const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');

const utils = require('../utils.js');
const icon = require('./static.js');

/**
 * @description 验证是否是日期
 * @param {Object} str
 */
function validateData(str) {
    if (['yesterday','today'].includes(str)) {
        return true;
    };
    return  /^(\d{4})(\/|\-)(\d{2})(\/|\-)(\d{2}) (\d{2})(?:\:\d{2}|:(\d{2}):(\d{2}))$/.test(str) || /^(\d{4})\-(\d{2})\-(\d{2})$/.test(str);
};


/**
 * @description log view
 * @param {Object} viewType
 * @param {Object} param
 * @param {Object} webviewPanel
 */
async function show(webviewPanel, userConfig, gitData) {
    const view = webviewPanel.webView;

    // 根据主题适配颜色
    let colorData = utils.getThemeColor();
    let {fontColor} = colorData;

    // svg icon
    let helpIcon = icon.getHelpIcon(fontColor);
    let refreshIcon = icon.getRefreshIcon(fontColor);
    let searchIcon = icon.getSearchIcon(fontColor);

    let iconData = {helpIcon,refreshIcon,searchIcon};
    let uiData = Object.assign(iconData,colorData);

    // get project info
    const {projectPath, projectName, selectedFile, currentBranch} = gitData;

    // get webview html content, set html
    async function setLogView(condition) {
        // 引导用户正确的使用日期查询
        if(validateData(condition)){
            return hx.window.showErrorMessage(
                '检测到您只输入了一个日期, 日期查询, 请使用--after、--before、--since、--until。例如:--after=2020/8/1 \n',
                ['我知道了']
           );
        };
        
        // 引导使用--grep
        if (!validateData(condition) &&
            condition!='default' &&
            !condition.includes(',') &&
            !condition.includes('-n ') &&
            !condition.includes('--grep=') &&
            !(/\-\-([A-Za-z0-9]+)(\=?)/.test(condition)) &&
            !(/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(condition))
        ) {
            condition = '--grep=' + condition;
        };

        // 引导email搜索
        if (condition!='default' &&
            !condition.includes(',') &&
            !condition.includes('--author=') &&
            (/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(condition))
        ) {
            condition = '--author=' + condition;
        };

        let gitLogInfo = await utils.gitLog(projectPath,condition);
        if (!gitLogInfo.success && gitLogInfo.errorMsg == '') {
            return hx.window.showErrorMessage('获取日志失败，未知错误。请重新尝试操作，或通过运行日志查看错误。',['关闭']);
        };
        if (!gitLogInfo.success && gitLogInfo.errorMsg != '') {
            hx.window.showErrorMessage(`获取日志失败。原因: ${gitLogInfo.errorMsg}`,['关闭']);
        };
        gitData = Object.assign(gitData,{
            "logData": gitLogInfo.data
        });
        if (condition != 'default') {
            gitData.searchText = condition;
        } else {
            delete gitData.searchText;
        };
        view.html = generateLogHtml(userConfig, uiData, gitData);
    };

    if (selectedFile != '' && selectedFile != undefined) {
        // 选中文件，则查看此文件的log记录
        let sfile = selectedFile.replace(path.join(projectPath,path.sep),'');
        if (projectPath == selectedFile ) {
            setLogView('default');
        } else {
            setLogView(sfile);
        }
    } else {
        setLogView('default');
    };


    view.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'refresh':
                setLogView('default');
                break;
            case 'openFile':
                let furi = path.join(projectPath,msg.filename);
                hx.workspace.openTextDocument(furi);
                break;
            case 'copy':
                hx.env.clipboard.writeText(msg.text);
                break;
            case 'search':
                let condition = msg.condition;
                setLogView(condition);
                break;
            default:
                break;
        };
    });

};

/**
 * @description generationhtml
 * @todo 查看日志详情，背景层也滚动的Bug
 */
