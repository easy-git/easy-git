const hx = require('hbuilderx');

const os = require('os');
const path = require('path');

const icon = require('../static/icon.js');
let utils = require('../../common/utils.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'static', '','vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'bootstrap.min.css');
const diff2htmlCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'diff2html.min.css');


/**
 * @description 获取图标、各种颜色
 * @return {Object} UIData
 */
function getUIData() {

    // 根据主题适配颜色
    let colorData = utils.getThemeColor('right');

    // let {fontColor} = colorData;

    // let uiData = Object.assign(iconData,colorData);
    return colorData;
};

/**
 * @description 获取webview Branch内容
 * @param {String} selectedFile
 * @param {Object} userConfig
 * @param {Object} gitBranchData
 */
function getWebviewDiffContent(selectedFile, userConfig, diffData) {
    // 是否启用开发者工具
    let { DisableDevTools } = userConfig;

    let uiData = getUIData();

    // color
    let {
        background,
        liHoverBackground,
        inputColor,
        inputLineColor,
        cursorColor,
        fontColor,
        lineColor,
        d2h_ins_bg,
        d2h_ins_border,
        d2h_del_bg,
        d2h_del_border,
        d2h_code_side_line_del_bg,
        d2h_code_side_line_ins_bg,
        d2h_emptyplaceholder_bg,
        d2h_emptyplaceholder_border,
        d2h_linenum_color
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
            .d2h-file-wrapper {
                border: none !important;
            }
            .d2h-files-diff .d2h-file-side-diff:last-child {
                border-left: 1px solid ${lineColor} !important;
            }
            .d2h-file-side-diff::-webkit-scrollbar {
                height: 0 !important
            }
            .d2h-file-header {
                display: none !important;
            }
            .d2h-code-side-linenumber {
               background-color: ${background} !important;
               border: 1px solid ${background} !important;
               color: ${d2h_linenum_color} !important;
            }
            .d2h-code-side-linenumber::after {
                background-color: ${background} !important;
            }
            .d2h-info {
                border-color: ${background} !important;
                background-color: ${background} !important;
            }
            .d2h-ins {
                background-color: ${d2h_ins_bg} !important;
                border-color: ${d2h_ins_bg} !important;
            }
            .d2h-del {
                background-color: ${d2h_del_bg} !important;
                border-color: ${d2h_del_bg} !important;
            }
            .d2h-code-side-line ins {
                background-color: ${d2h_code_side_line_ins_bg} !important;
            }
            .d2h-code-side-line del {
                background-color: ${d2h_code_side_line_del_bg} !important;
            }
            .d2h-code-side-emptyplaceholder, .d2h-emptyplaceholder {
                border-color: ${d2h_emptyplaceholder_bg} !important;
                background-color: ${d2h_emptyplaceholder_bg} !important;
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


function getDefaultContent(userConfig) {

    let uiData = getUIData();

    // icon
    let {
        background,
        liHoverBackground,
        inputColor,
        inputLineColor,
        cursorColor,
        fontColor,
        lineColor
    } = uiData;

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
                font-size: 0.92rem;
                background-color: ${background} !important;
            }
            body::-webkit-scrollbar {
                display: none;
            }
            [v-cloak] {
                display: none;
            }
            p {
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div id="app" v-cloak>
            <div class="container-fluid">
                <div id="diff-head" class="row">
                    <div class="col text-center pt-5">
                        <p>没有要对比的文件内容</p>
                        <p>注意：目前仅支持对比本地有更改的文件</p>
                    </div>
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
                mounted() {
                },
                methods: {
                }
            })
        </script>
        <script>
            window.oncontextmenu = function() {
                event.preventDefault();
                return false;
            }
        </script>
    </body>
</html>
    `
};

module.exports = {
    getDefaultContent,
    getWebviewDiffContent
};
