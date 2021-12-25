const fs = require('fs');
const os = require('os');
const path = require('path');
const chokidar = require('chokidar');
const { debounce } = require('throttle-debounce');

const hx = require('hbuilderx');

const file = require('../common/file.js');
const gitAction = require('../commands/index.js');
let utils = require('../common/utils.js');

const icon = require('./static/icon.js');
const html = require('./mainHtml.js')

// 字体图标文件路径
let ttfOtherFile = path.join(__dirname, 'static', 'file-icon', "other.ttf");

const osName = os.platform();

// 主题
let hxConfig = hx.workspace.getConfiguration();

// Git触发途径：HBuilderX内触发、外部Git命令（或其它工具）触发
let GitHBuilderXInnerTrigger = false;

/**
 * @description 获取图标、各种颜色
 * @return {Object} UIData
 */
function getUIData() {

    // 根据主题适配颜色
    let colorData = utils.getThemeColor('siderBar');
    let {fontColor, explorerIconTheme, explorerIconScheme} = colorData;

    // 文件图标
    let ttfFileName = explorerIconTheme == 'vs-seti' ? `${explorerIconTheme}.woff` : `${explorerIconTheme}.ttf`;
    let ttfFilePath = path.join(__dirname, 'static', 'file-icon', ttfFileName);
    let ttfJSONFile = path.join(__dirname, 'static', 'file-icon', `${explorerIconTheme}.json`);
    let ttfContent = require(ttfJSONFile);

    let cssName = `${explorerIconTheme}-${explorerIconScheme}.css`;
    let ttfCSSFilePath = path.join(__dirname, 'static', 'file-icon', cssName);

    // windows路径处理
    if ( osName != 'darwin') {
        ttfOtherFile = ttfOtherFile.replace(/\\/g, '/');
        ttfFilePath = ttfFilePath.replace(/\\/g, '/');
    };

    let fListIcon = {"explorerIconTheme": explorerIconTheme, "ttfFile": ttfFilePath, "ttfCSSFilePath": ttfCSSFilePath ,"ttfOtherFile": ttfOtherFile};
    let flist = [];

    // vs-stei没有文件夹图标，因此vs-stei图标单独取自other.ttf
    for (let s of flist) {
        fListIcon[`${s}_ficon`] = ttfContent[`${s}_${explorerIconScheme}`] ? ttfContent[`${s}_${explorerIconScheme}`] : ttfContent[`_${explorerIconScheme}`];
    };

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
    let HandleIcon = icon.getHandleIcon(fontColor);
    let CommandPanelIcon = icon.getCommandPanelIcon(fontColor);

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
        ChevronDownIcon,
        HandleIcon,
        CommandPanelIcon
    };
    return Object.assign(iconData,colorData, fListIcon);
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
};


/**
 * @description Git操作
 */
class GitFile {
    constructor(webviewPanel, projectPath, projectName, uiData, userConfig) {
        this.webviewPanel = webviewPanel;
        this.projectPath = projectPath;
        this.projectName = projectName;
        this.uiData = uiData;
        this.userConfig = userConfig;
        this.BranchTracking = false;
        this.ProjectCurrentBranch = '';
    }

    // refresh webview git 分支信息
    async refreshHEAD() {
        let gitInfo = await utils.gitStatus(this.projectPath, false);

        let { originurl, behind, ahead, currentBranch } = gitInfo;
        ahead = ahead == 0 ? '' : ahead;
        behind = behind == 0 ? '' : behind;

        let originurlBoolean = originurl != undefined ? true : false;
        this.webviewPanel.webView.postMessage({
            command: "HEAD",
            ahead: ahead,
            behind: behind,
            currentBranch: currentBranch,
            originurlBoolean: originurlBoolean
        });
    }

