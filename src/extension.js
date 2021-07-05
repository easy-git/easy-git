const hx = require("hbuilderx");
const path = require('path');

const Main = require("./index.js");
const file = require('./common/file.js');
const cmp_hx_version = require('./common/cmp.js');
const upgrade = require('./common/upgrade.js');

const { getThemeColor } = require('./common/utils.js');
const { openOAuthBox } = require('./common/oauth.js');
const { Gitee, onUriForResponse } = require('./common/oauth.js');
const { goSetEncoding } = require('./commands/base.js');

const git = require('./commands/index.js');
const { gitRepositoryCreate } = require('./commands/repository.js');
const sshKeygen = require('./commands/ssh_keygen.js');

let showCommandPanel = require('./commands/commandPanel.js');

// hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');

// git logView and FileView, use WebView
let source = 'viewMenu';
let FileView = hx.window.createWebView("EasyGitSourceCodeView", {
    enableScritps: true
});

// 解决从扩展视图打开空白的问题
let {background} = getThemeColor('siderBar');
FileView.webView.html = `<body style="background-color: ${background};"><p style='margin-top: 2rem;font-size: 13px;'>请从项目管理器，选中项目，通过右键菜单打开源代码管理器。</p></body>`;


function activate(context) {
    context.source = 'viewMenu';

    // hbuilderx version 2.9.2+ , git log view, use customEditor
    const cmp = cmp_hx_version(hxVersion, '2.9.2');
    if (cmp <= 0) {
        // git log customEditor view
        var { CatCustomEditorProvider, GitLogCustomWebViewPanal } = require('./view/log/index.js');
        let provider = new CatCustomEditorProvider({}, {}, {});
        hx.window.registerCustomEditorProvider("EasyGit - 日志", provider);

        // git file diff cusomtEditor view
        var { CatDiffCustomEditorProvider, GitDiffCustomWebViewPanal } = require('./view/diff/CustomEditor.js');
        let providerForDiff = new CatDiffCustomEditorProvider({}, {}, {});
        hx.window.registerCustomEditorProvider("EasyGit - 对比差异", providerForDiff);
    };

    try {
        // 解决某些hx版本上，registerUriHandler拼写错误的Bug
        let cmpUri = cmp_hx_version(hxVersion, '2.8.12');
        if (cmpUri > 0) {
            hx.window.registerUriHanlder({
                handleUri: function(uri) {
                    onUriForResponse(uri);
                }
            }, context);
        } else {
            hx.window.registerUriHandler({
                handleUri: function(uri) {
                    onUriForResponse(uri);
                }
            }, context);
        };
    } catch (e) {
        console.error(e);
    };

    // 命令面板
    let CommandPanel = hx.commands.registerCommand('EasyGit.CommandPanel', (param) => {
        showCommandPanel(param);
    });
    context.subscriptions.push(CommandPanel);

    // 创建远程仓库
    let CreateRemoteRepository = hx.commands.registerCommand('EasyGit.CreateRemoteRepository', (param) => {
        if (param == null) {
            param = {};
        };
        gitRepositoryCreate(param);
    });
    context.subscriptions.push(CreateRemoteRepository);

    // 菜单【源代码管理】，菜单【工具】、及项目管理器右键菜单，打开源代码管理器视图
    let view_fv = hx.commands.registerCommand('EasyGit.main', (param) => {
        context.source = 'filesExplorer';
        let main_view = new Main('main', param, FileView, context);
        main_view.run();
    });
    context.subscriptions.push(view_fv);

    // 菜单【分支管理】，菜单【工具】、及项目管理器右键菜单，打开分支管理视图
    let view_branch_manage = hx.commands.registerCommand('EasyGit.branch', (param) => {
        context.source = 'filesExplorer';
        let view_branch = new Main('branch', param, FileView, context);
        view_branch.run();
    });
    context.subscriptions.push(view_branch_manage);

    // 菜单【日志】, 打开日志视图
    let view_log_manage = hx.commands.registerCommand('EasyGit.log', (param) => {
        if (param == undefined) {return};
        if (cmp <=0) {
            let LogCscratFile = path.join(__dirname, 'view',  'log', 'cscrat', 'EasyGit - 日志');
            hx.workspace.openTextDocument(LogCscratFile);
        } else {
            hx.window.showErrorMessage("EasyGit: 日志视图仅支持HBuilderX 2.9.2+版本，请升级HBuilderX。", ["我知道了"])
            return;
        };
        context.source = 'filesExplorer';
        let view_log = new Main('log', param, {}, context);
        view_log.run();
    });
    context.subscriptions.push(view_log_manage);

    // git diff view
    let view_diff_file = hx.commands.registerCommand('EasyGit.diffFile', (param)=> {
        if (param == undefined) {return};
        if (cmp <=0) {
            let DiffCscratFile = path.join(__dirname, 'view',  'diff', 'cscrat', 'EasyGit - 对比差异');
            hx.workspace.openTextDocument(DiffCscratFile);
        } else {
            hx.window.showErrorMessage("EasyGit: 文件对比视图仅支持HBuilderX 2.9.2+版本，请升级HBuilderX。", ["我知道了"])
            return;
        };
        context.source = 'filesExplorer';
        let view_diff = new Main('diff', param, {}, context);
        view_diff.run();
    });
    context.subscriptions.push(view_diff_file);

    // 分支对比
    let two_branch_diff = hx.commands.registerCommand('EasyGit.BranchDiff', (param) => {
        git.action(param, 'BranchDiff');
    });
    context.subscriptions.push(two_branch_diff);

    // 对比两个分支的某个文件（显示两个分支指定文件的差异）
    let two_branch_specific_file_diff = hx.commands.registerCommand('EasyGit.twoBranchSpecificFileDiff', (param) => {
        git.action(param, 'twoBranchSpecificFileDiff');
    });
    context.subscriptions.push(two_branch_specific_file_diff);

    // 菜单【工具】【克隆存储库】
    let clone = hx.commands.registerCommand('EasyGit.clone',(param) => {
        context.source = 'clone';
        let view_clone = new Main('clone',param, FileView, context);
        view_clone.run();
    });
    context.subscriptions.push(clone);

    // 菜单【工具】【关于】
    let about = hx.commands.registerCommand('EasyGit.about', () => {
        const { version } = require('../package.json');
        hx.window.showInformationMessage(`Easy-git：当前版本号是 ${version}`, ["评价/寻求帮助", "关闭"]).then( btn => {
            if (btn == '评价/寻求帮助') {
                let url = "https://ext.dcloud.net.cn/plugin?name=easy-git";
                hx.env.openExternal(url);
            };
        });
    });
    context.subscriptions.push(about);

    // 菜单【工具】【设置】
    let setting = hx.commands.registerCommand('EasyGit.set', ()=> {
        hx.commands.executeCommand('workbench.action.openGlobalSettings');
    });
    context.subscriptions.push(setting);

    // 设置 git user.name
    let setUserName = hx.commands.registerCommand('EasyGit.setUserName', (param)=> {
        git.action(param, 'setUserName');
    });
    context.subscriptions.push(setUserName);

    // 设置 git user.name
    let setEmail = hx.commands.registerCommand('EasyGit.setEmail', (param)=> {
        git.action(param, 'setEmail');
    });
    context.subscriptions.push(setEmail);

    // 设置 git config --global core.quotepath false
    let setEncodingForQuote = hx.commands.registerCommand('EasyGit.setEncodingForQuote', (param)=> {
        goSetEncoding('core.quotepath');
    });
    context.subscriptions.push(setEncodingForQuote);

    // 设置 git config --global i18n.logoutputencoding utf-8
    let setI18nLogoutputencoding = hx.commands.registerCommand('EasyGit.setI18nLogoutputencoding', (param)=> {
        goSetEncoding('i18n.logoutputencoding');
    });
    context.subscriptions.push(setI18nLogoutputencoding);

    // 菜单 【.gitignore】
    let setGitignore = hx.commands.registerCommand('EasyGit.setGitingore', (param)=> {
        file.gitignore(param);
    });
    context.subscriptions.push(setGitignore);

    // 菜单【.gitattributes】
    let setGitattributes= hx.commands.registerCommand('EasyGit.setGitattributes', (param)=> {
        file.gitattributes(param);
    });
    context.subscriptions.push(setGitattributes);

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

    // Git rm remote origin
    let RemoteRmOrigin = hx.commands.registerCommand('EasyGit.RemoteRmOrigin',(param) => {
        git.action(param, 'RemoteRmOrigin');
    });
    context.subscriptions.push(RemoteRmOrigin);

    // Git add
    let add = hx.commands.registerCommand('EasyGit.add', (param)=> {
        git.action(param, 'add');
    });
    context.subscriptions.push(add);

    // git commit
    let commit = hx.commands.registerCommand('EasyGit.commit', (param)=> {
        git.action(param, 'commit');
    });
    context.subscriptions.push(commit);

    // git commit --amend
    let commitAmend = hx.commands.registerCommand('EasyGit.commitAmend', (param)=> {
        git.action(param, 'commitAmend');
    });
    context.subscriptions.push(commitAmend);

    // Git reset last commit
    let resetSoftLastCommit = hx.commands.registerCommand('EasyGit.resetSoftLastCommit', (param)=> {
        git.action(param, 'resetSoftLastCommit');
    });
    context.subscriptions.push(resetSoftLastCommit);

    // git reset --hard HEAD
    let resetHard = hx.commands.registerCommand('EasyGit.resetHard', (param)=> {
        return git.action(param, 'resetHard');
    });
    context.subscriptions.push(resetHard);

    // git reset --hard HEAD^
    let resetHardLastCommit = hx.commands.registerCommand('EasyGit.resetHardLastCommit', (param)=> {
        return git.action(param, 'resetHardLastCommit');
    });
    context.subscriptions.push(resetHardLastCommit);

    // git reset
    let resetHardCommitID = hx.commands.registerCommand('EasyGit.resetHardCommitID', (param)=> {
        git.action(param, 'resetHardCommitID');
    });
    context.subscriptions.push(resetHardCommitID);

    // git restore --staged file
    let restoreStaged = hx.commands.registerCommand('EasyGit.restoreStaged', (param)=> {
        git.action(param, 'restoreStaged');
    });
    context.subscriptions.push(restoreStaged);

    // git restore file
    let restoreChanged = hx.commands.registerCommand('EasyGit.restore', (param)=> {
        git.action(param, 'restoreChanged');
    });
    context.subscriptions.push(restoreChanged);

    // git checkout -- file 备注：发现一些用户还是习惯性的使用checkout去放弃修改，为了兼容，故此增加此项。
    let checkoutFile = hx.commands.registerCommand('EasyGit.checkoutFile', (param)=> {
        git.action(param, 'restoreChanged');
    });
    context.subscriptions.push(checkoutFile);

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

    // Git pull --rebase
    let pullRebase = hx.commands.registerCommand('EasyGit.pullRebase', (param)=> {
        git.action(param, 'pullRebase');
    });
    context.subscriptions.push(pullRebase);

    // Git pull --rebase --autostash
    let pullRebaseAutostash = hx.commands.registerCommand('EasyGit.pullRebaseAutostash', (param)=> {
        git.action(param, 'pullRebaseAutostash');
    });
    context.subscriptions.push(pullRebaseAutostash);

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

    // Git push --force
    let pushForce = hx.commands.registerCommand('EasyGit.pushForce', (param)=> {
        git.action(param, 'pushForce');
    });
    context.subscriptions.push(pushForce);

    // Git push --force-with-lease
    let pushForceWithLease = hx.commands.registerCommand('EasyGit.pushForceWithLease', (param)=> {
        git.action(param, 'pushForceWithLease');
    });
    context.subscriptions.push(pushForceWithLease);

    // Git push --no-verify
    let pushNoVerify = hx.commands.registerCommand('EasyGit.pushNoVerify', (param)=> {
        git.action(param, 'pushNoVerify');
    });
    context.subscriptions.push(pushNoVerify);

    // Git push --set-upstream origin master
    let pushSetUpstream = hx.commands.registerCommand('EasyGit.pushSetUpstream', (param)=> {
        git.action(param, 'push --set-upstream');
    });
    context.subscriptions.push(pushSetUpstream);

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

    // Git Branch reanmeEasyGit.BranchRename
    let BranchRename = hx.commands.registerCommand('EasyGit.BranchRename', (param)=> {
        git.action(param, 'BranchRename');
    });
    context.subscriptions.push(BranchRename);

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

    // git Stash show
    let stashShow = hx.commands.registerCommand('EasyGit.stashShow', (param)=> {
        git.action(param, 'stashShow')
    });
    context.subscriptions.push(stashShow);

    // git archive
    let archive = hx.commands.registerCommand('EasyGit.archive', (param)=> {
        git.action(param, 'archive')
    });
    context.subscriptions.push(archive);

    // git reflog
    let reflog = hx.commands.registerCommand('EasyGit.reflog', (param)=> {
        git.action(param, 'reflog')
    });
    context.subscriptions.push(reflog);

    // git annotate
    let annotate = hx.commands.registerCommand('EasyGit.annotate', (param)=> {
        git.action(param, 'annotate')
    });
    context.subscriptions.push(annotate);

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

    // git tag -d
    let tagDelete = hx.commands.registerCommand('EasyGit.tagDelete', (param)=> {
        git.action(param, 'tagDelete');
    });
    context.subscriptions.push(tagDelete);

    // git tag details
    let tagDetails = hx.commands.registerCommand('EasyGit.tagDetails', (param)=> {
        git.action(param, 'tagDetails');
    });
    context.subscriptions.push(tagDetails);

    // git show branch:filename
    let showAnotherBranchFile = hx.commands.registerCommand('EasyGit.showAnotherBranchFile', (param)=> {
        git.action(param, 'showAnotherBranchFile')
    });
    context.subscriptions.push(showAnotherBranchFile);

    // git show commitID:filename 查看当前文件的历史提交版本内容
    let showHashFile = hx.commands.registerCommand('EasyGit.showHashFile', (param)=> {
        git.action(param, 'showHashFileContent')
    });
    context.subscriptions.push(showHashFile);

    // git open repository in the browser
    let openGitRepositoryInBrowser = hx.commands.registerCommand('EasyGit.openGitRepositoryInBrowser',(param)=> {
        git.action(param, 'openGitRepositoryInBrowser')
    });
    context.subscriptions.push(openGitRepositoryInBrowser);

    // git config --list --local
    let showConfigLocal = hx.commands.registerCommand('EasyGit.showConfigLocal',(param)=> {
        git.action(param, 'showConfigLocal')
    });
    context.subscriptions.push(showConfigLocal);

    // git config --list --global
    let showConfigGlobal = hx.commands.registerCommand('EasyGit.showConfigGlobal',(param)=> {
        git.action(param, 'showConfigGlobal')
    });
    context.subscriptions.push(showConfigGlobal);

    // git config --list --system
    let showConfigSystem = hx.commands.registerCommand('EasyGit.showConfigSystem',(param)=> {
        git.action(param, 'showConfigSystem')
    });
    context.subscriptions.push(showConfigSystem);

    // git config --list --show-origin
    let showConfigAll = hx.commands.registerCommand('EasyGit.showConfigAll',(param)=> {
        git.action(param, 'showConfigAll')
    });
    context.subscriptions.push(showConfigAll);

    // help
    let help = hx.commands.registerCommand('EasyGit.help',(param)=> {
        hx.env.openExternal('https://easy-git.github.io/');
    });
    context.subscriptions.push(help);

    // set keyboard
    let keyboard = hx.commands.registerCommand('EasyGit.keyboard', () => {
        hx.env.openExternal('https://easy-git.github.io/setting/keyboard');
    });
    context.subscriptions.push(keyboard);

    // oauth
    let gitOAuth = hx.commands.registerCommand('EasyGit.oauth', () => {
        openOAuthBox();
    });
    context.subscriptions.push(gitOAuth);

    // ssh
    let ssh = hx.commands.registerCommand('EasyGit.sshKeygen', () => {
        sshKeygen();
    });
    context.subscriptions.push(ssh);
};


function deactivate() {

};

module.exports = {
    activate,
    deactivate
}
