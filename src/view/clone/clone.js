const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');

const ini = require('ini');
const hx = require('hbuilderx');

const icon = require('../static/icon.js');

const MainView = require('../main.js');
const utils = require('../../common/utils.js');
const file = require('../../common/file.js');

const osName = os.platform();

const vueFile = path.join(path.resolve(__dirname, '..'), 'static', '','vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'bootstrap.min.css');

/**
 * @description 读取HBuilderX.ini, 获取ProjectWizard
 */
function getProjectWizard() {
    let iniFile = '';
    try{
        const appData = hx.env.appData;
        const iniFile = path.join(appData,'HBuilder X.ini')
        const fileinfo = ini.parse(fs.readFileSync(iniFile, 'utf-8'));
        const ProjectWizard = path.join(fileinfo.ProjectWizard.location,'/');
        return ProjectWizard;
    } catch(e){
        return '';
    };
};


/**
 * @description 显示Git初始化页面
 * @param {Object} webviewPanel
 * @param {Object} userConfig
 * @param {Object} gitData
 */
function show(webviewPanel, userConfig) {
    const view = webviewPanel.webView;
    const viewId = webviewPanel.webView._id;
    hx.window.showView({
        viewid: "EasyGitSourceCodeView",
        containerid: "EasyGitSourceCodeView"
    });

    // 根据主题适配颜色
    let colorData = utils.getThemeColor('left');
    let {fontColor} = colorData;

    let uiData = Object.assign(colorData);

    // HBuilderX数据
    let ProjectWizard = getProjectWizard();
    let hxData = { 'ProjectWizard': ProjectWizard };

    view.html = generateLogHtml(userConfig, uiData, hxData);

    view.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'clone':
                clone(msg.info);
                break;
            default:
                break;
        };
    });

    async function clone(info) {
        let {localPath} = info;
        let projectName = localPath.split('/').pop();
        info = Object.assign(info,{
            'projectName': projectName
        });

        if (!fs.existsSync(localPath)) {
            fs.mkdirSync(localPath);
        };

        let result = await utils.gitClone(info);
        if (result == 'success') {
            utils.importProjectToExplorer(localPath);
            let pinfo = {
                'easyGitInner': true,
                'projectName': projectName,
                'projectPath': localPath
            };
            hx.commands.executeCommand('EasyGit.main', pinfo);
            hx.commands.executeCommand('workbench.view.explorer');
        } else {
            try{
                file.deleteFolderRecursive(projectName);
            }catch(e){};

            view.postMessage({
                command: 'clone',
                status: result
            });
        };
    };
};


/**
 * @description generationhtml
 * @todo 目前通过js打开资源管理器，无法打开的目录。因此 本地存储路径输入框，不支持手动选择
 * @todo 克隆进度条
 */
