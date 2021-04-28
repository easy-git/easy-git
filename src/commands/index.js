const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');

const file = require('../common/file.js');
const utils = require('../common/utils.js');
const count = require('../common/count.js');

const { goStash, goStashPop, goStashClear, goStashShow } = require('./stash.js');
const { gitInitProject } = require('./repository.js');
const { gitAddFile, gitRestore, goCleanFile, goCommit } = require('./file.js');
const { goSetConfig, goShowConfig } = require('./base.js');

const { Tag, Branch, Revert, Reset, Archive, reflog, showHashFileContent } = require('./ref.js');
const openBranchDiffView = require('./branch_diff.js');

const gitBlameForLineChange = require('./blame.js');
const gitAnnotate = require('./annotate.js');

/**
 * @description 失焦操作
 */
async function unfocusedAction() {
    // 将焦点置于编辑器
    try{
        await hx.commands.executeCommand('workbench.action.focusEditor');
    }catch(e){
        return null;
    };
    // 获取激活的项目信息
    let activeEditor = await hx.window.getActiveTextEditor().then(function(editor){
        return editor;
    });
    return activeEditor;
};

/**
 * @description 提供webview视图外Git的操作
 */
async function action(param,action_name) {
    if (param == null) {
        param = await unfocusedAction();
        if (param == null) {
            return hx.window.showErrorMessage('easy-git: 请在项目管理器选中项目后再试。', ['我知道了']);
        };
    };

    let projectName, projectPath, selectedFile, easyGitInner, isFromGitView;
    try{
        let {easyGitInner} = param;
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
            let t1 = new gitRestore();
            t1.restore(ProjectInfo, 'restoreStaged');
            break;
        case 'revert':
            let rinfo = Object.assign({ 'hash': param.hash }, ProjectInfo);
            let r = new Revert();
            r.run(rinfo);
            break;
        case 'restoreChanged':
            let t2 = new gitRestore();
            t2.restore(ProjectInfo, 'restoreChanged');
            break;
        case 'pull':
            utils.gitPull(projectPath);
            break;
        case 'pullRebase':
            utils.gitPull(projectPath, {'rebase': true});
            break;
        case 'fetch':
            utils.gitFetch(projectPath);
            break;
        case 'push':
            utils.gitPush(projectPath);
            break;
        case 'push --set-upstream':
            bch.LocalBranchToRemote(ProjectInfo)
            break;
        case 'BranchSwitch':
            bch.switchBranch(ProjectInfo);
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
        case 'setUserName':
            goSetConfig(projectPath, action_name);
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
            tag.delete();
            break;
        case 'tagDetails':
            let { tagName } = param;
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


module.exports = {
    action
}
