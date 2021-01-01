const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');

let utils = require('../../common/utils.js');
const debounce = require('../../common/debounce.js');
const { Branch } = require('../../commands/ref.js');

const icon = require('../static/icon.js');
const getWebviewBranchContent = require('./html.js')

// Git触发途径：HBuilderX内触发、外部Git命令（或其它工具）触发
let GitHBuilderXInnerTrigger = false;

/**
 * @description 获取图标、各种颜色
 * @return {Object} UIData
 */
function getUIData() {

    // 根据主题适配颜色
    let colorData = utils.getThemeColor('siderBar');
    let {fontColor} = colorData;

    // svg icon
    let AddIconSvg = icon.getAddIcon(fontColor);
    let iconRefresh = icon.getRefreshIcon(fontColor);
    let UpArrowIcon = icon.getUpArrowIcon(fontColor);
    let UpArrowIcon2 = icon.getUpArrowIcon2(fontColor);
    let BackIcon = icon.getBackIcon(fontColor);
    let DownArrowIcon = icon.getDownArrowIcon(fontColor);
    let BranchIcon = icon.getBranchIcon(fontColor);
    let XIcon = icon.getXIcon(fontColor);
    let SyncIcon = icon.getSyncIcon(fontColor);
    let MergeIcon = icon.getMergeIcon(fontColor);
    let TagIcon = icon.getTagIcon(fontColor);
    let uploadIcon = icon.getUploadIcon(fontColor);
    let cloudIcon = icon.getCloudIcon(fontColor);
    let ShowIcon = icon.getShowIcon(fontColor);

    let iconData = {
        AddIconSvg,
        iconRefresh,
        UpArrowIcon,
        UpArrowIcon2,
        BackIcon,
        DownArrowIcon,
        BranchIcon,
        XIcon,
        SyncIcon,
        MergeIcon,
        TagIcon,
        uploadIcon,
        cloudIcon,
        ShowIcon
    };

    let uiData = Object.assign(iconData,colorData);
    return uiData;
};


/**
 * @description Git分支
 */
class GitBranch {
    constructor(webviewPanel, ProjectGitInfo, uiData, userConfig) {
        this.initData = ProjectGitInfo;
        this.webviewPanel = webviewPanel;
        this.projectPath = ProjectGitInfo.projectPath;
        this.projectName = ProjectGitInfo.projectName;
        this.uiData = uiData;
        this.userConfig = userConfig;
        this.firstInit = true;
    }

    /**
     * @description 加载分支视图
     */
    async LoadingBranchView() {
        if (this.webviewPanel) {
            this.webviewPanel.webView.postMessage({
                command: "animation"
            });
        };

        let {localBranchList, remoteBranchList} = await utils.gitBranch(this.projectPath, ['-avvv']);

        let {GitAssignAction, behind, ahead, tracking, originurl} = this.initData;
        if (!this.firstInit) {
            let gitInfo = await utils.gitStatus(this.projectPath, false);
            behind = gitInfo.behind;
            ahead = gitInfo.ahead;
            tracking = gitInfo.tracking;
            originurl = gitInfo.originurl;
        };

        if (behind == undefined) { behind = 0 };
        if (ahead == undefined) { ahead = 0 };

        let currentBranch = '';
        for (let s of localBranchList) {
            if (s.current) {
                currentBranch = s.name;
                break;
            };
        };

        // 大部分情况下，并不需要tag，因此等到视图页面渲染后，再获取tags -> TagList
        let gitBranchData = Object.assign({
            'localBranchList': localBranchList,
            'remoteBranchList': remoteBranchList,
            'TagsList': {'data':[]}
        }, {
            'projectName': this.projectName,
            'projectPath': this.projectPath,
            'GitAssignAction': GitAssignAction,
            'ahead': ahead,
            'behind': behind,
            'tracking': tracking,
            'originurl': originurl,
            'currentBranch': currentBranch
        });
        
        // 2021-01-01 部分操作无法刷新或刷新数据出错
        // if (this.webviewPanel && this.firstInit == false) {
        //     this.webviewPanel.webView.postMessage({
        //         command: "refresh",
        //         gitBranchData: gitBranchData
        //     });
        // };

        let bhtml = getWebviewBranchContent(this.userConfig, this.uiData, gitBranchData);
        this.webviewPanel.webView.html = bhtml;
        this.firstInit = false;
    };

