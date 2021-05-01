const path = require('path');

const hx = require('hbuilderx');
const {
    gitRaw,
    gitInit,
    gitCurrentBranchName,
    gitAddRemoteOrigin,
    gitLocalBranchToRemote,
    gitConfigShow,
    gitConfigSet,
    createOutputChannel
} = require('../common/utils.js');
const { goSetEncoding } = require('./base.js');

const cmp_hx_version = require('../common/cmp.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'bootstrap.min.css');

// get hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');
let cmp = cmp_hx_version(hxVersion, '3.1.2');

/**
 * @description Git项目初始化; 初始化成功后，创建.gitignore文件, 并询问用户是否关联远程仓库
 * @param {Object} ProjectInfo 项目信息，即焦点在项目管理器、编辑器时，获取的文件信息
 */
async function gitInitProject(ProjectInfo) {
    let { projectPath, projectName } = ProjectInfo;

    let status = await gitInit(projectPath,projectName);
    if (status != 'success') {
        return;
    };

    // 获取配置
    let configData = await gitConfigShow(projectPath, false);

    // 检查是否设置user.name和user.email
    let gitUserName = configData['user.name'];
    let gitEmail = configData['user.email'];
    if (gitUserName == false || gitEmail == false) {
        createOutputChannel("当前仓库，未设置user.name或user.email。提交代码到Git远程仓库，必须设置用户名和邮箱。", "warning");
        createOutputChannel("如需设置，请在弹窗中输入。或后期HBuilderX选中项目，点击顶部菜单【工具 -> easy-git -> 设置user.name】\n");
    };

    // 设置编码, 解决中文问题
    let i18n = configData['i18n.logoutputencoding'];
    if (!i18n) {
        goSetEncoding("core.quotepath", 'StatusBar');
        goSetEncoding("i18n.logoutputencoding", 'StatusBar');
    };

    createOutputChannel("当前仓库，还未关联到远程仓库上, 请在弹窗输入框中输入仓库地址。如不需要关联远程仓库、或后期设置，请直接关闭弹窗。", "warning");
    createOutputChannel("新建仓库、及获取远程仓库地址，参考: https://easy-git.gitee.io/connecting/init\n")

    // 打开源代码管理器
    ProjectInfo.easyGitInner = true;

    // 关联远程仓库
    try {
        let pdata = Object.assign(ProjectInfo, {"username": gitUserName, "email": gitEmail})
        gitSetForWebDialog(pdata);
    } catch (e) {
        let relationResult = await gitAddRemoteOrigin(projectPath);
        if (relationResult == 'success') {
            createOutputChannel(`项目【${projectName}】远程仓库添加地址成功。`, "success");
            hx.commands.executeCommand('EasyGit.main', ProjectInfo);
        };
    };
};

/**
 * @description 用于git init之后的操作
 */
var isDisplayError;
async function gitConfigSetForWebDialog(webviewDialog, ProjectInfo) {
    // 清除上次错误提示
    if (isDisplayError) {
        webviewDialog.displayError('');
    };

    let {
        projectName, projectPath,
        username, email,
        oldUserName, oldEmail,
        RemoteBranch, RepositoryURL
    } = ProjectInfo;

    let reg = /^(https:\/\/|http:\/\/|git@)/g;
    if (RepositoryURL.length == 0 || !reg.test(RepositoryURL)) {
        return webviewDialog.displayError('仓库地址无效');
    };

    if (username.length == 0) {
        return webviewDialog.displayError('git user.name无效');
    };

    if (!email.includes('@')) {
        return webviewDialog.displayError('git user.email无效');
    };

    webviewDialog.displayError('');
    webviewDialog.setButtonStatus("开始设置", ["loading", "disable"]);

    // 添加远程仓库
    let addOriginResult = await gitAddRemoteOrigin(projectPath, RepositoryURL);

    if (email != oldEmail) {
        gitConfigSet(projectPath, {"key": "user.email", "value": email});
    };
    if (username != oldUserName) {
        gitConfigSet(projectPath, {"key": "user.name", "value": username});
    };

    if (addOriginResult) {
        // 发送消息到webdialog
        webviewDialog.setButtonStatus("开始设置", []);
        let webview = webviewDialog.webView
        webview.postMessage({
            command: 'setResult',
            status: addOriginResult
        });

        // 打印日志到控制台
        createOutputChannel(`项目【${projectName}】远程仓库添加地址成功。`, "success");

        // 打开源代码管理器视图
        let pinfo = {"easyGitInner": true, "projectPath": projectPath, "projectName": projectName};
        hx.commands.executeCommand('EasyGit.main', pinfo);
    };
};

/**
 * @description 加载webdialog
 * @param {Object} ProjectInfo
 */
async function gitSetForWebDialog(ProjectInfo) {
    try{
        if (cmp > 0) {
            hx.window.showInformationMessage("此功能仅支持HBuilderX 3.1.2+以上版本，请升级。", ["我知道了"]);
        };
    }catch(e){
        hx.window.showInformationMessage("警告：此功能仅支持HBuilderX 3.1.2+以上版本，请升级。", ["我知道了"]);
    };

    // 获取项目信息
    let { projectName, projectPath, username, email } = ProjectInfo;
    if (username == undefined) {
        username = "";
    };
    if (email == undefined) {
        email = "";
    };

    // 创建webviewdialog
    let webviewDialog = hx.window.createWebViewDialog({
        modal: true,
        title: "Git仓库设置",
        dialogButtons: ["开始设置", "关闭"],
        size: {
            width: 730,
            height: 400
        }
    }, {
        enableScripts: true
    });

    let webview = webviewDialog.webView;

    webview.onDidReceiveMessage((msg) => {
        let action = msg.command;
        let { info } = msg;
        switch (action) {
            case 'closed':
                webviewDialog.close();
                hx.commands.executeCommand('EasyGit.main', ProjectInfo);
                break;
            case 'set':
                let setData = Object.assign(
                    info,
                    {"oldUserName": username, "oldEmail": email},
                    {"projectPath": projectPath, "projectName": projectName},
                )
                gitConfigSetForWebDialog(webviewDialog, setData);
                break;
            default:
                break;
        };
    });

    let promi = webviewDialog.show();
    promi.then(function (data) {
        // 处理错误信息
    });

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

            </style>
        </head>
        <body>
            <div id="app" v-cloak>
                <form>
                    <div class="form-group row m-0">
                        <label for="u-p" class="col-sm-2 px-0">项目名称</label>
                        <div class="col-sm-10">
                            <span>{{ projectName }}</span>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3">
                        <label for="u-p" class="col-sm-2 px-0 pt-3">仓库URL</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control outline-none" id="git-url" placeholder="要添加的Git仓库地址，以https://或git@开头" v-model.trim="init_data.RepositoryURL">
                            <p class="form-text text-muted pl-2">
                                若无仓库，可到
                                <span><a href="https://github.com/">GitHub官网</a>、</span>
                                <span><a href="https://gitee.com/">Gitee官网</a></span>
                                创建仓库或拷贝仓库URL
                            </p>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-1" v-if="isShowRemote">
                        <label for="u-p" class="col-sm-2 px-0 pt-2">关联远程分支</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control outline-none" id="git-branch" placeholder="要关联远程分支, 默认master分支; 如果是github，新建仓库默认分支为main" v-model.trim="RemoteBranch">
                        </div>
                    </div>
                    <div class="form-group row m-0">
                        <label for="u-p" class="col-sm-2 px-0 pt-3">用户名与邮箱</label>
                        <div class="col-sm-10">
                            <div class="row">
                                <div class="col">
                                    <input type="text" class="form-control outline-none" id="git-user" placeholder="user.name" v-model.trim="init_data.username">
                                </div>
                                <div class="col">
                                    <input type="text" class="form-control outline-none" id="git-email" placeholder="user.email" v-model.trim="init_data.email">
                                </div>
                            </div>
                            <p class="form-text text-muted">user.name和user.email用于标识身份，因为每一个 Git 提交都会使用这些信息。</p>
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
                        projectName: '',
                        isShowRemote: false,
                        RemoteBranch: '',
                        init_data: {
                            RepositoryURL: '',
                            username: '',
                            email: ''
                        }
                    },
                    computed: {
                        git_url() {
                            return this.init_data.RepositoryURL;
                        }
                    },
                    watch: {
                        git_url: function (newv, oldv) {
                            let url = this.init_data.RepositoryURL;
                            if (url.includes('github.com')) {
                                this.RemoteBranch = 'main';
                            };
                        }
                    },
                    created() {
                        this.projectName = '${projectName}';
                        this.init_data.username = '${username}';
                        this.init_data.email = '${email}';
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
                                if (msg.command == 'setResult') {
                                    let {status} = msg;
                                    if (['error', 'fail'].includes(status)){
                                        this.btnDisable = false;
                                    } else {
                                        hbuilderx.postMessage({
                                            command: 'closed'
                                        });
                                    }
                                };
                            });
                        },
                        gitSet() {
                            hbuilderx.onDidReceiveMessage((msg)=>{
                                if(msg.type == 'DialogButtonEvent'){
                                    let button = msg.button;
                                    if(button == '开始设置'){
                                        hbuilderx.postMessage({
                                            command: 'set',
                                            info: this.init_data
                                        });
                                    } else if(button == '关闭'){
                                        hbuilderx.postMessage({
                                            command: 'closed'
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
    gitInitProject
}
