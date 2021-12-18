const hx = require('hbuilderx');

const os = require('os');
const path = require('path');
const osName = os.platform();

const vueFile = path.join(__dirname, 'static', '','vue.min.js');
const bootstrapCssFile = path.join(__dirname, 'static', 'bootstrap.min.css');
const mainCssFile = path.join(__dirname, 'static', 'main.css');
const ttfOtherFile = path.join(__dirname, 'static', 'file-icon', "other.ttf");

/**
 * hbuilderx.onDidReceiveMessage接收的事件
 *  - themeColor        当外部改变hx主题时，发送此事件，切换Git视图颜色
 *  - syncBehindAhead   同步Git behind、ahead数字；只有git fetch操作会触发此事件。
 *  - animation         Git视图显示加载动画
 *  - closedAnimation   Git视图关闭动画
 *  - CommitMessage     用于填充Git Commit消息输入框，一般发生在Git合并、revert等事件之后
 *  - autoRefresh       接收Git仓库的：文件变更列表、分支名称、Git URL、behind、ahead等基本信息
 *  - HEAD              同步Git仓库的：behind、ahead、branchName、url信息
 */

/**
 * @description 获取webview内容
 * @param {Object} userConfig
 * @param {Object} uiData
 * @param {Object} ProjectData
 */