    // refresh webview git filelist
    async refreshFileList() {
        if (this.webviewPanel) {
            this.webviewPanel.webView.postMessage({
                command: "animation"
            });
        };

        try{
            let gitInfo = await utils.gitStatus(this.projectPath);

            let { BranchTracking } = gitInfo;
            this.BranchTracking = BranchTracking;

            let gitData = Object.assign(gitInfo, {
                'projectName': this.projectName,
                'projectPath': this.projectPath
            });
            this.ProjectCurrentBranch = gitData.currentBranch;

            // 文件数量太多，可能会导致EasyGit插件视图失去响应
            if (gitData.FileResult) {
                try{
                    let gitViewFileList = gitData.FileResult;
                    let totalFile = gitViewFileList.conflictedLength + gitViewFileList.stagedLength + gitViewFileList.notStagedLength;
                    if (totalFile > 300) {
                        let userBtn = await utils.hxShowMessageBox('EasyGit',
                            `当前项目下变更的文件数量超过300个，文件数量太多，继续加载，可能会导致EasyGit插件视图失去响应，建议直接提交。\n\n 备注：一些非必要的文件，比如node_modules, 建议加入.gitignore进行忽略。\n\n直接提交：git add + git commit`, ["设置.gitignore","继续加载","直接提交", "关闭"],
                        ).then( (result) => { return result; });
                        if (userBtn == "直接提交") {
                            let ciMsg = await hx.window.showInputBox({
                                prompt:"Git Commit消息",
                                placeHolder: "必填"
                            }).then((result)=>{
                                return result;
                            });
                            await utils.gitAddCommit(this.projectPath, ciMsg);
                            this.webviewPanel.webView.postMessage({"command": "closedAnimation"});
                            return;
                        } else if (userBtn == "设置.gitignore") {
                            gitConfigFileSetting(this.projectPath, '.gitignore')
                            return;
                        } else if (userBtn == "继续加载") {
                            console.log('EasyGit:...........继续加载');
                        } else {
                            this.webviewPanel.webView.postMessage({"command": "closedAnimation"});
                            return;
                        };
                    };
                }catch(e){};
            };

            if (this.webviewPanel) {
                let { originurl, BranchTracking, behind, ahead } = gitData;
                ahead = ahead == 0 ? '' : ahead;
                behind = behind == 0 ? '' : behind;

                let originurlBoolean = originurl != undefined ? true : false;
                let { GitAlwaysAutoCommitPush } = this.userConfig;
                if (BranchTracking == null) {
                    GitAlwaysAutoCommitPush = false;
                };
                this.webviewPanel.webView.postMessage({
                    command: "autoRefresh",
                    gitFileResult: gitData.FileResult,
                    ahead: ahead,
                    behind: behind,
                    currentBranch: gitData.currentBranch,
                    originurlBoolean: originurlBoolean,
                    GitAlwaysAutoCommitPush: GitAlwaysAutoCommitPush
                });
            } else {
                const vhtml = html.getWebviewContent(this.userConfig, this.uiData, gitData);
                this.webviewPanel.webView.html = vhtml;
            };

            // Git文件视图：检查git项目是否包含node_modules
            let gitignore = path.join(this.projectPath, '.gitignore');
            if (!fs.existsSync(gitignore)) {
                utils.checkNodeModulesFileList(this.projectPath, this.projectName, gitInfo);
            };
        }catch(e){};
    };

    // 当编辑器打开日志视图时，文件视图内的操作，要刷新日志视图
    async refreshLogView() {
        // await hx.request('internaltest.executeCommand', 'workbench.action.focusEditor');
        let activeEditorName = await hx.window.getActiveTextEditor().then(function(editor){
            return editor.document.fileName;
        });
    };


    // 解决冲突
    async ManageConflict(filepath,action) {
        let firstConflict = 0;
        let checkResult = await utils.gitRaw(this.projectPath, ['diff', '--check', filepath], undefined, 'result');
        if (checkResult.length && checkResult.includes('conflict')) {
            let data = checkResult.split('\n');
            let conflictList = data.filter(item => item.includes(filepath) );
            let num = conflictList.length;
            try{
                firstConflict = conflictList[0].split(':')[1];
            }catch(e){};

            let title = `${filepath} 文件存在多处冲突，请选择接下来的操作`;
            let desc = '';
            let btns = ['打开文件对比', '去解决冲突', '关闭'];

            if (action == 'add') {
                title = 'Git暂存';
                desc = `<h4>${filepath} 文件存在多处冲突，建议解决冲突后再暂存。</h4>`;
                btns = ['暂存', '去解决冲突', '关闭'];
            };

            let btnText = await utils.hxShowMessageBox(title, desc, btns).then( (result)=> {
                return result;
            });
            if (btnText == '去解决冲突') {
                let fspath = path.join(this.projectPath, filepath);
                hx.workspace.openTextDocument(fspath).then(doc => {
                    hx.window.showTextDocument(doc, {
                        selection: {start: {line: Number(firstConflict), character: 0}}
                    });
                });
            };
            return btnText;
        };
        return 'noConflict';
    };

