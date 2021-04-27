const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');
const { debounce } = require('throttle-debounce');

const ini = require('ini');
const hx = require('hbuilderx');

const icon = require('../static/icon.js');

const MainView = require('../main.js');
const utils = require('../../common/utils.js');
const file = require('../../common/file.js');

const osName = os.platform();

const vueFile = path.join(path.resolve(__dirname, '..'), 'static', 'vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'bootstrap.min.css');

// Git仓库地址，用于数据填充
var GitRepoUrl = '';

/**
 * @description 读取HBuilderX.ini, 获取ProjectWizard
 */
function getProjectWizard() {
    try{
        if (osName == 'darwin') {
            return path.join(process.env.HOME, 'Documents')
        } else {
            return path.join("C:", process.env.HOMEPATH, 'Documents')
        }
    }catch(e){
        return '';
    };
};


/**
 * @description 仓库克隆
 * @param {Object} webviewPanel
 * @param {Object} gitData
 */
function showClone(webviewPanel) {

    // HBuilderX数据
    let ProjectWizard = getProjectWizard();
    let hxData = { 'ProjectWizard': ProjectWizard };

    // 上次克隆失败的仓库地址, 用于数据填充
    if (GitRepoUrl && GitRepoUrl.length) {
        hxData = Object.assign(hxData, {"GitRepoUrl": GitRepoUrl})
    };

    let isDisplayError;
    let webviewDialog = hx.window.createWebViewDialog({
        modal: true,
        title: "Git克隆",
        dialogButtons: ["开始克隆", "关闭"],
        size: {
            width: 700,
            height: 450
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
                clone(msg.info);
                break;
            case 'closed':
                webviewDialog.close();
                break;
            default:
                break;
        };
    });

    let promi = webviewDialog.show();
    promi.then(function (data) {
        // 处理错误信息
    });

    async function clone(info) {
        let {localPath} = info;
        let projectName = localPath.split('/').pop();
        info = Object.assign(info,{
            'projectName': projectName
        });

        // 记录仓库地址
        GitRepoUrl = info.repo;

        // 判断git仓库地址是否有效
        if (!GitRepoUrl.includes('git@') && (/^(http|https):\/\//.test(GitRepoUrl) == false)) {
            isDisplayError = true;
            webviewDialog.displayError(`Git仓库地址无效`);
            return;
        };

        if (fs.existsSync(localPath)) {
            let isEmpty = await utils.isDirEmpty(localPath);
            if (isEmpty > 0) {
                isDisplayError = true;
                webviewDialog.displayError(`目录 ${localPath} 已存在!`);
                return;
            };
        };
        // 清除上次错误提示
        if (isDisplayError) {
            webviewDialog.displayError('');
        };

        webviewDialog.setButtonStatus("开始克隆", ["loading", "disable"]);
        let result = await utils.gitClone(info);

        webviewDialog.setButtonStatus("开始克隆", []);
        webview.postMessage({
            command: 'cloneResult',
            status: result
        });

        if (result == 'success') {
            // 清除缓存数据
            GitRepoUrl = '';
            // 导入克隆项目到项目管理器
            utils.importProjectToExplorer(localPath);
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
    };
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
                .clone-help {
                    font-size: 0.9rem;
                    color: #8f8f8f;
                }
            </style>
        </head>
        <body>
            <div id="app" v-cloak>
                <form>
                    <div class="form-group row m-0 mt-3">
                        <label for="git-url" class="col-sm-2 pt-2">Git仓库</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control outline-none" id="git-url" placeholder="Git仓库地址, 以git@或http开头" v-focus v-model="repo">
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3">
                        <label for="git-url" class="col-sm-2 pt-2">Git分支</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control outline-none" id="git-url" placeholder="Git分支, 选填，如不填写，则默认拉取master分支" v-model="cloneInfo.branch">
                        </div>
                    </div>
                    <div class="form-group row mx-0 mt-3">
                        <label for="local-path" class="col-sm-2 pt-2">本地路径</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control outline-none" placeholder="本地存储路径" v-model="cloneInfo.localPath">
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3" v-show="isShowUserPasswd">
                        <label for="u-p" class="col-sm-2 pt-2">账号密码</label>
                        <div class="col-sm-10">
                            <div class="row">
                                <div class="col">
                                    <input type="text" class="form-control outline-none" id="git-user" placeholder="Git仓库用户名, 选填" v-model="cloneInfo.username">
                                </div>
                                <div class="col">
                                    <input type="password" class="form-control outline-none" id="git-passwd" placeholder="Git仓库密码, 选填" v-model="cloneInfo.password">
                                </div>
                            </div>
                            <p class="form-text text-muted">如果是私有仓库，HTTP协议，克隆，需要提供账号密码</p>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3">
                        <div class="col">
                            <p class="clone-help">
                                如克隆遇到问题，请<a href="https://easy-git.gitee.io/connecting/">参考文档</a>，
                                或<a href="https://ext.dcloud.net.cn/plugin?id=2475">反馈给作者</a>。
                                <span v-if="isSSH">
                                    使用SSH克隆，需要配置好SSH公钥，
                                    <a href="https://easy-git.gitee.io/auth/ssh-generate">配置SSH</a>
                                </span>
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
                        cloneInfo: {
                            repo: '',
                            localPath: '',
                            isAuth: '',
                            username: '',
                            password: '',
                            branch: ''
                        }
                    },
                    computed: {
                        isSSH: function() {
                            let repo = this.repo;
                            let tmp = repo.toLowerCase().trim();
                            return tmp.substring(0,4) == 'git@' ? true : false;
                        },
                        isShowUserPasswd: function() {
                            let repo = this.repo;
                            if (repo && repo.length >= 7) {
                                let tmp = repo.toLowerCase().trim();
                                let result = tmp.substring(0,4) == 'git@' ? false : true;
                                return result;
                            };
                            return false;
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
                            })
                        })
                    },
                    methods: {
                        getCloneResult() {
                            hbuilderx.onDidReceiveMessage((msg) => {
                                console.log(msg)
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
