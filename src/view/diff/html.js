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
    let {fontColor} = colorData;

    let OpenFileIconSvg = icon.getOpenFileIcon(fontColor);
    let HistoryIcon = icon.getHistoryIcon(fontColor);
    let DiffFullTextIcon = icon.getDiffFullIcon(fontColor);

    let iconData = {OpenFileIconSvg, HistoryIcon, DiffFullTextIcon};
    let uiData = Object.assign(iconData, colorData);
    return uiData;
};

/**
 * @description 获取webview Branch内容
 * @param {String} selectedFilePath
 * @param {Object} userConfig
 * @param {Object} gitBranchData
 */
function getWebviewDiffContent(selectedFilePath, userConfig, diffData) {
    // 是否启用开发者工具
    let { DisableDevTools, isFullTextDiffFile } = userConfig;

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
        d2h_linenum_color,
        diff_scrollbar_color,
        OpenFileIconSvg,
        HistoryIcon,
        DiffFullTextIcon
    } = uiData;

    let { titleLeft, titleRight, isDiffHtml, diffResult, isConflicted } = diffData;

    // .d2h-code-linenumber .d2h-code-line .d2h-cntx
    // let d2hCodeLinenumber = "width: 7.5em !important;";
    // let d2hCodeLine = "padding: 0 8em;";
    // if (isConflicted) {
    //     d2hCodeLinenumber = "width: 3.75em !important;";
    //     d2hCodeLine = "padding: 0 4em;";
    // };

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
                overflow-x: hidden;
            }
            body::-webkit-scrollbar {
                overflow-x: hidden;
                overflow-y: scroll;
            }
            ::-webkit-scrollbar {
                width: 9px;
            }
            ::-webkit-scrollbar-thumb {
                background-color: ${diff_scrollbar_color};
            }
            [v-cloak] {
                display: none;
            }
            .diff-head {
                height: 50px;
                background-color: ${background} !important;
                z-index: 100;
            }
            .diff-head .file-title {
                display: inline-block;
                font-size: 16px;
                width: 80%;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
            .diff-head .file-label {
                display: inline-block;
                padding-left: 1.5rem;
                font-size: 15px;
                font-style: oblique;
                color: ${fontColor} !important;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
            .diff-body {
                margin-top: 50px !important;
            }
            .d2h-file-wrapper {
                border: none !important;
                margin-bottom: 0px !important;
            }
            .d2h-files-diff .d2h-file-side-diff:last-child {
                border-left: 1px solid ${lineColor} !important;
            }
            .d2h-file-side-diff::-webkit-scrollbar {
                height: 9px !important
            }
            .d2h-file-side-diff {
                min-height: calc(100vh - 50px);
                position: relative;
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
            .f-custom-line {
                color: ${fontColor};
                margin: 3px 12px;
                font-size: 14px !important;
            }
            .cursor-default {
                cursor: default;
            }
        </style>
    </head>
    <body>
        <div id="app" v-cloak>
            <div class="container-fluid">
                <div id="diff-head" class="diff-head fixed-top">
                    <div class="row">
                        <div class="col px-5">
                            <div class="row">
                                <div class="col-10">
                                    <span class="file-title" @click="openFile();">${selectedFilePath}</span>
                                </div>
                                <div class="col-2 mr-2" style="right: 0; position: absolute; text-align: end;">
                                    <span title="打开文件" @click="openFile();">${OpenFileIconSvg}</span>
                                    <span title="查看日志" @click="openLog();">${HistoryIcon}</span>
                                    <span :title="isFullTextDiffFileIconTitle" @click="setDiffFileConfig();">${DiffFullTextIcon}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row" v-if="isConflicted">
                        <div class="col-auto mr-auto"></div>
                        <div class="col-auto px-5 cursor-default">
                            <span title="git checkout --ours" @click="gitHandleConflict('--ours')">保留当前分支文件 | </span>
                            <span title="git checkout --theirs" @click="gitHandleConflict('--theirs')">采用传入的文件</span>
                        </div>
                    </div>
                    <div class="row" v-else>
                        <div class="col-6">
                            <span class="file-label" v-show="titleLeft != 'undefined' ">{{ titleLeft }}</span>
                        </div>
                        <div class="col-6">
                            <span class="file-label" v-show="titleRight != 'undefined' ">{{ titleRight }}</span>
                        </div>
                    </div>
                </div>
                <div id="diff-body" class="row diff-body">
                    <div class="col p-0">
                        <div v-html="gitDiffResult" v-if="isDiffHtml"></div>
                        <div class="mb-5" v-else>
                            <p class="f-custom-line" v-for="(item,idx) in gitDiffResult" :index="idx">
                                <span class="mx-3">{{idx+1}}</span>
                                <span>{{item}}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script>
            var app = new Vue({
                el: '#app',
                data: {
                    isDiffHtml: ${isDiffHtml},
                    titleLeft: '${titleLeft}',
                    titleRight: '${titleRight}',
                    isConflicted: ${isConflicted},
                    gitDiffResult: '',
                    isFullTextDiffFile: ''
                },
                computed: {
                    // 文件对比，是否显示全文，icon悬停文本提示语
                    isFullTextDiffFileIconTitle() {
                        return this.isFullTextDiffFile == 'full' ? '关闭全文对比, 使用默认行数上下文生成差异' : '开启全文对比';
                    }
                },
                created() {
                    this.isFullTextDiffFile = '${isFullTextDiffFile}';
                    let text = this.isFullTextDiffFile == 'full' ? '关闭全文对比, 使用默认行数上下文生成差异' : '开启全文对比';
                    console.log(text)
                },
                mounted() {
                    this.forInit();

                    that = this;
                    window.onload = function() {
                        setTimeout(function() {
                            that.forUpdate();
                        }, 800);
                    };
                },
                methods: {
                    forInit() {
                        this.gitDiffResult = \`${diffResult}\`
                    },
                    forUpdate() {
                        hbuilderx.onDidReceiveMessage((msg) => {
                            this.gitDiffResult = '';
                            if (msg.command != 'update') {return};
                            let data = msg.result;
                            this.isDiffHtml = data.isDiffHtml;
                            this.gitDiffResult = data.diffResult;
                            this.titleLeft = '';
                            this.titleRight = '';
                        });
                    },
                    openFile() {
                        hbuilderx.postMessage({
                            command: 'openFile'
                        });
                    },
                    openLog() {
                        hbuilderx.postMessage({
                            command: 'openLog'
                        });
                    },
                    gitHandleConflict(options) {
                        hbuilderx.postMessage({
                            command: 'handleConflict',
                            options: options
                        });
                    },
                    setDiffFileConfig() {
                        hbuilderx.postMessage({
                            command: 'fileDiffLineSet',
                            options: this.isFullTextDiffFile
                        });
                        if (this.isFullTextDiffFile == 'full') {
                            this.isFullTextDiffFile = false;
                        } else {
                            this.isFullTextDiffFile = true;
                        };
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
`;
};


function getDefaultContent(fname='') {

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
                        <p>{{ msg }}</p>
                        <p>注意：目前仅支持对比本地有更改的文件</p>
                    </div>
                </div>
            </div>
        </div>
        <script>
            var app = new Vue({
                el: '#app',
                data: {
                    msg: ''
                },
                created() {
                    let tmp = '${fname}';
                    if (tmp == '') {
                        this.msg = '没有要对比的文件内容, 请直接关闭当前标签卡。'
                    } else {
                        this.msg = tmp + ' 没有要对比的文件内容, 请直接关闭当前标签卡。'
                    };
                }
            })
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

module.exports = {
    getDefaultContent,
    getWebviewDiffContent
};