function generateLogHtml(userConfig, uiData, gitData) {
    // 是否启用开发者工具
    let {DisableDevTools} = userConfig;

    // ui、color、font
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

    // 获取git日志列表
    let {projectName, currentBranch, logData, searchText} = gitData;

    logData = JSON.stringify(logData);

    if (!searchText) {
        searchText = '';
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css">
            <style type="text/css">
                body {
                    color: ${fontColor};
                    font-size: 0.92rem;
                }
                body::-webkit-scrollbar {
                    display: none;
                }
                [v-cloak] {
                    display: none;
                }
                label,input,button {
                    font-size: 0.9rem !important;
                }
                .pl18 {
                    padding-left:18px;
                }
                .h30 {
                    height: 30px;
                }
                .f11 {
                    font-size: 11px;
                }
                .f12 {
                    font-size: 12px;
                }
                .fgreen {
                    color: green;
                }
                .fred {
                    color: red;
                }
                #page-top {
                    background-color:${background} !important;
                    z-index: 999;
                }
                .project-name {
                    font-size: 1rem;
                    font-weight: 400;
                    color: ${fontColor};
                    overflow:hidden;
                    white-space: nowrap;
                    text-overflow:ellipsis;
                }
                .outline-none {
                    box-shadow: none !important;
                }
                .form-group .form-control::-webkit-input-placeholder, .form-control::-webkit-input-placeholder {
                    font-size: 0.9rem !important;
                    font-weight: 200 !important;
                    color: #c0c4cc !important;
                }
                .form-control {
                    border-radius: 2px !important;
                    font-size: 0.9rem !important;
                    border: none;
                    color: ${inputLineColor} !important;
                    font-weight: 500 !important;
                    font-size: 0.9rem !important;
                    caret-color: ${cursorColor};
                }
                .form-control:focus {
                    border-radius: 2px !important;
                    border-bottom: 1px solid ${lineColor};
                    padding-left: 16px;
                    border-bottom: 1px solid ${inputLineColor};
                    color: ${inputLineColor};
                    font-weight: 500;
                    font-size: 0.9rem;
                    caret-color: ${cursorColor};
                }
                .icon:active {
                    -webkit-transform: rotate(0.9);
                    transform: scale(0.9);
                }
                .gitfile:hover .hideicon {
                    opacity: 1;
                }
                .gitfile:hover .ci {
                    display:none;
                }
                .li-log {
                    padding: 10px 16px;
                    font-size: 14px;
                    font-weight: 400;
                    color: ${fontColor};
                    width:100%;
                    height:60px;
                    white-space:nowrap;
                    text-overflow:ellipsis;
                    overflow: hidden;
                    border-bottom: 1px solid ${lineColor};
                }
                .li-log:last-child {
                    border-bottom:none;
                }
                .li-log p {
                    margin-bottom: 0;
                    line-height: 1.4rem;
                }
                .li-log:hover {
                    background-color: ${liHoverBackground} !important;
                }
                .htext {
                    white-space:nowrap !important;
                    text-overflow:ellipsis !important;
                    overflow: hidden !important;
                }
                .li-log .hash {
                    font-size: 12px;
                    position: absolute;
                    right: 16px;
                    margin-top: 2px;
                    windth: 50px;
                }
                @media screen and (max-width: 300px) {
                    .hash {
                        display: none;
                    }
                }
                .gtag {
                    border: 1px solid ${lineColor};
                    border-radius: 6px;
                    margin: 0 5px;
                    padding: 3px 4px;
                    font-size: 0.7rem;
                    color: rgb(245,108,108);
                }
                .view-log-details {
                    border-top: 1px solid ${lineColor};
                    background-color: ${background};
                    -webkit-box-shadow:2px 2px 5px 3px ${background};
                }

                .view-log-details .fname:hover {
                    text-decoration: underline;
                }
                .view-log-details .intro {
                    font-size: 12px;
                    line-heigh: 1.7rem;
                    margin-bottom: 0;
                }
                .change-files {
                    height: 270px;
                    overflow-y: auto;
                }
                .change-files::-webkit-scrollbar{
                    display: none;
                }
                .change-files li{
                    color: ${fontColor};
                    height: 1.7rem;
                    line-height: 1.7rem;
                    margin-bottom: 0;
                    display: block;
                    overflow:hidden;
                    white-space: nowrap;
                    text-overflow:ellipsis;
                }
                .change-files .num {
                    width: 28px;
                    display:inline-block;
                }
                .change-files .binary {
                    font-size: 12px;
                }
                .change-files ul > li {
                    list-style: none;
                }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/vue"></script>
        </head>
        <body style="background-color:${background};">
            <div id="app" v-cloak>
                <div id="log-list" class="container-fluid">
                    <div id="page-top" class="fixed-top">
                        <div class="row px-3 pt-3">
                            <div class="col">
                                <h6 class="project-name">
                                    ${projectName} / ${currentBranch}
                                </h6>
                                <div class="d-flex">
                                    <div class="flex-grow-1">
                                        <input
                                            id="search"
                                            type="text"
                                            class="form-control outline-none pl-0"
                                            placeholder="按下回车进行搜索，多个条件以逗号分隔。如--author=name,-n 5"
                                            style="background: ${background};"
                                            autofocus="autofocus"
                                            v-model.trim="searchText"
                                            v-on:keyup.enter="searchLog();"/>
                                    </div>
                                    <div class="pt-2 px-1">
                                        <span @click.once="searchLog();">${searchIcon}</span>
                                    </div>
                                    <div class="pt-2">
                                        <span title="刷新日志" @click.once="refresh();">${refreshIcon}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row mb-5"  style="margin-top:80px;">
                        <div class="col mt-2 px-0">
                            <ul class="pl-0 mb-0" style="list-style-type:none;">
                                <li class="li-log gitfile"
                                    v-for="(item,idx) of gitLogInfoList" :key="idx"
                                    :id="'msg_'+idx"
                                    @mouseover="hoverLogID = 'msg_'+idx"
                                    @mouseleave="hoverLogID = false">
                                    <div class="d-flex">
                                        <div class="mr-auto htext" title="点击查看变更的文件列表" @click.stop="viewDetails(item);">
                                            {{ item.message }}
                                        </div>
                                        <div class="pl-2" v-show="item.refs != ''">
                                            <span class="gtag" v-for="(v2,i2) in (item.refs).split(',')" :key="i2">
                                                {{ v2 }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="d-block">
                                        <div class="text">
                                            <span class="f11" :title="item.author_email" @click.stop="goSearch('author',item.author_name);">
                                                {{ item.author_name }}
                                            </span>
                                            <span class="f11 pl-2">
                                                {{ item.date | FormatDate }}
                                            </span>
                                            <span class="hash" title="双击复制commit id" @dblclick="copy(item.hash);">
                                                {{ (item.hash).slice(0,9) }}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div id="log-view-file" class="fixed-bottom p-3 view-log-details" v-if="isShowViewDetails" @mouseenter="viewDetailsMouseenter();" @mouseleave="viewDetailsMouseleave();">
                    <div class="d-flex">
                        <div class="flex-grow-1">
                            <h6>{{ logDetails.message }}</h6>
                        </div>
                        <div>
                            <button type="button" class="close" aria-label="Close" @click="closeViewDetails();">
                              <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                    </div>
                    <p class="intro">{{ logDetails.author_name }} {{ logDetails.date  | FormatDate}}</p>
                    <p class="intro">
                        {{ logDetails.diff.changed }} file changed,
                        {{ logDetails.diff.insertions }} insertions(+),
                        {{ logDetails.diff.deletions }} deletions(-)
                    </p>
                    <div class="change-files mt-3">
                        <ul class="pl-0">
                            <li v-for="(v5,i5) in logDetailsFiles" :key="i5">
                                <div class="d-inline-block" v-if="!v5.binary" style="width: 115px !important;">
                                    <span class="num">{{ v5.changes }}</span>
                                    <span class="fgreen">{{ v5.add_str }}</span>
                                    <span class="fred">{{ v5.del_str }}</span>
                                </div>
                                <div class="d-inline-block binary" v-else-if="v5.binary" style="width: 115px !important;">
                                    <span>二进制文件</span>
                                </div>
                                <div class="d-inline htext pl-3">
                                    <span class="fname" :title="'insertions:'+ v5.insertions + ';' + 'deletions:'+ v5.deletions" @click="openFile(v5.file);">
                                        {{ v5.file }}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <script>
                var app = new Vue({
                    el: '#app',
                    data: {
                        searchText: '',
                        projectName: '',
                        hoverLogID: '',
                        isShowViewDetails: false,
                        logDetails: {},
                        logDetailsFiles: [],
                        gitLogInfoList: []
                    },
                    filters: {
                        FormatDate: function(date) {
                            let d = new Date(date);
                            let year = d.getFullYear();
                            let month = d.getMonth() + 1;
                            let day = d.getDate() <10 ? '0' + d.getDate() : '' + d.getDate();
                            let hour = d.getHours();
                            let minutes = d.getMinutes();
                            let seconds = d.getSeconds();
                            return year+ '-' + month + '-' + day + ' ' + hour + ':' + minutes + ':' + seconds;
                        }
                    },
                    created() {
                        this.projectName = '${projectName}'
                        this.gitLogInfoList = ${logData}
                    },
                    mounted() {
                        this.searchText = '${searchText}'
                    },
                    methods: {
                        refresh() {
                            hbuilderx.postMessage({
                                command: 'refresh'
                            });
                        },
                        searchLog() {
                            if (this.searchText.length == 0) {return;};
                            this.searchText = (this.searchText).replace(/'/g, '').replace(/"/g, '');
                            hbuilderx.postMessage({
                                command: 'search',
                                condition: this.searchText
                            });
                        },
                        goSearch(searchType,keyword) {
                            keyword = keyword.trim();
                            if (keyword.length == 0) {return;};
                            let w = '--'+searchType+'='+keyword;
                            if ((this.searchText).length != 0) {
                                if (!(this.searchText).includes(w)) {
                                    this.searchText = this.searchText + ',' + w;
                                };
                            } else {
                                this.searchText = w;
                            };
                        },
                        copy(data) {
                            hbuilderx.postMessage({
                                command: 'copy',
                                text: data
                            });
                        },
                        symbolRepeat(str, num) {
                        	return num > 1 ? str.repeat(num): str;
                        },
                        viewDetailsMouseenter() {
                            // 解决背景层滚动的问题
                            document.body.style.overflow = 'hidden';
                        },
                        viewDetailsMouseleave() {
                            // 解决背景层滚动的问题
                            document.body.style.overflow = 'auto';
                        },
                        viewDetails(data) {
                            this.isShowViewDetails = true;
                            this.logDetails = data;
                            let files = data.diff.files;
                            let tmp = [];
                            for (let f of files) {
                                f.add_str = '';
                                f.del_str = '';
                                let addNum = f.insertions ? Math.round((f.insertions / (f.insertions + f.deletions))*10) : 0;
                                let delNum = f.deletions ? Math.round((f.deletions / (f.insertions + f.deletions))*10) : 0;
                                if (addNum > 0) {
                                    f.add_str = this.symbolRepeat('+',addNum);
                                };
                                if (delNum > 0) {
                                    f.del_str = this.symbolRepeat('-',delNum);
                                };
                                tmp.push(f);
                            };
                            this.logDetailsFiles = tmp;
                        },
                        closeViewDetails() {
                            this.isShowViewDetails = false;
                        },
                        openFile(filename) {
                            hbuilderx.postMessage({
                                command: 'openFile',
                                filename: filename
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
    </html>`
};


module.exports = {
    show
}
