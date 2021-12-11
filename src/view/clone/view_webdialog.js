const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');
const { debounce } = require('throttle-debounce');

const ini = require('ini');
const hx = require('hbuilderx');

const MainView = require('../main.js');
const {
    isDirEmpty,
    getDirFileList,
    gitClone,
    updateHBuilderXConfig,
    importProjectToExplorer } = require('../../common/utils.js');
const { axiosGet } = require('../../common/axios.js');
const { Gitee, Github, openOAuthBox } = require('../../common/oauth.js');
const { getSyncIcon } = require('../static/icon.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'static', 'vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'bootstrap.min.css');
const customCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'custom.css');

const osName = os.platform();
const SyncIcon = getSyncIcon('#d4d4d4');

// Git仓库地址，用于数据填充
var GitRepoUrl = '';

// 克隆目录
var ProjectWizard = '';

/**
 * @description 设置初始克隆目录
 */
function getProjectWizard() {
    try{
        let config = hx.workspace.getConfiguration();
        let LastCloneDir = config.get('EasyGit.LastCloneDir');
        if (LastCloneDir && LastCloneDir != '') {
            return LastCloneDir;
        };
        if (osName == 'darwin') {
            return path.join(process.env.HOME, 'Documents')
        } else {
            return path.join("C:", process.env.HOMEPATH, 'Documents')
        };
    }catch(e){
        return '';
    };
};


/**
 * @description 检查SSH
 * @param {Object} webviewDialog
 * @param {Object} webview
 */
async function checkSSH(webviewDialog, webview) {
    const USERHOME = process.env.HOME;
    const sshDir = path.join(USERHOME, '.ssh');
    const emsg = "警告：您电脑不存在ssh public key文件，使用ssh协议克隆，可能会克隆失败，后期也无法提交代码。如不需要，请忽略。";
    if (!fs.existsSync(sshDir)) {
        webviewDialog.displayError(emsg);
        return [];
    };
    let publicKey = await getDirFileList(sshDir, '.pub');
    if (publicKey.length == 0) {
        webviewDialog.displayError(emsg);
    };
    return publicKey;
};

/**
 * @description 搜索Github
 * @param {Object} word 搜索关键字
 * @param {Object} webviewDialog
 * @param {Object} webview
 */
async function openGithubSearch(word, webviewDialog, webview) {
    let data = {"ssh":[],"https":[]};

    if (word.length < 2) {return};
    webviewDialog.displayError('');

    hx.window.setStatusBarMessage(`easy-git: 正在github搜索 ${word} ...., 这取决于您的网络状况`, 500000, 'info');

    let url = `https://api.github.com/search/repositories?q=${word}`
    let headers = {"Accept": "application/vnd.github.v3+json"};
    let SearchResult = await axiosGet(url, headers).catch(error=> {
        return 'fail';
    });
    hx.window.clearStatusBarMessage();

    if (SearchResult == 'fail') {
        webviewDialog.displayError("Github搜索失败，请检查网络。")
        return data;
    } else {
        let { items } = SearchResult;
        if ( items.length == 0) {
            webviewDialog.displayError("Github搜索，没有搜索到结果。")
            return data;
        };
        data.ssh = items.map( x => x["ssh_url"]);
        data.https = items.map( x => x["clone_url"]);
        webview.postMessage({command: 'githubSearchResult',data: data});
        return data;
    };
};

/**
 * @description 获取用户仓库列表
 */
async function getUserAllGitRepos(webview) {
    let allRepos = {"ssh":[],"https":[]};

    let ge = new Gitee();
    let giteeRepos = await ge.getUserRepos();

    let gtb = new Github();
    let githubRepos = await gtb.getUserRepos();

    if (githubRepos == 'fail-authorize' && giteeRepos == 'fail-authorize') {
        return webview.postMessage({command: 'authResult',data: false});
    };
    if (githubRepos != 'fail-authorize') {
        allRepos = githubRepos;
    };
    if (giteeRepos != 'fail-authorize') {
        let {ssh, https} = giteeRepos;
        allRepos.ssh = [ ...allRepos["ssh"], ...ssh ]
        allRepos.https = [ ...allRepos["https"], ...https ]
    };
    if (allRepos) {
        webview.postMessage({command: 'authResult',data: true});
        webview.postMessage({command: 'repos',data: allRepos});
    };
};

