const path = require('path');
const fs = require('fs');
const hx = require('hbuilderx');
const chokidar = require('chokidar');

const { goSetEncoding } = require('./base.js');
const { gitSetForWebDialog } = require('./repository_init.js');

const cmp_hx_version = require('../common/cmp.js');
const { axiosPost, axiosGet } = require('../common/axios.js');
const { Gitee, Github, gitRepoCreate } = require('../common/oauth.js');
const { gitRaw, createOutputChannel } = require('../common/utils.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'bootstrap.min.css');
const customCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'custom.css');

// get hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');
let cmp = cmp_hx_version(hxVersion, '3.1.2');

let giteeOAuth = new Gitee();
let githubOAuth = new Github();

var watcher;
class Api {
    constructor(webviewDialog) {
        this.webviewDialog = webviewDialog;
        this.webview = webviewDialog.webView;
    };

    listeningAuthorize(host) {
        const appDataDir = hx.env.appData;
        const OAuthConfigDir = path.join(appDataDir, 'easy-git', 'oauth');
        const status = fs.existsSync(OAuthConfigDir);
        if (!status) {
            fs.mkdirSync(OAuthConfigDir);
        };

        try {
            watcher = chokidar.watch(OAuthConfigDir, {
                ignoreInitial: true
            }).on('all', (event, vpath) => {
                let tmp = path.basename(vpath)
                if (tmp == `.${host}`) {
                    this.refreshAuthorizeStatus(host)
                };
            });
        } catch (e) {
            console.error(e);
        };
    };

    goAuthorize(host) {
        if (host == 'gitee') {
            giteeOAuth.authorize(true);
            this.listeningAuthorize(host);
        };
        if (host == 'github') {
            githubOAuth.authorize(true);
            this.listeningAuthorize(host);
        };
    };

    async refreshAuthorizeStatus(host) {
        if (host == 'gitee') {
            let authResult = await giteeOAuth.readLocalToken();
            this.webview.postMessage({
                type: 'authorizeResult', host: 'gitee', data: authResult
            });
        };
        if (host == 'github') {
            let authResult = await githubOAuth.readLocalToken();
            this.webview.postMessage({
                type: 'authorizeResult', host: 'github', data: authResult
            });
        };
    };

    async CreateRepo(CreateInfo) {
        // isRemoteAdd, fromProjectPath, fromProjectName 这3个字段用于处理从初始化窗口跳转过来的数据。
        let { isRemoteAdd, fromProjectPath, fromProjectName } = CreateInfo;

        let { host, name, isPrivate, isClone, Protocol } = CreateInfo;
        if (!name.length) {
            this.webviewDialog.displayError('创建：仓库名称无效，请重新输入。');
            return;
        };

        this.webviewDialog.displayError('');
        this.webviewDialog.setButtonStatus("开始创建", ["loading", "disable"]);

        let createResult = await gitRepoCreate(CreateInfo, this.webviewDialog);

        if (isRemoteAdd) {
            if (!fromProjectPath && !fromProjectName) {
                return hx.window.showErrorMessage(`警告：获取本地项目名称和项目路径失败，【本地关联远程仓库】操作中断。`, ['我知道了']);
            };
            try{
                let { status, ssh_url, http_url } = createResult;
                if (status == 'success') {
                    let repo_url = Protocol == 'ssh' ? ssh_url : http_url;
                    let setInfo = {
                        "repo_url": repo_url,
                        "projectName": fromProjectName,
                        "projectPath": fromProjectPath
                    };
                    gitSetForWebDialog(setInfo);
                };
            }catch(e){
                let emsg = isRemoteAdd ? '，因此中断【本地关联远程仓库】操作，请自行处理' : '';
                hx.window.showErrorMessage(`警告：远程仓库创建成功后，解析返回值失败${emsg}。`, ['我知道了']);
            }
        };
    };
};

/**
 * @description 创建远程仓库
 * @param {Object} FromData 用于处理从初始化过来的数据
 */