    // Git branch: switch
    async switch(branchInfo) {
        let {name,current} = branchInfo;
        if (current) {
            return;
        };
        if (name.includes('remote')) {
            return hx.window.setStatusBarMessage('请勿在远程分支上操作');
        };
        let switchStatus = await utils.gitBranchSwitch(this.projectPath,name);
        if (switchStatus == 'success') {
            this.LoadingBranchView();
        };
    };

    // Git branch: create
    async create(info) {
        let { newBranchName, ref } = info;
        let data = Object.assign(
            { 'projectPath': this.projectPath }, info
        );
        if (newBranchName == '') {
            return hx.window.showErrorMessage('Git: 在输入框输入分支名称后，再点击创建。',['关闭']);
        };
        if (ref == undefined) {
            let breachCreateStatus = await utils.gitBranchCreate(data);
            if (breachCreateStatus == 'success') {
                this.LoadingBranchView();
            };
        } else {
            let breachCreateStatus = await utils.gitBranchCreate(data);
            if (breachCreateStatus == 'success') {
                this.LoadingBranchView();
            };
        };
    };

    // Git branch: 从当前分支分支直接创建新分支，并推送
    async FromCurrentBranchCreatePush(branchName) {
        if (branchName == '') {
            return hx.window.showErrorMessage('Git: 在输入框输入分支名称后，再点击创建。',['关闭']);
        };
        let cpStatus = await utils.gitBranchCreatePush(this.projectPath,branchName);
        if (cpStatus == 'success') {
            this.LoadingBranchView();
        };
    };

    // Git branch: 推送本地的分支到远端
    async LocalToRemote(branchName) {
        let toStatus = await utils.gitLocalBranchToRemote(this.projectPath,branchName);
        if (toStatus == 'success') {
            this.LoadingBranchView();
        };
    };

    // Git branch: merge
    async merge(fromBranch,toBranch) {
        let param = {
            'projectPath': this.projectPath,
            'projectName': this.projectName,
            'easyGitInner': true
        };
        let mergeStatus = await utils.gitBranchMerge(this.projectPath, fromBranch, toBranch);
        hx.commands.executeCommand('EasyGit.main', param);
        if (mergeStatus != undefined) {
            let that = this;
            setTimeout(function() {
                let msg = `${toBranch} 合并 ${fromBranch} 分支成功，请选择接下来的操作？`;
                let btns = ['稍后推送', '立即推送'];
                if (mergeStatus == 'conflicts') {
                    msg = `${toBranch} 合并 ${fromBranch} 分支，部分文件存在冲突，请选择接下来的操作？`;
                    btns = ['关闭', '取消合并', '去解决冲突']
                };
                if (mergeStatus == 'fail') {
                    msg = `${toBranch} 合并 ${fromBranch} 分支，合并失败，请解决错误后，再次进行合并。\n 错误信息，请查看控制台。`;
                    btns = ['好的', '关闭']
                };

                utils.hxShowMessageBox('Git 分支合并', msg, btns).then(btnText => {
                    if (btnText == '取消合并') {
                        hx.commands.executeCommand('EasyGit.mergeAbort', param);
                    };
                    if (btnText == '立即推送') {
                        hx.commands.executeCommand('EasyGit.push', param);
                        setTimeout(function() {
                            hx.commands.executeCommand('EasyGit.main', param);
                        }, 1200);
                    };
                });
            }, 1000);
        };
    };

    // Git branch: delete
    async delete(branchName) {
        let title = branchName.includes('origin/') ? 'Git: 远程分支删除' :  'Git: 本地分支删除';
        let delMsg = `确定要删除 ${branchName} 分支?`;
        let btn = await utils.hxShowMessageBox(title, delMsg, ['删除','关闭']).then((result) =>{
            return result;
        });
        if (btn == '关闭') {
            return;
        };
        if (branchName.includes('origin/')) {
            let delStatus1 = await utils.gitDeleteRemoteBranch(this.projectPath,branchName);
            if (delStatus1 == 'success') {
                this.LoadingBranchView();
            };
        } else {
            let delStatus2 = await utils.gitDeleteLocalBranch(this.projectPath,branchName);
            if (delStatus2 == 'success') {
                this.LoadingBranchView();
            };
        };
    };

    // Git tag: list
    async TagList() {
        let TagsList = await utils.gitTagsList(this.projectPath);
        let { error, data } = TagsList;
        if (error) {
            return;
        };
        this.webviewPanel.webView.postMessage({
            command: "TagList",
            data: data
        });
    }

    // Git tag: create
    async TagCreate() {
        let param = {
            "hash": null,
            "projectPath": this.projectPath,
            "projectName": this.projectName,
            "easyGitInner": true
        };
        hx.commands.executeCommand('EasyGit.tagCreate', param);
    };