/**
 * @description 开始克隆
 */
var isDisplayError;
async function clone(webviewDialog, webview, info) {
    // 记录仓库地址
    GitRepoUrl = info.repo;

    // 判断git仓库地址是否有效
    if (!GitRepoUrl.includes('git@') && (/^(http|https):\/\//.test(GitRepoUrl) == false)) {
        isDisplayError = true;
        webviewDialog.displayError(`Git仓库地址无效`);
        return;
    };

    // 仓库名称
    let gitRepoName = GitRepoUrl.split('/').pop()
    if (gitRepoName.substring(gitRepoName - 4) === '.git') {
        gitRepoName = gitRepoNamereplace('.git', '');
    };

    let { localPath } = info;
    let projectName = path.basename(localPath);
    let currentCloneDir = path.dirname(localPath);
    info = Object.assign(info,{
        'projectName': projectName
    });

    if (fs.existsSync(localPath)) {
        let isEmpty = await isDirEmpty(localPath);
        if (isEmpty > 0) {
            isDisplayError = true;
            webviewDialog.displayError(`目录 ${localPath} 已存在，请输入一个空目录。`);
            return;
        };
    };
    // 清除上次错误提示
    if (isDisplayError) {
        webviewDialog.displayError('');
    };

    webviewDialog.setButtonStatus("开始克隆", ["loading", "disable"]);
    let result = await gitClone(info);

    webviewDialog.setButtonStatus("开始克隆", []);
    webview.postMessage({
        command: 'cloneResult',
        status: result
    });

    if (result == 'success') {
        // 清除缓存数据
        GitRepoUrl = '';
        // 导入克隆项目到项目管理器
        importProjectToExplorer(localPath);
        let pinfo = {
            'easyGitInner': true,
            'projectName': projectName,
            'projectPath': localPath
        };
        hx.commands.executeCommand('EasyGit.main', pinfo);
        hx.commands.executeCommand('workbench.view.explorer');
    } else {
        isDisplayError = true;
        webviewDialog.displayError('Git: 克隆失败, 请在底部控制台查看失败原因!');
    };

    // 记忆上次位置
    if (ProjectWizard != currentCloneDir) {
        updateHBuilderXConfig('EasyGit.LastCloneDir', currentCloneDir);
    };
};

/**
 * @description 打开克隆视图
 * @param {String} clone_url 用于外部调用
 */
function showClone(clone_url="") {

    // 获取克隆目录
    ProjectWizard = getProjectWizard();
    let hxData = { 'ProjectWizard': ProjectWizard };

    if (clone_url != "") {
        GitRepoUrl = clone_url;
    }
    // 上次克隆失败的仓库地址, 用于数据填充
    if (GitRepoUrl && GitRepoUrl.length) {
        hxData = Object.assign(hxData, {"GitRepoUrl": GitRepoUrl})
    };

    let webviewDialog = hx.window.createWebViewDialog({
        modal: true,
        title: "Git克隆",
        dialogButtons: ["开始克隆", "关闭"],
        size: {
            width: 730,
            height: 500
        }
    }, {
        enableScripts: true
    });

    let webview = webviewDialog.webView;
    webview.html = generateLogHtml(hxData);

    webview.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'clone':
                clone(webviewDialog, webview, msg.info);
                break;
            case 'closed':
                webviewDialog.close();
                break;
            case 'clearDisplayError':
                webviewDialog.displayError('');
                break;
            case 'authorize':
                openOAuthBox();
                break;
            case 'MyGitRepos':
                getUserAllGitRepos(webview);
                break;
            case 'checkSSH':
                checkSSH(webviewDialog, webview);
                break;
            case 'GithubSearch':
                let q = msg.data;
                openGithubSearch(q, webviewDialog, webview);
                break;
            case 'sshKeygen':
                hx.commands.executeCommand('EasyGit.sshKeygen');
                break;
            default:
                break;
        };
    });

    let promi = webviewDialog.show();
    promi.then(function (data) {
        // 处理错误信息
    });
};


/**
 * @description generationhtml
 * @todo 目前通过js打开资源管理器，无法打开的目录。因此 本地存储路径输入框，不支持手动选择
 * @todo 克隆进度条
 */