function getWebviewContent(userConfig, uiData, ProjectData) {
    // 是否启用开发者工具
    let { DisableDevTools, GitAlwaysAutoCommitPush } = userConfig;

    // icon
    let {
        background,
        lefeSideVeiwBackground,
        menuBackground,
        liHoverBackground,
        inputColor,
        inputLineColor,
        cursorColor,
        fontColor,
        remarkTextColor,
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
        ChevronRightIcon,
        HandleIcon,
        CommandPanelIcon,
        ttfFile,
        _ficon, folder_ficon,
        html_ficon, js_ficon,ts_ficon,vue_ficon,md_ficon,css_ficon,
        less_ficon,scss_ficon, sass_ficon,styl_ficon,xml_ficon,
        py_ficon,php_ficon,java_ficon,c_ficon,cpp_ficon,sh_ficon, go_ficon, sql_ficon,
        img_ficon, zip_ficon,json_ficon,
        docx_ficon, doc_ficon, xls_ficon, xlsx_ficon, csv_ficon,
        explorerIconTheme
    } = uiData;

    let iconSize = "14px";
    let iconTop = "2px";
    if (explorerIconTheme == "vs-seti") {
        iconSize = "19px";
        iconTop = "4px";
    };

    let {
        projectPath,
        projectName,
    } = ProjectData;

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
            :root {
              --background: ${lefeSideVeiwBackground};
              --remarkTextColor: ${remarkTextColor};
              --fontColor: ${fontColor};
              --lineColor: ${lineColor};
              --inputLineColor: ${inputLineColor};
              --scrollbarColor: ${scrollbarColor};
              --menuBackground: ${menuBackground};
              --liHoverBackground: ${liHoverBackground};
              --inputColor: ${inputColor};
              --cursorColor: ${cursorColor};
            }
            @font-face {
                font-family: 'ficon';
                src: url('${ttfFile}') format('truetype');
            }

            .before_ficon::before {
                position: relative;
                top: ${iconTop};
                font-size: ${iconSize};
                font-weight: 500;
            }
            ._icon::before { ${_ficon} }
            .js_icon::before { ${js_ficon} }
            .ts_icon::before { ${ts_ficon} }
            .vue_icon::before { ${vue_ficon} }
            .md_icon::before { ${md_ficon} }
            .css_icon::before { ${css_ficon} }
            .less_icon::before { ${less_ficon} }
            .scss_icon::before { ${scss_ficon} }
            .sass_icon::before { ${sass_ficon} }
            .html_icon::before { ${html_ficon} }
            .py_icon::before { ${py_ficon} }
            .java_icon::before { ${java_ficon} }
            .php_icon::before { ${php_ficon} }
            .img_icon::before { ${img_ficon} }
            .zip_icon::before { ${zip_ficon} }
            .json_icon::before { ${json_ficon} }
            .c_icon::before { ${c_ficon} }
            .cpp_icon::before { ${cpp_ficon} }
            .sh_icon::before { ${sh_ficon} }
            .styl_icon::before { ${styl_ficon} }
            .xml_icon::before { ${xml_ficon} }
            .go_icon::before { ${go_ficon} }
            .sql_icon::before { ${sql_ficon} }
            .csv_icon::before { ${csv_ficon} }
            .xls_icon::before { ${xls_ficon} }
            .xlsx_icon::before { ${xlsx_ficon} }
            .doc_icon::before { ${doc_ficon} }
            .docx_icon::before { ${docx_ficon} }

            @font-face {
                font-family: 'otherIcon';
                src: url('${ttfOtherFile}') format('truetype');
            }
            .folder_icon::before { ${folder_ficon} }
        </style>
        <link rel="stylesheet" href="${mainCssFile}">
    </head>
    <body>
        <div id="app" v-cloak>
            <div id="filelist" class="container-fluid pb-5">
                <div id="page-top" class="fixed-top">
                    <div id="refresh-progress" v-show="refreshProgress"></div>
                    <div class="row m-3">
                        <div class="col-auto p-0 project-name" :title="'项目名称:'+projectName">
                            <span class="top">{{projectName}}</span>
                        </div>
                        <div class="col-auto ml-auto p-0 top-function-icon">
                            <span class="top" @click="openCommandPanel();" title="打开命令面板">${CommandPanelIcon}</span>
                            <span class="top" @click="getProjectGitInfo();" title="刷新当前视图">${iconRefresh}</span>
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
                                        <li title="git restore" @click="gitCheckout('*');">放弃本地所有更改</li>
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
                                id="commitMsg"
                                v-model="commitMessage"
                                class="form-control outline-none textarea"
                                :placeholder="commitMessagePlaceholder"
                                @keyup.${ctrl}.enter="gitCommit();"
                                :title="GitAlwaysAutoCommitPush ? 'commit & push' : 'commit'">
                            </textarea>
                        </div>
                    </div>
                </div>
                <div class="row mt-3" id="git_merge" style="visibility: hidden;" :style="{visibility: 'visible'}">
                    <div class="col px-0" v-if="gitConflictedFileListLength != 0">
                        <p class="add-title" id="git_merge_title">
                            <span class="a-icon" v-html="ConflictedIcon" @click="isShowConflictedList();"></span>合并更改:
                            <span class="gtag">{{ gitConflictedFileListLength }}</span>
                        </p>
                        <ul style="list-style-type:none;padding-left:0;" id="git_merge_data" v-show="isShowConflicted">
                            <li class="d-flex px-3 lif gitfile" v-for="(v1,i1) in gitConflictedFileList" :key="i1"
                                @mouseover="hoverConflictedFileID = 'conflicted_'+i1"
                                @mouseleave="hoverConflictedFileID = false">
                                <div class="flex-grow-1 text-hidden cursor-default" :title="v1.path" >
                                    <span class="before_ficon" :class="v1.icon"></span>
                                    <span :class="setStyleForLineThrough(v1.tag)" @click="gitDiff('MergeChanges', v1.path, v1.tag, true);">{{ v1.name }}</span>
                                    <span class="dirname">{{ v1.dir }}</span>
                                </div>
                                <div class="d-inline float-right">
                                    <div class="d-inline" v-if="hoverConflictedFileID == 'conflicted_'+i1">
                                        <span title="解决冲突" @click="mergeConflicted(v1.path);">${HandleIcon}</span>
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
                        <p class="add-title" id="git_stash_title">
                            <span class="a-icon" v-html="StagedIcon" @click="isShowStagedList();"></span>暂存的更改:
                            <span class="gtag">{{ gitStagedFileListLength }}</span>
                            <span title="取消所有暂存" class="stash-all" @click="cancelAllStaged('all');">
                                ${CancelIconSvg}
                            </span>
                        </p>
                        <ul style="list-style-type:none;padding-left:0;" id="git_stash_list" v-show="isShowStaged">
                            <li class="d-flex px-3 lif gitfile"
                                v-for="(vv,ii) in gitStagedFileList" :key="ii"
                                @mouseover="hoverStashFileID = 'stash_'+ii"
                                @mouseleave="hoverStashFileID = false">
                                <div class="flex-grow-1 text-hidden cursor-default" :title="vv.path">
                                    <span class="before_ficon" :class="vv.icon"></span>
                                    <span :class="setStyleForLineThrough(vv.tag)" @click="gitDiff('StagedChanges', vv.path, vv.tag);">{{ vv.name }}</span>
                                    <span class="dirname">{{ vv.dir }}</span>
                                </div>
                                <div class="d-inline float-right">
                                    <div class="d-inline" v-if="hoverStashFileID == 'stash_'+ii">
                                        <span title="打开文件" @click="openFile(vv.path);">${OpenFileIconSvg}</span>
                                        <span
                                            title="取消暂存 git restore --staged <file>"
                                            @click="cancelStaged(vv.path, vv.tag);">
                                            ${CancelIconSvg}
                                        </span>
                                    </div>
                                    <div class="d-inline ml-1 pt-2">
                                        <span class="file-label" :class="gitStatusStyle(vv.tag)">{{ vv.tag }}</span>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="row mt-0" id="git_add" style="visibility: hidden;" :style="{visibility: 'visible'}">
                    <div class="col px-0" v-show="gitNotStagedileListLength != 0">
                        <p class="add-title" id="git_change_title">
                            <span class="a-icon" v-html="ChangeIcon" @click="isShowChangeList();"></span>更改:
                            <span class="gtag">{{ gitNotStagedileListLength }}</span>
                            <span title="暂存所有文件" class="stash-all" @click="gitAdd('all', '');">
                                ${AddAllIcon}
                            </span>
                            <span title="取消所有更改" class="stash-all" @click="gitCheckout('*');">
                                ${checkoutIconSvg}
                            </span>
                        </p>
                        <ul style="list-style-type:none;padding-left:0;" id="git_change_data" v-show="isShowChange">
                            <li class="d-flex px-3 lif gitfile" v-for="(v,i) in gitNotStagedileList" :key="i"
                                @mouseover="hoverChangeFileID = 'change_'+i"
                                @mouseleave="hoverChangeFileID = false">
                                <div class="flex-grow-1 text-hidden cursor-default" :title="v.path">
                                    <span class="before_ficon" :class="v.icon"></span>
                                    <span :class="setStyleForLineThrough(v.tag)" @click="gitDiff('Changes', v.path, v.tag);">{{ v.name }}</span>
                                    <span class="dirname">{{ v.dir }}</span>
                                </div>
                                <div class="d-inline float-right">
                                    <div class="d-inline"  v-if="hoverChangeFileID == 'change_'+i">
                                        <span title="打开文件" @click="openFile(v.path);">${OpenFileIconSvg}</span>
                                        <span title="加入暂存 (git add)" @click="gitAdd(v.path, v.tag);">${AddIconSvg}</span>
                                        <span title="放弃、撤销对文件的修改 (git restore)" @click="gitCheckout(v);">${checkoutIconSvg}</span>
                                    </div>
                                    <div class="d-inline ml-1 pt-2">
                                        <span class="file-label" :class="gitStatusStyle(v.tag)"> {{ v.tag }} </span>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="container-fluid no-select">
                <div class="row m-0 fixedBottom" id="git_branch">
                    <div class="col-auto mr-auto" title="鼠标左键，进入分支管理视图; 鼠标右键或中键，可直接切换到上一次分支。" style="cursor:default;">
                        <span class="cactive" @click="showBranchWindow();" @click.right.prevent="switchLastBranch();" @click.middle="switchLastBranch();">
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
                    currentBranch: "",
                    behind: "",
                    ahead: "",
                    tracking: "",
                    originurlBoolean: true,
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
                    gitStatusStyle() {
                        return function(t) {
                            let color = "f111";
                            if (t == 'D') { color = "fred"};
                            if (t == 'U') { color = "fgreen"};
                            return color;
                        }
                    },
                    // 用于给文本设置下划线
                    setStyleForLineThrough() {
                        return function(t) {
                            return t == "D" || t == 'R' ? "line-through" : "";
                        }
                    },
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

                    // 用户是否设置自动commit -> push
                    let GitAlwaysAutoCommitPush =  ${GitAlwaysAutoCommitPush};
                    if (GitAlwaysAutoCommitPush != undefined && GitAlwaysAutoCommitPush) {
                        this.GitAlwaysAutoCommitPush = GitAlwaysAutoCommitPush;
                    };
                },
                mounted() {
                    that = this;
                    window.onload = function() {
                        setTimeout(function() {
                            that.receiveInfo();
                        }, 200);
                        setTimeout(function() {
                            that.getProjectGitInfo();
                        }, 600);
                        setTimeout(function() {
                            that.getCommitMessage();
                        }, 1500);
                        setTimeout(function() {
                            that.runSyncForGitBehindAhead();
                        }, 12000);
                    };

                    document.querySelector('#commitMsg').addEventListener('input', function () {
                        this.style.height = 'auto';
                        this.style.height = this.scrollHeight + 'px';
                    })
                },
                methods: {
                    runSyncForGitBehindAhead() {
                        hbuilderx.postMessage({
                            command: 'syncBehindAhead'
                        });
                    },
                    receiveInfo() {
                        hbuilderx.onDidReceiveMessage((msg) => {
                            if (msg.command == 'themeColor') {
                                let themedata = msg.data;
                                let colors = Object.keys(themedata);
                                for (let i of colors) {
                                    document.documentElement.style.setProperty('--' + i, themedata[i]);
                                };
                                return;
                            };
                            if (msg.command == 'syncBehindAhead') {
                                this.behind = msg.behind;
                                this.ahead = msg.ahead;
                                return;
                            };

                            if (msg.command == 'animation') {
                                this.refreshProgress = true;
                            };
                            if (msg.command == 'closedAnimation') {
                                this.refreshProgress = false;
                            };

                            if (msg.command == 'HEAD') {
                                this.ahead = msg.ahead;
                                this.behind = msg.behind;
                                this.currentBranch = msg.currentBranch;
                                this.originurlBoolean = msg.originurlBoolean;
                            };

                            if (msg.command == 'CommitMessage') {
                                this.commitMessage = msg.commitMessage;
                            };

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
                    mergeConflicted(fpath) {
                        hbuilderx.postMessage({
                            command: 'mergeConflicted',
                            data: fpath
                        });
                    },
                    isShowConflictedList(isShow=undefined) {
                        if (this.isShowConflicted || isShow == "N") {
                            this.isShowConflicted = false;
                            this.ConflictedIcon = '${ChevronRightIcon}';
                        } else {
                            this.isShowConflicted = true;
                            this.ConflictedIcon = '${ChevronDownIcon}';
                        }
                    },
                    isShowChangeList(isShow=undefined) {
                        if (this.isShowChange || isShow == "N") {
                            this.isShowChange = false;
                            this.ChangeIcon = '${ChevronRightIcon}';
                        } else {
                            this.isShowChange = true;
                            this.ChangeIcon = '${ChevronDownIcon}';
                        }
                    },
                    isShowStagedList(isShow=undefined) {
                        if (this.isShowStaged || isShow == "N") {
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

                        let fileTotal = this.gitFileResult.fileTotal;
                        this.gitNotStagedileListLength = this.gitFileResult.notStagedLength;
                        this.gitStagedFileListLength = this.gitFileResult.stagedLength;
                        this.gitConflictedFileListLength = this.gitFileResult.conflictedLength;

                        if (this.gitNotStagedileListLength > 40) {
                            this.isShowChangeList("N");
                        };
                        if (this.gitStagedFileListLength > 30) {
                            this.isShowStagedList("N");
                        };
                        if (this.gitConflictedFileListLength > 30) {
                            this.isShowConflictedList("N");
                        };

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
                        };
                        if (document.body.clientWidth < 200) {
                            hbuilderx.postMessage({
                                command: 'send_msg',
                                text: 'EasyGit: 视图区域，宽度太窄，请拉宽后再试。',
                                level: 'error'
                            });
                        };
                    },
                    getProjectGitInfo() {
                        // 获取变更的文件列表、当前分支、behind、ahead等信息
                        hbuilderx.postMessage({
                            command: 'syncProjectGitInfo'
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
                    gitDiff(objStatus, fileUri, tag, isConflicted=false) {
                        hbuilderx.postMessage({
                            command: 'diff',
                            filename: fileUri,
                            tag: tag,
                            objStatus: objStatus,
                            isConflicted: isConflicted
                        });
                    },
                    openFile(fileUri) {
                        hbuilderx.postMessage({
                            command: 'open',
                            text: fileUri
                        });
                    },
                    cancelStaged(fileUri, tag) {
                        hbuilderx.postMessage({
                            command: 'cancelStaged',
                            fileUri: fileUri,
                            tag: tag
                        });
                    },
                    cancelAllStaged() {
                        hbuilderx.postMessage({
                            command: 'cancelAllStaged'
                        });
                    },
                    gitAdd(fileUri, tag) {
                        hbuilderx.postMessage({
                            command: 'add',
                            text: fileUri,
                            tag: tag
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
                        document.getElementById('commitMsg').style.height = "31px";
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
                            text: 'branch',
                            originurl: this.originurlBoolean
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
                };
            };
        </script>
    </body>
</html>
`;
};


module.exports = {
    getWebviewContent
}