    // Git tag: Detail
    async TagDetails(tagName) {
        let param = {
            "tagName": tagName,
            "projectPath": this.projectPath,
            "projectName": this.projectName,
            "easyGitInner": true
        };
        hx.commands.executeCommand('EasyGit.tagDetails', param);
    }
};


/**
 * @description 监听Git目录变化
 */
let watcherListen;
let watchProjectPath;
function watchProjectDir(projectDir, func) {
    const watchOpt = {
        persistent: true,
        recursive: true
    };
    try {
        let dir = path.join(projectDir, '.git');
        watcherListen = fs.watch(dir, watchOpt, (eventType, filename) => {
            if (filename == 'index.lock') return;
            if (GitHBuilderXInnerTrigger == false) {
                if (eventType && (['FETCH_HEAD', 'HEAD','ORIG_HEAD'].includes(filename) || filename.includes('refs/tags'))) {
                    debounce(func.LoadingBranchView(), 1000);
                };
            };
        });
    } catch (e) {};
};


/**
 * @description 显示webview
 * @param {Object} userConfig 用户配置
 * @param {Object} webviewPanel
 * @param {Object} gitData
 */
function GitBranchView(webviewPanel, userConfig, gitData) {
    const view = webviewPanel.webView;
    hx.window.showView({
        viewid: 'EasyGitSourceCodeView',
        containerid: 'EasyGitSourceCodeView'
    });

    // get project info , and git info
    const { projectPath, projectName, currentBranch, originurl } = gitData;

    let currentProjectData = {
        'projectPath': projectPath,
        'projectName': projectName,
        'easyGitInner': true
    };

    // UI: color and svg icon
    let uiData = getUIData();

    // Git: 分支
    let {...ProjectGitInfo} = gitData;
    let Branch = new GitBranch(webviewPanel, ProjectGitInfo, uiData, userConfig);
    Branch.LoadingBranchView();

    // 记录监听的项目路径，解决项目切换问题
    if (watchProjectPath != undefined && watchProjectPath != projectPath) {
        watcherListen.close();
        watcherListen = undefined;
    };
    watchProjectPath = projectPath;

    // 监听Git目录
    watchProjectDir(projectPath, Branch);

    view.onDidReceiveMessage((msg) => {
        GitHBuilderXInnerTrigger = true;
        let action = msg.command;
        switch (action) {
            case 'back':
                hx.commands.executeCommand('EasyGit.main',currentProjectData);
                if (watcherListen != undefined) {
                    watcherListen.close();
                };
                break;
            case 'publish':
                goPublish(projectPath, msg);
                break;
            case 'fetch':
                fetch(projectPath,msg.text);
                break;
            case 'BranchInfo':
                if (msg.text == 'branch') {
                    if (originurl == undefined) {
                        hx.window.showErrorMessage('请发布此项目到远程到后再进行操作。', ['我知道了']);
                    } else {
                        Branch.LoadingBranchView();
                    };
                } else {
                    hx.commands.executeCommand('EasyGit.main',currentProjectData);
                    if (watcherListen != undefined) {
                        watcherListen.close();
                    };
                };
                break;
            case 'BranchSwitch':
                Branch.switch(msg.text);
                break;
            case 'BranchCreate':
                Branch.create(msg);
                break;
            case 'pushBranchToRemote':
                Branch.LocalToRemote(msg.text);
                break;
            case 'BranchCreatePush':
                Branch.FromCurrentBranchCreatePush(msg.text);
                break;
            case 'BranchMerge':
                Branch.merge(msg.from,msg.to);
                break;
            case 'BranchDelete':
                let branch = msg.text;
                Branch.delete(branch);
                break;
            case 'CreateTag':
                Branch.TagCreate(msg.text);
                break;
            case 'TagDetails':
                Branch.TagDetails(msg.name);
                break;
            case 'TagList':
                Branch.TagList();
                break;
            default:
                break;
        };
        setTimeout(function() {
            GitHBuilderXInnerTrigger = false;
        }, 2000);
    });

    // git publish
    async function goPublish(projectPath, msg) {
        let branchName = msg.text;
        let pushStatus = await utils.gitAddRemoteOrigin(projectPath, branchName);
        if (pushStatus == 'success') {
            Branch.LoadingBranchView();
        };
    };

    // git fetch
    async function fetch(projectPath, source) {
        let fetchStatus = await utils.gitFetch(projectPath);
        if (fetchStatus == 'success') {
            Branch.LoadingBranchView();
        };
    };

};


module.exports = GitBranchView;