function generateLogHtml(hxData) {

    let { ProjectWizard, GitRepoUrl } = hxData;
    ProjectWizard = ProjectWizard.split(path.sep).join('/');

    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="${bootstrapCssFile}">
            <link rel="stylesheet" href="${customCssFile}">
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
                .clone-help {
                    font-size: 13px;
                    color: #8f8f8f;
                    margin-bottom: 5px;
                }
                .clone-help a {
                    color: #8f8f8f !important;
                }
                .link-no-style {
                    color: #6c757d!important;
                }
                .link-text {
                    color: #007bff;
                    margin-left: 10px;
                }
            </style>
        </head>
        <body>
            <div id="app" v-cloak>
                <form>
                    <div class="form-group row m-0">
                        <label for="repo-type" class="col-sm-2 px-0 text-center">克隆协议</label>
                        <div class="col-sm-10 d-inline">
                            <input name="Protocol" type="radio" class="mr-2" value="http"
                                v-model="cloneProtocol"
                                @click="isManualSelectedProtocol='http'"/>HTTPS/HTTP
                            <input name="Protocol" type="radio" class="ml-3 mr-2" value="ssh"
                                v-model="cloneProtocol"
                                @click="isManualSelectedProtocol='ssh'"/>SSH
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-2">
                        <label for="repo-type" class="col-sm-2 px-0 text-center">仓库来源</label>
                        <div class="col-sm-10 d-inline">
                            <input name="repoSource" type="radio" class="mr-2" value="0"
                                v-model="isSearchGitHub" />手动输入仓库地址
                            <input name="repoSource" type="radio" class="ml-3 mr-2" value="1"
                                v-model="isSearchGitHub" />搜索Github仓库
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-2">
                        <label for="git-url" class="col-sm-2 pt-3 px-0 text-center">
                            <span title="Git存储库URL">Git仓库</span>
                        </label>
                        <div class="col-sm-10" @mouseleave="isShowRecommend=false">
                            <div v-if="isSearchGitHub == 1">
                                <input type="text"
                                    class="form-control outline-none" id="git-url"
                                    placeholder="输入关键字后，按下回车，在Github全部仓库中搜索......"
                                    v-focus
                                    v-model="repo"
                                    @keyup.enter="GithubSearch()"
                                    @mouseover="isShowRecommend=true"
                                    @onblur="isShowRecommend=false "
                                    @onfocus="isShowRecommend=true">
                            </div>
                            <div v-else>
                                <input type="text"
                                    class="form-control outline-none" id="git-url"
                                    placeholder="输入Git存储库URL（以git@或http开头）, 或选择仓库地址"
                                    v-focus v-model="repo"
                                    @mouseover="isShowRecommend=true"
                                    @onblur="isShowRecommend=false "
                                    @onfocus="isShowRecommend=true">
                                <span
                                    class="input-icon"
                                    title="当您授权Github等托管服务器后，可点此处刷新我的Git仓库列表"
                                    v-show="isClickAuth || oauthResult"
                                    @click="getUserAllGitRepos();">${SyncIcon}
                                </span>
                            </div>
                            <p class="form-text text-muted mb-0">
                                <span v-if="isSearchGitHub != 1">
                                    授权github、gitee等，自动加载您所有的仓库，克隆更方便。
                                    <a href="https://easy-git.github.io/oauth" class="link-no-style" title="点击查看详情">查看详情</a>
                                    <span class="link-text" @click="goAuthorize();" title="点击进行授权">授权</span>
                                </span>
                                <span v-else>Github是否搜索成功，取决于您网络，目前仅返回前10条结果...</span>
                            </p>
                            <ul class="ul-list"
                                style="margin-top: -22px;width: 485px;"
                                v-show="githubReposList.length && isShowRecommend"
                                @mouseleave="isShowRecommend=false"
                                v-if="isSearch">
                                <li
                                    v-for="(item,idx) in githubReposList" :key="idx"
                                    @click="selectMyRepos(item);">
                                    {{item}}
                                </li>
                            </ul>
                            <ul class="ul-list"
                                style="margin-top: -22px;width: 485px;"
                                v-show="myReposList.length && isShowRecommend"
                                @mouseleave="isShowRecommend=false"
                                v-else>
                                <li v-for="(item,idx) in myReposList" :key="idx" @click="selectMyRepos(item);">
                                    {{item}}
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-2">
                        <label for="git-url" class="col-sm-2 pt-3 px-0 text-center">Git分支</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control outline-none" id="git-url"
                                placeholder="Git分支, 选填，如不填写，则默认拉取master分支"
                                v-model="cloneInfo.branch" />
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-2">
                        <label for="local-path" class="col-sm-2 pt-3 px-0 text-center">本地路径</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control outline-none" placeholder="本地存储路径"
                                v-model="cloneInfo.localPath" />
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-2" v-show="isShowUserPasswd">
                        <label for="u-p" class="col-sm-2 pt-3 px-0 text-center">账号密码</label>
                        <div class="col-sm-10">
                            <div class="row">
                                <div class="col">
                                    <input type="text"
                                        class="form-control outline-none" id="git-user"
                                        placeholder="Git仓库用户名, 选填"
                                        v-model="cloneInfo.username">
                                </div>
                                <div class="col">
                                    <input type="password"
                                        class="form-control outline-none" id="git-passwd"
                                        placeholder="Git仓库密码, 选填"
                                        v-model="cloneInfo.password">
                                </div>
                            </div>
                            <p class="form-text text-muted">如果是私有仓库，HTTP协议，克隆，需要提供账号密码</p>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-2">
                        <label for="git-url" class="col-sm-2 pt-2 px-0 text-center">帮助文档</label>
                        <div class="col-sm-10">
                            <p class="clone-help"> 1. 如遇到问题，请<a href="https://easy-git.github.io/connecting/" title="点击查看文档">参考文档</a>，
                                或<a href="https://ext.dcloud.net.cn/plugin?id=2475" title="点击反馈">反馈给作者</a><br />
                            </p>
                            <p class="clone-help"> 2. 使用SSH克隆，需配置SSH，<a href="https://easy-git.github.io/auth/ssh-generate" title="点击查看教程">查看配置SSH教程</a>。
                                <span title="点击打开SSH KEY一键生成工具" class="link-text ml-0" @click="openSshKeygen();">一键生成SSH KEY</span>
                            </p>
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
                        submitDisabled: false,
                        ProjectWizard: '',
                        repo: '',
                        isClickAuth: false,
                        oauthResult: '',
                        isShowRecommend: false,
                        MyAllReposList: {},
                        isManualSelectedProtocol: '',
                        cloneInfo: {
                            repo: '',
                            localPath: '',
                            isAuth: '',
                            username: '',
                            password: '',
                            branch: ''
                        },
                        isSearchGitHub: 0,
                        isSearch: false,
                        githubSearchResult: {}
                    },
                    computed: {
                        isSSH: function() {
                            let repo = this.repo;
                            let tmp = repo.toLowerCase().trim();
                            return tmp.substring(0,4) == 'git@' ? true : false;
                        },
                        cloneProtocol: function() {
                            if (['http','ssh'].includes(this.isManualSelectedProtocol)) {
                                return this.isManualSelectedProtocol;
                            };
                            let repo = this.repo;
                            let tmp = repo.toLowerCase().trim();
                            let result = tmp.substring(0,4) == 'git@' ? 'ssh' : 'http';
                            return result;
                        },
                        isShowUserPasswd: function() {
                            let repo = this.repo;
                            if (repo && repo.length >= 7) {
                                let tmp = repo.toLowerCase().trim();
                                let result = tmp.substring(0,4) == 'git@' ? false : true;
                                return result;
                            };
                            return false;
                        },
                        myReposList: function() {
                            let searchWord = this.repo;
                            let Protocol = this.cloneProtocol;
                            if (Protocol == 'http') {
                                Protocol = 'https';
                            };
                            let result = this.MyAllReposList[Protocol];
                            if (result && searchWord) {
                                result = result.filter( x => x.includes(searchWord));
                            };
                            return result == undefined ? [] : result;
                        },
                        githubReposList: function() {
                            let searchWord = this.repo;
                            let Protocol = this.cloneProtocol;
                            if (Protocol == 'http') {
                                Protocol = 'https';
                            };
                            let result = this.githubSearchResult[Protocol];
                            if (result && searchWord) {
                                result = result.filter( x => x.includes(searchWord));
                            };
                            return result == undefined ? [] : result;
                        }
                    },
                    watch: {
                        repo: function (newrepo, oldrepo) {
                            let repo = this.repo;
                            let projectName = ((repo.split('/')).pop()).replace('.git','');
                            let ProjectWizard = this.ProjectWizard;
                            let lastChar = ProjectWizard.substr(ProjectWizard.length-1,1);
                            if ( lastChar == '/' || lastChar == '\') {
                                this.cloneInfo.localPath = this.ProjectWizard + projectName;
                            } else {
                                this.cloneInfo.localPath = this.ProjectWizard + '/' + projectName;
                            };
                        },
                        cloneProtocol: function (newVal, oldVal) {
                            if (this.cloneProtocol== 'ssh') {
                                this.checkSSH();
                            } else {
                                this.clearDisplayError();
                            }
                        }
                    },
                    created() {
                        this.ProjectWizard = '${ProjectWizard}';
                        this.cloneInfo.localPath = '${ProjectWizard}';

                        // 上次发生错误，再次打开后，自动填充url
                        let repo = '${GitRepoUrl}';
                        if (repo && repo != 'undefined') {
                            this.repo = repo;
                        };
                    },
                    mounted() {
                        this.$nextTick(() => {
                            window.addEventListener('hbuilderxReady', () => {
                                this.gitClone();
                                this.getCloneResult();
                                this.getUserAllGitRepos();
                            })
                        });

                        that = this;
                        window.onload = function() {
                            setTimeout(function() {
                                that.getUserAllGitRepos();
                            }, 1000);
                        };
                    },
                    methods: {
                        switchType(e) {
                            this.isSearch = e;
                            this.isShowRecommend = false;
                        },
                        checkSSH() {
                            hbuilderx.postMessage({
                                command: 'checkSSH'
                            });
                        },
                        clearDisplayError() {
                            hbuilderx.postMessage({
                                command: 'clearDisplayError'
                            });
                        },
                        getUserAllGitRepos() {
                            hbuilderx.postMessage({
                                command: 'MyGitRepos'
                            });
                        },
                        goAuthorize() {
                            this.isClickAuth = true;
                            hbuilderx.postMessage({
                                command: 'authorize'
                            });
                        },
                        GithubSearch() {
                            hbuilderx.postMessage({
                                command: 'GithubSearch',
                                data: this.repo
                            });
                        },
                        openSshKeygen() {
                            hbuilderx.postMessage({
                                command: 'sshKeygen'
                            });
                        },
                        getCloneResult() {
                            hbuilderx.onDidReceiveMessage((msg) => {
                                if (msg.command == 'cloneResult') {
                                    let {status} = msg;
                                    if (['error', 'fail'].includes(status)){
                                        this.btnDisable = false;
                                    };
                                    if (status == 'success') {
                                        hbuilderx.postMessage({
                                            command: 'closed'
                                        });
                                    };
                                };
                                if (msg.command == 'repos') {
                                    this.MyAllReposList = msg.data;
                                };
                                if (msg.command == 'authResult') {
                                    this.oauthResult = msg.data;
                                };
                                if (msg.command == 'githubSearchResult') {
                                    this.githubSearchResult = msg.data;
                                };
                            });
                        },
                        gitClone() {
                            hbuilderx.onDidReceiveMessage((msg)=>{
                                if(msg.type == 'DialogButtonEvent'){
                                    let button = msg.button;
                                    if(button == '开始克隆'){
                                        this.cloneInfo.repo = this.repo;
                                        if (this.isShowUserPasswd) {
                                            let username = this.cloneInfo.username;
                                            let password = this.cloneInfo.password;
                                            if (username.length || password.length) {
                                                this.cloneInfo.isAuth = true;
                                            };
                                        };
                                        hbuilderx.postMessage({
                                            command: 'clone',
                                            info: this.cloneInfo
                                        });
                                    } else if(button == '关闭'){
                                        hbuilderx.postMessage({
                                            command: 'closed'
                                        });
                                    }
                                }
                            });
                        },
                        selectMyRepos(item) {
                            this.isShowRecommend = false;
                            this.repo = item;
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
    </html>

    `
};

module.exports = showClone;