function generateLogHtml(userConfig, uiData, hxData) {
    // 是否启用开发者工具
    let {DisableDevTools} = userConfig;

    // UI数据, ui、color、font
    let {
        background,
        liHoverBackground,
        inputColor,
        inputLineColor,
        cursorColor,
        fontColor,
        lineColor,
        helpIcon,
        refreshIcon,
        searchIcon
    } = uiData;

    let { ProjectWizard } = hxData;
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
                    color: ${fontColor};
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

                .btn-imp {
                    background-color: ${background};
                    border: 1px solid ${lineColor};
                    border-radius: 3px;
                    width: 100%;
                    margin: 10px 0px;
                    padding: 5px 0;
                    font-size: 14px;
                    color: ${fontColor};
                    outline: 0;
                }
                button:focus {
                    outline: none;
                    transform: scale(0.98);
                }
                button:active {
                    color: ${inputLineColor}!important;
                }

                .outline-none {
                    box-shadow: none !important;
                }
                .form-control {
                    background-color:${background} !important;
                    font-size: 0.9rem !important;
                    border: 1px solid ${lineColor} !important;
                }
                .form-control:focus {
                    border: 1px solid ${inputLineColor} !important;
                }
                .form-group .form-control::-webkit-input-placeholder, .form-control::-webkit-input-placeholder {
                    font-size: 0.9rem !important;
                    font-weight: 200 !important;
                    color: #c0c4cc !important;
                }
                .custom-file {
                    width: 60px !important;
                    height: 100% !important;
                }
                .from-file {
                    border-radius: 0.25rem 0 0 0.25rem !important;
                }
                .custom-file-input {
                    width: 100% !important;
                    height: 100% !important;
                }
                .custom-file-label {
                    width: 100% !important;
                    height: 100% !important;
                    border-left: none !important;
                    border-radius: 0 0.25rem 0.25rem 0 !important;
                }
                .custom-file-label::after {
                    background-color: transparent !important;
                    border-radius: 0 0.25rem 0.25rem 0 !important;
                }
                .custom-control-label::before {
                    background-color:${background} !important;
                }
                .custom-switch .custom-control-input:checked~.custom-control-label::after {
                    background-color: ${inputLineColor} !important;
                }
            </style>
        </head>
        <body style="background-color:${background};">
            <div id="app" v-cloak>
                <div class="d-flex flex-column mt-3 mx-3">
                    <div>
                        <form>
                            <div class="form-group">
                                <label for="git-url">Git地址</label>
                                <input type="text" class="form-control outline-none" v-focus id="git-url" placeholder="Git仓库地址, 以git@或http开头" v-model="repo">
                                <small id="git-url-help" class="form-text text-muted">备注: 如果地址是私有仓库, 可能需要提供认证信息才能克隆。</small>
                            </div>
                            <div class="form-group">
                                <label for="exampleInputPassword1">本地存储路径</label>
                                <div class="input-group">
                                    <input type="text" class="form-control outline-none" placeholder="本地存储路径" v-model="cloneInfo.localPath">
                                </div>
                            </div>
                            <div class="form-group">
                                <div class="custom-control custom-switch">
                                    <input type="checkbox" class="custom-control-input outline-none" id="customSwitch1" v-model="isShowOption">
                                    <label class="custom-control-label" for="customSwitch1">高级选项</label>
                                </div>
                            </div>
                            <div class="form-group" v-if="isShowOption">
                                <input type="text" class="form-control outline-none" id="git-user" placeholder="Git仓库用户名" v-model="cloneInfo.username">
                            </div>
                            <div class="form-group" v-if="isShowOption">
                                <input type="password" class="form-control outline-none" id="git-passwd" placeholder="Git仓库密码" v-model="cloneInfo.password">
                            </div>
                            <button type="button" class="btn-imp" @click="gitClone();">开始克隆</button>
                        </form>
                    </div>
                </div>
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
                        isShowOption: false,
                        btnDisable: true,
                        ProjectWizard: '',
                        repo: '',
                        cloneInfo: {
                            repo: '',
                            localPath: '',
                            isAuth: '',
                            username: '',
                            password: ''
                        }
                    },
                    watch: {
                        repo: function (newrepo, oldrepo) {
                            this.btnDisable = false;
                            let repo = this.repo;
                            let projectName = ((repo.split('/')).pop()).replace('.git','');
                            this.cloneInfo.localPath = this.ProjectWizard + projectName;
                        }
                    },
                    created() {
                        this.ProjectWizard = '${ProjectWizard}';
                        this.cloneInfo.localPath = '${ProjectWizard}';
                    },
                    mounted() {},
                    methods: {
                        gitClone() {
                            this.cloneInfo.repo = this.repo;
                            if (this.isShowOption) {
                                this.cloneInfo.isAuth = true;
                            };
                            hbuilderx.postMessage({
                                command: 'clone',
                                info: this.cloneInfo,
                            });
                            this.btnDisable = true;
                        }
                    }
                })
            </script>
            <script>
                let devStatus = ${DisableDevTools};
                if (devStatus) {
                    window.oncontextmenu = function() {
                        event.preventDefault();
                        return false;
                    }
                };
            </script>
        </body>
    </html>

    `
};

module.exports = {
    show
}
