const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');

const utils = require('../utils.js');
const icon = require('./static.js');

const MainView = require('./main.js');


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
    let colorData = utils.getThemeColor();
    let {fontColor} = colorData;

    let uiData = Object.assign(colorData);

    view.html = generateLogHtml(userConfig, uiData, FilesExplorerProjectInfo);

    view.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'init':
                init(msg);
                break;
            case 'select':
                hx.commands.executeCommand('workbench.view.explorer');
                break;
            case 'open':
                hx.commands.executeCommand('workbench.action.files.openFile');
                break;
            default:
                break;
        };
    });

    async function init(msg) {
        let {projectPath,projectName} = msg;
        let status = await utils.gitInit(projectPath,projectName);
        if (status == 'success') {
            if (viewId == 'EasyGitSourceCode') {
                let gitInfo = await utils.gitStatus(projectPath,projectName);
                let gitData = Object.assign(gitInfo, {
                    'projectName': projectName,
                    'projectPath': projectPath
                });
                MainView.active(webviewPanel, userConfig, gitData);
            };
            if (viewId == 'EasyGitLog') {
                let data = {
                    'projectPath': projectPath,
                    'projectName': projectName,
                    'easyGitInner': true
                }
                hx.commands.executeCommand('extension.EasyGitMain',data);
            };

        }
    };
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
            <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css">
            <style type="text/css">
                body {
                    color: $  {fontColor};
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
            </style>
            <script src="https://cdn.jsdelivr.net/npm/vue"></script>
        </head>
        <body style="background-color:${background};">
            <div id="app" v-cloak>
                <div class="d-flex flex-column mt-3 mx-3" v-if="FoldersNum == 1 || currentSelect != undefined">
                    <div>
                        <p class="d-block">当前选择的项目【 {{ projectInfo.FolderName }}】 没有 git 储存库。</p>
                    </div>
                    <div>
                        <button class="btn-imp" @click.once="gitInit(projectInfo);">初始化存储库</button>
                    </div>
                </div>
                <div class="d-flex mt-3 mx-3" v-if="FoldersNum > 1 && currentSelect == undefined">
                    <button class="btn-imp" @click.once="selectProject();">选择项目管理器中的Git项目</button>
                </div>
                <div class="d-flex mx-3" v-if="currentSelect == undefined">
                    <button class="btn-imp" @click="openLocal();">打开本地Git项目</button>
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
