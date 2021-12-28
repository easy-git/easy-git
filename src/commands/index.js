const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');

const file = require('../common/file.js');
const utils = require('../common/utils.js');
const count = require('../common/count.js');

const quickOpen = require('../commands/quick_open.js');
const sshKeygen = require('../commands/ssh_keygen.js');

const { gitRepositoryCreate } = require('../commands/repository.js');
const { openOAuthBox } = require('../common/oauth.js');

const { goStash, goStashPop, goStashClear, goStashShow } = require('./stash.js');
const { gitInitProject } = require('./repository_init.js');
const { gitAddFile, goCleanFile, goCommit } = require('./file.js');
const { goSetConfig, goShowConfig } = require('./base.js');

const { Tag, Branch, BranchCreate, Revert, Reset, Archive, reflog, showHashFileContent } = require('./ref.js');
const openBranchDiffView = require('./branch_diff.js');

const gitBlameForLineChange = require('./blame.js');
const gitAnnotate = require('./annotate.js');

const gitConfig = require('./gitConfig.js');

/**
 * @description 提供webview视图外Git的操作
 */
async function action(param, action_name) {
    let easyGitInner, projectName, projectPath, selectedFile, isFromGitView;
    try{
        if (param != null) {
            easyGitInner = param.easyGitInner;
        };
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
    } catch(e){
        return hx.window.showErrorMessage('easy-git: 无法获取到项目路径，请在项目管理器选中项目后再试。', ["我知道了"]);
    };

    let ProjectInfo = {
        'projectName': projectName,
        'projectPath': projectPath,
        'selectedFile': selectedFile,
        'easyGitInner': easyGitInner,
        'isFromGitView': isFromGitView
    };

    let action_list = ["init"];
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
    try{
        let gitCountList = [
            "init",
            "add", "commit", "commitAmend",
            "cherryPick",
            "BranchDiff", "twoBranchSpecificFileDiff", "BranchSwitch", "BranchMerge",
            "annotate", "BlameForLineChange",
            "stash", "stashAll",
            "tagCreate"
        ];
        if (gitCountList.includes(action_name)) {
            count(action_name);
        };
    }catch(e){};

    switch (action_name){
        case 'init':
            gitInitProject(ProjectInfo);
            break;
        case 'addRemoteOrigin':
            utils.gitAddRemoteOrigin(projectPath);
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

    try{
        count(action_name);
    }catch(e){};

    switch (action_name){
        case 'quickOpenGitProject':
            quickOpen(param);
            break;
        case 'CreateRemoteRepository':
            gitRepositoryCreate(param);
            break;
        case 'sshKeygen':
            sshKeygen();
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
