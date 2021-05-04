const path = require('path');
const hx = require('hbuilderx');
const { gitRaw, createOutputChannel } = require('../common/utils.js');
const { axiosPost, axiosGet } = require('../common/axios.js');
const { Gitee, Github } = require('../common/oauth.js');
const { goSetEncoding } = require('./base.js');

const cmp_hx_version = require('../common/cmp.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'bootstrap.min.css');

// get hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');
let cmp = cmp_hx_version(hxVersion, '3.1.2');

let giteeOAuth = new Gitee();
let githubOAuth = new Github();

/**
 * @description 用于git init之后的操作
 */
class Api {
    constructor(webviewDialog) {
        this.webviewDialog = webviewDialog;
        this.webview = webviewDialog.webView;
    };

    goAuthorize(host) {
        if (host == 'gitee') {
            giteeOAuth.authorize(true);
        };
        if (host == 'github') {
            githubOAuth.authorize(true);
        };
    };

    async refreshAuthorizeStatus(host) {
        if (host == 'gitee') {
            let authResult = await giteeOAuth.readLocalToken();
            this.webview.postMessage({
                type: 'authorizeResult', host: 'gitee', data: authResult
            });
        };
    };

    async get_access_token(host) {
        if (host == 'gitee') {
            let giteeOAuthInfo = await giteeOAuth.readLocalToken();
            let {status,access_token} = giteeOAuthInfo;
            if (status != 'success-authorize' && access_token == '') {
                createOutputChannel("Gitee：身份信息无效，或权限不够，请重新授权认证。", "error");
                return 'fail';
            };
            return access_token;
        } else if (host == 'github') {
            let githubOAuthInfo = await githubOAuth.readLocalToken();
            let {status,access_token} = githubOAuthInfo;
            if (status != 'success-authorize' && access_token == '') {
                createOutputChannel("Github：身份信息无效，或权限不够，请重新授权认证。", "error");
                return 'fail';
            };
            return access_token;
        } else {
            return 'fail';
        };
    };

    async CreateRepo(CreateInfo) {
        let {host, name, isPrivate} = CreateInfo;
        if (!name.length) {
            this.webviewDialog.displayError('创建：仓库名称无效，请重新输入。');
            return;
        };

        if (!['gitee','github'].includes(host)) {
            this.webviewDialog.displayError('程序运行异常，请联系开发者。');
            return;
        };

        this.webviewDialog.displayError('');
        this.webviewDialog.setButtonStatus("开始创建", ["loading", "disable"]);

        let access_token = await this.get_access_token(host);
        if (access_token == 'fail') {
            this.webviewDialog.displayError('错误：token无效，请重新授权。');
            this.webviewDialog.setButtonStatus("开始创建", []);
            return;
        }

        let url = "";
        if (host == 'gitee') {
            url = "https://gitee.com/api/v5/user/repos";
        };
        if (host == 'github') {
            url = "https://api.github.com/user/repos"
        };

        let params = {
            "access_token": access_token,
            "name":name,
            "private": isPrivate
        };

        let headers = {};
        if (host == 'github') {
            headers = {
                "Authorization": `token ${access_token}`,
                "Accept": "application/vnd.github.v3+json"
            };
        };
        let createResult = await axiosPost(url, params, headers).catch( error=> {
            console.error(typeof(error))
            createOutputChannel(`${host}: 创建远程仓库发生异常。`, "error");
            let resMsg = error instanceof Object;
            if (resMsg) {
                let message = JSON.stringify(error);
                createOutputChannel(`${host}: 服务器返回，${message}`, "error");
            };
            this.webviewDialog.setButtonStatus("开始创建", []);
            return;
        });
        if (createResult) {
            createOutputChannel(`${host}: 创建远程仓库成功。`, "success");
            let {html_url, ssh_url, clone_url} = createResult;
            if (html_url) {
                createOutputChannel(`http访问地址：${html_url}`)
            };
            if (ssh_url) {
                createOutputChannel(`ssh访问地址：${ssh_url}`)
            };
            if (clone_url) {
                createOutputChannel(`https访问地址：${clone_url}`)
            };
            this.webview.postMessage({
                type: 'closed'
            });
        };
    }
}

/**
 * @description 创建远程仓库
 * @param {Object} ProjectInfo
 */
async function gitRepositoryCreate() {
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
            <script src="${vueFile}"></script>
            <style type="text/css">
                body {
                    font-size: 14px;
                }
                body::-webkit-scrollbar {
                    display: none;
                }
                * {
                    outline: none;
                    moz-user-select: -moz-none;
                    -moz-user-select: none;
                    -o-user-select:none;
                    -khtml-user-select:none;
                    -webkit-user-select:none;
                    -ms-user-select:none;
                    user-select:none;
                }
                [v-cloak] {
                    display: none;
                }
                .outline-none {
                    box-shadow: none !important;
                }
                select {
                    border: none;
                    border-bottom: 1px solid #000000;
                    border-radius: 0px;
                    outline: none;
                }
                select:focus {
                    border-bottom: 1px solid rgb(65,168,99) !important;
                }
                select:focus {
                    border-bottom: 1px solid rgb(65,168,99) !important;
                }
                .form-control {
                    color: #000000 !important;
                    font-size: 0.93rem !important;
                    border-left: none !important;
                    border-right: none !important;
                    border-top: none !important;
                    border-radius: 0 !important;
                }
                .form-control:focus {
                    border: 1px solid rgb(65,168,99) !important;
                    border-left: none !important;
                    border-right: none !important;
                    border-top: none !important;
                    border-radius: 0 !important;
                }
                .form-group .form-control::-webkit-input-placeholder, .form-control::-webkit-input-placeholder {
                    font-size: 0.9rem !important;
                    font-weight: 200 !important;
                }
                input[type="text"]:disabled {
                	background-color: #FFF;
                    border-top: 1px solid #FFF;
                    border-left: 1px solid #FFF;
                    border-right: 1px solid #FFF;
                }
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
                                <button class="authbtn d-inline" @click="goAuthorize();" >重新授权</button>
                                <button class="ml-3 refreshbtn d-inline" @click="goAuthorizeRefresh();">刷新</button>
                                <span class="text-muted pl-2" v-if="oauth_info.msg">{{oauth_info.msg}}</span>
                            </div>
                            <div v-else>
                                <button class="authbtn d-inline" @click="goAuthorize();" >连接{{host}}账号</button>
                                <button class="ml-3 refreshbtn d-inline" @click="goAuthorizeRefresh();">刷新</button>
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
                        <label for="u-p" class="col-sm-2 px-0">仓库类型</label>
                        <div class="col-sm-10 d-inline">
                            <input name="rep" type="radio" class="mr-1" value="false" v-model="repos.isPrivate"/>公开(所有人可见)
                            <input name="rep" type="radio" class="ml-3 mr-1" value="true" v-model="repos.isPrivate"/>私有(仅仓库成员可见)
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
                        giteeOAuthInfo: {},
                        githubOAuthInfo: {},
                        host: 'gitee',
                        isShowOrgsList: false,
                        isClickOAuthBtn: false,
                        repos: {
                            owner: '',
                            name: '',
                            description: '',
                            isPrivate: true
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
                                console.log(msg)
                                if(msg.type == 'DialogButtonEvent'){
                                    let button = msg.button;
                                    if(button == '开始创建'){
                                        let data = Object.assign({"host": this.host}, this.repos);
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
