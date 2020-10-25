const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');

const file = require('../common/file.js');
let utils = require('../common/utils.js');
const gitAction = require('../git.js');

const icon = require('./static/icon.js');
const html = require('./mainHtml.js')

const cmp_hx_version = require('../common/cmp.js');
let cmp_git;

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


// 提示框
function showGitVersionPrompt() {
    hx.window.showErrorMessage('Git: 取消暂存，用到了restore命令。\n本机Git命令行版本太低, 没有restore命令。请升级电脑的Git命令行工具！', ['安装高版本Git工具', '关闭']).then( (res)=> {
        if (res == '安装高版本Git工具') {
            hx.env.openExternal('https://git-scm.com/downloads');
        }
    });
};

// Git: resotre git 2.23.0版本的命令
async function JudgeGitRestore() {
    try{
        if (cmp_git == undefined) {
            let version = await utils.getGitVersion();
            cmp_git = cmp_hx_version(version, '2.23.0');
            if (cmp_git > 0 ) {
                showGitVersionPrompt();
                return false;
            };
            return true;
        } else {
            if (cmp_git > 0 ) {
                showGitVersionPrompt();
                return false;
            }
            return true;
        };
    }catch(e){
        return true;
    };
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
    async cancelStash(fileUri) {
        let isUseRestore = await JudgeGitRestore();
        if (isUseRestore == false) { return; }

        let cancelStatus = await utils.gitRaw(this.projectPath, ['restore', '--staged', fileUri], '取消暂存');
        if (cancelStatus == 'success') {
            this.refreshFileList();
        };
    };

    // Git: cancel all add
    async cancelAllStash() {
        let isUseRestore = await JudgeGitRestore();
        if (isUseRestore == false) { return; }

        let cancelStatus = await utils.gitRaw(this.projectPath, ['restore', '--staged', '*'], '取消所有暂存');
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
            case 'refresh':
                File.refreshFileList();
                break;
            case 'diff':
                let f = path.join(projectPath, msg.filename)
                hx.workspace.openTextDocument(f);
                // setTimeout(function() {
                //     hx.request('internaltest.executeCommand', 'file.compareWithLastVersion');
                // }, 2000);
                // utils.gitDiffFile(projectPath,msg.filename);
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
            case 'checkoutFile':
                File.checkoutFile(msg.text);
                break;
            case 'stash':
                let param = {
                    'projectPath': projectPath,
                    'projectName': projectName,
                    'easyGitInner': true
                };
                gitAction.action(param,msg.option);
                break;
            case 'cancelStash':
                File.cancelStash(msg.text);
                break;
            case 'cancelAllStash':
                File.cancelAllStash();
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
                        let currentProjectData = {
                            'projectPath': projectPath,
                            'projectName': projectName,
                            'easyGitInner': true
                        };
                        hx.commands.executeCommand('EasyGit.branch',currentProjectData);
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
