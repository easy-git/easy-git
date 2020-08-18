const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');
const git = require('simple-git');

const file = require('./file.js');
const utils = require('./utils.js');

const MainView = require('./view/main.js');
const LogView = require('./view/log.js');
const initView = require('./view/init.js');
const cloneView = require('./view/clone.js');


/**
 * @description 提供webview视图外Git的操作
 */
function action(param,action_name) {

    let projectName, projectPath, selectedFile;
    try{
        try {
            projectName = param.workspaceFolder.name;
            projectPath = param.workspaceFolder.uri.fsPath;
            selectedFile = param.fsPath;
        } catch (e) {
            projectName = param.document.workspaceFolder.name;
            projectPath = param.document.workspaceFolder.uri.fsPath;
            selectedFile = param.document.uri.fsPath;
        };
    } catch(e){
        return hx.window.setStatusBarMessage('easy-git: 无法获取到项目了路径，请在项目管理器选中后再试。',4000, 'error');
    };

    switch (action_name){
        case 'pull':
            utils.gitPull(projectPath, {'rebase': true});
            break;
        default:
            break;
    };

};

module.exports = {
    action
}
