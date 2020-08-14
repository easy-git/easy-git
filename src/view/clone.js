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
function show(webviewPanel, userConfig) {
    const view = webviewPanel.webView;
    const viewId = webviewPanel.webView._id;

    // 根据主题适配颜色
    let colorData = utils.getThemeColor();
    let {fontColor} = colorData;

    let uiData = Object.assign(colorData);

    view.html = generateLogHtml(userConfig, uiData);

    view.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'clone':
                clone(msg);
                break;
            default:
                break;
        };
    });

    async function clone(msg) {

    };
};


/**
 * @description generationhtml
 */
function generateLogHtml(userConfig, uiData) {
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
                        <p class="d-block">。</p>
                    </div>
                    <div>
                        <button class="btn-imp" @click.once="gitClone();">开始克隆</button>
                    </div>
                </div>
            </div>
            <script>
                var app = new Vue({
                    el: '#app',
                    data: {
                    },
                    created() {
                    },
                    mounted() {},
                    methods: {
                        gitClone() {
                            hbuilderx.postMessage({
                                command: 'clone',
                                info: this.info,
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
