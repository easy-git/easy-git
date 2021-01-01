const hx = require('hbuilderx');

const path = require('path');

const vueFile = path.join(path.resolve(__dirname, '..'), 'static', '','vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'bootstrap.min.css');


/**
 * @description 获取webview Branch内容
 * @param {Object} userConfig
 * @param {Object} uiData
 * @param {Object} gitBranchData
 */
function getWebviewBranchContent(userConfig, uiData, gitBranchData) {
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

    let {
        projectPath,
        projectName,
        GitAssignAction,
        localBranchList,
        remoteBranchList,
        TagsList,
        ahead,
        behind,
        tracking,
        originurl,
        currentBranch
    } = gitBranchData;

    let branchs = JSON.stringify(localBranchList);
    remoteBranchList = JSON.stringify(remoteBranchList);

    TagsList = JSON.stringify(TagsList.data);
    GitAssignAction = JSON.stringify(GitAssignAction);

    let originurlBoolean = originurl != undefined ? true : false;
    ahead = ahead == 0 ? '' : ahead;
    behind = behind == 0 ? '': behind;

    return `<!DOCTYPE html>
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
            #page-top {
                background-color:${background} !important;
                z-index: 999;
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
            .project-name {
                width:150px;
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
                border: 1px solid ${lineColor};
            }
            .form-control:focus {
                border-radius: 2px !important;
            }
            input:focus {
                border: 1px solid ${inputLineColor};
                caret-color: ${cursorColor};
            }
            .top {
                font-size: 0.95rem;
                color: ${fontColor};
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
            .lif {
                margin: 0;
                padding: 4px 10px 4px 18px;
                font-size: 14px;
                font-weight: 400;
                color: ${fontColor};
                width:100%;
                height:30px;
                white-space:nowrap;
                text-overflow:ellipsis;
                overflow: hidden
            }
            .lif > .hideicon {
                position: relative;
                float: right;
                z-index: 1000;
            }
            .lif:hover {
                background-color: ${liHoverBackground} !important;
            }
            .hideicon {
                overflow: hidden;
                opacity: 0;
                transition: all 0.3s;
                /*transform: translateY(100%);*/
            }
            .fixedBottom {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                width: 100%;
                height: 2rem;
                line-height: 2rem;
                font-size: 0.9rem;
                color: ${fontColor} !important;
                border-top: 1px solid ${lineColor};
                background-color: ${background} !important;
                z-index: 1000;
            }
            .push-pull > div {
                display:inline-block;
            }
            .push-pull > div > .num {
                right: -6px;
                position: relative;
                top: 1px;
            }
            .ci {
                font-size:0.8rem;
                margin-top:3px;
            }
            .btnd {
                border: 1px solid ${lineColor};
                border-radius: 3px;
                color: ${fontColor};
                font-size: 0.87rem !important;
                padding: 3px 10px;
                background-color: ${background};
                margin-right: 1rem;
                outline:none !important;
            }
            .btnd:active {
                -webkit-transform: rotate(0.95);
                transform: scale(0.95);
            }
            .major-title > span {
                font-size: 14px;
            }
            .major-title:hover .is-show{
                display: inline;
            }
            .is-show {
                display: none;
                float: right;
                font-size: 14px;
            }

        </style>
    </head>
    <body style="background-color:${background};">
        <div id="app" v-cloak>
            <div class="container-fluid pb-5" v-if="!isShowModel">
                <div id="page-top" class="fixed-top">
                    <div id="refresh-progress" v-show="refreshProgress"></div>
                    <div class="row px-3 pt-3">
                        <div class="col-auto mr-auto project-name" :title="projectName">
                            <span class="top">{{ projectName }}</span>
                        </div>
                        <div class="col-auto pl-0">
                            <span class="top" @click="back();" title="跳转到源代码管理器">${BackIcon}</span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col mt-3">
                            <div class="input-group mb-3 px-3">
                                <input
                                    id="inputBranch"
                                    type="text"
                                    class="form-control outline-none"
                                    placeholder="分支/标签名称"
                                    autofocus="autofocus"
                                    style="background: ${background};"
                                    v-model.trim="inputBranch"/>
                            </div>
                            <ul class="pl-0 mb-0" style="list-style-type:none;">
                                <li class="lif">
                                   <span @click="gitCreateBranch();" :title="'在当前工作区上创建分支, 即基于当前'+currentBranch+'分支创建'">从现有来源创建新分支</span>
                                </li>
                                <li class="lif">
                                    <span @click="gitCreatePushBranch();" :title="'在当前工作区上创建分支, 即基于当前'+currentBranch+'分支创建'">从现有来源创建新分支并push</span>
                                </li>
                                <li class="lif">
                                    <span @click="openModelBox('none');">从...创建分支</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div id="gather-local-branchs" class="row"  style="margin-top:198px;">
                    <div class="col-12 mt-2 px-0">
                        <p class="mx-3 mb-1 major-title">
                            <span @click="isShowLocalBranchList()">${BranchIcon}&nbsp;&nbsp;本地分支</span>
                            <span v-if="!isShowLocalBranch" class="is-show" @click="isShowLocalBranchList()">显示</span>
                            <span v-else class="is-show" @click="isShowLocalBranchList()">隐藏</span>
                        </p>
                        <ul class="pl-3 mb-0" style="list-style-type:none;" v-if="isShowLocalBranch">
                            <li class="lif gitfile" v-for="(item,idx) in BranchList" :key="idx"
                                :id="'branch_'+idx"
                                @mouseover="hoverStampID = 'branch_'+idx"
                                @mouseleave="hoverStampID = false">
                                <div class="d-inline">
                                    <span
                                        :style="{'color': BranchStyle(item)}"
                                        @click="switchBranch(item);"
                                        :title="'点击即可切换分支'+item.name">
                                        {{ item.current ? '*' + item.name : (item.name).replace('origin/','') }}
                                    </span>
                                </div>
                                <div id="branch_action_local" class="d-inline float-right" v-if="hoverStampID == 'branch_'+idx">
                                    <span class="ml-1"
                                        title="打标签, 创建后会自动推送到远端"
                                        @click="CreateTag();"
                                        v-if="item.current">
                                        ${TagIcon}
                                    </span>
                                    <span class="ml-1"
                                        title="从此分支上创建新分支"
                                        @click="openModelBox(item.name);">
                                        ${AddIconSvg}
                                    </span>
                                    <span
                                        class="ml-1"
                                        @click="deleteBranch(item.name);"
                                        title="强制删除本地此分支"
                                        v-if="item.name != 'master' && !item.current">
                                        ${XIcon}
                                    </span>
                                    <span
                                        class="ml-1"
                                        v-if="!(item.label).includes('origin/') && !(item.name).includes('origin/')"
                                        title="推送当前分支到远端"
                                        @click="gitPushBranchToRemote(item.name);">
                                        ${UpArrowIcon}
                                    </span>
                                    <span
                                        class="ml-1"
                                        v-if="currentBranch != item.name"
                                        :title="'合并此分支到当前 ' + currentBranch + ' 分支'"
                                        @click="gitMergeBranch(item.name);">
                                        ${MergeIcon}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div id="gather-origin-branchs" class="col-12 mt-2 px-0">
                        <p class="mx-3 mb-1 major-title">
                            <span @click="isShowOriginList();">${cloudIcon}&nbsp;&nbsp;远端(origin)分支</span>
                            <span v-if="!isShowOrigin" @click="isShowOriginList();" class="is-show">显示</span>
                            <span v-else @click="isShowOriginList();" class="is-show">隐藏</span>
                        </p>
                        <ul class="pl-3 mb-0" style="list-style-type:none;" v-if="isShowOrigin">
                            <li class="lif gitfile" v-for="(item,idx) in OriginBranchList" :key="idx"
                                :id="'origin_'+idx"
                                @mouseover="hoverStampID = 'origin_'+idx"
                                @mouseleave="hoverStampID = false">
                                <div class="d-inline">
                                    <span>{{ item.name }}</span>
                                </div>
                                <div id="branch_action_origin" class="d-inline float-right" v-if="hoverStampID == 'origin_'+idx">
                                    <span class="ml-1"
                                        title="从此分支上创建新分支"
                                        @click="openModelBox(item.name);"
                                        v-if="(item.name).includes('origin/')">
                                        ${AddIconSvg}
                                    </span>
                                    <span
                                        class="ml-1"
                                        @click="deleteBranch(item.name);"
                                        title="删除远程此分支"
                                        v-if="item.name != 'origin/master'">
                                        ${XIcon}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div id="gather-tags" class="col-12 mt-2 px-0">
                        <p class="mx-3 mb-1 major-title">
                            <span @click="isShowTagList();">${TagIcon}&nbsp;&nbsp;标签</span>
                            <span v-if="!isShowTag" @click="isShowTagList();" class="is-show">显示</span>
                            <span v-else @click="isShowTagList();" class="is-show">隐藏</span>
                        </p>
                        <ul class="pl-3 mb-0" style="list-style-type:none;" v-if="isShowTag">
                            <li class="lif gitfile" v-for="(v3,i3) in TagsList" :key="i3"
                                :id="'tag_'+i3"
                                @mouseover="hoverTagId = 'tag_'+i3"
                                @mouseleave="hoverTagId = false">
                                <span title="tag">{{ v3 }}</span>
                                <div id="tag_action" class="d-inline float-right" v-if="hoverTagId == 'tag_'+i3">
                                    <span class="ml-1"
                                        title="从此tag上签出新分支"
                                        @click="openModelBox(v3);">
                                        ${AddIconSvg}
                                    </span>
                                    <span
                                        class="ml-1"
                                        @click="getTagDetails(v3);"
                                        title="查看标签详情">
                                        ${ShowIcon}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="container-fluid" v-if="!isShowModel">
                <div class="row m-0 fixedBottom" id="git_branch">
                    <div class="col-auto mr-auto" title="鼠标左键，跳转到源代码管理器视图; 鼠标右键或中键，可直接切换到上一次分支。">
                        <span @click.left="showBranchWindow();" @click.middle="switchBranch({'name':'-', 'current':false});" @click.right.prevent="switchBranch({'name':'-', 'current':false});" class="branch">
                            ${BranchIcon} {{currentBranch}}
                        </span>
                    </div>
                    <div class="col-auto push-pull" v-if="GitAssociationRemote">
                        <div class="ml-2" @click="gitFetch();" title="git fetch --all">
                            ${SyncIcon}
                        </div>
                    </div>
                    <div class="col-auto push-pull" v-else>
                        <div :title="projectName + '(git) - 发布更改'" @click="publish();">
                            ${uploadIcon}
                        </div>
                    </div>
                </div>
            </div>
            <div class="container-fluid" id="is-model" v-if="isShowModel">
                <div class="row mt-3">
                    <div class="col">
                        <form>
                          <div class="form-group">
                            <label for="newBranchName">新的分支名称</label>
                            <input
                                id="newBranchName"
                                type="text"
                                class="form-control outline-none"
                                autofocus="autofocus"
                                placeholder="新的分支名称"
                                style="height: 30px !important;background: ${background};"
                                v-model.trim="fromToCreate.newBranchName" />
                          </div>
                          <div class="form-group">
                            <label for="ref">选择 ref 以便创建新分支</label>
                            <input
                                type="text"
                                class="form-control outline-none"
                                id="ref"
                                style="height: 30px !important;background: ${background};"
                                placeholder="commitID或其它分支名称，如origin/master"
                                :disabled="inputDisabled"
                                v-model.trim="fromToCreate.ref" />
                          </div>
                          <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="isPush" v-model='fromToCreate.isPush'>
                            <label class="form-check-label" for="isPush">推送</label>
                          </div>
                          <div class="mt-3">
                            <button type="submit" class="btnd" @click="gitCreateBranchFromRef();">创建</button>
                            <button type="submit" class="btnd" @click='isShowModel=false'>关闭</button>
                          </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <script>
            var app = new Vue({
                el: '#app',
                data: {
                    refreshProgress: true,
                    projectName: '',
                    currentBranch: '',
                    ahead: '',
                    behind: '',
                    tracking: '',
                    originurl: '',
                    originurlBoolean: '',
                    isShowModel: false,
                    inputBranch: '',
                    isShowLocalBranch: true,
                    isShowOrigin: false,
                    rawOriginBranchList: [],
                    OriginBranchList: [],
                    isShowTag: false,
                    rawBranchList: [],
                    BranchList: [],
                    rawTagsList: [],
                    TagsList: [],
                    fromToCreate: {
                        newBranchName: '',
                        ref: '',
                        isPush: true
                    },
                    AssignAction: {},
                    inputDisabled: false,
                    hoverStampID: false,
                    hoverTagId: false
                },
                computed:{
                    BranchStyle(){
                        return function (v) {
                            if (v.current) {
                                return '#339933';
                            } else if (v.name.includes('remote')) {
                                return '#cc3300';
                            } else {
                                return '${fontColor}';
                            }
                        }
                    },
                    ProjectWidth() {
                        let width = '150';
                        return document.body.clientWidth <= 300 ? width : document.body.clientWidth - width;
                    },
                    GitAssociationRemote() {
                        return this.originurlBoolean
                    }
                },
                watch: {
                    inputBranch: function (newv, oldv) {
                        if ((this.inputBranch).replace(/(^\s*)|(\s*$)/g,"") == '') {
                            this.BranchList = this.rawBranchList;
                            return;
                        };
                        let raw = [ ...this.rawBranchList ];
                        let tmp = raw.filter( item => {
                            let name = item.name;
                            return name.includes(this.inputBranch) || item.current;
                        });
                        this.BranchList = tmp;
                    }
                },
                created() {
                    this.ahead = '${ahead}';
                    this.behind = '${behind}';
                    this.projectName = '${projectName}';
                    this.currentBranch = '${currentBranch}';
                    this.AssignAction = ${GitAssignAction};
                    this.tracking = '${tracking}';
                    this.originurl = '${originurl}';
                    this.originurlBoolean = ${originurlBoolean};

                    this.rawBranchList = ${branchs};
                    this.BranchList = ${branchs};

                    this.rawOriginBranchList = ${remoteBranchList};
                    this.OriginBranchList = ${remoteBranchList};
                },
                mounted() {
                    if (this.AssignAction && JSON.stringify(this.AssignAction) != '{}') {
                        let {name,value} = this.AssignAction;
                        if (name == 'create-branch') {
                            this.isShowModel = true;
                            if (value != undefined && value) {
                                this.fromToCreate.ref = value;
                                document.getElementById('newBranchName').focus();
                            };
                        };
                    };
                    document.getElementById('inputBranch').focus();

                    let that = this;
                    setTimeout(function() {
                        that.refreshProgress = false;
                    },2000);

                    window.onload = function() {
                        setTimeout(function(){
                            that.getTagsList();
                            that.receiveInfo();
                        }, 1500);
                    };
                },
                methods: {
                    receiveInfo() {
                        hbuilderx.onDidReceiveMessage((msg) => {
                            if (msg.command == 'animation') {
                                this.refreshProgress = true;
                                let that = this;
                                setTimeout(function() {
                                    that.refreshProgress = false;
                                }, 1000);
                            };
                            if (msg.command == 'refresh') {
                                if (msg.gitBranchData) {
                                    let data = msg.gitBranchData;
                                    this.rawBranchList = data.localBranchList;
                                    this.BranchList = data.localBranchList;

                                    this.rawOriginBranchList = data.remoteBranchList;
                                    this.OriginBranchList = data.remoteBranchList;

                                    this.ahead = data.ahead;
                                    this.behind = data.behind;
                                    this.currentBranch = data.currentBranch;
                                    this.AssignAction = data.AssignAction;
                                    this.tracking = data.tracking;
                                    this.originurl = data.originurl;
                                };
                            };
                            if (msg.command == 'TagList') {
                                if (msg.data) {
                                    this.rawTagsList = msg.data;
                                    this.TagsList = msg.data;
                                };
                            };
                        });
                    },
                    back() {
                        hbuilderx.postMessage({
                            command: 'back'
                        });
                    },
                    getTagsList() {
                        hbuilderx.postMessage({
                            command: 'TagList'
                        });
                    },
                    showBranchWindow() {
                        hbuilderx.postMessage({
                            command: 'BranchInfo',
                            text: 'file'
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
                    gitPull(options) {
                        let req = {command: 'pull',text: 'file'};
                        if (options == 'rebase') {
                            req.rebase = true
                        };
                        hbuilderx.postMessage(req);
                    },
                    gitFetch() {
                        hbuilderx.postMessage({
                            command: 'fetch',
                            text: 'branch'
                        });
                    },
                    gitCreateBranch() {
                        hbuilderx.postMessage({
                            command: 'BranchCreate',
                            newBranchName: this.inputBranch
                        });
                    },
                    openModelBox(source) {
                        this.isShowModel = true;
                        if (source != 'none') {
                            this.fromToCreate.ref = source;
                            this.inputDisabled = true;
                        };
                    },
                    gitCreateBranchFromRef() {
                        let {newBranchName,ref,isPush} = this.fromToCreate;
                        hbuilderx.postMessage({
                            command: 'BranchCreate',
                            newBranchName: newBranchName,
                            ref: ref,
                            isPush: isPush
                        });
                    },
                    switchBranch(branch) {
                        hbuilderx.postMessage({
                            command: 'BranchSwitch',
                            text: branch
                        });
                    },
                    deleteBranch(branchName) {
                        hbuilderx.postMessage({
                            command: 'BranchDelete',
                            text: branchName
                        });
                    },
                    gitPushBranchToRemote(branchName) {
                        hbuilderx.postMessage({
                            command: 'pushBranchToRemote',
                            text: branchName
                        });
                    },
                    gitCreatePushBranch() {
                        hbuilderx.postMessage({
                            command: 'BranchCreatePush',
                            text: this.inputBranch
                        });
                    },
                    gitMergeBranch(select) {
                        hbuilderx.postMessage({
                            command: 'BranchMerge',
                            from: select,
                            to: this.currentBranch
                        });
                    },
                    isShowLocalBranchList() {
                        if (this.isShowLocalBranch) {
                            this.isShowLocalBranch = false;
                        } else {
                            this.isShowLocalBranch = true;
                        }
                    },
                    isShowOriginList() {
                        if (this.isShowOrigin) {
                            this.isShowOrigin = false;
                        } else {
                            this.isShowOrigin = true;
                        }
                    },
                    isShowTagList() {
                        if (this.isShowTag) {
                            this.isShowTag = false;
                        } else {
                            this.isShowTag = true;
                        }
                    },
                    CreateTag() {
                        hbuilderx.postMessage({
                            command: 'CreateTag',
                            text: this.inputBranch
                        });
                    },
                    getTagDetails(tagName) {
                        hbuilderx.postMessage({
                            command: 'TagDetails',
                            name: tagName
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


module.exports = getWebviewBranchContent;