async function gitRepositoryCreate(FromData={}) {

    // 用于处理从初始化过来的数据
    let { fromProjectPath, fromProjectName } = FromData;
    if (!fromProjectPath || !fromProjectName) {
        fromProjectPath = '';
        fromProjectName = '';
    };

    try{
        if (cmp > 0) {
            hx.window.showInformationMessage("此功能仅支持HBuilderX 3.1.2+以上版本，请升级。", ["我知道了"]);
        };
    }catch(e){
        hx.window.showInformationMessage("警告：此功能仅支持HBuilderX 3.1.2+以上版本，请升级。", ["我知道了"]);
    };

    let giteeOAuthInfo = await giteeOAuth.readLocalToken();
    let githubOAuthInfo = await githubOAuth.readLocalToken();

    // 创建webviewdialog
    let webviewDialog = hx.window.createWebViewDialog({
        modal: true,
        title: "Git 创建远程仓库",
        dialogButtons: ["开始创建", "关闭"],
        size: {
            width: 730,
            height: 430
        }
    }, {
        enableScripts: true
    });

    let api = new Api(webviewDialog);

    const webview = webviewDialog.webView;
    webview.onDidReceiveMessage((msg) => {
        let type = msg.type;
        let { data } = msg;
        switch (type) {
            case 'closed':
                if (watcher) {
                    watcher.close();
                };
                webviewDialog.close();
                break;
            case 'create':
                api.CreateRepo(data);
                break;
            case 'authorize':
                let {host} = data;
                api.goAuthorize(host);
                break;
            case 'refreshAuthorizeStatus':
                api.refreshAuthorizeStatus();
                break;
            default:
                break;
        };
    });

    let promi = webviewDialog.show();
    promi.then(function (data) {});

    let giteeOAuthInfoForHtml = JSON.stringify(giteeOAuthInfo);
    let githubOAuthInfoForHtml = JSON.stringify(githubOAuthInfo);
    webview.html = `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="${bootstrapCssFile}">
            <link rel="stylesheet" href="${customCssFile}">
            <script src="${vueFile}"></script>
            <style type="text/css">
                .authbtn {
                    border: 1px solid #eee;
                    border-radius: 5px;
                    padding: 4px 7px;
                    background-color: #FFF;
                    color: rgb(65,168,99);
                }
                .refreshbtn {
                    border: none;
                    background-color: #FFF;
                    color: blue;
                    font-size: 12px;
                }
                button:active {
                    -webkit-transform: rotate(0.9);
                    transform: scale(0.9);
                }
                .forlist {
                    list-style: none;
                    padding-left: 10px;
                    position: absolute;
                    z-index: 1600;
                    border-radius: 3px;
                    box-shadow: 0 0 8px 0 rgba(55,49,29,.15);
                    background-color: #FFF;
                    width: 100%;
                }
                .forlist li {
                    height: 36px;
                    line-height: 36px;
                    width: 100%;
                }
            </style>
        </head>
        <body>
            <div id="app" v-cloak>
                <form>
                    <div class="form-group row m-0">
                        <label for="u-p" class="col-sm-2 px-0">托管主机</label>
                        <div class="col-sm-10 d-inline">
                            <input name="host" type="radio" class="mr-1" value="github" v-model="host"/>GitHub
                            <input name="host" type="radio" class="mr-1 ml-3" value="gitee" v-model="host"/>Gitee
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3">
                        <label for="u-p" class="col-sm-2 px-0">授权类型</label>
                        <div class="col-sm-10">
                            <span>OAuth</span>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3">
                        <label for="u-p" class="col-sm-2 px-0 pt-1">账号授权</label>
                        <div class="col-sm-10">
                            <div v-if="oauth_info.status == 'success-authorize'">
                                <span class="text-muted">{{host}}已授权</span>
                            </div>
                            <div v-else-if="['fail-authorize','permission-denied'].includes(oauth_info.status) ">
                                <button type="button" class="authbtn d-inline" @click="goAuthorize();" >重新授权</button>
                                <button type="button" class="ml-3 refreshbtn d-inline" @click="goAuthorizeRefresh();">刷新</button>
                                <span class="text-muted pl-2" v-if="oauth_info.msg">{{oauth_info.msg}}</span>
                            </div>
                            <div v-else>
                                <button type="button" class="authbtn d-inline outline-none" @click="goAuthorize();" >连接{{host}}账号</button>
                                <button type="button" class="ml-3 refreshbtn d-inline outline-none" @click="goAuthorizeRefresh();">刷新</button>
                                <span class="text-muted pl-2" v-if="oauth_info.msg">{{oauth_info.msg}}</span>
                            </div>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-1">
                        <label for="u-p" class="col-sm-2 px-0 pt-3">仓库名称</label>
                        <div class="col-sm-10">
                            <div class="row m-0 p-0">
                                <div class="col-4 p-0" @mouseenter="isShowOrgsList=true" @mouseleave="isShowOrgsList=false">
                                    <input type="text" title="归属组织" placeholder="归属" class="form-control outline-none pl-0" v-model="repos.owner" disabled/>
                                    <ul class="forlist" v-show="isShowOrgsList">
                                        <li v-for="(item,idx) in orgs" :key="idx" @click="repos.owner=item">{{item}}</li>
                                    </ul>
                                </div>
                                <div class="col-8">
                                    <input type="text" class="form-control outline-none" placeholder="仓库名称必填，只允许包含字母、数字或者下划线(_)、中划线(-)、英文句号(.)，且长度为1~100个字符" v-model.trim="repos.name">
                                </div>
                            </div>
                            <span class="form-text text-muted" v-if="git_url">仓库地址：{{ git_url }}</span>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-4">
                        <label for="repo-type" class="col-sm-2 px-0">仓库类型</label>
                        <div class="col-sm-10 d-inline">
                            <input name="rep" type="radio" class="mr-1" value="0" v-model="isPrivate"/>公开(所有人可见)
                            <input name="rep" type="radio" class="ml-3 mr-1" value="1" v-model="isPrivate"/>私有(仅仓库成员可见)
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3" v-if="fromProjectName == '' && fromProjectPath == ''">
                        <label for="repo-isClone" class="col-sm-2 px-0">克隆</label>
                        <div class="col-sm-10">
                            <input type="checkbox" class="mr-2" v-model="isClone" />
                            <label class="d-inline">远程仓库创建后，是否克隆到本地</label>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3" v-if="fromProjectName && fromProjectPath">
                        <label for="repo-type" class="col-sm-2 px-0">添加远程仓库</label>
                        <div class="col-sm-10 d-inline">
                            <input type="checkbox" class="mr-2" v-model="isRemoteAdd" />
                            <label class="d-inline">远程仓库创建后，是否关联刚创建的项目{{fromProjectName}}</label>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3" v-if="isClone || (fromProjectName && fromProjectPath)">
                        <label for="repo-type" class="col-sm-2 px-0">协议</label>
                        <div class="col-sm-10 d-inline">
                            <input name="Protocol" type="radio" class="mr-1" value="http" v-model="Protocol"/>HTTPS/HTTP
                            <input name="Protocol" type="radio" class="ml-3 mr-1" value="ssh" v-model="Protocol"/>SSH
                        </div>
                    </div>
                </form>
            </div>
            <script>
                Vue.directive('focus', {
                  inserted: function (el) {
                    el.focus()
                  }
                });
                var app = new Vue({
                    el: '#app',
                    data: {
                        fromProjectPath: '',
                        fromProjectName: '',
                        isRemoteAdd: true,
                        giteeOAuthInfo: {},
                        githubOAuthInfo: {},
                        host: 'gitee',
                        isShowOrgsList: false,
                        isClickOAuthBtn: false,
                        isClone: false,
                        Protocol: 'http',
                        isPrivate: '0',
                        repos: {
                            owner: '',
                            name: '',
                            description: '',
                            isPrivate: ''
                        }
                    },
                    computed: {
                        git_url() {
                            if (this.repos.owner == "" || this.repos.owner == undefined || this.repos.owner == '默认') return;
                            if (this.repos.name == "") return;
                            if (this.host == 'gitee') {
                                return "https://gitee.com/" + this.repos.owner + "/" + this.repos.name;
                            } else if (this.host == 'github' ) {
                                return "https://github.com/" + this.repos.owner + "/" + this.repos.name;
                            } else {
                                return "";
                            };
                        },
                        oauth_info() {
                            if (this.host == 'gitee' && JSON.stringify(this.giteeOAuthInfo) != '{}' && this.giteeOAuthInfo instanceof Object) {
                                return this.giteeOAuthInfo;
                            } else if (this.host == 'github' && JSON.stringify(this.githubOAuthInfo) != '{}' && this.githubOAuthInfo instanceof Object) {
                                return this.githubOAuthInfo;
                            } else {
                                return {};
                            }
                        },
                        orgs() {
                            let orgs = [];
                            if (this.host == 'gitee' && JSON.stringify(this.giteeOAuthInfo) != '{}' && this.giteeOAuthInfo instanceof Object) {
                                orgs = this.giteeOAuthInfo.orgs;
                            } else if (this.host == 'github' && JSON.stringify(this.githubOAuthInfo) != '{}' && this.githubOAuthInfo instanceof Object) {
                                orgs = this.githubOAuthInfo.orgs;
                            };
                            if (orgs == undefined) {
                                this.repos.owner = "默认";
                                return ["默认"];
                            };
                            if (orgs.length) {
                                this.repos.owner = orgs[0];
                            };
                            return orgs ? orgs : ["默认"];
                        }
                    },
                     watch:{
                        host(val, oldVal){
                            this.repos.owner = "";
                        }
                     },
                    created() {
                        this.fromProjectPath = '${fromProjectPath}';
                        this.fromProjectName = '${fromProjectName}';
                        this.giteeOAuthInfo = ${giteeOAuthInfoForHtml};
                        this.githubOAuthInfo = ${githubOAuthInfoForHtml};
                    },
                    mounted() {
                        this.$nextTick(() => {
                            window.addEventListener('hbuilderxReady', () => {
                                this.gitSet();
                                this.getResult();
                            })
                        })
                    },
                    methods: {
                        getResult() {
                            hbuilderx.onDidReceiveMessage((msg) => {
                                if (msg.type == 'setResult') {
                                    let {status} = msg;
                                    if (['error', 'fail'].includes(status)){
                                        this.btnDisable = false;
                                    } else {
                                        hbuilderx.postMessage({
                                            type: 'closed'
                                        });
                                    };
                                };
                                if (msg.type == 'closed') {
                                    hbuilderx.postMessage({
                                        type: 'closed'
                                    });
                                };
                                if (msg.type == 'authorizeResult') {
                                    if (msg.host == 'gitee') {
                                        this.giteeOAuthInfo = msg.data;
                                    };
                                    if (msg.host == 'github') {
                                        this.githubOAuthInfo = msg.data;
                                    };
                                };
                            });
                        },
                        goAuthorize() {
                            hbuilderx.postMessage({
                                type: 'authorize',
                                data: {"host": this.host}
                            })
                        },
                        goAuthorizeRefresh() {
                            hbuilderx.postMessage({
                                type: 'refreshAuthorizeStatus',
                                data: {"host": this.host}
                            });
                        },
                        gitSet() {
                            hbuilderx.onDidReceiveMessage((msg)=>{
                                if(msg.type == 'DialogButtonEvent'){
                                    let button = msg.button;
                                    if(button == '开始创建'){
                                        let data = Object.assign({"host": this.host}, this.repos);
                                        data.isPrivate = this.isPrivate == 1 ? true : false;
                                        if (this.isClone) {
                                            data.isClone = this.isClone;
                                            data.Protocol = this.Protocol;
                                        };
                                        if (this.fromProjectPath && this.fromProjectName) {
                                            data.isRemoteAdd = this.isRemoteAdd;
                                            data.Protocol = this.Protocol;
                                            data.fromProjectPath = this.fromProjectPath;
                                            data.fromProjectName = this.fromProjectName;
                                        };
                                        hbuilderx.postMessage({
                                            type: 'create',
                                            data: data
                                        });
                                    } else if(button == '关闭'){
                                        hbuilderx.postMessage({
                                            type: 'closed'
                                        });
                                    };
                                };
                            });
                        }
                    }
                });
            </script>
            <script>
                window.oncontextmenu = function() {
                    event.preventDefault();
                    return false;
                };
            </script>
        </body>
    </html>`
};

module.exports = {
    gitRepositoryCreate
}
