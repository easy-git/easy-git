const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');

const utils = require('../common/utils.js');
const icon = require('./static/icon.js');

const vueFile = path.join(__dirname, 'static', '','vue.min.js');
const bootstrapCssFile = path.join(__dirname, 'static', 'bootstrap.min.css');


/**
 * @description 显示Git初始化页面
 * @param {Object} webviewPanel
 * @param {Object} userConfig
 * @param {Object} gitData
 */
function show(webviewPanel, userConfig, FilesExplorerProjectInfo) {
    const view = webviewPanel.webView;
    const viewId = webviewPanel.webView._id;

    // 根据主题适配颜色
    let colorData = utils.getThemeColor('siderBar');
    let {fontColor} = colorData;

    let uiData = Object.assign(colorData);

    view.html = generateLogHtml(userConfig, uiData, FilesExplorerProjectInfo);

    view.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'init':
                let data = {
                    'projectPath': projectPath,
                    'projectName': projectName,
                    'easyGitInner': true
                };
                hx.commands.executeCommand('EasyGit.init',data);
                break;
            case 'select':
                hx.commands.executeCommand('workbench.view.explorer');
                break;
            case 'open':
                hx.commands.executeCommand('workbench.action.files.openFolder');
                break;
            case 'open_clone':
                hx.commands.executeCommand('EasyGit.clone');
                break;
            default:
                break;
        };
    });
};


/**
 * @description generationhtml
 */
function generateLogHtml(userConfig, uiData, FilesExplorerProjectInfo) {
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

    // 解析当前项目管理器项目数据
    let {FoldersNum, Folders, currentSelectedProject} = FilesExplorerProjectInfo;
    Folders = JSON.stringify(Folders);
    currentSelectedProject = JSON.stringify(currentSelectedProject);

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
                    outline:none;
                    transform: scale(0.95);
                }
                button:hover {
                    color: ${inputLineColor} !important;
                }
                .action-desc {
                    font-size: 12px;
                    color: ${fontColor};
                }
            </style>
        </head>
        <body style="background-color:${background};">
            <div id="app" v-cloak>
                <div class="mt-3">
                    <div class="d-flex flex-column mt-5 mx-3" v-if="FoldersNum == 1 || currentSelect != undefined">
                        <div>
                            <span class="d-block action-desc">
                                当前选择的项目【 {{ projectInfo.FolderName }} 】 没有 git 储存库。
                            </span>
                        </div>
                        <div>
                            <button class="btn-imp" @click.once="gitInit(projectInfo);">初始化存储库</button>
                        </div>
                    </div>
                    <div class="d-flex flex-column mt-5 mx-3" v-if="FoldersNum > 1 && currentSelect == undefined">
                        <div>
                            <span class="d-block action-desc">
                                项目管理器，选中项目，右键菜单点击源代码管理，即可打开Git视图。
                            </span>
                        </div>
                        <div>
                            <button class="btn-imp" @click.once="selectProject();">选择项目管理器中的Git项目</button>
                        </div>
                    </div>
                    <!--
                        <div class="d-flex mx-3" v-if="currentSelect == undefined">
                            <button class="btn-imp" @click="openLocal();">打开本地Git项目</button>
                        </div>
                    -->
                    <div class="d-flex flex-column mx-3 mt-3">
                        <div>
                            <span class="d-block action-desc">
                                输入URL克隆Git仓库，克隆成功后，会自动在项目管理器打开。
                                <a href="https://ext.dcloud.net.cn/plugin?id=2475">了解详情</a>
                            </span>
                        </div>
                        <div>
                            <button class="btn-imp" @click="goClone();">克隆Git存储库</button>
                        </div>
                    </div>
                </div>
            </div>
            <script>
                var app = new Vue({
                    el: '#app',
                    data: {
                        FoldersNum: 0,
                        Folders: [],
                        currentSelect: undefined
                    },
                    computed:{
                        projectInfo() {
                            if (this.currentSelect == undefined) {
                                let Folders = this.Folders
                                if (this.FoldersNum == 1) {
                                    return Folders[0]
                                } else {
                                    return {}
                                }
                            } else {
                                return this.currentSelect
                            }
                        }
                    },
                    created() {
                        this.FoldersNum = ${FoldersNum};
                        this.Folders = ${Folders};
                        this.currentSelect = ${currentSelectedProject};
                    },
                    mounted() {},
                    methods: {
                        refresh() {
                            hbuilderx.postMessage({
                                command: 'refresh'
                            });
                        },
                        gitInit(projectInfo) {
                            let fsPath = projectInfo.FolderPath;
                            let name = projectInfo.FolderName;
                            hbuilderx.postMessage({
                                command: 'init',
                                projectPath: fsPath,
                                projectName: name
                            });
                        },
                        selectProject() {
                            hbuilderx.postMessage({
                                command: 'select'
                            });
                        },
                        openLocal() {
                            hbuilderx.postMessage({
                                command: 'open'
                            });
                        },
                        goClone() {
                            hbuilderx.postMessage({
                                command: 'open_clone'
                            });
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
