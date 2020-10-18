const hx = require("hbuilderx");
const path = require('path');

const index = require("./index.js");
const file = require('./common/file.js');
const git = require('./git.js');
const cmp_hx_version = require('./common/cmp.js');

const upgrade = require('./common/upgrade.js');

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
 * @todo 通过工具菜单触发视图，第一次点击打开后，第二次点击没有反应的问题
 */
function activate(context) {
    context.source = 'viewMenu';

    // hbuilderx version 2.9.2+ , git log view, use customEditor
    const cmp = cmp_hx_version(hxVersion, '2.9.2');
    if (cmp <= 0) {
        var { CatCustomEditorProvider, GitLogCustomWebViewPanal } = require('./view/log/openCustomEditor.js');
        let provider = new CatCustomEditorProvider({}, {}, {});
        hx.window.registerCustomEditorProvider("EasyGit - 日志", provider);
    };

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

    // Git拉取
    let pull = hx.commands.registerCommand('EasyGit.pull', (param)=> {
        git.action(param, 'pull');
    });

    // Git推送
    let push = hx.commands.registerCommand('EasyGit.push', (param)=> {
        git.action(param, 'push');
    });

    // Git Stash 储藏
    let stash = hx.commands.registerCommand('EasyGit.stash', (param)=> {
        git.action(param, 'stash');
    });

    // Git Stash 储藏全部
    let stashAll = hx.commands.registerCommand('EasyGit.stashAll', (param)=> {
        git.action(param, 'stashAll');
    });

    // git Stash 弹出指定储藏
    let stashPop = hx.commands.registerCommand('EasyGit.stashPop', (param)=> {
        git.action(param, 'stashPop')
    });

    // git Stash 弹出最新储藏
    let stashPopNew = hx.commands.registerCommand('EasyGit.stashPopNew', (param)=> {
        git.action(param, 'stashPopNew')
    });

    // git Stash 清除所有储藏
    let stashClear = hx.commands.registerCommand('EasyGit.stashClear', (param)=> {
        git.action(param, 'stashClear')
    });

    // check update
    let checkUpdate = hx.commands.registerCommand('EasyGit.checkUpdate', ()=> {
        upgrade.checkUpdate('manual');
    })

};


function deactivate() {

};

module.exports = {
    activate,
    deactivate
}
