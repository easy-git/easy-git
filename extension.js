const hx = require("hbuilderx");

const index = require("./src/index.js");
const file = require('./src/file.js');
const git = require('./src/git.js');

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

    // if (source == 'viewMenu') {
    //     index.main('main', {}, FileView, context);
    //     index.main('log', {}, CommonView, context);
    // };

    // 菜单【源代码管理】，菜单【工具】、及项目管理器右键菜单
    let f = hx.commands.registerCommand('EasyGit.main', (param) => {
        context.source = 'filesExplorer';
        index.main('main',param, FileView, context);
    });
    context.subscriptions.push(f);

    // 菜单【日志】
    let l = hx.commands.registerCommand('EasyGit.log', (param) => {
        context.source = 'filesExplorer';
        index.main('log',param, CommonView, context);
    });
    context.subscriptions.push(l);

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

    // 菜单 【.gitignore】
    let setGitignore = hx.commands.registerCommand('EasyGit.setGitingore', (param)=> {
        file.gitignore({
            'param': param
        });
    });

    // 菜单【.gitattributes】
    let setGitattributes= hx.commands.registerCommand('EasyGit.setGitattributes', (param)=> {
        file.gitattributes({
            'param': param
        });
    });

    // Git拉取
    let pull = hx.commands.registerCommand('EasyGit.pull', (param)=> {
        git.action(param, 'pull');
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
    })

};


function deactivate() {

};

module.exports = {
    activate,
    deactivate
}
