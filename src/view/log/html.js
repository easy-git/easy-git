const path = require('path');

const vueFile = path.join(path.resolve(__dirname, '..'), 'static', '','vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'bootstrap.min.css');


/**
 * @description generationhtml
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
        searchIcon,
        noIcon,
        OpenFileIconSvg
    } = uiData;

    // 获取git日志列表
    let {projectName, projectPath, currentBranch, logData, searchText, branchNum, CommitTotal} = gitData;
    logData = JSON.stringify(logData);
    if (!searchText) {
        searchText = '';
    };

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
                .project-info {
                    font-size: 1rem;
                    font-weight: 400;
                    color: ${fontColor};
                    overflow:hidden;
                    white-space: nowrap;
                    text-overflow:ellipsis;
                }
                .project-info .branch {
                    font-size: 0.95rem;
                    color: ${fontColor};
                }
                .project-info .active {
                    color: ${inputLineColor};
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
                .form-control:focus , .form-control:active{
                    border-radius: 2px !important;
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
                #git-log-body {
                    overflow: auto;
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
                .no-result {
                    color: ${fontColor} !important;
                }
                .contextmenu {
                    margin: 0;
                    background: #F4F4F4;
                    z-index: 3000;
                    position: absolute;
                    display: block;
                    list-style-type: none;
                    padding: 5px 0;
                    border-radius: 4px;
                    border: 1px solid #d3d8d7;
                    font-size: 14px;
                    font-weight: 400;
                    color: #333;
                    box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);
                }
                .contextmenu li {
                    margin: 0;
                    padding: 2px 16px;
                    color: #000000;
                    font-size: 14px;
                    letter-spacing: 0px
                    cursor: pointer;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .contextmenu .dropdown-divider {
                    border-top: 1px solid #c9cfd9 !important;
                }
                .contextmenu li:hover {
                    background-color: rgb(84,156,228);
                    color: #FFFFFF;
                }

                .spinner {
                    margin: 100px auto;
                    width: 50px;
                    height: 60px;
                    text-align: center;
                    font-size: 10px;
                }

                .spinner>div {
                    background-color: #67CF22;
                    height: 100%;
                    width: 6px;
                    display: inline-block;
                    -webkit-animation: stretchdelay 1.2s infinite ease-in-out;
                    animation: stretchdelay 1.2s infinite ease-in-out;
                }

                .spinner .rect2 {
                    -webkit-animation-delay: -1.1s;
                    animation-delay: -1.1s;
                }

                .spinner .rect3 {
                    -webkit-animation-delay: -1.0s;
                    animation-delay: -1.0s;
                }

                .spinner .rect4 {
                    -webkit-animation-delay: -0.9s;
                    animation-delay: -0.9s;
                }

                .spinner .rect5 {
                    -webkit-animation-delay: -0.8s;
                    animation-delay: -0.8s;
                }

                @-webkit-keyframes stretchdelay {
                    0%,40%,100% {
                        -webkit-transform: scaleY(0.4)
                    }
                    20% {
                        -webkit-transform: scaleY(1.0)
                    }
                }

                @keyframes stretchdelay {
                    0%,40%,100% {
                        transform: scaleY(0.4);
                        -webkit-transform: scaleY(0.4);
                    }
                    20% {
                        transform: scaleY(1.0);
                        -webkit-transform: scaleY(1.0);
                    }
                }
                .click-disable {
                    pointer-events: none;
                    color: #888888 !important;
                }
                .load-more-log {
                    font-size: 14px;
                }
            </style>
        </head>
        <body style="background-color:${background};">
            <div id="app" v-cloak>
                <div id="log-list" class="container-fluid">
                    <div id="page-top" class="fixed-top">
                        <div class="row px-3 pt-3">
                            <div class="col">
                                <h6 class="project-info">
                                    <span>{{ projectName }} / </span>
                                    <span title="显示当前分支log" class="branch" :class="{ active: searchType == 'branch'}" @click="switchSearchType('branch');">{{ currentBranch }} </span>
                                    <span v-if="branchNum > 1"> | </span>
                                    <span title="显示所有分支log" class="branch" :class="{ active: searchType == 'all'}" @click="switchSearchType('all');" v-if="branchNum > 1">所有分支</span>
                                </h6>
                                <div class="d-flex">
                                    <div class="flex-grow-1">
                                        <input
                                            id="search"
                                            type="text"
                                            class="form-control outline-none pl-0"
                                            title="按下回车进行搜索，多个条件以逗号分隔。如--author=name,-n 5。默认返回50条结果，如需要更多条数，请输入: -n 数量。"
                                            placeholder="按下回车进行搜索，多个条件以逗号分隔。如--author=name,-n 5"
                                            style="background: ${background};"
                                            autofocus="autofocus"
                                            v-model.trim="searchText"
                                            v-on:keyup.enter="searchLog();" />
                                    </div>
                                    <div class="pt-2 px-1">
                                        <span @click="searchLog();">${searchIcon}</span>
                                    </div>
                                    <div class="pt-2">
                                        <span title="重置：并刷新日志" @click.once="refresh();">${refreshIcon}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="spinner" v-if="loading">
                        <div class="rect1"></div>
                        <div class="rect2"></div>
                        <div class="rect3"></div>
                        <div class="rect4"></div>
                        <div class="rect5"></div>
                    </div>
                    <div id="git-log-body" class="row mb-5"  style="margin-top:80px;" v-else>
                        <div class="col mt-2 px-0" v-if="gitLogInfoList.length == 0">
                            <div class="text-center" style="margin-top: 20%;">
                                <span>${noIcon}</span>
                                <p class="no-result">没有结果...</p>
                                <p class="no-result" v-if="searchText">请检查查询条件，如存在多个查询条件，请以逗号分隔</p>
                            </div>
                        </div>
                        <div class="col mt-2 px-0" v-else>
                            <ul class="pl-0 mb-0" style="list-style-type:none;">
                                <li class="li-log gitfile"
                                    v-for="(item,idx) of gitLogInfoList" :key="idx"
                                    :id="'msg_'+idx"
                                    @contextmenu.prevent.stop="openMenu($event,item)"
                                    @mouseover="hoverLogID = 'msg_'+idx"
                                    @mouseleave="mouseleaveLogItem()">
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
                                            <span class="f11" :title="item.author_email" @click.stop="goSearchAuthor('author',item.author_name);">
                                                {{ item.author_name }}
                                            </span>
                                            <span class="f11 pl-2">
                                                {{ item.date | FormatDate }}
                                            </span>
                                            <span class="hash" title="双击复制commit id" @dblclick="copyLogMsg(item, 'commit_id');">
                                                {{ (item.hash).slice(0,9) }}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                            <div class="mt-3 text-center load-more-log">
                                <!-- 此处存在问题，50不应该写死。 +1也存在问题。先这样 -->
                                <div v-if="logNum + 1 < CommitTotal && logNum >= 50" @click="moreLog();">加载更多</div>
                                <div v-if="logNum + 1 >= CommitTotal">我是有底线的</div>
                            </div>
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
                                    <span class="fname" :title="'insertions:'+ v5.insertions + ';' + 'deletions:'+ v5.deletions" @click="showCommitFileChange(v5.file)">
                                        {{ v5.file }}
                                    </span>
                                    <span @click="openFile(v5.file);">${OpenFileIconSvg}</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div v-show="visibleRightMenu">
                    <ul v-show="visibleRightMenu" :style="{left:left+'px',top:top+'px'}" class="contextmenu" @mouseleave="visibleRightMenu = false">
                        <li @click="viewDetails(rightClickItem)">查看详情</li>
                        <div class="dropdown-divider"></div>
                        <li @click="refresh()">刷新</li>
                        <li @click="switchBranch()">切换分支</li>
                        <div class="dropdown-divider"></div>
                        <li @click="checkoutCommit(rightClickItem)" :class="{ 'click-disable': searchType == 'all' }">检出...</li>
                        <li @click="checkoutCommitForCreateBranch(rightClickItem)" :class="{ 'click-disable': searchType == 'all' }">检出并创建新分支</li>
                        <li @click="createTag(rightClickItem)" :class="{ 'click-disable': searchType == 'all' }" title="git tag">创建标签</li>
                        <div class="dropdown-divider"></div>
                        <li @click="resetCommit(rightClickItem)" :class="{ 'click-disable': searchType == 'all' }">将 {{currentBranch}} 重置到这次提交</li>
                        <li @click="cherryPick(rightClickItem)" title="cherry pick" :class="{ 'click-disable': searchType != 'all' }">将当前提交应用于 {{currentBranch}} 分支</li>
                        <div class="dropdown-divider"></div>
                        <li @click="copyLogMsg(rightClickItem, 'msg')">复制</li>
                        <li @click="copyLogMsg(rightClickItem, 'commit_id')">复制commit id到剪贴板</li>
                    </ul>
                </div>
            </div>
            <script>
                var app = new Vue({
                    el: '#app',
                    data: {
                        visibleRightMenu: false,
                        top: 0,
                        left: 0,
                        searchType: 'branch',
                        searchText: '',
                        currentBranch: '',
                        projectName: '',
                        branchNum: 1,
                        CommitTotal: 0,
                        logNum: 0,
                        gitLogInfoList: [],
                        hoverLogID: '',
                        isShowViewDetails: false,
                        logDetails: {},
                        logDetailsFiles: [],
                        loading: false,
                        CommitFileChangeDetails: {}
                    },
                    watch: {
                        visibleRightMenu(value) {
                            if (value) {
                                document.body.addEventListener('click', this.closeMenu)
                            } else {
                                document.body.removeEventListener('click', this.closeMenu)
                            }
                        }
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
                        this.projectName = '${projectName}';
                        this.gitLogInfoList = ${logData};
                        this.currentBranch = '${currentBranch}';
                        this.searchText = '${searchText}';
                        this.branchNum = ${branchNum};
                        this.CommitTotal = ${CommitTotal};
                        this.logNum = (this.gitLogInfoList).length;
                    },
                    mounted() {
                        this.loading = false;
                        that = this;
                        window.onload = function() {
                            setTimeout(function() {
                                that.forUpdate();
                                that.forShowCommitFileChange()
                            }, 1000)
                        };
                    },
                    methods: {
                        openMenu(e, item) {
                            this.rightClickItem = item;
                            var x = e.pageX;
                            var y = e.pageY;
                            this.top = y;
                            this.left = x;
                            this.visibleRightMenu = true;
                        },
                        closeMenu() {
                            this.visibleRightMenu = false;
                        },
                        mouseleaveLogItem() {
                            this.viewDetailsMouseleave();
                            this.hoverLogID = false;
                        },
                        refresh() {
                            this.loading = true;
                            hbuilderx.postMessage({
                                command: 'refresh',
                                searchType: this.searchType,
                                condition: this.searchText
                            });
                        },
                        moreLog() {
                            if (this.logNum < 1) {return;};
                            let num = this.logNum + 100;
                            if (this.searchText.includes("-n")) {
                                let tmp = this.searchText.split(',');
                                for (let i in tmp) {
                                    if (/\-n ([0-9]{1,9})$/.test(tmp[i])) {
                                        tmp[i] = '-n ' + num.toString();
                                        break;
                                    }
                                }
                                this.searchText = tmp.toString();
                            } else {
                                if (this.searchText != '') {
                                    this.searchText = '-n ' + num.toString() + ',' + this.searchText;
                                } else {
                                    this.searchText = '-n ' + num.toString();
                                }
                            }
                            this.searchLog();
                        },
                        forUpdate() {
                            hbuilderx.onDidReceiveMessage((msg) => {
                                if (msg.command != 'search') {return};
                                this.loading = false;
                                if (this.isShowViewDetails) {
                                    this.isShowViewDetails = false;
                                };
                                if (msg.gitData) {
                                    let gitData = msg.gitData;
                                    this.searchType = msg.searchType;
                                    this.gitLogInfoList = gitData.logData;
                                    this.searchText = msg.searchText;
                                    this.currentBranch = gitData.currentBranch;
                                    this.projectName = msg.projectName;
                                    this.logNum = (gitData.logData).length;
                                    this.CommitTotal = msg.CommitTotal;
                                }
                            });
                        },
                        switchSearchType(type) {
                            this.loading = true;
                            this.searchType = type;
                            hbuilderx.postMessage({
                                command: 'search',
                                searchType: this.searchType,
                                condition: this.searchText
                            });
                        },
                        searchLog() {
                            if (this.searchText.length == 0) {return;};
                            this.searchText = (this.searchText).replace(/'/g, '').replace(/"/g, '');
                            this.loading = true;
                            hbuilderx.postMessage({
                                command: 'search',
                                searchType: this.searchType,
                                condition: this.searchText
                            });
                        },
                        goSearchAuthor(searchType,keyword) {
                            keyword = keyword.trim();
                            if (keyword.length == 0) {return;};
                            let w = '--'+searchType+'='+keyword;
                            if ((this.searchText).length != 0) {
                                if (!(this.searchText).includes(w)) {
                                    this.searchText = w + ',' + this.searchText;
                                };
                            } else {
                                this.searchText = w;
                            };
                        },
                        copyLogMsg(data, type) {
                            let content = '';
                            if (type == 'commit_id') {
                                content = data.hash
                            }
                            if (type == 'msg') {
                                content = data.message + ' ' + data.hash + ' ' + data.author_name + ' ' + data.date;
                            }
                            if (content == '') {return;};
                            hbuilderx.postMessage({
                                command: 'copy',
                                text: content
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
                            document.body.style.overflow = 'auto !important';
                        },
                        openFile(filename) {
                            hbuilderx.postMessage({
                                command: 'openFile',
                                filename: filename
                            });
                        },
                        switchBranch() {
                            this.searchType = 'branch';
                            hbuilderx.postMessage({
                                command: 'branch'
                            });
                        },
                        cherryPick(item) {
                            let hash = item.hash;
                            if (!hash) {return};
                            hbuilderx.postMessage({
                                command: 'cherry-pick',
                                hash: hash
                            })
                        },
                        resetCommit(item) {
                            let hash = item.hash;
                            if (!hash) {return};
                            hbuilderx.postMessage({
                                command: 'reset-hard-commit',
                                hash: hash
                            })
                        },
                        checkoutCommit(item) {
                            let hash = item.hash;
                            if (!hash) {return};
                            hbuilderx.postMessage({
                                command: 'checkout-commit',
                                hash: hash
                            })
                        },
                        checkoutCommitForCreateBranch(item) {
                            let hash = item.hash;
                            if (!hash) {return};
                            hbuilderx.postMessage({
                                command: 'checkout-commit-for-create-branch',
                                hash: hash
                            })
                        },
                        createTag(item) {
                            let hash = item.hash;
                            if (!hash) {return};
                            hbuilderx.postMessage({
                                command: 'create-tag',
                                hash: hash
                            })
                        },
                        // 显示commit 文件具体修改
                        showCommitFileChange(filePath) {
                            let data = {
                                "commitId": this.logDetails.hash,
                                "filePath": filePath
                            };
                            hbuilderx.postMessage({
                                command: 'showCommitFileChange',
                                data: data
                            })
                        },
                        forShowCommitFileChange() {
                            hbuilderx.onDidReceiveMessage((msg) => {
                                this.CommitFileChangeDetails = {};
                                if (msg.command != 'showCommitFileChange') {return};
                                this.CommitFileChangeDetails = msg.result;
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


module.exports = generateLogHtml;
