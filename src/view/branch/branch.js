const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');

let utils = require('../../common/utils.js');
const gitAction = require('../../git.js');

const icon = require('../static/icon.js');
const getWebviewBranchContent = require('./html.js')


/**
 * @description 获取图标、各种颜色
 * @return {Object} UIData
 */
function getUIData() {

    // 根据主题适配颜色
    let colorData = utils.getThemeColor('siderBar');
    let {fontColor} = colorData;

    // svg icon
    let CancelIconSvg = icon.getDelIcon(fontColor);
    let OpenFileIconSvg = icon.getOpenFileIcon(fontColor);
    let AddIconSvg = icon.getAddIcon(fontColor);
    let AddAllIcon = icon.getAddAllIcon(fontColor);
    let checkoutIconSvg = icon.getCheckoutIcon(fontColor);
    let iconRefresh = icon.getRefreshIcon(fontColor);
    let CheckMarkIcon = icon.getCheckMarkIcon(fontColor);
    let UpArrowIcon = icon.getUpArrowIcon(fontColor);
    let UpArrowIcon2 = icon.getUpArrowIcon2(fontColor);
    let BackIcon = icon.getBackIcon(fontColor);
    let DownArrowIcon = icon.getDownArrowIcon(fontColor);
    let BranchIcon = icon.getBranchIcon(fontColor);
    let XIcon = icon.getXIcon(fontColor);
    let SyncIcon = icon.getSyncIcon(fontColor);
    let MergeIcon = icon.getMergeIcon(fontColor);
    let TagIcon = icon.getTagIcon(fontColor);
    let MenuIcon = icon.getMenuIcon(fontColor);
    let HistoryIcon = icon.getHistoryIcon(fontColor);
    let uploadIcon = icon.getUploadIcon(fontColor);

    let iconData = {
        CancelIconSvg,
        OpenFileIconSvg,
        AddIconSvg,
        AddAllIcon,
        checkoutIconSvg,
        iconRefresh,
        CheckMarkIcon,
        UpArrowIcon,
        UpArrowIcon2,
        BackIcon,
        DownArrowIcon,
        BranchIcon,
        XIcon,
        SyncIcon,
        MergeIcon,
        TagIcon,
        MenuIcon,
        HistoryIcon,
        uploadIcon
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
    }

    async LoadingBranchData() {
        let BranchInfo = await utils.gitBranch(this.projectPath);
        let StatusInfo = await utils.gitStatus(this.projectPath);
        let TagsList = await utils.gitTagsList(this.projectPath);

        let {GitAssignAction} = this.initData;

        const gitBranchData = Object.assign({
            'BranchInfo': BranchInfo
        }, {
            'TagsList': TagsList
        }, {
            'projectName': this.projectName,
            'projectPath': this.projectPath,
            'GitAssignAction': GitAssignAction,
            'ahead': StatusInfo.ahead,
            'behind': StatusInfo.behind,
            'tracking': StatusInfo.tracking,
            'originurl': StatusInfo.originurl
        });
        const bhtml = getWebviewBranchContent(this.userConfig, this.uiData, gitBranchData);
        this.webviewPanel.webView.html = bhtml;
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
            this.LoadingBranchData();
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
                this.LoadingBranchData();
            };
        } else {
            let breachCreateStatus = await utils.gitBranchCreate(data);
            if (breachCreateStatus == 'success') {
                this.LoadingBranchData();
            };
        };
    };

    // Git branch: create and push
    async FromCurrentBranchCreatePush(branchName) {
        if (branchName == '') {
            return hx.window.showErrorMessage('Git: 在输入框输入分支名称后，再点击创建。',['关闭']);
        };
        let cpStatus = await utils.gitBranchCreatePush(this.projectPath,branchName);
        if (cpStatus == 'success') {
            this.LoadingBranchData();
        };
    };

    // Git branch: push local branch to remote
    async LocalToRemote(branchName) {
        let toStatus = await utils.gitLocalBranchToRemote(this.projectPath,branchName);
        if (toStatus == 'success') {
            this.LoadingBranchData();
        };
    };

    // Git branch: merge
    async merge(fromBranch,toBranch) {
        let mergeStatus = await utils.gitBranchMerge(this.projectPath,fromBranch,toBranch);
        if (mergeStatus == 'success') {
            this.refreshFileList();
        };
    };

    // Git branch: delete
    async delete(branchName) {
        let delMsg = `Git: 确认删除 ${branchName} 分支?`;
        let btn = await hx.window.showInformationMessage(delMsg, ['删除','关闭']).then((result) =>{
            return result;
        });
        if (btn == '关闭') {
            return;
        };
        if (branchName.includes('remotes/origin')) {
            let delStatus1 = await utils.gitDeleteRemoteBranch(this.projectPath,branchName);
            if (delStatus1 == 'success') {
                this.LoadingBranchData();
            };
        } else {
            let delStatus2 = await utils.gitDeleteLocalBranch(this.projectPath,branchName);
            if (delStatus2 == 'success') {
                this.LoadingBranchData();
            };
        };
    };

    // Git tag: create
    async TagCreate(tagName) {
        if (tagName.length == 0) {
            return hx.window.showErrorMessage('tag名称无效，请重新输入。',['关闭']);
        };
        let tagCreateStatus = await utils.gitTagCreate(this.projectPath, [tagName], tagName);
        if (tagCreateStatus == 'success') {
            this.LoadingBranchData();
        };
    };
};


/**
 * @description 显示webview
 * @param {Object} userConfig 用户配置
 * @param {Object} webviewPanel
 * @param {Object} gitData
 */
function GitBranchView(webviewPanel, userConfig, gitData) {
    const view = webviewPanel.webView;

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
    Branch.LoadingBranchData();

    view.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'back':
                hx.commands.executeCommand('EasyGit.main',currentProjectData);
                break;
            case 'push':
                push(projectPath);
                break;
            case 'publish':
                goPublish(projectPath, msg);
                break;
            case 'pull':
                pull(projectPath,msg);
                break;
            case 'fetch':
                fetch(projectPath,msg.text);
                break;
            case 'BranchInfo':
                if (msg.text == 'branch') {
                    if (originurl == undefined) {
                        hx.window.showErrorMessage('请发布此项目到远程到后再进行操作。', ['我知道了']);
                    } else {
                        Branch.LoadingBranchData();
                    };
                } else {
                    hx.commands.executeCommand('EasyGit.main',currentProjectData);
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
            default:
                break;
        };
    });


    // git push
    async function push(projectPath) {
        let pushStatus = await utils.gitPush(projectPath);
        if (pushStatus == 'success') {
            File.refreshFileList();
        };
    };

    // git publish
    async function goPublish(projectName, msg) {
        let branchName = msg.text;
        let pushStatus = await utils.gitPush(projectPath,[]);
        if (pushStatus == 'success') {
            File.refreshFileList();
        };
    };

    // git pull
    async function pull(projectPath, msg) {
        let {text,rebase} = msg;
        let options = Object.assign(msg);
        let pullStatus = await utils.gitPull(projectPath,options);
        if (pullStatus == 'success') {
            if (text == 'file') {
                File.refreshFileList();
            } else {
                Branch.LoadingBranchData();
            };
        };
    };

    // git fetch
    async function fetch(projectPath, source) {
        let fetchStatus = await utils.gitFetch(projectPath);
        if (fetchStatus == 'success') {
            if (source == 'file') {
                File.refreshFileList();
            } else {
                Branch.LoadingBranchData();
            };
        };
    };

};


module.exports = GitBranchView;
