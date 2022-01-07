const hx = require('hbuilderx');

const path = require('path');

const vueFile = path.join(path.resolve(__dirname, '..'), 'static', '','vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'bootstrap.min.css');
const inputCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'input.css');
const branchCssFile = path.join(path.resolve(__dirname, '..'), 'static', 'branch.css');


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
        lefeSideVeiwBackground,
        liHoverBackground,
        inputColor,
        inputLineColor,
        inputBgColor,
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
        ShowIcon,
        CommandPanelIcon
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
        <link rel="stylesheet" href="${inputCssFile}">
        <script src="${vueFile}"></script>
        <style type="text/css">
            :root {
                --background:${lefeSideVeiwBackground};
                --liHoverBackground:${liHoverBackground};
                --inputColor:${inputColor};
                --inputLineColor:${inputLineColor};
                --inputBgColor:${inputBgColor};
                --cursorColor:${cursorColor};
                --fontColor:${fontColor};
                --lineColor:${lineColor};
            }
        </style>
        <link rel="stylesheet" href="${branchCssFile}">
    </head>
    <body>
        <div id="app" v-cloak>
            <div class="container-fluid pb-5" v-if="!isShowModel">
                <div id="page-top" class="fixed-top">
                    <div id="refresh-progress" v-show="refreshProgress"></div>
                    <div class="row px-3 pt-3">
                        <div class="col-auto mr-auto project-name" :title="projectName">
                            <span class="top">{{ projectName }}</span>
                        </div>
                        <div class="col-auto pl-0">
                            <span class="top" @click="openCommandPanel();" title="打开命令面板">${CommandPanelIcon}</span>
                            <span class="top" @click="back();" title="跳转到源代码管理器">${BackIcon}</span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col mt-3">
                            <div class="input-group mb-3 px-3">
                                <input
                                    id="inputBranch"
                                    type="text"
                                    class="form-control form-control-bg outline-none"
                                    :placeholder="inputBranchPlaceholder"
                                    autofocus="autofocus"
                                    v-model.trim="inputBranch"
                                    ref="BranchInput" />
                            </div>
                            <ul class="pl-0 mb-0" style="list-style-type:none;">
                                <li class="lif cursor-default" @click="gitCreateBranchForExecuteCommand(currentBranch, 'current');">
                                   <span :title="'在当前工作区上创建分支, 即基于当前'+currentBranch+'分支创建'">从现有来源创建新分支</span>
                                </li>
                                <li class="lif cursor-default" @click="gitCreateBranchForExecuteCommand(undefined);">
                                    <span>从...创建分支</span>
                                </li>
                                <li class="lif cursor-default" @click="gitDiffBranch();">
                                    <span>分支对比</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div id="gather-local-branchs" class="row"  style="margin-top:198px;">
                    <div class="col-12 mt-2 px-0">
                        <p class="mx-3 mb-1 major-title cursor-default">
                            <span @click="isShowLocalBranchList()">
                                ${BranchIcon}&nbsp;&nbsp;本地分支
                                <span class="count-num" v-show="BranchList.length != 0">{{ BranchList.length }}</span>
                            </span>
                            <span v-if="!isShowLocalBranch" class="is-show" @click="isShowLocalBranchList()">显示</span>
                            <span v-else class="is-show" @click="isShowLocalBranchList()">隐藏</span>
                        </p>
                        <ul class="pl-3 mb-0" style="list-style-type:none;" v-if="isShowLocalBranch">
                            <li class="lif gitfile" v-for="(item,idx) in BranchList" :key="idx"
                                :id="'branch_'+idx"
                                @mouseover="hoverStampID = 'branch_'+idx"
                                @mouseleave="hoverStampID = false">
                                <div class="d-inline cursor-default">
                                    <span
                                        :style="{'color': BranchStyle(item)}"
                                        @click="switchBranch(item);"
                                        :title="'点击即可切换分支'+item.name">
                                        {{ item.current ? '*' + item.name : (item.name).replace('origin/','') }}
                                    </span>
                                </div>
                                <div id="branch_action_local" class="d-inline float-right cursor-default" v-if="hoverStampID == 'branch_'+idx">
                                    <span class="ml-1"
                                        title="打标签, 创建后会自动推送到远端"
                                        @click="CreateTag();"
                                        v-if="item.current">
                                        ${TagIcon}
                                    </span>
                                    <span class="ml-1"
                                        title="从此分支上创建新分支"
                                        @click="gitCreateBranchForExecuteCommand(item.name);">
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
                                    <span
                                        class="ml-1"
                                        v-if="currentBranch == item.name"
                                        title="选择分支进行合并"
                                        @click="gitOpenMergeBranch();">
                                        ${MergeIcon}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div id="gather-origin-branchs" class="col-12 mt-2 px-0">
                        <p class="mx-3 mb-1 major-title cursor-default">
                            <span @click="isShowOriginList();">
                                ${cloudIcon}&nbsp;&nbsp;远端(origin)分支
                                <span class="count-num" v-show="OriginBranchList.length != 0">{{ OriginBranchList.length }}</span>
                            </span>
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
                                        @click="gitCreateBranchForExecuteCommand(item.name);"
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
                                    <span
                                        class="ml-1"
                                        v-if="currentBranch != (item.name).split('/')[1]"
                                        :title="'合并此分支到当前 ' + currentBranch + ' 分支'"
                                        @click="gitMergeBranch(item.name);">
                                        ${MergeIcon}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div id="gather-tags" class="col-12 mt-2 px-0">
                        <p class="mx-3 mb-1 major-title cursor-default">
                            <span @click="isShowTagList();">
                                ${TagIcon}&nbsp;&nbsp;标签
                                <span class="count-num" v-show="TagsList.length != 0">{{ TagsList.length }}</span>
                            </span>
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
                                        @click="gitCreateBranchForExecuteCommand(v3);">
                                        ${AddIconSvg}
                                    </span>
                                    <span
                                        class="ml-1"
                                        @click="TagDelete(v3);"
                                        title="删除此tag">
                                        ${XIcon}
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
            <div id="page-bottom" class="container-fluid" v-if="!isShowModel">
                <div class="row m-0 fixedBottom" id="git_branch">
                    <div class="col-auto mr-auto cursor-default" title="鼠标左键，跳转到源代码管理器视图; 鼠标右键或中键，可直接切换到上一次分支。">
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
                    inputBranchPlaceholder: '分支名称',
                    isShowLocalBranch: true,
                    isShowOrigin: false,
                    rawOriginBranchList: [],
                    OriginBranchList: [],
                    isShowTag: false,
                    rawBranchList: [],
                    BranchList: [],
                    rawTagsList: [],
                    TagsList: [],
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

                    document.getElementById('inputBranch').focus();
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
                            if (msg.command == 'themeColor') {
                                let themedata = msg.data;
                                let colors = Object.keys(themedata);
                                for (let i of colors) {
                                    document.documentElement.style.setProperty('--' + i, themedata[i]);
                                };
                            };
                            if (msg.command == 'reLoding') {
                                this.isShowModel = false;
                                if (msg.data) {
                                    let data = msg.data;
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
                    gitCreateBranchForExecuteCommand(refName, action='ref') {
                        hbuilderx.postMessage({
                            command: 'BranchCreateForExecuteCommand',
                            action: action,
                            refName: refName
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
                    gitDiffBranch() {
                        hbuilderx.postMessage({
                            command: 'BranchDiff'
                        });
                    },
                    gitMergeBranch(select) {
                        hbuilderx.postMessage({
                            command: 'BranchMerge',
                            from: select,
                            to: this.currentBranch
                        });
                    },
                    gitOpenMergeBranch() {
                        hbuilderx.postMessage({
                            command: 'openBranchMerge'
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
                    TagDelete(tagName) {
                        hbuilderx.postMessage({
                            command: 'TagDelete',
                            name: tagName
                        });
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


module.exports = getWebviewBranchContent;
