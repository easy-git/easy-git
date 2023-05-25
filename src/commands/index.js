const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');

const file = require('../common/file.js');
const utils = require('../common/utils.js');
const count = require('../common/count.js');

const { openOAuthBox } = require('../common/oauth.js');

const quickOpen = require('./quick_open.js');
const sshKeygen = require('./ssh_keygen.js');
const { goStash, goStashPop, goStashClear, goStashShow } = require('./stash.js');

const { gitRepositoryCreate } = require('./repository.js');
const { gitInitProject, gitInitAfterSetting } = require('./repository_init.js');

const { gitAddFile, goCleanFile, goCommit } = require('./file.js');
const { goSetConfig, goShowConfig } = require('./base.js');

const { Tag, Branch, BranchCreate, Revert, Reset, Archive, reflog, showHashFileContent } = require('./ref.js');
const openBranchDiffView = require('./branch_diff.js');

const gitBlameForLineChange = require('./blame.js');
const gitAnnotate = require('./annotate.js');

const gitConfig = require('./gitConfig.js');
const gitGrep = require('./grep.js');

const gitignore = require('./gitignore.js');

// 检查是否安装Git
let isInstallGitForLocal;

// 上次信息
let lastProjectInfo = {};

/**
 * @description 提供webview视图外Git的操作
 */
