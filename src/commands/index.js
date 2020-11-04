const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');

const file = require('../common/file.js');
const utils = require('../common/utils.js');

const { goStash, goStashPop, goStashClear } = require('./stash.js');
const { gitInitProject } = require('./repository.js');
const { gitAddFile, gitRestore, goCleanFile, goCommitAmend } = require('./file.js');
const { goSetConfig } = require('./base.js');

const { Tag, Branch } = require('./ref.js');
const gitBlameForLineChange = require('./blame.js');


/**
 * @description 提供webview视图外Git的操作
 */
function action(param,action_name) {
    if (param == null) {
        return hx.window.showErrorMessage('easy-git: 请在项目管理器选中项目后再试。', ['我知道了']);
    };

    let projectName, projectPath, selectedFile, easyGitInner;
    try{
        let {easyGitInner} = param;
        if (easyGitInner != undefined) {
            projectName = param.projectName;
            projectPath = param.projectPath;
            selectedFile = param.selectedFile;
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
        console.log(e);
        return hx.window.showErrorMessage('easy-git: 无法获取到项目路径，请在项目管理器选中项目后再试。');
    };

    let ProjectInfo = {
        'projectName': projectName,
        'projectPath': projectPath,
        'selectedFile': selectedFile,
        'easyGitInner': easyGitInner
    };

    // git tag: 标签相关操作
    let tag = new Tag(projectPath);

    // git branch: 分支相关操作
    let bch = new Branch();

    switch (action_name){
        case 'init':
            gitInitProject(ProjectInfo);
            break;
        case 'addRemoteOrigin':
            utils.gitAddRemoteOrigin(projectPath);
            break;
        case 'add':
            gitAddFile(ProjectInfo);
            break;
        case 'commitAmend':
            goCommitAmend(ProjectInfo);
            break;
        case 'resetLastCommit':
            utils.gitReset(projectPath, ['--soft', 'HEAD^'], 'Git: 插销上次commit');
            break;
        case 'restoreStaged':
            let t1 = new gitRestore();
            t1.restore(ProjectInfo, 'restoreStaged');
            break;
        case 'restoreChanged':
            let t2 = new gitRestore();
            t2.restore(ProjectInfo, 'restoreChanged');
            break;
        case 'pull':
            utils.gitPull(projectPath, {'rebase': true});
            break;
        case 'fetch':
            utils.gitFetch(projectPath);
            break;
        case 'push':
            utils.gitPush(projectPath);
            break;
        case 'BranchSwitch':
            bch.switchBranch(ProjectInfo);
            break;
        case 'BranchDelete':
            bch.del(ProjectInfo);
            break;
        case 'BranchMerge':
            bch.merge(ProjectInfo);
            break;
        case 'BranchMergeAbort':
            bch.mergeAbort(ProjectInfo);
            break;
        case 'cherryPick':
            let hashValue = param.hash;
            let info = Object.assign( {'hash': hashValue}, ProjectInfo);
            bch.cherryPick(info);
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
        case 'tagDetails':
            let { tagName } = param;
            tag.showDetails(tagName);
            break;
        default:
            break;
    };
};


module.exports = {
    action
}
