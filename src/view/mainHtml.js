const hx = require('hbuilderx');

const os = require('os');
const path = require('path');
const osName = os.platform();

const vueFile = path.join(__dirname, 'static', '','vue.min.js');
const bootstrapCssFile = path.join(__dirname, 'static', 'bootstrap.min.css');


/**
 * @description 获取webview内容
 * @param {Object} userConfig
 * @param {Object} uiData
 * @param {Object} gitData
 */
function getWebviewContent(userConfig, uiData, gitData) {
    // 是否启用开发者工具
    let { DisableDevTools, GitAlwaysAutoCommitPush } = userConfig;

    // icon
    let {
        background,
        menuBackground,
        liHoverBackground,
        inputColor,
        inputLineColor,
        cursorColor,
        fontColor,
        lineColor,
        scrollbarColor,
        iconRefresh,
        CheckMarkIcon,
        UpArrowIcon,
        BranchIcon,
        DownArrowIcon,
        CancelIconSvg,
        OpenFileIconSvg,
        SyncIcon,
        AddIconSvg,
        AddAllIcon,
        checkoutIconSvg,
        MenuIcon,
        HistoryIcon,
        uploadIcon,
        ChevronDownIcon,
        ChevronRightIcon
    } = uiData;
    let {
        projectPath,
        projectName,
        FileResult,
        currentBranch,
        tracking,
        ahead,
        behind,
        originurl,
        BranchTracking
    } = gitData;

    if (!BranchTracking) {
        GitAlwaysAutoCommitPush = false;
    };

    let gitFileResult = JSON.stringify(FileResult);
    let originurlBoolean = originurl != undefined ? true : false;
    ahead = ahead == 0 ? '' : ahead;
    behind = behind == 0 ? '': behind;

    let ctrl = 'ctrl';
    if (osName == 'darwin') {
        ctrl = 'meta'
    };

    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=249px, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
        <link rel="stylesheet" href="${bootstrapCssFile}">
        <script src="${vueFile}"></script>
        <style type="text/css">
            body {
                color: ${fontColor};
                font-size: 0.92rem;
                font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";
            }
            [v-cloak] {
                display: none;
            }
            * {
                moz-user-select: -moz-none;
                -moz-user-select: none;
                -o-user-select:none;
                -khtml-user-select:none;
                -webkit-user-select:none;
                -ms-user-select:none;
                user-select:none;
            }
            body::-webkit-scrollbar {
                overflow-x: hidden !important;
                overflow-y: scroll;
            }
            ::-webkit-scrollbar {
                width: 8px;
            }
            ::-webkit-scrollbar-thumb {
                background-color: ${scrollbarColor};
            }
            @media screen and (max-width: 132px) {
                body {
                    display: none;
                }
            }
            #refresh-progress {
                width:20px;
                height:2px;
                background:${inputLineColor};
                position:absolute;
                animation-name:pulse;
                animation-duration:5s;
                animation-timing-function:linear;
                animation-iteration-count:infinite;
                animation-direction:alternate;
                animation-play-state:running;
                -webkit-animation-name:pulse;
                -webkit-animation-duration:5s;
                -webkit-animation-timing-function:linear;
                -webkit-animation-iteration-count:infinite;
                -webkit-animation-direction:alternate;
                -webkit-animation-play-state:running;
            }
            @-webkit-keyframes pulse {
                0%   {background:${inputLineColor} !important; left:0px; top:0px;}
                50%  {background:${inputLineColor} !important; left:50%; top:0px;}
                100% {background:${inputLineColor} !important; left:100%; top:0px;}
            }
            .cactive {
                -webkit-user-select:text;
                user-select: text;
            }
            .cactive:active {
                -webkit-transform: rotate(0.9);
                transform: scale(0.9);
            }
            .pl18 {
                padding-left:18px;
            }
            .h30 {
                height: 30px;
            }
            .fred {
                color: red !important;
            }
            .fgreen {
                color: green;
            }
            .f111 {
                color: rgb(182,151,103);
            }
            #page-top {
                background-color:${background} !important;
            }
            .project-name {
                width: 120px;
                overflow:hidden;
                white-space: nowrap;
                text-overflow:ellipsis;
            }
            @media screen and (max-width: 249px) {
                .project-name {
                    width: calc(100% - 129px);
                }
            }
            .text-hidden {
                text-overflow:ellipsis;
                overflow:hidden;
                white-space: nowrap;
            }
            .outline-none {
                box-shadow: none !important;
            }
            .form-control::-webkit-input-placeholder {
                font-size: 0.9rem !important;
                font-weight: 200 !important;
                color: #c0c4cc !important;
            }
            .form-control {
                border-radius: 2px !important;
                font-size: 14px !important;
                border: 1px solid ${lineColor};
                transition: none !important;
                caret-color: ${cursorColor};
                color: ${fontColor};
            }
            .form-control:focus  {
                border-radius: 2px !important;
                border: 1px solid ${liHoverBackground};
                transition: none !important;
                color: ${fontColor};
            }
            .textarea {
                background: ${background} !important;
                overflow: hidden;
                resize: none;
                max-height: 98px !important;
                color: ${fontColor};
            }
            .textarea::-webkit-input-placeholder {
                font-size: 13px !important;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
            .add-title {
                font-size: 14px;
                padding-left:18px;
                line-height: 2rem;
                margin-bottom: 3px;
            }
            .add-title:hover .stash-all{
                display: inline;
            }
            .add-title > .a-icon {
                margin-left: -5px;
                margin-right: 5px;
            }
            .stash-all {
                display: none;
                float: right;
                padding-right: 13px;
            }
            .top {
                font-size: 0.95rem;
                height: 30px;
                color: ${fontColor};
            }
            .icon:active {
                -webkit-transform: rotate(0.9);
                transform: scale(0.9);
            }
            .gitfile:hover .hideicon {
                opacity: 1;
            }

            .lif {
                margin: 0;
                padding: 3px 10px 3px 18px;
                height:25px;
                font-size: 0.9rem;
                color: ${fontColor};
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                align-items: flex-end;
            }
            .lif:hover {
                background-color: ${liHoverBackground} !important;
            }
            .lif .file-label {
                font-weight: 500;
            }
            .fixedBottom {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                width: 100%;
                height: 2rem;
                line-height: 2rem;
                color: ${fontColor} !important;
                border-top: 1px solid ${lineColor};
                z-index: 1000;
                opacity: 1;
                background-color: ${background} !important;
            }
            .push-pull > div {
                display:inline-block;
            }
            .push-pull > div > .num {
                right: -6px;
                position: relative;
                top: 1px;
            }
            .line-through {
                text-decoration: line-through;
            }

            .menu {
                background-color: ${menuBackground} !important;
                display: flex;
                position: absolute;
                z-index: 1000;
                border: 1px solid ${lineColor};
                border-radius: 4px;
                width: 188px;
                top: 2rem;
                right: 10px;
                box-shadow: 0px 0px 6px 1px rgba(0,0,0,0.2);
            }
            .menu ul {
                list-style:none;
                padding-left: 0px;
                width: 100%;
                margin:10px 0;
            }
            .menu ul>li {
                line-height: 1.6rem;
                padding-left: 20px;
                font-size:0.83rem !important;
            }
            .menu ul>li:hover {
                background-color: ${liHoverBackground};
            }
            .divider {
                height: 0;
                margin: .2rem 0;
                overflow: hidden;
                border-top: 1px solid ${lineColor};
            }
            .gtag {
                border: 1px solid ${liHoverBackground};
                border-radius: 5px;
                margin: 0 6px;
                padding: 1px 6px;
                font-size: 0.6rem;
                top: -1px;
                position: relative;
                color: ${fontColor};
            }
        </style>
    </head>
    <body style="background-color:${background};">
        <div id="app" v-cloak>
            <div id="filelist" class="container-fluid pb-5">
                <div id="page-top" class="fixed-top">
                    <div id="refresh-progress" v-show="refreshProgress"></div>
                    <div class="row m-3">
                        <div class="col-auto mr-auto p-0 project-name" :title="projectName">
                            <span class="top">{{projectName}}</span>
                        </div>
                        <div class="col-auto p-0">
                            <span class="top" @click="refresh();" title="刷新">${iconRefresh}</span>
                            <span class="top" @click="gitCommit();" :title="GitAlwaysAutoCommitPush && gitStagedFileList.length ? 'commit & push' : 'commit'">${CheckMarkIcon}</span>
                            <span class="top" @click="gitLog();" title="查看日志">${HistoryIcon}</span>
                            <span class="top" @click.stop="clickMenu();">
                                <i title="更多操作">${MenuIcon}</i>
                                <div id="menu" :class="[ isShowMenu ? 'menu' : 'd-none' ]" @mouseleave="isShowMenu=false">
                                    <ul>
								        <li title="git commit，仅提交，不受其它设置影响" @click="gitCommit(true);">提交 - commit</li>
                                        <li title="git pull" @click="gitPull('');">拉取 - pull</li>
                                        <li title="git pull" @click="gitPush();">推送 - push</li>
                                        <li class="divider"></li>
                                        <li title="git reset --soft HEAD^" @click="gitResetSoftHEAD();">撤销上次commit</li>
                                        <li title="git reset --hard HEAD" @click="gitResetHardHEAD('HEAD');">重置当前修改</li>
                                        <li title="git reset --hard HEAD^" @click="gitResetHardHEAD('HEAD^');">重置代码到上个版本</li>
                                        <li class="divider"></li>
                                        <li title="git checkout ." @click="gitCheckout('*');">放弃本地所有更改</li>
                                        <li title="git clean -df" @click="clean();">删除未跟踪的文件</li>
                                        <li class="divider"></li>
                                        <li title="stash" @click="gitStash('stashShow');">查看储藏</li>
                                        <li title="stash" @click="gitStash('stash');">储藏</li>
                                        <li title="stash -a" @click="gitStash('stashAll');">储藏全部(包含未跟踪的)</li>
                                        <li title="stash pop" @click="gitStash('stashPop');">弹出储藏</li>
                                        <li title="stash pop stash@{0}" @click="gitStash('stashPopNew');">弹出最新储藏</li>
                                        <li title="stash clear" @click="gitStash('stashClear');">删除所有储藏</li>
                                        <li class="divider"></li>
                                        <li title="git config -l" @click="showConfig();">查看配置文件</li>
                                        <li title="git show remote origin" @click="showRemoteOrigin();">查看远程仓库信息</li>
                                        <li @click="openRemoteServerInBrowser();">浏览器里查看远程仓库</li>
                                        <li class="divider"></li>
                                        <li @click="openCommandPanel();">Git 命令面板</li>
                                    </ul>
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="row mt-5 px-0">
                    <div class="col mt-2">
                        <div>
                            <textarea rows=1
                                v-model="commitMessage"
                                class="form-control outline-none textarea"
                                :placeholder="commitMessagePlaceholder"
                                @keyup.${ctrl}.enter="gitCommit();"
                                :title="GitAlwaysAutoCommitPush ? 'commit & push' : 'commit'"
                                onfocus="window.activeobj=this;this.clock=setInterval(function(){activeobj.style.height=(activeobj.scrollHeight + 2)+'px';},100);">
                            </textarea>
                        </div>
                    </div>
                </div>
                <div class="row mt-3" id="git_add" style="visibility: hidden;" :style="{visibility: 'visible'}">
                    <div class="col px-0" v-if="gitConflictedFileListLength != 0">
                        <p class="add-title" id="git_add_title">
                            <span class="a-icon" v-html="ConflictedIcon" @click="isShowConflictedList();"></span>合并更改:
                            <span class="gtag">{{ gitConflictedFileListLength }}</span>
                        </p>
                        <ul style="list-style-type:none;padding-left:0;" id="git_add_data" v-show="isShowConflicted">
                            <li class="d-flex px-3 lif gitfile" v-for="(v1,i1) in gitConflictedFileList" :key="i1"
                                :id="'conflicted_'+i1"
                                @mouseover="hoverConflictedFileID = 'conflicted_'+i1"
                                @mouseleave="hoverConflictedFileID = false">
                                <div class="flex-grow-1 text-hidden" :title="v1.path">
                                    <span :class="[v1.tag == 'D' ? 'line-through' : '']" @click="gitDiff(v1.path, v1.tag, true);">{{ v1.path }}</span>
                                </div>
                                <div class="d-inline float-right" :id="'conflicted_'+i1">
                                    <div class="d-inline" v-if="hoverConflictedFileID == 'conflicted_'+i1">
                                        <span title="打开文件" @click="openFile(v1.path);">${OpenFileIconSvg}</span>
                                        <span title="加入暂存 (git add)" @click="gitAdd(v1.path, v1.tag);">${AddIconSvg}</span>
                                    </div>
                                    <div class="d-inline ml-1 pt-2">
                                        <span class="file-label fred"> {{ v1.tag }} </span>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="row mt-0" id="git_stash" style="visibility: hidden;" :style="{visibility: 'visible'}">
                    <div class="col px-0" v-show="gitStagedFileListLength != 0">
                        <p class="add-title" id="git_add_title">
                            <span class="a-icon" v-html="StagedIcon" @click="isShowStagedList();"></span>暂存的更改:
                            <span class="gtag">{{ gitStagedFileListLength }}</span>
                            <span title="取消所有暂存" class="stash-all" @click="cancelAllStash('all');">
                                ${CancelIconSvg}
                            </span>
                        </p>
                        <ul style="list-style-type:none;padding-left:0;" id="git_stash_list" v-if="isShowStaged">
                            <li class="d-flex px-3 lif gitfile"
                                v-for="(vv,ii) in gitStagedFileList" :key="ii"
                                :id="'stash'+ii"
                                @mouseover="hoverStashFileID = 'stash_'+ii"
                                @mouseleave="hoverStashFileID = false">
                                <div class="flex-grow-1 text-hidden" :title="vv.path">
                                    <span :class="[vv.tag == 'D' ? 'line-through' : '']" @click="gitDiff(vv.path, vv.tag);">{{ vv.path }}</span>
                                </div>
                                <div class="d-inline float-right">
                                    <div class="d-inline" v-if="hoverStashFileID == 'stash_'+ii">
                                        <span title="打开文件" @click="openFile(vv.path);">${OpenFileIconSvg}</span>
                                        <span
                                            title="取消暂存 git restore --staged <file>"
                                            @click="cancelStash(vv.path, vv.tag);">
                                            ${CancelIconSvg}
                                        </span>
                                    </div>
                                    <div class="d-inline ml-1 pt-2">
                                        <span class="file-label" :class="[vv.tag == 'D' ? 'fred' : vv.tag == 'U' ? 'fgreen':'f111']">{{ vv.tag }}</span>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="row mt-0" id="git_add" style="visibility: hidden;" :style="{visibility: 'visible'}">
                    <div class="col px-0" v-show="gitNotStagedileListLength != 0">
                        <p class="add-title" id="git_add_title">
                            <span class="a-icon" v-html="ChangeIcon" @click="isShowChangeList();"></span>更改:
                            <span class="gtag">{{ gitNotStagedileListLength }}</span>
                            <span title="暂存所有文件" class="stash-all" @click="gitAdd('all', '');">
                                ${AddAllIcon}
                            </span>
                            <span title="取消所有更改" class="stash-all" @click="gitCheckout('*');">
                                ${checkoutIconSvg}
                            </span>
                        </p>
                        <ul style="list-style-type:none;padding-left:0;" id="git_add_data" v-if="isShowChange">
                            <li class="d-flex px-3 lif gitfile" v-for="(v,i) in gitNotStagedileList" :key="i"
                                :id="'change_'+i"
                                @mouseover="hoverChangeFileID = 'change_'+i"
                                @mouseleave="hoverChangeFileID = false">
                                <div class="flex-grow-1 text-hidden" :title="v.path">
                                    <span :class="[v.tag == 'D' || v.tag == 'R' ? 'line-through' : '']" @click="gitDiff(v.path, v.tag);">{{ v.path }}</span>
                                </div>
                                <div class="d-inline float-right" :id="'change_'+i">
                                    <div class="d-inline"  v-if="hoverChangeFileID == 'change_'+i">
                                        <span title="打开文件" @click="openFile(v.path);">${OpenFileIconSvg}</span>
                                        <span title="加入暂存 (git add)" @click="gitAdd(v.path, v.tag);">${AddIconSvg}</span>
                                        <span title="放弃、撤销对文件的修改 (git checkout --)" @click="gitCheckout(v);">${checkoutIconSvg}</span>
                                    </div>
                                    <div class="d-inline ml-1 pt-2">
                                        <span class="file-label" :class="[v.tag == 'D' ? 'fred' : v.tag == 'U' ? 'fgreen':'f111']"> {{ v.tag }} </span>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="container-fluid">
                <div class="row m-0 fixedBottom" id="git_branch">
                    <div class="col-auto mr-auto" title="鼠标左键，进入分支管理视图; 鼠标右键或中键，可直接切换到上一次分支。">
                        <span class="cactive" @click.once="showBranchWindow();" @click.right.prevent="switchLastBranch();" @click.middle="switchLastBranch();">
                            ${BranchIcon} {{ currentBranch }}
                        </span>
                    </div>
                    <div class="col-auto push-pull" v-if="GitAssociationRemote">
                        <div class="ml-2" @click="gitFetch();" title="git fetch --all">
                            ${SyncIcon}
                        </div>
                        <div @click="gitPull('rebase');" title="git pull --rebase">
                            <span class="cactive num">{{ behind }}</span>
                            <span>${DownArrowIcon}</span>
                        </div>
                        <div @click="gitPush();" title="git push">
                            <span class="cactive num">{{ ahead }}</span>
                            <span>${UpArrowIcon}</span>
                        </div>
                    </div>
                    <div class="col-auto push-pull" v-else>
                        <div :title="projectName + '(git) - 发布更改'" @click="publish();">
                            ${uploadIcon}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script>
            var app = new Vue({
                el: '#app',
                data: {
                    refreshProgress: true,
                    projectName: "${projectName}",
                    currentBranch: "${currentBranch}",
                    behind: "${behind}",
                    ahead: "${ahead}",
                    tracking: "${tracking}",
                    originurl: "${originurl}",
                    originurlBoolean: ${originurlBoolean},
                    commitMessage: '',
                    gitFileResult: {},
                    isShowMenu: false,
                    bodyWidth: 0,
                    hoverConflictedFileID: false,
                    hoverChangeFileID: false,
                    hoverStashFileID: false,
                    ConflictedIcon: '${ChevronDownIcon}',
                    isShowConflicted: true,
                    gitConflictedFileList: [],
                    gitConflictedFileListLength:0,
                    ChangeIcon: '${ChevronDownIcon}',
                    isShowChange: true,
                    gitNotStagedileList: [],
                    gitNotStagedileListLength: 0,
                    StagedIcon: '${ChevronDownIcon}',
                    isShowStaged: true,
                    gitStagedFileList: [],
                    gitStagedFileListLength: 0,
                    GitAlwaysAutoCommitPush: false,
                    ctrl: ''
                },
                computed: {
                    GitAssociationRemote() {
                        return this.originurlBoolean;
                    },
                    commitMessagePlaceholder() {
                        let msg;
                        if (this.GitAlwaysAutoCommitPush && this.gitStagedFileList.length) {
                            msg = '消息（' + this.ctrl + '+Enter 提交并推送）';
                        } else {
                            msg = '消息（' + this.ctrl + '+Enter 提交）';
                        };

                        if (this.currentBranch != '' && this.currentBranch != undefined) {
                            let text = '在"' + this.currentBranch + '"分支提交';
                            return msg.replace('提交', text);
                        } else {
                            return msg;
                        };
                    }
                },
                created() {
                    this.ctrl = '${ctrl}';
                    if (this.ctrl == 'meta') {
                        this.ctrl = '⌘';
                    };

                    this.gitFileResult = ${gitFileResult};
                    this.getGitFileList();

                    // 用户是否设置自动commit -> push
                    let GitAlwaysAutoCommitPush =  ${GitAlwaysAutoCommitPush};
                    if (GitAlwaysAutoCommitPush != undefined && GitAlwaysAutoCommitPush) {
                        this.GitAlwaysAutoCommitPush = GitAlwaysAutoCommitPush;
                    };

                    let that = this;
                    setTimeout(function() {
                        that.refreshProgress = false;
                    },2000);
                },
                mounted() {
                    that = this;
                    window.onload = function() {
                        setTimeout(function() {
                            that.updateProjectStatusInfo();
                        }, 500);
                        setTimeout(function() {
                            that.runSync();
                            that.getCommitMessage();
                            that.forUpdateCommitMessage();
                        }, 1000);
                    };
                },
                methods: {
                    runSync() {
                        hbuilderx.postMessage({
                            command: 'sync'
                        });
                    },
                    updateProjectStatusInfo() {
                        hbuilderx.onDidReceiveMessage((msg) => {
                            if (msg.command == 'sync') {
                                this.behind = msg.behind;
                                return;
                            };

                            if (msg.command == 'animation') {
                                this.refreshProgress = true;
                                let that = this;
                                setTimeout(function() {
                                    that.refreshProgress = false;
                                }, 3000);
                                return;
                            };

                            if (msg.command == 'HEAD') {
                                this.ahead = msg.ahead;
                                this.behind = msg.behind;
                                this.currentBranch = msg.currentBranch;
                                this.originurlBoolean = msg.originurlBoolean;
                            }

                            if (msg.command == 'autoRefresh') {
                                this.gitFileResult = msg.gitFileResult;
                                this.ahead = msg.ahead;
                                this.behind = msg.behind;
                                this.currentBranch = msg.currentBranch;
                                this.originurlBoolean = msg.originurlBoolean;
                                this.GitAlwaysAutoCommitPush = msg.GitAlwaysAutoCommitPush;
                                // 处理文件
                                this.getGitFileList();
                                // 关闭动画
                                let that = this;
                                setTimeout(function() {
                                    that.refreshProgress = false;
                                }, 2000);
                            };
                        });
                    },
                    isShowConflictedList() {
                        if (this.ConflictedIcon == '${ChevronDownIcon}') {
                            this.isShowConflicted = false;
                            this.ConflictedIcon = '${ChevronRightIcon}';
                        } else {
                            this.isShowConflicted = true;
                            this.ConflictedIcon = '${ChevronDownIcon}';
                        }
                    },
                    isShowChangeList() {
                        if (this.ChangeIcon == '${ChevronDownIcon}') {
                            this.isShowChange = false;
                            this.ChangeIcon = '${ChevronRightIcon}';
                        } else {
                            this.isShowChange = true;
                            this.ChangeIcon = '${ChevronDownIcon}';
                        }
                    },
                    isShowStagedList() {
                        if (this.StagedIcon == '${ChevronDownIcon}') {
                            this.isShowStaged = false;
                            this.StagedIcon = '${ChevronRightIcon}';
                        } else {
                            this.isShowStaged = true;
                            this.StagedIcon = '${ChevronDownIcon}';
                        }
                    },
                    getGitFileList() {
                        this.gitConflictedFileList = this.gitFileResult.conflicted;
                        this.gitStagedFileList = this.gitFileResult.staged;
                        this.gitNotStagedileList = this.gitFileResult.notStaged;

                        this.gitStagedFileListLength = (this.gitStagedFileList).length;
                        this.gitNotStagedileListLength = (this.gitNotStagedileList).length;
                        this.gitConflictedFileListLength = (this.gitConflictedFileList).length;

                        if (this.gitStagedFileListLength == 0 && this.gitNotStagedileListLength == 0 && this.gitConflictedFileListLength == 0) {
                            this.commitMessage = '';
                        };
                    },
                    clickMenu() {
                        this.bodyWidth = document.body.clientWidth;
                        if (this.isShowMenu) {
                            this.isShowMenu = false
                        } else {
                            this.isShowMenu = true
                        }
                    },
                    refresh() {
                        hbuilderx.postMessage({
                            command: 'refresh',
                            text: ''
                        });
                    },
                    gitLog() {
                        hbuilderx.postMessage({
                            command: 'log',
                            text: ''
                        });
                    },
                    showConfig() {
                        hbuilderx.postMessage({
                            command: 'configShow'
                        });
                    },
                    showRemoteOrigin() {
                        hbuilderx.postMessage({
                            command: 'showOrigin'
                        });
                    },
                    gitConfigFile(filename) {
                        hbuilderx.postMessage({
                            command: 'gitConfigFile',
                            text: filename
                        });
                    },
                    gitDiff(fileUri, tag, isConflicted=false) {
                        hbuilderx.postMessage({
                            command: 'diff',
                            filename: fileUri,
                            tag: tag,
                            isConflicted: isConflicted
                        });
                    },
                    openFile(fileUri) {
                        hbuilderx.postMessage({
                            command: 'open',
                            text: fileUri
                        });
                    },
                    cancelStash(fileUri, tag) {
                        hbuilderx.postMessage({
                            command: 'cancelStash',
                            text: fileUri,
                            tag: tag
                        });
                    },
                    cancelAllStash() {
                        hbuilderx.postMessage({
                            command: 'cancelAllStash'
                        });
                    },
                    gitAdd(fileUri, tag) {
                        hbuilderx.postMessage({
                            command: 'add',
                            text: fileUri,
                            tag: tag
                        });
                    },
                    forUpdateCommitMessage() {
                        hbuilderx.onDidReceiveMessage((msg) => {
                            if (msg.command != 'CommitMessage') {
                                return;
                            };
                            if (msg.commitMessage) {
                                this.commitMessage = msg.commitMessage;
                            }
                        });
                    },
                    getCommitMessage() {
                        hbuilderx.postMessage({
                            command: 'CommitMessage'
                        });
                    },
                    gitCommit(onlyCommit=false) {
                        let ChangeList = this.gitNotStagedileList;
                        let stagedList = this.gitStagedFileList;
                        let ConflictedList = this.gitConflictedFileList;

                        let isStaged = stagedList.length == 0 ? false : true;
                        let exist = (stagedList.length) + (ChangeList.length) + (ConflictedList.length);

                        hbuilderx.postMessage({
                            command: 'commit',
                            comment: this.commitMessage,
                            isStaged: isStaged,
                            exist: exist,
                            onlyCommit: onlyCommit
                        });

                        // 清空输入框消息
                        this.commitMessage = '';
                    },
                    gitPush() {
                        hbuilderx.postMessage({
                            command: 'push',
                            text: ''
                        });
                    },
                    publish() {
                        hbuilderx.postMessage({
                            command: 'publish',
                            text: this.currentBranch
                        });
                    },
                    gitFetch() {
                        hbuilderx.postMessage({
                            command: 'fetch',
                            text: 'file'
                        });
                    },
                    gitPull(options) {
                        let req = {
                            command: 'pull',
                            text: 'file'
                        }
                        if (options == 'rebase') {
                            req.rebase = true
                        }
                        hbuilderx.postMessage(req);
                    },
                    gitCheckout(file) {
                        hbuilderx.postMessage({
                            command: 'checkoutFile',
                            text: file
                        });
                    },
                    gitStash(option) {
                        hbuilderx.postMessage({
                            command: 'stash',
                            option: option
                        });
                    },
                    switchLastBranch() {
                        hbuilderx.postMessage({
                            command: 'switchLastBranch'
                        });
                    },
                    showBranchWindow() {
                        hbuilderx.postMessage({
                            command: 'BranchInfo',
                            text: 'branch'
                        });
                    },
                    clean() {
                        hbuilderx.postMessage({
                            command: 'clean'
                        });
                    },
                    gitResetSoftHEAD() {
                        hbuilderx.postMessage({
                            command: 'ResetSoftHEAD'
                        });
                    },
                    gitResetHardHEAD(text) {
                        hbuilderx.postMessage({
                            command: 'ResetHardHEAD',
                            version: text
                        });
                    },
                    openRemoteServerInBrowser() {
                        hbuilderx.postMessage({
                            command: 'openRemoteServer'
                        });
                    },
                    openCommandPanel() {
                        hbuilderx.postMessage({
                            command: 'openCommandPanel'
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
                }
            };
        </script>
    </body>
</html>
`;
};


module.exports = {
    getWebviewContent
}
