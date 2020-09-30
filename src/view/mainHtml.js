const hx = require('hbuilderx');

const os = require('os');
const path = require('path');
const osName = os.platform();

const vueFile = path.join(__dirname, 'static', '','vue.min.js');
const bootstrapCssFile = path.join(__dirname, 'static', 'bootstrap.min.css');


/**
 * @description 获取webview内容
 * @param {Object} uiData
 * @param {Object} gitData
 */
function getWebviewContent(userConfig, uiData, gitData) {
    // 是否启用开发者工具
    let {DisableDevTools} = userConfig;

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
        uploadIcon
    } = uiData;

    let {
        projectPath,
        projectName,
        gitStatusResult,
        currentBranch,
        tracking,
        ahead,
        behind,
        originurl
    } = gitData;

    let originurlBoolean = originurl != undefined ? true : false;
    ahead = ahead == 0 ? '' : ahead;
    behind = behind == 0 ? '': behind;
    gitStatusResult = gitStatusResult;

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
            body::-webkit-scrollbar {
                display: none;
            }
            @media screen and (max-width: 132px) {
                body {
                    display: none;
                }
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
                color: red;
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
                border: 1px solid ${inputLineColor};
                transition: none !important;
            }
            .textarea {
                background: ${background} !important;
                overflow: hidden;
                resize: none;
                max-height: 98px !important;
                color: ${fontColor};
            }
            .add-title {
                font-size: 15px;
                padding-left:18px;
                line-height: 2rem;
                margin-bottom: 3px;
            }
            .add-title:hover .stash-all{
                display: inline;
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
                border: 1px solid ${lineColor};
                border-radius: 5px;
                margin: 0 8px;
                padding: 1px 7px;
                font-size: 0.6rem;
                top: -1px;
                position: relative;
                color: ${lineColor};
            }
        </style>
    </head>
    <body style="background-color:${background};">
        <div id="app" v-cloak>
            <div id="filelist" class="container-fluid pb-5">
                <div id="page-top" class="fixed-top">
                    <div class="row m-3">
                        <div class="col-auto mr-auto p-0 project-name" :title="projectName">
                            <span class="top">{{projectName}}</span>
                        </div>
                        <div class="col-auto p-0">
                            <span class="top" @click="refresh();" title="刷新">${iconRefresh}</span>
                            <span class="top" @click="gitCommit();" title="commit">${CheckMarkIcon}</span>
                            <span class="top" @click="gitLog();">${HistoryIcon}</span>
                            <span class="top" @click.stop="clickMenu();">
                                <i>${MenuIcon}</i>
                                <div id="menu" :class="[ isShowMenu ? 'menu' : 'd-none' ]" @mouseleave="isShowMenu=false">
                                    <ul>
                                        <li title="git pull" @click="gitPull('');">拉取</li>
                                        <li class="divider"></li>
                                        <li title="git reset --soft HEAD^" @click="gitResetSoftHEAD();">撤销上次commit</li>
                                        <li class="divider"></li>
                                        <li title="git checkout ." @click="gitCheckout('all');">放弃本地所有更改</li>
                                        <li title="git clean -df" @click="clean();">删除未跟踪的文件</li>
                                        <li class="divider"></li>
                                        <li title="stash" @click="gitStash('stash');">储藏</li>
                                        <li title="stash -a" @click="gitStash('stashAll');">储藏全部(包含未跟踪的)</li>
                                        <li title="stash pop" @click="gitStash('stashPop');">弹出储藏</li>
                                        <li title="stash pop stash@{0}" @click="gitStash('stashPopNew');">弹出最新储藏</li>
                                        <li title="stash clear" @click="gitStash('stashClear');">删除所有储藏</li>
                                        <li class="divider"></li>
                                        <li title="git show remote origin" @click="showRemoteOrigin();">查看远程仓库信息</li>
                                        <li title="git config -l" @click="showConfig();">查看配置文件</li>
                                        <li class="divider"></li>
                                        <li @click="gitConfigFile('.gitignore');">设置.gitignore</li>
                                        <li @click="gitConfigFile('.gitattributes');">设置.gitattributes</li>
                                        <li class="divider"></li>
                                        <li @click="openRemoteServerInBrowser();">浏览器里查看远程仓库</li>
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
                                v-model="codeComment"
                                class="form-control outline-none textarea"
                                :placeholder="commitMessage"
                                @keyup.${ctrl}.enter="gitCommit();"
                                onfocus="window.activeobj=this;this.clock=setInterval(function(){activeobj.style.height=(activeobj.scrollHeight + 2)+'px';},100);">
                            </textarea>
                        </div>
                    </div>
                </div>
                <div class="row mt-3" id="git_stash" style="visibility: hidden;" :style="{visibility: 'visible'}">
                    <div class="col px-0" v-show="gitStashFileList.length">
                        <p class="add-title" id="git_add_title">暂存的更改:
                            <span class="gtag">{{ gitStashFileListLength }}</span>
                            <span title="取消暂存所有更改" class="stash-all" @click="cancelAllStash('all');">
                                ${CancelIconSvg}
                            </span>
                        </p>
                        <ul style="list-style-type:none;padding-left:0;" id="git_stash_list">
                            <li class="d-flex px-3 lif gitfile" v-for="(vv,ii) in gitStashFileList" :key="ii"
                                :id="'stash'+ii"
                                @mouseover="hoverStashFileID = 'stash_'+ii"
                                @mouseleave="hoverStashFileID = false">
                                <div class="flex-grow-1 text-hidden">
                                    <span @click="openFile(vv.path);">{{ vv.path }}</span>
                                </div>
                                <div class="d-inline float-right">
                                    <div class="d-inline" v-if="hoverStashFileID == 'stash_'+ii">
                                        <span title="打开文件" @click="openFile(vv.path);">${OpenFileIconSvg}</span>
                                        <span
                                            title="取消暂存 git restore --staged <file>"
                                            @click="cancelStash(vv.path);">
                                            ${CancelIconSvg}
                                        </span>
                                    </div>
                                    <div class="d-inline ml-1 pt-2">
                                        <span class="file-label" :class="[vv.tag == 'A' ? 'fgreen':'f111']">{{ vv.tag }}</span>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="row mt-0" id="git_add" style="visibility: hidden;" :style="{visibility: 'visible'}">
                    <div class="col px-0" v-show="gitChangeFileList.length">
                        <p class="add-title" id="git_add_title">
                            更改:
                            <span class="gtag">{{ gitChangeFileListLength }}</span>
                            <span title="暂存所有文件" class="stash-all" @click="gitAdd('all');">
                                ${AddAllIcon}
                            </span>
                        </p>
                        <ul style="list-style-type:none;padding-left:0;" id="git_add_data">
                            <li class="d-flex px-3 lif gitfile" v-for="(v,i) in gitChangeFileList" :key="i"
                                :id="'change_'+i"
                                @mouseover="hoverChangeFileID = 'change_'+i"
                                @mouseleave="hoverChangeFileID = false">
                                <div class="flex-grow-1 text-hidden">
                                    <span :class="[v.tag == 'D' ? 'line-through' : '']" @click="gitDiff(v.path);">{{ v.path }}</span>
                                </div>
                                <div class="d-inline float-right" :id="'change_'+i">
                                    <div class="d-inline"  v-if="hoverChangeFileID == 'change_'+i">
                                        <span title="打开文件" @click="openFile(v.path);">${OpenFileIconSvg}</span>
                                        <span title="加入暂存 (git add)" @click="gitAdd(v.path);">${AddIconSvg}</span>
                                        <span title="撤销对文件的修改 (git checkout --)" @click="gitCheckout(v);">${checkoutIconSvg}</span>
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
                    <div class="col-auto mr-auto" title="点击：切换/管理分支">
                        <span class="cactive" @click="showBranchWindow();">
                            ${BranchIcon} {{ currentBranch }}
                        </span>
                    </div>
                    <div class="col-auto push-pull" v-if="GitAssociationRemote">
                        <div class="ml-2" @click="gitFetch();" title="git fetch --all">
                            ${SyncIcon}
                        </div>
                        <div @click="gitPull('rebase');" title="git pull --rebase">
                            <span class="cactive num">${behind}</span>
                            <span>${DownArrowIcon}</span>
                        </div>
                        <div @click="gitPush();" title="git push">
                            <span class="cactive num">${ahead}</span>
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
                    projectName: "",
                    currentBranch: "",
                    tracking: "",
                    originurl: "",
                    originurlBoolean: "",
                    commitMessage: "",
                    GitStatusResult: {},
                    codeComment: '',
                    isShowMenu: false,
                    bodyWidth: 0,
                    hoverChangeFileID: false,
                    hoverStashFileID: false,
                    gitChangeFileList: [],
                    gitStashFileList: [],
                    gitChangeFileListLength: 0,
                    gitStashFileListLength: 0
                },
                computed: {
                    GitAssociationRemote() {
                        return this.originurlBoolean
                    }
                },
                created() {
                    let ctrl = '${ctrl}';
                    if (ctrl == 'meta') {
                        ctrl = '⌘';
                    };
                    this.commitMessage = '消息（' + ctrl + '+Enter 在"${currentBranch}"提交）'
                    this.GitStatusResult = ${gitStatusResult};
                    this.projectName = '${projectName}';
                    this.tracking = '${tracking}';
                    this.originurl = '${originurl}';
                    this.originurlBoolean = ${originurlBoolean};
                    this.currentBranch = '${currentBranch}';
                },
                mounted() {
                    this.getGitChangeFileList();
                    this.getGitStashFileList();
                },
                methods: {
                    getGitChangeFileList() {
                        let staged = this.GitStatusResult.staged;
                        let modified = this.GitStatusResult.modified;
                        let deleted = this.GitStatusResult.deleted;
                        let not_added = this.GitStatusResult.not_added;
                        let renamed = this.GitStatusResult.renamed;

                        let tm = modified.filter((val)=>!new Set(staged).has(val));
                        let m = tm.map( i => ({'path': i, 'status': 'modified', 'tag': 'M'}) );
                        let d = deleted.map( i => ( {'path': i, 'status': 'deleted', 'tag': 'D'}) );
                        let na = not_added.map( i => ({'path': i, 'status': 'not_added', 'tag': 'U'}) );
                        let r = renamed.map( i => ({'path': i, 'status': 'renamed', 'tag': 'R'}) );
                        this.gitChangeFileList = [...m,...d,...na,...r];
                        this.gitChangeFileListLength = (this.gitChangeFileList).length;
                    },
                    getGitStashFileList() {
                        let staged = this.GitStatusResult.staged;
                        let created = this.GitStatusResult.created;
                        let m1 = staged.map( i => ({'path': i, 'status': 'staged', 'tag': 'M'}) );
                        let c1 = created.map( i => ( {'path': i, 'status': 'created', 'tag': 'A'}) );
                        this.gitStashFileList = [...m1,...c1];
                        this.gitStashFileListLength = (this.gitStashFileList).length;
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
                    gitDiff(fileUri) {
                        hbuilderx.postMessage({
                            command: 'diff',
                            filename: fileUri
                        });
                    },
                    openFile(fileUri) {
                        hbuilderx.postMessage({
                            command: 'open',
                            text: fileUri
                        });
                    },
                    cancelStash(fileUri) {
                        hbuilderx.postMessage({
                            command: 'cancelStash',
                            text: fileUri
                        });
                    },
                    cancelAllStash() {
                        hbuilderx.postMessage({
                            command: 'cancelAllStash'
                        });
                    },
                    gitAdd(fileUri) {
                        hbuilderx.postMessage({
                            command: 'add',
                            text: fileUri
                        });
                    },
                    gitCommit() {
                        let ChangeFile = this.gitChangeFileList;
                        let stagedList = this.gitStashFileList;

                        let isStaged = stagedList.length == 0 ? false : true;
                        let exist = (stagedList.length) + (ChangeFile.length);

                        hbuilderx.postMessage({
                            command: 'commit',
                            comment: this.codeComment,
                            isStaged: isStaged,
                            exist: exist
                        });
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
                    // 链式操作: add -> commit -> push
                    gitACP() {
                        hbuilderx.postMessage({
                            command: 'commit',
                            text: this.codeComment
                        });
                    },
                    gitCheckout(file) {
                        hbuilderx.postMessage({
                            command: 'checkout',
                            text: file
                        });
                    },
                    gitStash(option) {
                        hbuilderx.postMessage({
                            command: 'stash',
                            option: option
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
                    openRemoteServerInBrowser() {
                        hbuilderx.postMessage({
                            command: 'openRemoteServer'
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
