const hx = require("hbuilderx");

const index = require("./src/index.js");
const file = require('./src/file.js');


let source = 'viewMenu';

//该方法将在插件激活的时候调用
function activate(context) {
    context.source = 'viewMenu';

    let FileView = hx.window.createWebView("EasyGitSourceCode", {
        enableScritps: true
    });

    let LogView = hx.window.createWebView("EasyGitLog", {
        enableScritps: true
    });

    // if (source == 'viewMenu') {
    //     index.main('main',{}, FileView,context);
    //     index.main('log',{}, LogView,context);
    // };

    // git file view
    let disposable = hx.commands.registerCommand('extension.EasyGitMain', (param) => {
        context.source = 'filesExplorer';
        index.main('main',param, FileView, context);
    });

    // git file log view
    let log = hx.commands.registerCommand('extension.EasyGitLog', (param) => {
        context.source = 'filesExplorer';
        index.main('log',param, LogView, context);
    });

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