async function action(param, action_name) {
    let easyGitInner, projectName, projectPath, selectedFile, isFromGitView;

    if (param != null) {
        try{
            easyGitInner = param.easyGitInner;
            if (easyGitInner != undefined) {
                projectName = param.projectName;
                projectPath = param.projectPath;
                selectedFile = param.selectedFile;
                isFromGitView = param.isFromGitView;
            } else {
                try {
                    projectName = param.workspaceFolder.name;
                    projectPath = param.workspaceFolder.uri.fsPath;
                    selectedFile = param.fsPath;
                } catch (e) {
                    projectName = param.document.workspaceFolder.name;
                    projectPath = param.document.workspaceFolder.uri.fsPath;
                    selectedFile = param.document.uri.fsPath;
                };
            };

            // 保存全局项目信息
            global_git_projectInfo.projectPath = projectPath;
            global_git_projectInfo.projectName = projectName;
        } catch(e){
            return hx.window.showErrorMessage('easy-git: 无法得知您需要对哪个Git项目进行操作，请在项目管理器选中项目后再试。', ["我知道了"]);
        };
    };

    // 不需要获取项目信息的就能进行git操作的命令
    let NotFocusList = ['set-username-useremail'];
    
    // 当无法从hx获取到焦点时的处理
    if (param == null && !NotFocusList.includes(action_name)) {
        // 方法1： 当无法获取到焦点时，使用全局记忆的项目信息
        // if (global_git_projectInfo.projectPath != "" && global_git_projectInfo.projectName != "") {
        //     projectName = global_git_projectInfo.projectName;
        //     projectPath = global_git_projectInfo.projectPath;
        //     let btnText = await utils.hxShowMessageBox(`提示`, `由于没有获取到焦点，请确认是否是对 ${projectName} 项目进行 git ${action_name} 操作。` ["否","是"]);
        //     if (btnText != "是") return;
        // };

        // 方法2：当无法获取到焦点时，弹出快速选择项目
        let quickInfo = await quickOpen({}, true);
        if (quickInfo == undefined || typeof quickInfo != 'object') return;
        projectName = quickInfo.projectName;
        projectPath = quickInfo.projectPath;
        if (!fs.existsSync(projectPath)) return;
    };


    let ProjectInfo = {
        'projectName': projectName,
        'projectPath': projectPath,
        'selectedFile': selectedFile,
        'easyGitInner': easyGitInner,
        'isFromGitView': isFromGitView
    };

    // 记录当前操作的项目信息
    let lastProjectInfo = {projectName, projectPath};

    // 检查本机是否安装Git
    isInstallGitForLocal = await utils.isGitInstalled();
    if (!isInstallGitForLocal) {
        hx.window.showErrorMessage('检测到您本机未安装Git命令行工具! 如已安装，还提示此错误，请重启HBuilderX。<a href="https://easy-git.github.io/home/git-install">安装教程</a>',['下载Git','关闭']).then((result) => {
            if (result == '下载Git') {
                hx.env.openExternal('https://git-scm.com/download');
            };
        });
        return;
    };

    let action_list = ["init", "set-username-useremail"];
    if (easyGitInner != true && !action_list.includes(action_name)) {
        let isGit = await utils.checkIsGitProject(projectPath).catch( error => { return 'No' });
        if (isGit == 'No') {
            hx.window.showErrorMessage("EasyGit: 请将焦点置于项目管理器Git项目、或在编辑器打开Git项目下的文件后，再进行操作。", ["我知道了"]);
            return;
        };
    };

    // git tag: 标签相关操作
    let tag = new Tag(projectPath);

    // git branch: 分支相关操作
    let bch = new Branch();

    // 不需要统计所有git操作，只统计某些
    // try{
    //     let gitCountList = [
    //         "init",
    //         "add", "RemoteRmOrigin","commit", "commitAmend",
    //         "cherryPick", "grep",
    //         "BranchDiff", "twoBranchSpecificFileDiff", "BranchSwitch", "BranchMerge",
    //         "annotate", "BlameForLineChange",
    //         "stash", "stashAll",
    //         "tagCreate", "archive",
    //         "reflog", "annotate", "BlameForLineChange",
    //         "showAnotherBranchFile",
    //         "gitignore"
    //     ];
    //     if (gitCountList.includes(action_name)) {
    //         count(action_name);
    //     };
    // }catch(e){};

    switch (action_name){
        case 'init':
            gitInitProject(ProjectInfo);
            break;
        case 'gitignore':
            gitignore(ProjectInfo);
            break;
        case 'addRemoteOrigin':
            let remoteParam = Object.assign(ProjectInfo);
            let {git_service} = param;
            if (git_service) {
                remoteParam = Object.assign(ProjectInfo, {"git_service": git_service});
            };
            let aro = new gitInitAfterSetting();
            aro.main(remoteParam);
            break;
        case 'RemoteRmOrigin':
            utils.gitRmRemoteOrigin(projectPath, projectName);
            break;
        case 'add':
            gitAddFile(ProjectInfo);
            break;
        case 'commit':
            goCommit(ProjectInfo);
            break;
        case 'commitAmend':
            goCommit(ProjectInfo, true);
            break;
        case 'resetSoftLastCommit':
            let rt = new Reset();
            rt.resetSoftLastCommit(ProjectInfo);
            break;
        case 'resetHard':
            let rt0 = new Reset();
            rt0.resetHard(ProjectInfo, 'HEAD');
            break;
        case 'resetHardLastCommit':
            let rt1 = new Reset();
            rt1.resetHard(ProjectInfo, 'HEAD^');
            break;
        case 'resetHardCommitID':
            let rt2 = new Reset();
            rt2.resetHardCommitID(ProjectInfo);
            break;
        case 'restoreStaged':
            let t1 = new utils.gitRestore();
            t1.restore(ProjectInfo, 'restoreStaged');
            break;
        case 'revert':
            let rinfo = Object.assign({ 'hash': param.hash }, ProjectInfo);
            let r = new Revert();
            r.run(rinfo);
            break;
        case 'restoreChanged':
            let t2 = new utils.gitRestore();
            t2.restore(ProjectInfo, 'restoreChanged');
            break;
        case 'openPullOptions':
            // 使用quickpick样式打开pull多个选项
            break;
        case 'pull':
            utils.gitPull(projectPath);
            break;
        case 'pullRebase':
            utils.gitPull(projectPath, ["--rebase"]);
            break;
        case 'pullRebaseAutostash':
            utils.gitPull(projectPath, ["--rebase", "--autostash"])
            break;
        case 'fetch':
            utils.gitFetch(projectPath);
            break;
        case 'push':
            utils.gitPush(projectPath);
            break;
        case 'pushForce':
            utils.gitPush(projectPath, ['--force']);
            break;
        case 'pushForceWithLease':
            utils.gitPush(projectPath, ['--force-with-lease']);
            break;
        case 'pushNoVerify':
            bch.LocalBranchToRemote(ProjectInfo, ['--no-verify'])
            break;
        case 'push --set-upstream':
            bch.LocalBranchToRemote(ProjectInfo)
            break;
        case 'BranchSwitch':
            bch.switchBranch(ProjectInfo);
            break;
        case 'BranchCreate':
            let bc_info = Object.assign({ 'refStartPoint': param.ref , 'actionType': param.action }, ProjectInfo);
            let bc = new BranchCreate();
            bc.main(bc_info);
            break;
        case 'BranchDelete':
            bch.del(ProjectInfo);
            break;
        case 'BranchRename':
            bch.renameBranch(ProjectInfo);
            break;
        case 'BranchMerge':
            bch.merge(ProjectInfo);
            break;
        case 'BranchMergeAbort':
            bch.mergeAbort(ProjectInfo);
            break;
        case 'cherryPick':
            let hashValue = param.hash;
            let info = Object.assign({'hash': hashValue}, ProjectInfo);
            bch.cherryPick(info);
            break;
        case 'showAnotherBranchFile':
            bch.showAnotherBranchFile(ProjectInfo);
            break;
        case 'showHashFileContent':
            showHashFileContent(ProjectInfo);
            break;
        case 'BranchDiff':
            // 打开分支对比视图
            openBranchDiffView(ProjectInfo);
            break;
        case 'twoBranchSpecificFileDiff':
            // 示两个分支指定文件的差异
            let isSpecificFile = true;
            openBranchDiffView(ProjectInfo, isSpecificFile);
            break;
        case 'clean':
            goCleanFile(ProjectInfo);
            break;
        case 'stash':
            goStash(ProjectInfo, '', 'Git: 储藏(stash)');
            break;
        case 'stashAll':
            goStash(ProjectInfo, '-a', 'Git: 全部储藏(stash)')
            break;
        case 'stashPop':
            goStashPop(ProjectInfo, 'isOther');
            break;
        case 'stashPopNew':
            goStashPop(ProjectInfo, 'isNew');
            break;
        case 'stashClear':
            goStashClear(ProjectInfo);
            break;
        case 'stashShow':
            let stashShow = new goStashShow(ProjectInfo);
            stashShow.main();
            break;
        case 'set-username-useremail':
            gitConfig(projectPath);
            break;
        case 'setEmail':
            goSetConfig(projectPath, action_name);
            break;
        case 'BlameForLineChange':
            gitBlameForLineChange(projectPath, selectedFile);
            break;
        case 'grep':
            let gp = new gitGrep(ProjectInfo);
            gp.main();
            break;
        case 'tagCreate':
            let { hash } = param;
            tag.create(hash, param);
            break;
        case 'tagDelete':
            tag.delete(param.tagName);
            break;
        case 'tagDetails':
            const { tagName } = param;
            tag.showDetails(tagName);
            break;
        case 'archive':
            let archiveValue = param.hash;
            let archiveInfo = Object.assign( {'hash': archiveValue}, ProjectInfo);
            let ae = new Archive(archiveInfo);
            ae.set();
            break;
        case 'reflog':
            reflog(ProjectInfo);
            break;
        case 'annotate':
            gitAnnotate(ProjectInfo);
            break;
        case 'openGitRepositoryInBrowser':
            utils.gitRepositoryUrl(projectPath);
            break;
        case 'showConfigLocal':
            goShowConfig(projectPath, '--local');
            break;
        case 'showConfigGlobal':
            goShowConfig(projectPath, '--global');
            break;
        case 'showConfigSystem':
            goShowConfig(projectPath, '--system');
            break;
        case 'showConfigAll':
            goShowConfig(projectPath, '--show-origin');
            break;
        default:
            break;
    };
};


/**
 * @description 独立的功能
 */
async function independentFunction(action_name, param) {

    // try{
    //     count(action_name);
    // }catch(e){};

    switch (action_name){
        case 'quickOpenGitProject':
            quickOpen(param);
            break;
        case 'CreateRemoteRepository':
            gitRepositoryCreate(param);
            break;
        case 'sshKeygen':
            let ssh = new sshKeygen()
            ssh.main();
            break;
        case 'openOAuthBox':
            openOAuthBox();
            break;
        default:
            break;
    };
};

module.exports = {
    action,
    independentFunction
}
