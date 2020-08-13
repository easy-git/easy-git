const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');

const file = require('./file.js');
let utils = require('./utils.js');
const icon = require('./static.js');

const html = require('./MainHtml.js')

/**
 * @description 显示webview
 * @param {Object} userConfig 用户配置
 * @param {Object} webviewPanel
 * @param {Object} gitData
 */
function active(webviewPanel, userConfig, gitData) {
    const view = webviewPanel.webView;

    // 获取项目信息、git信息
    const {projectPath,projectName,currentBranch} = gitData;

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
        HistoryIcon
    };

    let uiData = Object.assign(iconData,colorData);

    // get webview html content
    const viewContent = html.getWebviewContent(userConfig, uiData, gitData);

    // set html
    view.html = viewContent;

    view.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'back':
                refreshFileList();
                break;
            case 'refresh':
                refreshFileList();
                break;
            case 'diff':
                utils.gitDiffFile(projectPath,msg.filename);
                break;
            case 'log':
                let data = {
                    'projectPath': projectPath,
                    'projectName': projectName,
                    'easyGitInner': true
                }
                hx.commands.executeCommand('extension.EasyGitLog',data);
                break;
            case 'open':
                let fileUri = path.join(projectPath, msg.text);
                hx.workspace.openTextDocument(fileUri);
                break;
            case 'add':
                add(projectPath, msg.text);
                break;
            case 'commit':
                let {isStaged,exist,comment} = msg;
                commit(projectPath, isStaged, exist, comment);
                break;
            case 'push':
                push(projectPath, msg.text);
                break;
            case 'acp':
                let commitComment = msg.text;
                if (commitComment.trim() == '') {
                    hx.window.showErrorMessage('请输入注释后再提交', ['我知道了']);
                } else {
                    ACP(commitComment);
                };
                break;
            case 'diff':
                let fileAbsPath = path.join(projectPath, msg.text);
                hx.commands.executeCommand('file.compareWithLastVersion', fileAbsPath);
                break;
            case 'checkout':
                CheckoutFile(projectPath, msg.text);
                break;
            case 'cancelStash':
                CancelAdd(projectPath, msg.text);
                break;
            case 'pull':
                pull(projectPath,msg);
                break;
            case 'fetch':
                fetch(projectPath,msg.text);
                break;
            case 'BranchInfo':
                if (msg.text == 'branch') {
                    LoadingBranchData();
                } else {
                    refreshFileList();
                };
                break;
            case 'BranchSwitch':
                BranchSwitch(msg.text);
                break;
            case 'BranchCreate':
                BranchCreate(msg);
                break;
            case 'pushBranchToRemote':
                BranchToRemote(msg.text);
                break;
            case 'BranchCreatePush':
                FromCurrentBranchCreatePush(msg.text);
                break;
            case 'BranchDelete':
                let branch = msg.text;
                let delMsg = `Git: 确认删除 ${branch} 分支?`;
                hx.window.showInformationMessage(delMsg, ['删除','关闭']).then((result) =>{
                    if (result == '删除') {
                        BranchDelete(branch);
                    };
                });
                break;
            case 'BranchMerge':
                BranchMerge(msg.from,msg.to);
                break;
            case 'CreateTag':
                TagCreate(msg.text);
                break;
            case 'clean':
                let cleanMsg = 'Git: 确认删除当前所有未跟踪的文件，删除后无法恢复。';
                hx.window.showInformationMessage(cleanMsg, ['删除','关闭']).then((result) =>{
                    if (result == '删除') {
                        CleanFile();
                    };
                });
                break;
            case 'configShow':
                ConfigShow();
                break;
            case 'showOrigin':
                showOrigin();
                break;;
            case 'gitConfigFile':
                gitConfigFileSetting(msg.text);
                break;
            default:
                break;
        };
    });

    // refresh webview git filelist
    async function refreshFileList() {
        let gitInfo = await utils.gitStatus(projectPath);
        const gitData = Object.assign(gitInfo, {
            'projectName': projectName,
            'projectPath': projectPath
        });
        const vhtml = html.getWebviewContent(userConfig, uiData, gitData);
        webviewPanel.webView.html = vhtml;
    };


    // get webview git branchs
    async function LoadingBranchData() {
        let BranchInfo = await utils.gitBranch(projectPath);
        let StatusInfo = await utils.gitStatus(projectPath);
        let TagsList = await utils.gitTagsList(projectPath);
        const gitData = Object.assign(
            {'BranchInfo': BranchInfo}, {'TagsList': TagsList}, {
            'projectName': projectName,
            'projectPath': projectPath,
            'ahead': StatusInfo.ahead,
            'behind': StatusInfo.behind
        });
        const bhtml = html.getWebviewBranchContent(userConfig, uiData, gitData);
        webviewPanel.webView.html = bhtml;
    };

    // git branch switch
    async function BranchSwitch(branchInfo) {
        let {name,current} = branchInfo;
        if (current) {
            return;
        };
        if (name.includes('remote')) {
            return hx.window.setStatusBarMessage('请勿在远程分支上操作');
        };

        let switchStatus = await utils.gitBranchSwitch(projectPath,name);
        if (switchStatus == 'success') {
            LoadingBranchData();
        };
    };

    // git branch create
    async function BranchCreate(info) {
        let {newBranchName,ref} = info;
        let data = Object.assign(
            {'projectPath':projectPath},info
        )
        if (newBranchName == '') {
            return hx.window.showErrorMessage('Git: 在输入框输入分支名称后，再点击创建。',['关闭']);
        };
        if (ref == undefined) {
            let breachCreateStatus = await utils.gitBranchCreate(data);
            if (breachCreateStatus == 'success') {
                LoadingBranchData();
            };
        } else {
            let breachCreateStatus = await utils.gitBranchCreate(data);
            if (breachCreateStatus == 'success') {
                LoadingBranchData();
            };
        };
    };

    // git branch create and push
    async function FromCurrentBranchCreatePush(branchName) {
        if (branchName == '') {
            return hx.window.showErrorMessage('Git: 在输入框输入分支名称后，再点击创建。',['关闭']);
        };
        let cpStatus = await utils.gitBranchCreatePush(projectPath,branchName);
        if (cpStatus == 'success') {
            LoadingBranchData();
        };
    };

    // git push local branch to remote
    async function BranchToRemote(branchName) {
        let toStatus = await utils.gitLocalBranchToRemote(projectPath,branchName);
        if (toStatus == 'success') {
            LoadingBranchData();
        };
    };

    // git branch git
    async function BranchMerge(fromBranch,toBranch) {
        let mergeStatus = await utils.gitBranchMerge(projectPath,fromBranch,toBranch);
        if (mergeStatus == 'success') {
            refreshFileList();
        }
    };

    // git branch delete
    async function BranchDelete(branchName) {
        if (branchName.includes('remotes/origin')) {
            let delStatus1 = await utils.gitDeleteRemoteBranch(projectPath,branchName);
            if (delStatus1 == 'success') {
                LoadingBranchData();
            };
        } else {
            let delStatus2 = await utils.gitDeleteLocalBranch(projectPath,branchName);
            if (delStatus2 == 'success') {
                LoadingBranchData();
            };
        }
    };

    // git add -> commit -> push
    async function ACP(commitComment) {
        let acpStatus = await utils.gitAddCommitPush(projectPath, commitComment);
        if (acpStatus == 'fail') {
            view.html = viewContent;
        } else if (acpStatus == 'success') {
            refreshFileList();
        };
    };

    // git add
    async function add(projectPath, filename) {
        let files = [];
        files.push(filename);
        let addStatus = await utils.gitAdd(projectPath, files);
        if (addStatus == 'success') {
            refreshFileList();
        };
    };

    // git commit
    async function commit(projectPath, isStaged, exist, comment) {
        if (exist == 0){
            return hx.window.setStatusBarMessage('Git: 当前不存在要提交的文件',3000,'info');
        };
        if (isStaged) {
            let ciStatus = await utils.gitCommit(projectPath, comment);
            if (ciStatus == 'success') {
                refreshFileList();
            };
        } else {
            // 需要判断用户是否开启了：当没有可提交的暂存更改时，总是自动暂存所有更改并直接提交。
            let config = hx.workspace.getConfiguration();
            let AlwaysAutoAddCommit = config.get('EasyGit.AlwaysAutoAddCommit');

            if (AlwaysAutoAddCommit) {
                let acStatus = await utils.gitAddCommit(projectPath, comment);
                if (acStatus == 'success') {
                    refreshFileList();
                };
            } else {
                hx.window.showInformationMessage(
                    '没有可提交的暂存更改。\n是否要自动暂存所有更改并直接提交?',['总是','是','关闭'],
                ).then( (result) => {
                    if (result == '是' || result == '总是') {
                        const goAddCI = async () => {
                            let acStatus = await utils.gitAddCommit(projectPath, comment);
                            if (acStatus == 'success') {
                                refreshFileList();
                            };
                        };
                        goAddCI();
                    };
                    if (result == '总是') {
                        config.update("EasyGit.AlwaysAutoAddCommit", true).then(() => {
                            hx.window.setStatusBarMessage(
                                "Git已开启：当没有可提交的暂存更改时，总是自动暂存所有更改并直接提交。", 5000,'info'
                            );
                        })
                    };
                });
            };
        }
    };

    // git push
    async function push(projectPath, filename) {
        let files = [];
        files.push(filename);
        let pushStatus = await utils.gitPush(projectPath, files);
        if (pushStatus == 'success') {
            refreshFileList();
        };
    };

    // git pull
    async function pull(projectPath, msg) {
        let {text,rebase} = msg;
        let options = Object.assign(msg);
        let pullStatus = await utils.gitPull(projectPath,options);
        if (pullStatus == 'success') {
            if (text == 'file') {
                refreshFileList();
            } else {
                LoadingBranchData();
            };
        };
    };

    // git fetch
    async function fetch(projectPath, source) {
        let fetchStatus = await utils.gitFetch(projectPath);
        if (fetchStatus == 'success') {
            if (source == 'file') {
                refreshFileList();
            } else {
                LoadingBranchData();
            };
        };
    };

    // git cancel add
    async function CancelAdd(projectPath, fileUri) {
        let cancelStatus = await utils.gitCancelAdd(projectPath, fileUri);
        if (cancelStatus == 'success') {
            refreshFileList();
        };
    };

    // 撤销更改: git checkout -- filename
    async function CheckoutFile(projectPath, fileinfo) {
        let fpath,fstatus;
        if (fileinfo instanceof Object) {
            fpath = fileinfo.path;
            fstatus = fileinfo.status;
        } else {
            fpath = fileinfo;
        };
        if (fileinfo == 'all' || fstatus != 'not_added') {
            let checkoutlStatus = await utils.gitCheckout(projectPath, fpath);
            if (checkoutlStatus == 'success') {
                refreshFileList();
            };
        };
        if (fpath != 'all' && fstatus == 'not_added') {
            let absPath = path.join(projectPath, fpath);
            let status = await file.remove(absPath,fpath);
            if (status) {
                refreshFileList();
            };
        };
    };

    // git tag create
    async function TagCreate(tagName) {
        if (tagName.length == 0) {
            return hx.window.showErrorMessage('tag名称无效，请重新输入。',['关闭']);
        }
        let tagCreateStatus = await utils.gitTagCreate(projectPath,tagName);
        if (tagCreateStatus == 'success') {
            LoadingBranchData();
        }
    };

    // git clean
    async function CleanFile() {
        let cleanStatus = await utils.gitClean(projectPath);
        if (cleanStatus == 'success') {
            refreshFileList();
        }
    };

    // git config show
    async function ConfigShow() {
        await utils.gitConfigShow(projectPath);
    };

    // git remote show origin
    async function showOrigin() {
        await utils.gitRemoteshowOrigin(projectPath);
    };

    // git config file
    function gitConfigFileSetting(filename) {
        let data = {
            "projectPath": projectPath
        };
        if (filename == '.gitignore') {
            file.gitignore(data);
        };
        if (filename == '.gitattributes') {
            file.gitattributes(data);
        }
    }

};


module.exports = {
    active
}
