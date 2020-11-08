const hx = require("hbuilderx");
const path = require('path');

const index = require("./index.js");
const file = require('./common/file.js');
const git = require('./commands/index.js');
const cmp_hx_version = require('./common/cmp.js');

const upgrade = require('./common/upgrade.js');
let showCommandPanel = require('./commands/commandPanel.js');

// hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');

// git logView and FileView, use WebView
let source = 'viewMenu';
let FileView = hx.window.createWebView("EasyGitSourceCodeView", {
    enableScritps: true
});

let CommonView = hx.window.createWebView("EasyGitCommonView", {
    enableScritps: true
});


/**
 * @todo 多个视图一起执行的问题
 */
function activate(context) {
    context.source = 'viewMenu';

    // hbuilderx version 2.9.2+ , git log view, use customEditor
    const cmp = cmp_hx_version(hxVersion, '2.9.2');
    if (cmp <= 0) {
        // git log customEditor view
        var { CatCustomEditorProvider, GitLogCustomWebViewPanal } = require('./view/log/openCustomEditor.js');
        let provider = new CatCustomEditorProvider({}, {}, {});
        hx.window.registerCustomEditorProvider("EasyGit - 日志", provider);

        // git file diff cusomtEditor view
        var { CatDiffCustomEditorProvider, GitDiffCustomWebViewPanal } = require('./view/diff/openCustomEditor.js');
        let providerForDiff = new CatDiffCustomEditorProvider({}, {}, {});
        hx.window.registerCustomEditorProvider("EasyGit - 对比差异", providerForDiff);
    };

    // 命令面板
    let CommandPanel = hx.commands.registerCommand('EasyGit.CommandPanel', (param) => {
        showCommandPanel(param);
    });
    context.subscriptions.push(CommandPanel);

    // 菜单【源代码管理】，菜单【工具】、及项目管理器右键菜单
    let fv = hx.commands.registerCommand('EasyGit.main', (param) => {
        context.source = 'filesExplorer';
        index.main('main',param, FileView, context);
    });
    context.subscriptions.push(fv);

    // 菜单【分支管理】，菜单【工具】、及项目管理器右键菜单
    let branch = hx.commands.registerCommand('EasyGit.branch', (param) => {
        context.source = 'filesExplorer';
        index.main('branch',param, FileView, context);
    });
    context.subscriptions.push(branch);

    // 菜单【日志】
    let log = hx.commands.registerCommand('EasyGit.log', (param) => {
        if (param == undefined) {return};
        if (cmp <=0) {
            let LogCscratFile = path.join(__dirname, 'view',  'log', 'cscrat', 'EasyGit - 日志');
            hx.workspace.openTextDocument(LogCscratFile);
        };
        context.source = 'filesExplorer';
        index.main('log',param, CommonView, context);
    });
    context.subscriptions.push(log);

    // 菜单【工具】【克隆存储库】
    let clone = hx.commands.registerCommand('EasyGit.clone',(param) => {
        context.source = 'clone';
        index.main('clone',param, FileView, context);
    });
    context.subscriptions.push(clone);

    // 菜单【工具】【关于】
    let about = hx.commands.registerCommand('EasyGit.about', () => {
        let url = "https://ext.dcloud.net.cn/plugin?name=easy-git";
        hx.env.openExternal(url);
    });

    // 菜单【工具】【设置】
    let setting = hx.commands.registerCommand('EasyGit.set', ()=> {
        hx.commands.executeCommand('workbench.action.openGlobalSettings');
    });

    // 设置 git user.name
    let setUserName = hx.commands.registerCommand('EasyGit.setUserName', (param)=> {
        git.action(param, 'setUserName');
    });

    // 设置 git user.name
    let setEmail = hx.commands.registerCommand('EasyGit.setEmail', (param)=> {
        git.action(param, 'setEmail');
    });

    // 菜单 【.gitignore】
    let setGitignore = hx.commands.registerCommand('EasyGit.setGitingore', (param)=> {
        file.gitignore(param);
    });

    // 菜单【.gitattributes】
    let setGitattributes= hx.commands.registerCommand('EasyGit.setGitattributes', (param)=> {
        file.gitattributes(param);
    });

    // Git init
    let init = hx.commands.registerCommand('EasyGit.init',(param) => {
        git.action(param, 'init');
    });
    context.subscriptions.push(init);

    // Git add remote origin
    let addRemoteOrigin = hx.commands.registerCommand('EasyGit.addRemoteOrigin',(param) => {
        git.action(param, 'addRemoteOrigin');
    });
    context.subscriptions.push(addRemoteOrigin);

    // Git add
    let add = hx.commands.registerCommand('EasyGit.add', (param)=> {
        git.action(param, 'add');
    });
    context.subscriptions.push(add);

    // git commit --amend
    let commitAmend = hx.commands.registerCommand('EasyGit.commitAmend', (param)=> {
        git.action(param, 'commitAmend');
    });
    context.subscriptions.push(commitAmend);

    // Git reset last commit
    let resetLastCommit = hx.commands.registerCommand('EasyGit.resetLastCommit', (param)=> {
        git.action(param, 'resetLastCommit');
    });
    context.subscriptions.push(resetLastCommit);

    // git restore --staged file
    let restoreStaged = hx.commands.registerCommand('EasyGit.restoreStaged', (param)=> {
        git.action(param, 'restoreStaged');
    });
    context.subscriptions.push(restoreStaged);

    // git restore --staged file
    let restoreChanged = hx.commands.registerCommand('EasyGit.restore', (param)=> {
        git.action(param, 'restoreChanged');
    });
    context.subscriptions.push(restoreChanged);

    // git revert
    let revert = hx.commands.registerCommand('EasyGit.revert', (param)=> {
        git.action(param, 'revert');
    });
    context.subscriptions.push(revert);

    // Git pull
    let pull = hx.commands.registerCommand('EasyGit.pull', (param)=> {
        git.action(param, 'pull');
    });
    context.subscriptions.push(pull);

    // Git fetch
    let fetch = hx.commands.registerCommand('EasyGit.fetch', (param)=> {
        git.action(param, 'fetch');
    });
    context.subscriptions.push(fetch);

    // Git push
    let push = hx.commands.registerCommand('EasyGit.push', (param)=> {
        git.action(param, 'push');
    });
    context.subscriptions.push(push);

    // Git Branch Switch
    let BranchSwitch = hx.commands.registerCommand('EasyGit.BranchSwitch', (param)=> {
        git.action(param, 'BranchSwitch');
    });
    context.subscriptions.push(BranchSwitch);

    // Git Branch delete
    let BranchDelete = hx.commands.registerCommand('EasyGit.BranchDelete', (param)=> {
        git.action(param, 'BranchDelete');
    });
    context.subscriptions.push(BranchDelete);

    // Git merge
    let merge = hx.commands.registerCommand('EasyGit.merge', (param)=> {
        git.action(param, 'BranchMerge');
    });
    context.subscriptions.push(merge);

    // Git merge --abort
    let mergeAbort = hx.commands.registerCommand('EasyGit.mergeAbort', (param)=> {
        git.action(param, 'BranchMergeAbort');
    });
    context.subscriptions.push(mergeAbort);

    // Git cherry-pick
    let cherryPick = hx.commands.registerCommand('EasyGit.cherryPick', (param)=> {
        git.action(param, 'cherryPick');
    });
    context.subscriptions.push(cherryPick);

    // Git clean
    let clean = hx.commands.registerCommand('EasyGit.clean', (param)=> {
        git.action(param, 'clean');
    });
    context.subscriptions.push(clean);

    // Git Stash
    let stash = hx.commands.registerCommand('EasyGit.stash', (param)=> {
        git.action(param, 'stash');
    });
    context.subscriptions.push(stash);

    // Git Stash all
    let stashAll = hx.commands.registerCommand('EasyGit.stashAll', (param)=> {
        git.action(param, 'stashAll');
    });
    context.subscriptions.push(stashAll);

    // git Stash pop
    let stashPop = hx.commands.registerCommand('EasyGit.stashPop', (param)=> {
        git.action(param, 'stashPop')
    });
    context.subscriptions.push(stashPop);

    // git Stash pop new
    let stashPopNew = hx.commands.registerCommand('EasyGit.stashPopNew', (param)=> {
        git.action(param, 'stashPopNew')
    });
    context.subscriptions.push(stashPopNew);

    // git Stash clear
    let stashClear = hx.commands.registerCommand('EasyGit.stashClear', (param)=> {
        git.action(param, 'stashClear')
    });
    context.subscriptions.push(stashClear);

    // check update
    let checkUpdate = hx.commands.registerCommand('EasyGit.checkUpdate', ()=> {
        upgrade.checkUpdate('manual');
    });
    context.subscriptions.push(checkUpdate);

    // git blame: show line last change info
    let ForLineChange = hx.commands.registerCommand('EasyGit.gitBlameForLineChange', (param)=> {
        const cmp3 = cmp_hx_version(hxVersion, '2.9.5');
        if (cmp3 <= 0) {
            git.action(param, 'BlameForLineChange')
        } else {
            hx.window.showErrorMessage('Git: 此功能适用于HBuilderX 2.9.5+版本。', ['升级HBuilderX', '关闭']).then( (res) => {
                if (res == '升级HBuilderX') {
                    hx.commands.executeCommand('update.checkForUpdate');
                }
            })
        }
    });
    context.subscriptions.push(ForLineChange);

    // git tag create
    let tagCreate = hx.commands.registerCommand('EasyGit.tagCreate', (param)=> {
        git.action(param, 'tagCreate');
    });
    context.subscriptions.push(tagCreate);

    // git tag details
    let tagDetails = hx.commands.registerCommand('EasyGit.tagDetails', (param)=> {
        git.action(param, 'tagDetails');
    });
    context.subscriptions.push(tagDetails);

    // git diff
    let diffFile = hx.commands.registerCommand('EasyGit.diffFile', (param)=> {
        if (param == undefined) {return};
        if (cmp <=0) {
            let DiffCscratFile = path.join(__dirname, 'view',  'diff', 'cscrat', 'EasyGit - 对比差异');
            hx.workspace.openTextDocument(DiffCscratFile);
        };
        context.source = 'filesExplorer';
        index.main('diff', param, {}, context);
    });
    context.subscriptions.push(diffFile);
};


function deactivate() {

};

module.exports = {
    activate,
    deactivate
}
