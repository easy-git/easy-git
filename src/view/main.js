const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');

const file = require('../common/file.js');
let utils = require('../common/utils.js');
const gitAction = require('../commands/index.js');

const icon = require('./static/icon.js');
const html = require('./mainHtml.js')

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
    let ChevronDownIcon = icon.getChevronDown(fontColor);
    let ChevronRightIcon = icon.getChevronRight(fontColor);

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
        uploadIcon,
        ChevronRightIcon,
        ChevronDownIcon
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

    async getUrl() {
        let result = await utils.gitRaw(this.projectPath, ['ls-remote', '--get-url', 'origin'], '获取仓库URL', 'result')
        if (typeof(result) == 'string') {
            let url = result;
            if (result.includes('.git')) {
                if (result.includes('git@') == true) {
                    url = result.replace('git@', '').replace(':','/').replace('.git','');
                    url = 'http://' + url;
                };
                url = url.replace(/\r\n/g,"").replace(/\n/g,"");
                setTimeout(function() {
                    hx.env.openExternal(url);
                }, 1000);
            };
        } else {
            hx.window.showErrorMessage('获取仓库地址失败');
        }
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
        this.BranchTracking = false;
    }

    // refresh webview git filelist
    async refreshFileList() {
        try{
            let gitInfo = await utils.gitStatus(this.projectPath);
            let { BranchTracking } = gitInfo;
            const gitData = Object.assign(gitInfo, {
                'projectName': this.projectName,
                'projectPath': this.projectPath
            });
            const vhtml = html.getWebviewContent(this.userConfig, this.uiData, gitData);
            this.webviewPanel.webView.html = vhtml;
        }catch(e){};
    };

    // 当编辑器打开日志视图时，文件视图内的操作，要刷新日志视图
    async refreshLogView() {
        // await hx.request('internaltest.executeCommand', 'workbench.action.focusEditor');
        let activeEditorName = await hx.window.getActiveTextEditor().then(function(editor){
            return editor.document.fileName;
        });
        console.log(activeEditorName)
    };

    // Git: add
    async add(info) {
        let {text, tag} = info;
        if (tag == 'C') {
            let btnText = await hx.window.showErrorMessage(`确定要暂存含有合并冲突的 ${text} 文件吗? `, ['我已解决冲突','关闭']).then( (btnText) => {
                return btnText
            });
            if (btnText == '关闭') { return; };
        };

        let files = [];
        files.push(text);
        let addStatus = await utils.gitAdd(this.projectPath, files);
        if (addStatus == 'success') {
            this.refreshFileList();
        };
    };

    // Git: from local get commit message
    async getCommitMessage() {
        let cm = new utils.FillCommitMessage(this.projectPath);
        let cmText = await cm.getMergeMsg();

        if (cmText == undefined) {return;};
        this.webviewPanel.webView.postMessage({
            command: "CommitMessage",
            commitMessage: cmText
        });
    };

    // Git: commit
    async commit(isStaged, exist, comment) {
        if (exist == 0){
            return hx.window.setStatusBarMessage('Git: 当前不存在要提交的文件',3000,'info');
        };
        if (comment == '') {
            return hx.window.showErrorMessage('Git: 请填写commit message后再提交。', ['我知道了']);
        };

        let config = await hx.workspace.getConfiguration();

        if (isStaged) {
            let AlwaysAutoCommitPush = config.get('EasyGit.AlwaysAutoCommitPush');

            // commit & push的前提：本地分支必须关联到远端
            if (this.BranchTracking == null || this.BranchTracking == false) {
                let gitInfo = await utils.gitStatus(this.projectPath);
                let { BranchTracking } = gitInfo;
                if (BranchTracking != null) {
                    this.BranchTracking = true;
                } else {
                    AlwaysAutoCommitPush = false;
                };
            };

            if (AlwaysAutoCommitPush) {
                let cpStatus = await utils.gitCommitPush(this.projectPath, comment);
                if (cpStatus == 'success') {
                    this.refreshFileList();
                };
            } else {
                let ciStatus = await utils.gitCommit(this.projectPath, comment);
                if (ciStatus == 'success') {
                    this.refreshFileList();
                };
            };
        } else {
            // 需要判断用户是否开启了：当没有可提交的暂存更改时，总是自动暂存所有更改并直接提交。
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
                        });
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

    // Git: 重置代码到上次提交
    async resetHardLastCommit() {
        let resetStatus = await utils.gitReset(this.projectPath, ['--hard', 'HEAD^'], 'Git: 重置代码到上次提交');
        if (resetStatus == 'success') {
            this.refreshFileList();
        };
    };

    // Git: cancel add
    async cancelStash(fileUri, tag) {
        if (!fileUri) {return;};
        if (tag == 'R') {
            let tmp = (fileUri.split('->')[1]).trim();
            fileUri = path.join(this.projectPath, tmp);
        } else {
            fileUri = path.join(this.projectPath, fileUri);
        }
        let data = {
            'projectPath': this.projectPath,
            'projectName': this.projectName,
            'selectedFile': fileUri,
            'easyGitInner': true
        };
        hx.commands.executeCommand('EasyGit.restoreStaged', data);
    };

    // Git: cancel all add
    async cancelAllStash() {
        let data = {
            'projectPath': this.projectPath,
            'projectName': this.projectName,
            'selectedFile': this.projectPath,
            'easyGitInner': true
        };
        hx.commands.executeCommand('EasyGit.restoreStaged', data);
    };

    // Git: clean
    async clean() {
        let data = {
            'projectPath': this.projectPath,
            'projectName': this.projectName,
            'easyGitInner': true
        };
        hx.commands.executeCommand('EasyGit.clean', data);
    };

    // Git: 撤销更改 git checkout -- filename
    async checkoutFile(fileinfo) {
        let fpath,ftag;
        if (fileinfo instanceof Object) {
            fpath = fileinfo.path;
            ftag = fileinfo.tag;
        } else {
            fpath = fileinfo;
        };
        if (fileinfo == 'all' || !ftag.includes('?')) {
            let checkoutlStatus = await utils.gitCheckoutFile(this.projectPath, fpath);
            if (checkoutlStatus == 'success') {
                this.refreshFileList();
            };
        };
        if (fpath != 'all' && ftag.includes('?')) {
            let absPath = path.join(this.projectPath, fpath);
            let status = await utils.gitRemoveFile(absPath, fpath);
            if (status) {
                this.refreshFileList();
            };
        };
    };

    // Git: push
    async push() {
        let options = [];

        // push的前提：本地分支必须关联到远端
        if (this.BranchTracking == null || this.BranchTracking == false) {
            let gitInfo = await utils.gitStatus(this.projectPath);
            let { BranchTracking,currentBranch } = gitInfo;
            if (BranchTracking != null) {
                this.BranchTracking = true;
            } else {
                options = ['--set-upstream', 'origin', currentBranch];
            };
        };

        let pushStatus = await utils.gitPush(this.projectPath, options);
        if (pushStatus == 'success') {
            this.refreshFileList();
        };
    };

    // Git: switch last Branch
    async switchLastBranch() {
        let switchResult = await utils.gitBranchSwitch(this.projectPath, '-');
        if (switchResult == 'success') {
            this.refreshFileList();
        };
    };

    // Git: pull
    async pull(msg) {
        let {text,rebase} = msg;
        let options = Object.assign(msg);
        let pullStatus = await utils.gitPull(this.projectPath,options);
        if (pullStatus == 'success') {
            if (text == 'file') {
                this.refreshFileList();
            } else {
                Branch.LoadingBranchData();
            };
        };
    };

    // Git: fetch
    async fetch(source) {
        let fetchStatus = await utils.gitFetch(this.projectPath);
        if (fetchStatus == 'success') {
            if (source == 'file') {
                this.refreshFileList();
            } else {
                Branch.LoadingBranchData();
            };
        };
    };

    // Git: publish
    async goPublish(msg) {
        let branchName = msg.text;
        let pushStatus = await utils.gitAddRemoteOrigin(this.projectPath);
        if (pushStatus == 'success') {
            // let AssociationResult = await utils.gitLocalBranchToRemote(this.projectPath, branchName);
            // if (AssociationResult) {
            //     this.refreshFileList();
            // };
            this.refreshFileList();
        };
    };

    // Git: sync
    async sync() {
        let fetchStatus = await utils.gitFetch(this.projectPath, false);
        if (fetchStatus == 'success') {
            let gitInfo = await utils.gitStatus(this.projectPath);
            let { behind } = gitInfo;
            if (behind != 0 && behind != undefined) {
                this.webviewPanel.webView.postMessage({
                    command: "sync",
                    behind: behind
                });
            };
        };
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
    hx.window.showView({
        viewid: 'EasyGitSourceCodeView',
        containerid: 'EasyGitSourceCodeView'
    });

    // get project info , and git info
    const { projectPath, projectName, currentBranch, originurl } = gitData;

    // UI: color and svg icon
    let uiData = getUIData();

    // Git: 文件
    let File = new GitFile(webviewPanel, projectPath, projectName, uiData, userConfig);

    // Git: Config配置
    let GitCfg = new GitConfig(projectPath);

    // get webview html content
    const viewContent = html.getWebviewContent(userConfig, uiData, gitData);

    // set html
    view.html = viewContent;

    let EasyGitInnerParams = {
        'projectPath': projectPath,
        'projectName': projectName,
        'easyGitInner': true
    };

    view.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'refresh':
                File.refreshFileList();
                break;
            case 'diff':
                let { filename, tag, isConflicted } = msg;
                let fpath = path.join(projectPath, filename);
                if ( tag == 'D') {
                    return hx.window.showErrorMessage(`EasyGit: ${filename} 已被删除，无法查看信息。`, ['我知道了']);
                };
                if ( tag == '?' || isConflicted) {
                    hx.workspace.openTextDocument(fpath);
                    return;
                };
                if (isConflicted) {
                    hx.workspace.openTextDocument(fpath);
                    return;
                };
                let diff_parms = {
                    "easyGitInner": true,
                    "projectPath": projectPath,
                    "projectName": projectName,
                    "selectedFile": msg.filename,
                };
                hx.commands.executeCommand('EasyGit.diffFile',diff_parms);
                break;
            case 'log':
                hx.commands.executeCommand('EasyGit.log',EasyGitInnerParams);
                break;
            case 'open':
                let fileUri = path.join(projectPath, msg.text);
                hx.workspace.openTextDocument(fileUri);
                break;
            case 'add':
                File.add(msg);
                break;
            case 'CommitMessage':
                File.getCommitMessage();
                break;
            case 'commit':
                let {isStaged,exist,comment} = msg;
                File.commit(isStaged, exist, comment);
                break;
            case 'ResetSoftHEAD':
                File.resetLastCommit();
                break;
            case 'ResetHardHEAD':
                File.resetHardLastCommit();
                break;
            case 'push':
                File.push();
                break;
            case 'publish':
                File.goPublish(msg);
                break;
            case 'diff':
                let fileAbsPath = path.join(projectPath, msg.text);
                hx.commands.executeCommand('file.compareWithLastVersion', fileAbsPath);
                break;
            case 'checkoutFile':
                File.checkoutFile(msg.text);
                break;
            case 'stash':
                gitAction.action(EasyGitInnerParams,msg.option);
                break;
            case 'cancelStash':
                File.cancelStash(msg.text, msg.tag);
                break;
            case 'cancelAllStash':
                File.cancelAllStash();
                break;
            case 'pull':
                File.pull(msg);
                break;
            case 'fetch':
                File.fetch(msg.text);
                break;
            case 'BranchInfo':
                if (msg.text == 'branch') {
                    if (originurl == undefined) {
                        hx.window.showErrorMessage('请发布此项目到远程到后再进行操作。', ['我知道了']);
                    } else {
                        hx.commands.executeCommand('EasyGit.branch',EasyGitInnerParams);
                    };
                } else {
                    File.refreshFileList();
                };
                break;
            case 'clean':
                File.clean();
                break;
            case 'gitConfigFile':
                gitConfigFileSetting(projectPath, msg.text);
                break;
            case 'configShow':
                GitCfg.ConfigShow();
                break;
            case 'showOrigin':
                GitCfg.showOrigin();
                break;;
            case 'openRemoteServer':
                GitCfg.getUrl();
                break;
            case 'switchLastBranch':
                File.switchLastBranch();
                break;
            case 'openCommandPanel':
                hx.commands.executeCommand('EasyGit.CommandPanel', EasyGitInnerParams);
                break;
            case 'sync':
                File.sync();
                break;
            default:
                break;
        };
    });

};


module.exports = {
    active
}
