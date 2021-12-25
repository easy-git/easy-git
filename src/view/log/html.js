const path = require('path');

const icon = require('../static/icon.js');
const {getThemeColor} = require('../../common/utils.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'static', '','vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'bootstrap.min.css');
const diff2htmlCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'diff2html.min.css');
const logCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'log.css');


/**
 * @description 获取图标、各种颜色
 * @return {Object} UIData
 */
function getUIData() {
    // 根据主题适配颜色
    let colorData = getThemeColor('right');
    let {fontColor,lineColor} = colorData;

    // svg icon
    let helpIcon = icon.getHelpIcon(fontColor);
    let refreshIcon = icon.getRefreshIcon(fontColor);
    let searchIcon = icon.getSearchIcon(fontColor);
    let noIcon = icon.getNoIcon(lineColor);
    let OpenFileIconSvg = icon.getOpenFileIcon(fontColor);

    let iconData = {helpIcon, refreshIcon, searchIcon, noIcon, OpenFileIconSvg};
    return Object.assign(iconData,colorData);
};

/**
 * @description generationhtml
 * @param {Object} userConfig
 * @param {Object} initData
 */
function generateLogHtml(userConfig, initData) {
    // 是否启用开发者工具
    let {DisableDevTools} = userConfig;

    let uiData = getUIData();

    // ui、color、font
    let {
        background,
        liHoverBackground,
        inputColor,
        inputLineColor,
        cursorColor,
        fontColor,
        lineColor,
        scrollbarColor,
        d2h_ins_bg,
        d2h_ins_border,
        d2h_del_bg,
        d2h_del_border,
        d2h_code_side_line_del_bg,
        d2h_code_side_line_ins_bg,
        d2h_emptyplaceholder_bg,
        d2h_emptyplaceholder_border,
        helpIcon,
        refreshIcon,
        searchIcon,
        noIcon,
        OpenFileIconSvg
    } = uiData;

    // 获取git日志列表
    let {projectName, projectPath, searchText} = initData;
    if (!searchText) {
        searchText = '';
    };

    background = (background).toLowerCase();
    if (['#ffffff', '#fff'].includes(background)) {
        lineColor = '#EEE';
    };

    return `
    <!DOCTYPE html>
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
                    --inputColor: ${inputColor};
                    --inputLineColor: ${inputLineColor};
                    --cursorColor: ${cursorColor};
                    --fontColor: ${fontColor};
                    --lineColor: ${lineColor};
                    --scrollbarColor: ${scrollbarColor};
                    --d2h_ins_bg: ${d2h_ins_bg};
                    --d2h_ins_border: ${d2h_ins_border};
                    --d2h_del_bg: ${d2h_del_bg};
                    --d2h_del_border: ${d2h_del_border};
                    --d2h_code_side_line_del_bg: ${d2h_code_side_line_del_bg};
                    --d2h_code_side_line_ins_bg: ${d2h_code_side_line_ins_bg};
                    --d2h_emptyplaceholder_bg: ${d2h_emptyplaceholder_bg};
                    --d2h_emptyplaceholder_border: ${d2h_emptyplaceholder_border};
                }
            </style>
            <link rel="stylesheet" href="${logCssFile}">
        </head>
        <body style="">
            <div id="app" v-cloak>
                <div id="log-list" class="container-fluid p-0">
                    <div id="page-top" class="fixed-top">
                        <div class="row px-3 pt-3">
                            <div class="col">
                                <div class="d-flex">
                                    <div class="mr-auto">
                                        <h6 class="project-info cursor-default">
                                            <span>{{ projectName }} / </span>
                                            <span title="仅显示当前分支log" class="branch"
                                                :class="{ active: searchType == 'branch'}"
                                                @click="switchSearchType('branch');">{{ currentBranch }} </span>
                                            <span> | </span>
                                            <span title="显示所有分支log" class="branch"
                                                :class="{ active: searchType == 'all'}"
                                                @click="switchSearchType('all');">所有分支</span>
                                        </h6>
                                    </div>
                                    <div class="cursor-default">
                                        <span @click="showRefList();" title="可查看指定分支或标签的log">跳转到: {{ viewRefName }} </span>
                                    </div>
                                </div>

                                <div class="d-flex">
                                    <div class="flex-grow-1">
                                        <input
                                            id="search"
                                            type="text"
                                            class="form-control outline-none pl-0"
                                            title="支持git log所有参数，多个条件以逗号分隔。如--author=name,-n 5。默认返回50条结果，如需要更多条数，请输入: -n 数量。"
                                            placeholder="支持git log所有参数，多个条件以逗号分隔。如--grep=xxx,--author=name,-n 5"
                                            autofocus="autofocus"
                                            v-model.trim="searchText"
                                            v-on:keyup.enter="searchLog();" />
                                    </div>
                                    <div class="pt-2 px-1">
                                        <span @click="searchLog();">${searchIcon}</span>
                                    </div>
                                    <div class="pt-2">
                                        <span title="重置：并刷新日志" @click="refresh();">${refreshIcon}</span>
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
                    <div id="git-log-body" class="row mx-0 mb-5"  style="margin-top:80px;" v-else :class="{ 'tmp-log-body' :isShowViewDetails }">
                        <div class="col px-0 mt-2" v-if="gitLogInfoList.length == 0 && isReviceLog">
                            <div class="text-center" style="margin-top: 12%;">
                                <span>${noIcon}</span>
                                <p class="no-result">没有结果, 请检查查询条件...</p>
                                <p class="no-result"><a href="https://easy-git.github.io/docs/log/search">搜索帮助</a></p>
                                <p class="no-result" v-if="searchText">
                                    模糊查询提交消息，建议使用--grep。例如: --grep=xxx
                                    存在多个查询条件，请以逗号分隔。例: -n 10,--auther=xxx,--grep=xxx <br/>
                                    注意：当使用--grep、--author、--after等带有 -- 的参数进行查询时，必须使用 =
                                </p>
                                <p class="no-result">{{ LogErrorMsg }}</p>
                            </div>
                        </div>
                        <div class="col px-0 mt-2" v-else>
                            <ul class="pl-0 mb-0" style="list-style-type:none;">
                                <li class="li-log gitfile"
                                    v-for="(item,idx) of gitLogInfoList" :key="idx"
                                    :class="{ 'li-log-selected' : selectedLogID == item.hash }"
                                    @contextmenu.prevent.stop="openMenu($event,item)"
                                    @mouseover="hoverLogID = 'msg_'+idx"
                                    @mouseleave="mouseleaveLogItem()">
                                    <div class="row">
                                        <div class="col-9 col-md-7 col-lg-8 htext" @click.stop="viewDetails(item);" @click.middle="copyLogMsg(item, 'msg');">
                                            <span class="gtag" v-for="(v2,i2) in item.refs" :key="i2">{{ v2 }}</span>
                                            <span title="点击查看变更的文件列表; 鼠标中键点击即可复制消息到剪贴板">{{ item.message }}</span>
                                        </div>
                                        <div class="col-3 col-md-1 col-lg-1 htext" @click.stop="goSearchAuthor('author',item.author_name);">
                                            <span title="点击搜索此用户提交记录">{{ item.author_name }}</span>
                                        </div>
                                        <div class="col-md-2 col-lg-2 htext md-screen">
                                            <span>{{ item.date }}</span>
                                        </div>
                                        <div class="col-md-2 col-lg-1 htext md-screen" @dblclick="copyLogMsg(item, 'commit_id');">
                                            <span class="hash" title="双击复制commit id">
                                                {{ (item.hash).slice(0,9) }}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                            <div class="mt-3 text-center load-more-log">
                                <!-- 此处存在问题，50不应该写死。 +1也存在问题。先这样 -->
                                <div v-if="logNum + 1 < CommitTotal && logNum >= 50" @click="moreLog();">加载更多</div>
                                <div v-if="logNum + 1 >= CommitTotal && logNum >= 15">我是有底线的</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="log-view-file" class="fixed-bottom p-3 view-log-details" v-if="isShowViewDetails" @mouseenter="viewDetailsMouseenter();" @mouseleave="viewDetailsMouseleave();">
                    <div class="d-flex">
                        <div class="flex-grow-1" @dblclick="copyLogMsg(logDetails.message, 'onlyMsg');">
                            <h6 title="双击复制消息到剪切板">{{ logDetails.message }}</h6>
                        </div>
                        <div>
                            <button type="button" class="close" aria-label="Close" @click="closeViewDetails();">
                              <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                    </div>
                    <p class="intro">
                        {{ logDetails.author_name }} {{ logDetails.date }}
                        <span>
                            ; {{ logDetails.diff.changed }} file changed,
                            {{ logDetails.diff.insertions }} insertions(+),
                            {{ logDetails.diff.deletions }} deletions(-)
                        </span>
                    </p>
                    <div class="mt-3">
                        <div class="d-flex flex-row">
                            <div class="change-files-list">
                                <ul class="pl-0">
                                    <li v-for="(v5,i5) in logDetailsFiles" :key="i5">
                                        <div class="d-inline-block" v-if="!v5.binary" style="width: 110px !important;">
                                            <!-- <span class="num">{{ v5.changes }}</span> -->
                                            <span class="fgreen">{{ v5.add_str }}</span>
                                            <span class="fred">{{ v5.del_str }}</span>
                                        </div>
                                        <div class="d-inline-block binary" v-else-if="v5.binary" style="width: 115px !important;">
                                            <span>二进制文件</span>
                                        </div>
                                        <div class="d-inline htext">
                                            <span class="fname"
                                                :title="'点击查看文件变化，' +'insertions:'+ v5.insertions + ';' + 'deletions:'+ v5.deletions"
                                                @click="showCommitFileChange(v5.file)">
                                                {{ v5.file }}
                                            </span>
                                            <span @click="openFile(v5.file);" title="在编辑器打开文件">${OpenFileIconSvg}</span>
                                        </div>
                                    </li>
                                </ul>
                             </div>
                             <div class="change-files-list commit-file-details" v-if="CommitFileChangeDetails != ''">
                                <p class="mb-0 ml-3">{{ ShowCommitFilePath }}</p>
                                <div v-html="CommitFileChangeDetails"></div>
                             </div>
                        </div>
                    </div>
                </div>

                <div v-show="visibleRightMenu">
                    <ul v-show="visibleRightMenu"
                        :style="{left:left+'px',top:top+'px'}"
                        class="contextmenu"
                        @mouseleave="visibleRightMenu = false">
                        <li @click="viewDetails(rightClickItem)">查看详情</li>
                        <div class="dropdown-divider"></div>
                        <li @click="refresh()">刷新</li>
                        <li @click="switchBranch()">切换分支</li>
                        <div class="dropdown-divider"></div>
                        <li @click="checkoutCommit(rightClickItem);">检出...</li>
                        <li @click="checkoutCommitForCreateBranch(rightClickItem);">检出并创建新分支</li>
                        <li @click="createTag(rightClickItem)" title="git tag">创建标签</li>
                        <div class="dropdown-divider"></div>
                        <li @click="resetCommit(rightClickItem)" :class="[searchType == 'all' || viewRefName ? 'click-disable' : '']">将 {{currentBranch}} 重置到这次提交</li>
                        <li @click="cherryPick(rightClickItem)" title="cherry pick，如置灰无法点击，请点击顶部：所有分支，查看所有log" :class="[searchType == 'all' || viewRefName ? '' : 'click-disable']">
                            将当前提交应用于 {{currentBranch}} 分支
                        </li>
                        <li @click="revert(rightClickItem)" :class="[searchType == 'all' || viewRefName ? 'click-disable' : '']">revert到这次提交...</li>
                        <div class="dropdown-divider"></div>
                        <li @click="copyLogMsg(rightClickItem, 'msg')">复制</li>
                        <li @click="copyLogMsg(rightClickItem, 'commit_id')">复制commit id到剪贴板</li>
                        <div class="dropdown-divider"></div>
                        <li @click="archive(rightClickItem)">归档</li>
                        <li @click="openCommandPanel(rightClickItem)">Git 命令面板</li>
                    </ul>
                </div>
            </div>
            <script>
                var app = new Vue({
                    el: '#app',
                    data: {
                        isReviceLog: false,
                        visibleRightMenu: false,
                        top: 0,
                        left: 0,
                        searchType: 'branch',
                        searchText: '',
                        currentBranch: '',
                        projectName: '',
                        CommitTotal: 0,
                        logNum: 0,
                        gitLogInfoList: [],
                        hoverLogID: '',
                        selectedLogID: '',
                        isShowViewDetails: false,
                        logDetails: {},
                        logDetailsFiles: [],
                        loading: true,
                        ShowCommitFilePath: '',
                        CommitFileChangeDetails: '',
                        viewRefName: '',
                        LogErrorMsg: ''
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
                    filters: {},
                    created() {
                        this.projectName = '${projectName}';
                        this.searchText = '${searchText}';
                    },
                    mounted() {
                        that = this;
                        window.onload = function() {
                            setTimeout(function() {
                                that.forReceiveInfo();
                                that.forShowCommitFileChange()
                            }, 200)
                            setTimeout(function() {
                                that.getGitLog();
                            }, 500);
                        };
                    },
                    methods: {
                        openMenu(e, item) {
                            this.selectedLogID = item.hash;
                            this.rightClickItem = item;
                            this.left = e.pageX;
                            let pageYOffset = window.pageYOffset;
                            let t = window.innerHeight - e.pageY;
                            if (pageYOffset > 0) {
                                t = window.innerHeight - e.pageY + pageYOffset;
                            };
                            if (t < 425 && e.pageY > 425) {
                                this.top =  e.pageY - 425;
                            } else {
                                this.top = e.pageY;
                            };
                            this.visibleRightMenu = true;
                        },
                        closeMenu() {
                            this.top = 0;
                            this.left = 0;
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
                                condition: this.searchText,
                                refname: this.viewRefName
                            });
                        },
                        getGitLog() {
                            hbuilderx.postMessage({
                                command: 'gitLog',
                                searchType: this.searchType,
                                condition: this.searchText,
                                refname: this.viewRefName
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
                        forReceiveInfo() {
                            hbuilderx.onDidReceiveMessage((msg) => {
                                if (msg.command == 'themeColor') {
                                    let themedata = msg.data;
                                    let colors = Object.keys(themedata);
                                    for (let i of colors) {
                                        document.documentElement.style.setProperty('--' + i, themedata[i]);
                                    };
                                    return;
                                };
                                if (msg.command == 'search') {
                                    this.loading = false;
                                    this.isReviceLog = true;
                                    if (this.isShowViewDetails) {
                                        this.isShowViewDetails = false;
                                    };
                                    if (msg.gitData) {
                                        let gitData = msg.gitData;
                                        this.gitLogInfoList = gitData.logData;
                                        this.currentBranch = gitData.currentBranch;
                                        this.LogErrorMsg = gitData.LogErrorMsg;
                                        this.CommitTotal = gitData.CommitTotal;
                                        this.logNum = (gitData.logData).length;
                                        this.searchType = msg.searchType;
                                        this.searchText = msg.searchText;
                                        this.projectName = msg.projectName;
                                        this.viewRefName = msg.refname;
                                        this.closeMenu();
                                    }
                                };
                            })
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
                                condition: this.searchText,
                                refname: this.viewRefName
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
                            };
                            if (type == 'msg') {
                                content = data.hash + '\\n'+ data.message + '\\n' + data.author_name + '\\n' + data.date;
                            };
                            if (type == 'onlyMsg') {
                                content = data;
                            };
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
                            // document.body.style.overflow = 'hidden';
                        },
                        viewDetailsMouseleave() {
                            // 解决背景层滚动的问题
                            document.body.style.overflow = 'auto';
                        },
                        viewDetails(data) {
                            this.selectedLogID = data.hash;
                            this.CommitFileChangeDetails = '';
                            this.isShowViewDetails = true;
                            this.logDetails = data;
                            try{
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

                                let firstFile = files.length ? files[0] : {};
                                if (JSON.stringify(firstFile) != '{}') {
                                    let {file} = firstFile;
                                    this.ShowCommitFilePath = file;
                                    this.showCommitFileChange(file);
                                };
                            }catch(e){
                                this.showCommitFileChange('');
                                this.closeViewDetails();
                            };
                        },
                        closeViewDetails() {
                            this.selectedLogID = '';
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
                        revert(item) {
                            let hash = item.hash;
                            if (!hash) {return};
                            hbuilderx.postMessage({
                                command: 'revert',
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
                        // 显示文件具体修改
                        showCommitFileChange(filePath) {
                            this.ShowCommitFilePath = filePath;
                            this.CommitFileChangeDetails = '';
                            let {message, diff, hash} = this.logDetails;
                            let isMergeMessage = false;
                            if (message.includes('Merge') && diff == undefined) {
                                isMergeMessage = true;
                            };
                            let data = {
                                "commitId": hash,
                                "filePath": filePath,
                                "isMergeMessage": isMergeMessage
                            };
                            hbuilderx.postMessage({
                                command: 'showCommitFileChange',
                                data: data
                            });
                        },
                        forShowCommitFileChange() {
                            hbuilderx.onDidReceiveMessage((msg) => {
                                this.CommitFileChangeDetails = '';
                                if (msg.command != 'showCommitFileChange') {return};
                                this.CommitFileChangeDetails = msg.result.data;
                            });
                        },
                        openCommandPanel() {
                            hbuilderx.postMessage({
                                command: 'openCommandPanel'
                            })
                        },
                        showRefList() {
                            hbuilderx.postMessage({
                                command: 'showRefList'
                            })
                        },
                        archive(item) {
                            let hash = item.hash;
                            if (!hash) {return};
                            hbuilderx.postMessage({
                                command: 'archive',
                                hash: hash
                            })
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
