const hx = require('hbuilderx');

const os = require('os');
const path = require('path');
const osName = os.platform();

const vueFile = path.join(path.resolve(__dirname, '..'), 'static', '','vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'bootstrap.min.css');
const diff2htmlCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'diff2html.min.css');

/**
 * @description 获取webview Branch内容
 * @param {Object} userConfig
 * @param {Object} uiData
 * @param {Object} gitBranchData
 */
function getWebviewDiffContent(selectedFile, userConfig, uiData, diffResult='') {
    // 是否启用开发者工具
    let {DisableDevTools} = userConfig;

    // icon
    let {
        background,
        liHoverBackground,
        inputColor,
        inputLineColor,
        cursorColor,
        fontColor,
        lineColor,
        UpArrowIcon,
        BackIcon,
        BranchIcon,
        DownArrowIcon,
        AddIconSvg,
        XIcon,
        SyncIcon,
        MergeIcon,
        TagIcon,
        uploadIcon,
        cloudIcon,
        ShowIcon
    } = uiData;

    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="${bootstrapCssFile}">
        <link rel="stylesheet" href="${diff2htmlCssFile}">
        <script src="${vueFile}"></script>
        <style type="text/css">
            body {
                color: ${fontColor};
                font-size: 0.92rem;
                background-color: ${background} !important;
            }
            body::-webkit-scrollbar {
                display: none;
            }
            [v-cloak] {
                display: none;
            }
            .diff-head {
                height: 40px;
                background-color: ${background} !important;
                z-index: 100;
            }
            .diff-body {
                margin-top: 40px !important;
            }
            .d2h-file-header {
                display: none !important;
            }
            .d2h-info {
                background-color: ${background} !important;
            }
            .d2h-file-wrapper {
                border: none !important;
            }
            .d2h-files-diff {
                height: calc(100vh - 50px) !important;
            }
            .d2h-file-side-diff {
                border-right: 1px solid ${lineColor};
            }
            .d2h-code-wrapper {
                height: calc(100vh - 50px) !important;
            }
            .d2h-code-side-linenumber {
                background-color: ${background} !important;
                border: none !important;
            }
            .d2h-code-side-linenumber::after {
                background-color: ${background} !important;
            }
        </style>
    </head>
    <body>
        <div id="app" v-cloak>
            <div class="container-fluid">
                <div id="diff-head" class="row diff-head fixed-top">
                    <div class="col-6">mina.js</div>
                    <div class="col-6">adfa.js</div>
                </div>
                <div id="diff-body" class="row diff-body">
                    <div class="col p-0">
                        <div v-html="gitDiffResult"></div>
                    </div>
                </div>
            </div>
        </div>
        <script>
            var app = new Vue({
                el: '#app',
                data: {
                    selectedFile: '',
                    gitDiffResult: ''
                },
                created() {
                    this.selectedFile = '${selectedFile}'
                },
                mounted() {
                    that = this;
                    window.onload = function() {
                        setTimeout(function() {
                            that.forUpdate();
                        }, 1000)
                    };
                    this.forInit();
                },
                methods: {
                    forInit() {
                        this.gitDiffResult = \`${diffResult}\`
                    },
                    forRefresh() {
                        hbuilderx.postMessage({
                            command: 'update',
                            selectedFile: this.selectedFile
                        })
                    },
                    forUpdate() {
                        hbuilderx.onDidReceiveMessage((msg) => {
                            this.gitDiffResult = '';
                            if (msg.command != 'update') {return};
                            this.gitDiffResult = msg.result;
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
            }
        </script>
    </body>
</html>
`;
};


module.exports = getWebviewDiffContent;