    // open diff
    async openDiff(msg) {
        let { filename, tag, isConflicted, objStatus } = msg;
        let fpath = path.join(this.projectPath, filename);

        if ( tag == 'D') {
            return hx.window.showInformationMessage(`EasyGit: ${filename} 已被删除，无法查看信息。`, ['我知道了']);
        };

        try{
            let extname = path.extname(fpath);
            if (['.jpg', '.png', '.gif', '.jpeg', '.bmp', '.tif', '.webp', '.zip'].includes(extname.toLowerCase())) {
                return hx.workspace.openTextDocument(fpath);
            };
        }catch(e){};

        if ( tag == '?' || tag == '??') {
            hx.workspace.openTextDocument(fpath);
            return;
        };

        if (isConflicted) {
            let result = await this.ManageConflict(filename, 'diff');
            if ( ['暂存', '去解决冲突', '关闭'].includes(result) ) { return; };
            // if (result == 'noConflict') {
            //     return hx.workspace.openTextDocument(fpath);
            // };
        };
        let diff_parms = {
            "easyGitInner": true,
            "projectPath": this.projectPath,
            "projectName": this.projectName,
            "selectedFile": filename,
            "objStatus": objStatus
        };
        hx.commands.executeCommand('EasyGit.diffFile', diff_parms);
    };

