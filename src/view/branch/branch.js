const fs = require('fs');
const path = require('path');

const chokidar = require('chokidar');
const { debounce } = require('throttle-debounce');

const hx = require('hbuilderx');

let utils = require('../../common/utils.js');
const { Branch } = require('../../commands/ref.js');
const { gitInitAfterSetting } = require('../../commands/repository_init.js');

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
    let CommandPanelIcon = icon.getCommandPanelIcon(fontColor);

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
        ShowIcon,
        CommandPanelIcon
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

        let {localBranchList, remoteBranchList} = await utils.gitBranchList(this.projectPath, '-avvv');

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
        },{
            'projectName': this.projectName,
            'projectPath': this.projectPath,
            'GitAssignAction': GitAssignAction,
            'ahead': ahead,
            'behind': behind,
            'tracking': tracking,
            'originurl': originurl,
            'currentBranch': currentBranch
        });

        if (this.webviewPanel && this.firstInit == false) {
            this.webviewPanel.webView.postMessage({
                command: "reLoding",
                data: gitBranchData
            });
            return;
        };

        let bhtml = getWebviewBranchContent(this.userConfig, this.uiData, gitBranchData);
        this.webviewPanel.webView.html = bhtml;
        this.firstInit = false;
    };

    /**
     * @description 加载分支视图
     */
    async BranchList() {
        if (this.webviewPanel) {
            this.webviewPanel.webView.postMessage({
                command: "animation"
            });
        };

        // 获取分支数据
        let {localBranchList, remoteBranchList} = await utils.gitBranchList(this.projectPath, '-avvv');

        let currentBranch = '';
        for (let s of localBranchList) {
            if (s.current) {
                currentBranch = s.name;
                break;
            };
        };

        let gitBranchData = {
            'localBranchList': localBranchList,
            'remoteBranchList': remoteBranchList
        };

        this.webviewPanel.webView.postMessage({
           command: "BranchList",
           data: gitBranchData
        });
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
            this.BranchList();
        };
    };

    // Git branch: 推送本地的分支到远端
    async LocalToRemote(branchName) {
        let toStatus = await utils.gitLocalBranchToRemote(this.projectPath, branchName);
        if (toStatus == 'success') {
            this.BranchList();
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

        // 合并
        if (mergeStatus == 'Already up to date.') {
            utils.hxShowMessageBox('Git 分支合并', "合并结果：Already up to date。没有要合并的提交或文件。", ["关闭"]).then(btnText => {})
            return;
        };

        hx.commands.executeCommand('EasyGit.main', param);
        if (mergeStatus != undefined) {
            let that = this;
            setTimeout(function() {
                let msg = `${toBranch} 合并 ${fromBranch} 分支成功，请选择接下来的操作？`;
                let btns = ['稍后推送', '立即推送'];
                if (mergeStatus == 'conflicts') {
                    msg = `${toBranch} 合并 ${fromBranch} 分支，部分文件存在冲突，请选择接下来的操作？\n\n源代码管理器视图，每个文件，鼠标悬停，即可显示解决冲突的图标，点击可以选择：采用远端、采用本地。`;
                    btns = ['取消合并', '关闭']
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
        let delMsg = `确定要删除 ${branchName} 分支? \n\n`;
        if (title.includes("远程分支")) {
            delMsg = delMsg + "请注意：远程分支删除后无法恢复。"
        } else {
            delMsg = delMsg + "请注意：如果本地分支未推送到远端，当删除本地分支后，代码无法恢复。"
        };
        let btn = await utils.hxShowMessageBox(title, delMsg, ['删除','关闭']).then((result) =>{
            return result;
        });
        if (btn != '删除') return;

        if (branchName.includes('origin/')) {
            let delStatus1 = await utils.gitDeleteRemoteBranch(this.projectPath,branchName);
            if (delStatus1 == 'success') {
                this.BranchList();
            };
        } else {
            let delStatus2 = await utils.gitDeleteLocalBranch(this.projectPath,branchName);
            if (delStatus2 == 'success') {
                this.BranchList();
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
    };

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

    // Git tag: delete
    async TagDelete(tagName) {
        let param = {
            "tagName": tagName,
            "projectPath": this.projectPath,
            "projectName": this.projectName,
            "easyGitInner": true
        };
        hx.commands.executeCommand('EasyGit.tagDelete', param);
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
        const debounceGit = debounce(1000, () => {
            func.LoadingBranchView();
        });

        const debounceGitForTag = debounce(2000, () => {
            func.TagList();
        });

        let GitDir = path.join(projectDir, '.git');
        let ignoredDir = path.join(projectDir, '.git', 'objects');
        watcherListen = chokidar.watch(GitDir, {
            ignored: ignoredDir,
            ignoreInitial: true
        }).on('all', (event, vpath) => {
            if (vpath == 'index.lock' && !['FETCH_HEAD', 'HEAD','ORIG_HEAD'].includes(filename) ) return;
            if (['change', 'add', 'unlink', 'unlinkDir'].includes(event) && GitHBuilderXInnerTrigger == false) {
                if (vpath.includes('.git/refs/tags/')) {
                    debounceGitForTag();
                } else {
                    debounceGit();
                };
            };
        });
    } catch (e) {};
};


/**
 * @description 显示webview
 * @param {Object} userConfig 用户配置
 * @param {Object} webviewPanel
 * @param {Object} projectData - {projectPath, projectName}
 */
async function GitBranchView(webviewPanel, userConfig, projectData) {
    const view = webviewPanel.webView;
    hx.window.showView({
        viewid: 'EasyGitSourceCodeView',
        containerid: 'EasyGitSourceCodeView'
    });

    // get project name and project path
    const { projectPath, projectName } = projectData;

    let currentProjectData = {
        'projectPath': projectPath,
        'projectName': projectName,
        'easyGitInner': true
    };

    // UI: color and svg icon
    let uiData = getUIData();

    // Git: 分支
    let GitData = await utils.gitStatus(projectPath);
    let ProjectGitInfo = {"projectPath":projectPath, "projectName":projectName, ...GitData}
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
                goPublish(msg);
                break;
            case 'fetch':
                fetch(projectPath,msg.text);
                break;
            case 'BranchList':
                Branch.BranchList();
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
            case 'BranchCreateForExecuteCommand':
                let BcParams = Object.assign({'ref': msg.refName, 'action': msg.action}, currentProjectData);
                hx.commands.executeCommand('EasyGit.BranchCreate', BcParams);
                break;
            case 'pushBranchToRemote':
                Branch.LocalToRemote(msg.text);
                break;
            case 'BranchMerge':
                Branch.merge(msg.from,msg.to);
                break;
            case 'openBranchMerge':
                hx.commands.executeCommand('EasyGit.merge', currentProjectData);
                break;
            case 'BranchDiff':
                hx.commands.executeCommand('EasyGit.BranchDiff', currentProjectData);
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
            case 'TagDelete':
                Branch.TagDelete(msg.name);
                break;
            case 'TagList':
                Branch.TagList();
                break;
            case 'openCommandPanel':
                hx.commands.executeCommand('EasyGit.CommandPanel', currentProjectData);
                break;
            default:
                break;
        };
        setTimeout(function() {
            GitHBuilderXInnerTrigger = false;
        }, 2000);
    });

    // git publish
    async function goPublish(msg) {
        let branchName = msg.text;
        let tmp = {"projectName": projectName, "projectPath": projectPath, "easyGitInner": true };
        try{
            let aro = new gitInitAfterSetting();
            let pushStatus =  await aro.main(tmp);
            if (pushStatus.status == 'success') {
                Branch.LoadingBranchView();
            };
        }catch(e){};
    };

    // git fetch
    async function fetch(projectPath, source) {
        let fetchStatus = await utils.gitFetch(projectPath);
        if (fetchStatus == 'success') {
            Branch.LoadingBranchView();
        };
    };

    let configurationChangeDisplose = hx.workspace.onDidChangeConfiguration(function(event){
        if(event.affectsConfiguration("editor.colorScheme")){
            let ThemeColor = utils.getThemeColor();
            view.postMessage({
                "command": "themeColor",
                "data": ThemeColor
            });
        }
    });

};


module.exports = GitBranchView;
