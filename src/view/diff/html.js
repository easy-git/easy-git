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
function getWebviewDiffContent(selectedFile, userConfig, uiData, diffData) {
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

    let { titleLeft, titleRight, diffResult } = diffData;

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
                line-height: 40px;
                background-color: ${background} !important;
                z-index: 100;
            }
            .diff-head .file-title {
                display: inline;
                padding-left: 1.5rem;
                font-size: 15px;
                font-style: oblique;
                color: ${fontColor} !important;
                display: block;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
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
            .d2h-files-diff .d2h-file-side-diff:last-child {
                border-left: 1px solid ${lineColor} !important;
            }
            .d2h-code-wrapper {
                height: calc(100vh - 50px) !important;
            }
            .d2h-code-side-linenumber {
                background-color: ${background} !important;
                border: 1px solid ${background} !important;
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
                    <div class="col-6">
                        <span class="file-title">{{ titleLeft }}</span>
                    </div>
                    <div class="col-6">
                        <span class="file-title">{{ titleRight }}</span>
                    </div>
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
                    titleLeft: '',
                    titleRight: '',
                    selectedFile: '',
                    gitDiffResult: ''
                },
                created() {
                    this.titleLeft = '${titleLeft}';
                    this.titleRight = '${titleRight}';
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
                    forUpdate() {
                        hbuilderx.onDidReceiveMessage((msg) => {
                            this.gitDiffResult = '';
                            if (msg.command != 'update') {return};
                            this.gitDiffResult = msg.result;
                            this.titleLeft = '';
                            this.titleRight = '';
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
