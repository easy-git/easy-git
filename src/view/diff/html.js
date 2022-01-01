const hx = require('hbuilderx');

const os = require('os');
const path = require('path');

const icon = require('../static/icon.js');
let utils = require('../../common/utils.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'static', '','vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'bootstrap.min.css');
const diff2htmlCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'diff2html.min.css');
const gitDiffCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'git-diff.css');
const ttfFile = path.join(path.resolve(__dirname, '..'), 'static', 'font' ,'diff.ttf');


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
    let RefreshIcon = icon.getRefreshIcon(fontColor);

    let iconData = {OpenFileIconSvg, HistoryIcon, DiffFullTextIcon, RefreshIcon};
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
        DiffFullTextIcon,
        RefreshIcon
    } = uiData;

    let { titleLeft, titleRight, isDiffHtml, diffResult, isConflicted, isDisplayPrompt } = diffData;

    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="${bootstrapCssFile}">
        <link rel="stylesheet" href="${diff2htmlCssFile}">
        <script src="${vueFile}"></script>
        <style type="text/css">
            :root {
                --background: ${background};
                --liHoverBackground: ${liHoverBackground};
                --cursorColor: ${cursorColor};
                --fontColor: ${fontColor};
                --lineColor: ${lineColor};
                --d2h_ins_bg: ${d2h_ins_bg};
                --d2h_ins_border: ${d2h_ins_border};
                --d2h_del_bg: ${d2h_del_bg};
                --d2h_del_border: ${d2h_del_border};
                --d2h_code_side_line_del_bg: ${d2h_code_side_line_del_bg};
                --d2h_code_side_line_ins_bg: ${d2h_code_side_line_ins_bg};
                --d2h_emptyplaceholder_bg: ${d2h_emptyplaceholder_bg};
                --d2h_emptyplaceholder_border: ${d2h_emptyplaceholder_border};
                --d2h_linenum_color: ${d2h_linenum_color};
                --diff_scrollbar_color: ${diff_scrollbar_color};
            }
            @font-face {
                font-family: 'diff-icon';
                src: url('${ttfFile}') format('truetype');
            }
        </style>
        <link rel="stylesheet" href="${gitDiffCssFile}">
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
                                <div class="col-2 mr-4" style="right: 0; position: absolute; text-align: end;">
                                    <span title="刷新当前视图" @click="refresh();">${RefreshIcon}</span>
                                    <span title="打开文件" @click="openFile();">${OpenFileIconSvg}</span>
                                    <span title="查看日志" @click="openLog();">${HistoryIcon}</span>
                                    <span :title="isFullTextDiffFileIconTitle" @click="setDiffFileConfig();">${DiffFullTextIcon}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-auto mr-auto">
                        </div>
                        <div class="col-auto mr-4 cursor-default">
                            <div v-if="isConflicted">
                                <span title="git checkout --ours" @click="gitHandleConflict('--ours')">保留当前分支文件 | </span>
                                <span title="git checkout --theirs" @click="gitHandleConflict('--theirs')">采用传入的文件</span>
                            </div>
                            <div class="diff-head-action" v-else>
                                <span :class="[ stylePreviousRevsion ? 'revision-disabled' : '' ]" @click="openChangeWithRevision('+')" title="open change with previous Revision">Previous</span>
                                <span :class="[ styleNextRevsion ? 'revision-disabled' : '' ]" @click="openChangeWithRevision('-')" title="open change with Next Revision">Next</span>
                                <span class="icon-git icon-git-commit" @click="openChangeWithOneRevision()" title="选择某条历史提交进行对比"></span>
                            </div>
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
                    <div class="row" v-if="isDisplayPrompt == 'N'">
                        <div class="col text-center">
                            <p class="mt-5">没有Git对比结果</p>
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
                    isDisplayPrompt: '${isDisplayPrompt}',
                    isDiffHtml: ${isDiffHtml},
                    titleLeft: '${titleLeft}',
                    titleRight: '${titleRight}',
                    isConflicted: ${isConflicted},
                    gitDiffResult: '',
                    isFullTextDiffFile: '',
                    isClickRevision: '',
                    currentHash: 0,
                    HistoryHashList: [],
                    HistoryHashNum: 0
                },
                computed: {
                    // 文件对比，是否显示全文，icon悬停文本提示语
                    isFullTextDiffFileIconTitle() {
                        return this.isFullTextDiffFile == 'full' ? '关闭全文对比, 使用默认行数上下文生成差异' : '开启全文对比';
                    },
                    stylePreviousRevsion() {
                        return this.HistoryHashNum >= this.currentHash && this.HistoryHashList.length ? false : true;
                    },
                    styleNextRevsion() {
                        return this.currentHash >= 0 && this.isClickRevision && this.HistoryHashList.length ? false : true;
                    },
                },
                created() {
                    this.isFullTextDiffFile = '${isFullTextDiffFile}';
                    let text = this.isFullTextDiffFile == 'full' ? '关闭全文对比, 使用默认行数上下文生成差异' : '开启全文对比';
                },
                mounted() {
                    this.forInit();

                    that = this;
                    window.onload = function() {
                        setTimeout(function() {
                            that.Receive();
                            that.getFileHistoryCommitHashList();
                        }, 800);
                        that.drag()
                    };
                },
                methods: {
                    forInit() {
                        this.gitDiffResult = \`${diffResult}\`
                    },
                    drag() {
                        let side1 = document.getElementById('side1');
                        let cutLine = document.getElementById('cut-line');
                        let side2 = document.getElementById('side2');
                        cutLine.onmousedown = function(e) {
                            let lineLeft = e.clientX;
                            cutLine.left = cutLine.offsetLeft;
                            document.onmousemove = function(e) {
                                let diffVal = cutLine.left + (e.clientX -lineLeft);
                                if(diffVal >= document.body.clientWidth * 0.05 && diffVal <= document.body.clientWidth * 0.95) {
                                    cutLine.style.left = diffVal+'px';
                                    // cutLine.style.width = '2px';
                                    side1.style.width = diffVal +'px';
                                    side2.style.width = document.body.clientWidth - diffVal +'px';
                                    window.scrollRight(10000);
                                };
                            };
                            document.onmouseup = function() {
                                document.onmousemove = null;
                                document.onmouseup = null;
                            };
                        };
                    },
                    Receive() {
                        hbuilderx.onDidReceiveMessage((msg) => {
                            if (msg.command == 'themeColor') {
                                let themedata = msg.data;
                                let colors = Object.keys(themedata);
                                for (let i of colors) {
                                    document.documentElement.style.setProperty('--' + i, themedata[i]);
                                };
                            };
                            if (msg.command == 'update') {
                                this.gitDiffResult = '';
                                let data = msg.result;
                                this.isDiffHtml = data.isDiffHtml;
                                this.gitDiffResult = data.diffResult;
                                this.titleLeft = '';
                                this.titleRight = '';
                            };
                            if (msg.command == 'updateRevisionContent') {
                                let isPrevious = msg.isPrevious;
                                let diffParam = msg.diffParam;
                                this.isClickRevision = msg.isPrevious;
                                if (['-', '+'].includes(isPrevious) && diffParam.length) {
                                    if (diffParam[0] == 'HEAD^') {
                                        this.currentHash = 0;
                                        this.isClickRevision = '';
                                    } else {
                                        this.currentHash = isPrevious == '+' ? this.currentHash + 1 : this.currentHash;
                                    };
                                };
                                this.gitDiffResult = '';
                                let data = msg.result;
                                this.isDiffHtml = data.isDiffHtml;
                                this.gitDiffResult = data.diffResult;
                                this.titleLeft = '';
                                this.titleRight = '';
                            };
                            if (msg.command == 'LogHistoryHash') {
                                this.HistoryHashList = msg.list;
                                this.HistoryHashNum = msg.historyHashNum;
                            }
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
                    refresh() {
                        hbuilderx.postMessage({
                            command: 'refresh'
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
                    },
                    getFileHistoryCommitHashList() {
                        hbuilderx.postMessage({
                            command: 'getFileHistoryCommitHashList'
                        });
                    },
                    openChangeWithRevision(e) {
                        if (this.currentHash == -1) {
                            this.currentHash = 0;
                        };
                        let n = this.currentHash;
                        if (n >= 0 && e == '-' && this.isClickRevision != '') {
                            n = n - 1;
                            this.currentHash = this.currentHash - 1;
                        };
                        if ((n == 0 && e == '-' && this.isClickRevision == '') || ( n == -1 && e == '-')) {
                            hbuilderx.postMessage({
                                command: 'historyRevision',
                                isPrevious: e,
                                param: ["HEAD"]
                            });
                            return;
                        };
                        let commit = this.HistoryHashList[n];
                        let {hash} = commit;
                        let options = [hash+'^', hash];
                        hbuilderx.postMessage({
                            command: 'historyRevision',
                            isPrevious: e,
                            param: options
                        });
                    },
                    openChangeWithOneRevision() {
                        hbuilderx.postMessage({
                            command: 'selectOneRevisionToDiff'
                        });
                    }
                }
            });
        </script>
        <script>
            let devStatus = ${DisableDevTools};
            if (devStatus) {
                window.oncontextmenu = function() {
                    event.preventDefault();
                    return false;
                };
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
            :root {
                --background: ${background};
                --fontColor: ${fontColor};
            }
            body {
                color: var(--fontColor);
                font-size: 0.92rem;
                background-color: var(--background) !important;
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
                },
                mounted() {
                    that = this;
                    window.onload = function() {
                        setTimeout(function() {
                            that.Receive();
                        }, 800);
                    };
                },
                methods: {
                    Receive() {
                        hbuilderx.onDidReceiveMessage((msg) => {
                            if (msg.command == 'themeColor') {
                                let themedata = msg.data;
                                let colors = Object.keys(themedata);
                                for (let i of colors) {
                                    document.documentElement.style.setProperty('--' + i, themedata[i]);
                                };
                            };
                        });
                    },
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
