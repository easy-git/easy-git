const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');

const file = require('../file.js');
let utils = require('../utils.js');
const gitAction = require('../git.js');

const icon = require('./static.js');
const html = require('./mainHtml.js')


/**
 * @description 获取图标、各种颜色
 * @return {Object} UIData
 */
function getUIData() {

    // 根据主题适配颜色
    let colorData = utils.getThemeColor();
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
 * @description  set .gitignore and .gitattributes
 * @param {Object} filename
 */
function gitConfigFileSetting(projectPath, filename) {
    let data = {
        "projectPath": projectPath
    };
    if (filename == '.gitignore') {
        file.gitignore(data);
    };
    if (filename == '.gitattributes') {
        file.gitattributes(data);
    }
};


/**
 * @description Git分支
 */
class GitBranch {
    constructor(webviewPanel, projectPath, projectName, uiData, userConfig) {
        this.webviewPanel = webviewPanel;
        this.projectPath = projectPath;
        this.projectName = projectName;
        this.uiData = uiData;
        this.userConfig = userConfig;
    }

    async LoadingBranchData() {
        let BranchInfo = await utils.gitBranch(this.projectPath);
        let StatusInfo = await utils.gitStatus(this.projectPath);
        let TagsList = await utils.gitTagsList(this.projectPath);

        const gitData = Object.assign({
            'BranchInfo': BranchInfo
        }, {
            'TagsList': TagsList
        }, {
            'projectName': this.projectName,
            'projectPath': this.projectPath,
            'ahead': StatusInfo.ahead,
            'behind': StatusInfo.behind,
            'tracking': StatusInfo.tracking,
            'originurl': StatusInfo.originurl
        });
        const bhtml = html.getWebviewBranchContent(this.userConfig, this.uiData, gitData);
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
        let tagCreateStatus = await utils.gitTagCreate(this.projectPath, tagName);
        if (tagCreateStatus == 'success') {
            this.LoadingBranchData();
        };
    };
};


/**
 * @description Git文件
 */
class GitFile {
    constructor(webviewPanel, projectPath, projectName, uiData, userConfig) {
        this.webviewPanel = webviewPanel;
        this.projectPath = projectPath;
        this.projectName = projectName;
        this.uiData = uiData;
        this.userConfig = userConfig;
    }

    // refresh webview git filelist
    async refreshFileList() {
        try{
            let gitInfo = await utils.gitStatus(this.projectPath);
            const gitData = Object.assign(gitInfo, {
                'projectName': this.projectName,
                'projectPath': this.projectPath
            });
            const vhtml = html.getWebviewContent(this.userConfig, this.uiData, gitData);
            this.webviewPanel.webView.html = vhtml;
        }catch(e){};
    };

    // Git: add
    async add(filename) {
        let files = [];
        files.push(filename);
        let addStatus = await utils.gitAdd(this.projectPath, files);
        if (addStatus == 'success') {
            this.refreshFileList();
        };
    };

    // Git: commit
    async commit(isStaged, exist, comment) {
        if (exist == 0){
            return hx.window.setStatusBarMessage('Git: 当前不存在要提交的文件',3000,'info');
        };
        if (comment == '') {
            return hx.window.showErrorMessage('Git: 请填写commit message后再提交。', ['我知道了']);
        };
        if (isStaged) {
            let ciStatus = await utils.gitCommit(this.projectPath, comment);
            if (ciStatus == 'success') {
                this.refreshFileList();
            };
        } else {
            // 需要判断用户是否开启了：当没有可提交的暂存更改时，总是自动暂存所有更改并直接提交。
            let config = hx.workspace.getConfiguration();
            let AlwaysAutoAddCommit = config.get('EasyGit.AlwaysAutoAddCommit');

            if (AlwaysAutoAddCommit) {
                let acStatus = await utils.gitAddCommit(this.projectPath, comment);
                if (acStatus == 'success') {
                    this.refreshFileList();
                };
            } else {
                let userSelect = await hx.window.showInformationMessage(
                    '没有可提交的暂存更改。\n是否要自动暂存所有更改并直接提交? \n',['总是','是','关闭'],
                ).then( (result) => { return result; })

                if (userSelect == '是' || userSelect == '总是') {
                    const goAddCI = async () => {
                        let acStatus = await utils.gitAddCommit(this.projectPath, comment);
                        if (acStatus == 'success') {
                            this.refreshFileList();
                        };
                    };
                    goAddCI();
                    if (userSelect == '总是') {
                        config.update("EasyGit.AlwaysAutoAddCommit", true).then(() => {
                            hx.window.setStatusBarMessage("Git已开启：当没有可提交的暂存更改时，总是自动暂存所有更改并直接提交。", 5000,'info');
                        })
                    };
                };
            };
        };
    };

    // Git: 撤销上次commit
    async resetLastCommit() {
        let resetStatus = await utils.gitReset(this.projectPath, ['--soft', 'HEAD^'], 'Git: 插销上次commit');
        if (resetStatus == 'success') {
            this.refreshFileList();
        };
    };

    // Git: cancel add
    async cancelAdd(fileUri) {
        let cancelStatus = await utils.gitCancelAdd(this.projectPath, fileUri);
        if (cancelStatus == 'success') {
            this.refreshFileList();
        };
    };

    // Git: clean
    async clean() {
        let cleanMsg = 'Git: 确认删除当前所有未跟踪的文件，删除后无法恢复。';
        let isDeleteBtn = await hx.window.showInformationMessage(cleanMsg, ['删除','关闭']).then((result) =>{
            return result;
        });
        if (isDeleteBtn == '关闭') {
            return;
        };
        let cleanStatus = await utils.gitClean(this.projectPath);
        if (cleanStatus == 'success') {
            this.refreshFileList();
        };
    };

    // Git: 撤销更改 git checkout -- filename
    async checkoutFile(fileinfo) {
        let fpath,fstatus;
        if (fileinfo instanceof Object) {
            fpath = fileinfo.path;
            fstatus = fileinfo.status;
        } else {
            fpath = fileinfo;
        };
        if (fileinfo == 'all' || fstatus != 'not_added') {
            let checkoutlStatus = await utils.gitCheckout(this.projectPath, fpath);
            if (checkoutlStatus == 'success') {
                this.refreshFileList();
            };
        };
        if (fpath != 'all' && fstatus == 'not_added') {
            let absPath = path.join(this.projectPath, fpath);
            let status = await file.remove(absPath, fpath);
            if (status) {
                this.refreshFileList();
            };
        };
    };

    // Git: add -> commit -> push
    async acp(commitComment) {
        if (commitComment.trim() == '') {
            return hx.window.showErrorMessage('请输入注释后再提交', ['我知道了']);
        };
        let acpStatus = await utils.gitAddCommitPush(this.projectPath, commitComment);
        if (acpStatus == 'success') {
            this.refreshFileList();
        };
    };

};


/**
 * @description  Git Cofing
 * @return {String} projectPath 项目路径
 */
class GitConfig {
    constructor(projectPath) {
        this.projectPath = projectPath;
    };

    async showOrigin() {
        await utils.gitRemoteshowOrigin(this.projectPath);
    };

    async ConfigShow() {
        return await utils.gitConfigShow(this.projectPath);
    };

};

/**
 * @description 显示webview
 * @param {Object} userConfig 用户配置
 * @param {Object} webviewPanel
 * @param {Object} gitData
 */
function active(webviewPanel, userConfig, gitData) {
    const view = webviewPanel.webView;

    // get project info , and git info
    const { projectPath, projectName, currentBranch, originurl } = gitData;

    // UI: color and svg icon
    let uiData = getUIData();

    // Git: 分支
    let Branch = new GitBranch(webviewPanel, projectPath, projectName, uiData, userConfig);

    // Git: 文件
    let File = new GitFile(webviewPanel, projectPath, projectName, uiData, userConfig);

    // Git: Config配置
    let GitCfg = new GitConfig(projectPath);

    // get webview html content
    const viewContent = html.getWebviewContent(userConfig, uiData, gitData);

    // set html
    view.html = viewContent;

    view.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'back':
                File.refreshFileList();
                break;
            case 'refresh':
                File.refreshFileList();
                break;
            case 'diff':
                utils.gitDiffFile(projectPath,msg.filename);
                break;
            case 'log':
                let data = {
                    'projectPath': projectPath,
                    'projectName': projectName,
                    'easyGitInner': true
                };
                hx.commands.executeCommand('EasyGit.log',data);
                break;
            case 'open':
                let fileUri = path.join(projectPath, msg.text);
                hx.workspace.openTextDocument(fileUri);
                break;
            case 'add':
                File.add(msg.text);
                break;
            case 'commit':
                let {isStaged,exist,comment} = msg;
                File.commit(isStaged, exist, comment);
                break;
            case 'ResetSoftHEAD':
                File.resetLastCommit();
                break;
            case 'push':
                push(projectPath);
                break;
            case 'publish':
                goPublish(projectPath, msg);
                break;
            case 'acp':
                let commitComment = msg.text;
                File.acp(commitComment);
                break;
            case 'diff':
                let fileAbsPath = path.join(projectPath, msg.text);
                hx.commands.executeCommand('file.compareWithLastVersion', fileAbsPath);
                break;
            case 'checkout':
                File.checkoutFile(msg.text);
                break;
            case 'cancelStash':
                File.cancelAdd(msg.text);
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
                    File.refreshFileList();
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
            case 'clean':
                File.clean();
                break;
            case 'configShow':
                GitCfg.ConfigShow();
                break;
            case 'showOrigin':
                GitCfg.showOrigin();
                break;;
            case 'gitConfigFile':
                gitConfigFileSetting(projectPath, msg.text);
                break;
            case 'stash':
                let param = {
                    'projectPath': projectPath,
                    'projectName': projectName,
                    'easyGitInner': true
                };
                gitAction.action(param,msg.option);
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


module.exports = {
    active
}
