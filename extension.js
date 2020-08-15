const hx = require("hbuilderx");

const index = require("./src/index.js");
const file = require('./src/file.js');


let source = 'viewMenu';

//该方法将在插件激活的时候调用
function activate(context) {
    
    context.source = 'viewMenu';

    let FileView = hx.window.createWebView("EasyGitSourceCodeView", {
        enableScritps: true
    });

    let CommonView = hx.window.createWebView("EasyGitCommonView", {
        enableScritps: true
    });

    // if (source == 'viewMenu') {
    //     index.main('main',{}, FileView,context);
    //     index.main('log',{}, CommonView,context);
    // };

    // git file view
    let f = hx.commands.registerCommand('extension.EasyGitMain', (param) => {
        context.source = 'filesExplorer';
        index.main('main',param, FileView, context);
    });
    context.subscriptions.push(f);

    // git file log view
    let l = hx.commands.registerCommand('extension.EasyGitLog', (param) => {
        context.source = 'filesExplorer';
        index.main('log',param, CommonView, context);
    });
    context.subscriptions.push(l);

    // git clone menu
    let clone = hx.commands.registerCommand('extension.EasyGitCloneProject',(param) => {
        context.source = 'clone';
        index.main('clone',param, FileView, context);
    });
    context.subscriptions.push(clone);

    // about
    let about = hx.commands.registerCommand('extension.AboutEasyGit', () => {
        let url = "https://ext.dcloud.net.cn/plugin?name=easy-git";
        hx.env.openExternal(url);
    });

    // setting
    let setting = hx.commands.registerCommand('extension.setEasyGit', ()=> {
        hx.commands.executeCommand('workbench.action.openGlobalSettings');
    });

    // .gitignore
    let setGitignore = hx.commands.registerCommand('extension.EasyGitSetGitingore', (param)=> {
        file.gitignore({
            'param': param
        });
    });

    // .gitattributes
    let setGitattributes= hx.commands.registerCommand('extension.EasyGitSetGitattributes', (param)=> {
        file.gitattributes({
            'param': param
        });
    });

};

//该方法将在插件禁用的时候调用（目前是在插件卸载的时候触发）
function deactivate() {

};

module.exports = {
    activate,
    deactivate
}