    // Git: add
    async add(info) {
        let {text, tag} = info;
        let filepath = text;

        // 操作有冲突的文件
        if (tag == 'C') {
            let btnText = await this.ManageConflict(filepath, 'add');
            if ( ['关闭','去解决冲突','打开文件对比'].includes(btnText)) {
                return;
            };
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
    async commit(msg) {
        let { isStaged, exist, comment, onlyCommit } = msg;

        if (isStaged == false && onlyCommit == true) {
            hx.window.showInformationMessage('Git:  此操作仅执行commit命令。请先暂存文件，再进行提交操作。', ['我知道了']);
            return;
        };

        if (exist == 0){
            return hx.window.setStatusBarMessage('Git: 当前不存在要提交的文件',3000,'info');
        };
        if (comment == '') {
            return hx.window.showErrorMessage('Git: 请填写commit message后再提交。', ['我知道了']);
        };

        if (isStaged) {
            let AlwaysAutoCommitPush = hxConfig.get('EasyGit.AlwaysAutoCommitPush');

            // commit & push的前提：本地分支必须关联到远端
            if (this.BranchTracking == null || this.BranchTracking == false) {
                let gitInfo = await utils.gitStatus(this.projectPath);
                let { BranchTracking } = gitInfo;
                if (BranchTracking) {
                    this.BranchTracking = BranchTracking;
                } else {
                    AlwaysAutoCommitPush = false;
                };
            };

            if (AlwaysAutoCommitPush && !onlyCommit) {
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
            let AlwaysAutoAddCommit = hxConfig.get('EasyGit.AlwaysAutoAddCommit');

            if (AlwaysAutoAddCommit == "never") {
                this.webviewPanel.webView.postMessage({
                    command: "CommitMessage",
                    commitMessage: comment
                });
                hx.window.setStatusBarMessage("EasyGit: 当前已关闭回车提交功能，如有需要请到插件设置中开启。", 5000, 'info');
                return;
            } else if (AlwaysAutoAddCommit == true) {
                let acStatus = await utils.gitAddCommit(this.projectPath, comment);
                if (acStatus == 'success') {
                    this.refreshFileList();
                };
            } else {
                let userSelect = await utils.hxShowMessageBox('EasyGit',
                    '没有可提交的暂存更改。\n是否要自动暂存所有更改并直接提交? \n\n 点击【是】或【总是】后，即执行add+commit操作', ["从不",'总是','是','关闭'],
                ).then( (result) => { return result; })

                if (userSelect == '从不') {
                    this.webviewPanel.webView.postMessage({
                        command: "CommitMessage",
                        commitMessage: comment
                    });
                    hxConfig.update("EasyGit.AlwaysAutoAddCommit", "never").then(() => {});
                    return;
                };
                if (userSelect == '总是') {
                    hxConfig.update("EasyGit.AlwaysAutoAddCommit", true).then(() => {
                        hx.window.setStatusBarMessage("EasyGit已开启：当没有可提交的暂存更改时，总是自动暂存所有更改并直接提交。", 5000,'info');
                    });
                };
                if (userSelect == '是' || userSelect == '总是') {
                    const goAddCI = async () => {
                        let acStatus = await utils.gitAddCommit(this.projectPath, comment);
                        if (acStatus == 'success') {
                            this.refreshFileList();
                        };
                    };
                    goAddCI();
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
    async resetHard(version) {
        if (!['HEAD^', 'HEAD'].includes(version)) {
            return;
        }
        let msg = version == 'HEAD' ? 'Git: 重置当前修改' : 'Git: 重置代码到上个版本';
        let resetStatus = await utils.gitReset(this.projectPath, ['--hard', version], msg);
        if (resetStatus == 'success') {
            this.refreshFileList();
        };
    };

    /**
     * @description Git: cancel add，即取消指定暂存文件
     * @param {Object} fileUri - 特定文件路径，*代表所有
     * @param {Object} tag
     */
    async cancelStaged(fileUri, tag) {
        if (!fileUri) {return;};
        if (tag == 'R') {
            let tmp = (fileUri.split('->')[1]).trim();
            fileUri = path.join(this.projectPath, tmp);
        };

        let projectInfo = {
            "projectPath": this.projectPath,
            "selectedFile": fileUri,
        };
        let rt = new utils.gitRestore();
        let cancelStatus = await rt.restore(projectInfo, 'restoreStaged');
        if (cancelStatus == 'success') {
            this.refreshFileList();
        };
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
        GitHBuilderXInnerTrigger = true;
        let fpath, ftag;
        if (fileinfo instanceof Object) {
            fpath = fileinfo.path;
            ftag = fileinfo.tag;
        } else {
            fpath = fileinfo;
        };

        if (fileinfo != '*') {
            if (!ftag.includes('?')) {
                let checkoutlStatus = await utils.gitCheckoutFile(this.projectPath, fpath, true);
                if (checkoutlStatus == 'success') {
                    this.refreshFileList();
                };
            } else {
                let cleanStatus = await utils.gitClean(this.projectPath, fpath, true);
                if (cleanStatus) {
                    this.refreshFileList();
                };
            };
            GitHBuilderXInnerTrigger = false;
        } else {
            try{
                let statusList = await utils.gitFileListStatus(this.projectPath);
                let { notStaged } = statusList;
                if (notStaged.length) {
                    let total = notStaged.length;
                    let notTrackList = notStaged.filter( item => item.tag == '??');
                    let notTrackNum = notTrackList.length;
                    let trackNum = total - notTrackNum;

                    let btns = [];
                    if (trackNum) {
                        btns.push(`放弃${trackNum}个已跟踪的文件`);
                    };
                    if (notTrackNum) {
                        btns.push(`放弃${notTrackNum}个未跟踪的文件`);
                    };
                    if (notTrackNum && trackNum) {
                        btns.push(`放弃所有${total}个文件`);
                    };
                    btns.push('关闭');

                    let desc = '此操作不可撤销! \n如果继续操作, 你当前的工作区文件将永久丢失。';
                    let btnText = await utils.hxShowMessageBox('放弃所有更改', desc, btns).then( btn => {
                        return btn;
                    });
                    if (btnText == null) return;
                    if (btnText == `放弃${trackNum}个已跟踪的文件`) {
                        let status = await utils.gitCheckoutFile(this.projectPath, '*');
                        if (status == 'success') {
                            this.refreshFileList();
                        };
                    } else if (btnText == `放弃所有${total}个文件`) {
                        await utils.gitClean(this.projectPath, '*', false);
                        if (trackNum) {
                            await utils.gitCheckoutFile(this.projectPath, '*');
                        };
                        this.refreshFileList();
                    } else if (btnText == `放弃${notTrackNum}个未跟踪的文件`) {
                        await utils.gitClean(this.projectPath, '*', false);
                        this.refreshFileList();
                    };
                };
                GitHBuilderXInnerTrigger = false;
            }catch(e){
                hx.window.showErrorMessage('Git: 取消所有更改，发生异常，请联系插件作者反馈。', ['我知道了']);
            };
        };
    };

    // Git: push
    async push() {
        let options = [];

        let gitInfo = await utils.gitStatus(this.projectPath);
        let { BranchTracking,currentBranch, ahead } = gitInfo;

        // push的前提：本地分支必须关联到远端
        if (this.BranchTracking == null || this.BranchTracking == false) {
            if (BranchTracking) {
                this.BranchTracking = BranchTracking;
            } else {
                options = ['--set-upstream', 'origin', currentBranch];
            };
        };

        if ((ahead == 0 || ahead == undefined) && BranchTracking != null) {
            hx.window.showInformationMessage("EasyGit: 当前没有要提交的内容。", ["我知道了"]);
            return;
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

        if (this.BranchTracking && (typeof(this.BranchTracking) == 'string')) {
            options = Object.assign(msg, {'BranchTracking': this.BranchTracking});
        };

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

    // Git: sync git behind and git ahead
    async syncBehindAhead() {
        let fetchStatus = await utils.gitFetch(this.projectPath, false);
        if (fetchStatus == 'success') {
            let gitInfo = await utils.gitStatus(this.projectPath, false);
            let { behind, ahead } = gitInfo;
            ahead = ahead == 0 ? '' : ahead;
            behind = behind == 0 ? '' : behind;

            if (behind != 0 || ahead != 0) {
                this.webviewPanel.webView.postMessage({
                    command: "syncBehindAhead",
                    behind: behind,
                    ahead: ahead
                });
            };
        };
    };
};


/**
 * @description 监听文件
 */
var listeningProjectFile = false;
let watchProjectPath;
let watcherListen;
var lastListeningFileInfo;
function watchProjectDir(projectDir, func) {
    let gitDir = path.join(projectDir, '.git');
    let refsPath = path.join(gitDir, 'refs', 'remotes', 'origin');
    let refsHeads = path.join(gitDir, 'refs', 'heads');

    try {
        // 项目目录刷新事件
        const debounceFileList = debounce(2000, () => {
            func.refreshFileList();
        });
        // .Git目录刷新事件
        const debounceGitHEAD = debounce(1200, () => {
            func.refreshHEAD();
        });

        watcherListen = chokidar.watch(projectDir, {
            ignored: path => ["node_modules",'unpackage', 'dist', '.git/objects'].some(s => path.includes(s)),
            ignoreInitial: true
        }).on('all', (event, vpath) => {
            let basename = path.basename(vpath);
            if (basename == 'index.lock') return;
            let isGitDirFile = vpath.includes(('.git/' + basename)) ? true : false;

            if (event == 'change' && vpath == path.join(gitDir, 'index')) {
                lastListeningFileInfo = undefined;
            };

            // 2021-03-26 解决频繁编辑一个文件，触发监听的问题
            // 2021-05-04 也是修改后，实时监听。有必要？已知问题：在低配置电脑上，会引发性能问题。
            if (event == 'change' && !isGitDirFile) {
                let tmpStr = 'event' + ' - ' + vpath;
                if (lastListeningFileInfo == tmpStr) {
                    return;
                };
                lastListeningFileInfo = tmpStr;
            };

            // 监听项目目录，不包含.git
            if (isGitDirFile == false && ['change', 'add', 'unlink', 'unlinkDir'].includes(event) && GitHBuilderXInnerTrigger == false) {
                listeningProjectFile = true;
                lastFileInfo = undefined;
                debounceFileList();
                setTimeout(function(){
                    listeningProjectFile = false;
                }, 1800);
            };
            // 仅监听.git
            if (isGitDirFile == true && event == 'change' && GitHBuilderXInnerTrigger == false && listeningProjectFile == false) {
                if (['FETCH_HEAD', 'HEAD','ORIG_HEAD'].includes(basename) || vpath.includes(refsPath) || vpath.includes(refsHeads)) {
                    debounceGitHEAD();
                } else if (['index', 'ORIG_HEAD'].includes(basename)) {
                    debounceFileList();
                } else if (basename == 'COMMIT_EDITMSG') {
                    debounceFileList();
                };
                setTimeout(function(){
                    listeningProjectFile = false;
                }, 1800);
            };
        });
    } catch (e) {};
};

/**
 * @description 自动刷新提示框
 */
let watcherPrompt;
function watchUserPrompt() {
    let UserPrompt = hxConfig.get('EasyGit.isShowPromptForAutoRefresh');
    if (UserPrompt == undefined) {
        hx.window.showInformationMessage('EasyGit：项目文件发生变动时，源代码管理器视图会自动刷新更改的文件列表。<a href="https://easy-git.github.io/setting/autoRefresh">详情</a>', ['关闭自动刷新', '我知道了']).then( (btn) => {
            if (btn == '关闭自动刷新') {
                hxConfig.update('EasyGit.mainViewAutoRefreshFileList', false).then(() => {});
            };
            // 当EasyGit.isShowPromptForAutoRefresh为true时，不再提示
            hxConfig.update('EasyGit.isShowPromptForAutoRefresh', true).then(() => {});
            watcherPrompt = true;
        });
    } else {
        watcherPrompt = true;
    };
};

/**
 * @description 显示webview
 * @param {Object} userConfig 用户配置
 * @param {Object} webviewPanel
 * @param {Object} ProjectData
 */
function active(webviewPanel, userConfig, ProjectData) {
    const view = webviewPanel.webView;
    hx.window.showView({
        viewid: 'EasyGitSourceCodeView',
        containerid: 'EasyGitSourceCodeView'
    });

    // get project info , and git info
    const { projectPath, projectName } = ProjectData;

    // UI: color and svg icon
    var uiData = getUIData();

    // get webview html content, go set
    view.html = html.getWebviewContent(userConfig, uiData, ProjectData);

    // Git: 文件
    let File = new GitFile(webviewPanel, projectPath, projectName, uiData, userConfig);

    // Git: Config配置
    let GitCfg = new GitConfig(projectPath);

    let EasyGitInnerParams = {
        'projectPath': projectPath,
        'projectName': projectName,
        'easyGitInner': true
    };

    // 记录监听的项目路径, 解决项目切换问题
    if (watchProjectPath != undefined && watchProjectPath != projectPath) {
        if (watcherListen != undefined) {
            watcherListen.close();
            watcherListen = undefined;
        };
    };
    watchProjectPath = projectPath;

    // 监听项目文件，如果有变动，则刷新; 关闭自动刷新，则不再监听。
    let { mainViewAutoRefreshFileList } = userConfig;
    if (mainViewAutoRefreshFileList && watcherListen == undefined) {
        let waitTime = osName == 'darwin' ? 5000 : 11000;
        setTimeout(function() {
            watchProjectDir(projectPath, File);
        }, waitTime);
    };

    view.onDidReceiveMessage((msg) => {
        GitHBuilderXInnerTrigger = true;
        let action = msg.command;
        switch (action) {
            case 'syncProjectGitInfo':
                // 获取变更的文件列表、当前分支、behind、ahead等信息
                File.refreshFileList();
                break;
            case 'diff':
                File.openDiff(msg);
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
                File.commit(msg);
                break;
            case 'ResetSoftHEAD':
                File.resetLastCommit();
                break;
            case 'ResetHardHEAD':
                File.resetHard(msg.version);
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
            case 'mergeConflicted':
                utils.gitCheckoutConflicted(projectPath, msg.data);
                break;
            case 'stash':
                // 包含：储藏、储藏全部、查看储藏、弹出储藏等
                gitAction.action(EasyGitInnerParams,msg.option);
                break;
            case 'cancelStaged':
                // 取消暂存
                File.cancelStaged(msg.fileUri, msg.tag);
                break;
            case 'cancelAllStaged':
                // 取消全部暂存
                File.cancelStaged('*');
                break;
            case 'pull':
                File.pull(msg);
                break;
            case 'fetch':
                File.fetch(msg.text);
                break;
            case 'BranchInfo':
                let { originurl, text } = msg;
                if (text == 'branch') {
                    if (originurl == undefined && !originurl) {
                        hx.window.showErrorMessage('请发布此项目到远程到后再进行操作。', ['我知道了']);
                    } else {
                        hx.commands.executeCommand('EasyGit.branch',EasyGitInnerParams);
                        if (watcherListen != undefined) {
                            watcherListen.close().then( () => {
                                console.log("easy-git: stop watch");
                            });
                            watcherListen = undefined;
                        };
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
                utils.gitRepositoryUrl(projectPath);
                break;
            case 'switchLastBranch':
                File.switchLastBranch();
                break;
            case 'syncBehindAhead':
                File.syncBehindAhead();
                break;
            case 'send_msg':
                hx.window.setStatusBarMessage(msg.text, 10000, msg.level);
                break;
            case 'hxCommand':
                let {actionName, commandName} = msg;
                let commandparam = actionName ? EasyGitInnerParams : {};
                hx.commands.executeCommand(commandName, commandparam);
                break;
            default:
                break;
        };
        setTimeout(function() {
            GitHBuilderXInnerTrigger = false;
        }, 1500);
    });

    let configurationChangeDisplose = hx.workspace.onDidChangeConfiguration(function(event){
        if(event.affectsConfiguration("editor.colorScheme")){
            let ThemeColor = utils.getThemeColor();
            view.postMessage({
                "command": "themeColor",
                "data": ThemeColor
            });
        };
        if(event.affectsConfiguration("explorer.iconTheme")){
            hx.window.showInformationMessage("EasyGit: 检测到您切换了文件图标，Git管理视图，下次启动生效。", ["我知道了"]);
        }
    });
};


module.exports = {
    active
}
