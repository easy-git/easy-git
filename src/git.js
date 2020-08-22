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
        return hx.window.setStatusBarMessage('easy-git: 无法获取到项目路径，请在项目管理器选中后再试。',4000, 'error');
    };

    const innerProjectInfo = {
        'projectName': projectName,
        'projectPath': projectPath,
        'easyGitInner': true
    };

    switch (action_name){
        case 'pull':
            utils.gitPull(projectPath, {'rebase': true});
            break;
        case 'stash':
            goStash(innerProjectInfo, '', 'Git: 储藏(stash)');
            break;
        case 'stashAll':
            goStash(innerProjectInfo, '-a', 'Git: 全部储藏(stash)')
            break;
        case 'stashPop':
            goStashPop(innerProjectInfo, 'isOther');
            break;
        case 'stashPopNew':
            goStashPop(innerProjectInfo, 'isNew');
            break;
        default:
            break;
    };
};


/**
 * @description 储藏
 */
async function goStash(ProjectInfo, option, stashMsg) {
    let inputResult = await hx.window.showInputBox({
        prompt: "stash - 储藏消息",
        placeHolder: "消息可选"
    }).then((result)=>{
        return result
    });

    let options = [];
    if (inputResult != '' && inputResult) {
        if (option == '-a') {
            options = ['save', '-a', inputResult]
        } else {
            options = ['save', inputResult]
        };
    } else {
        options.push(option)
    };
    utils.gitStash(ProjectInfo, options, stashMsg);
};


/**
 * @description 弹出储藏
 */
async function goStashPop(ProjectInfo, isNew) {
    let {projectPath} = ProjectInfo;
    if (isNew == 'isNew') {
        utils.gitStash(ProjectInfo, ['pop'], 'Git: 弹出最新储藏');
    } else {
        let stashList = await utils.gitStashList(projectPath);
        let stashAllList = stashList.all;

        let data = [];
        for (let i in stashAllList) {
            let line = stashAllList[i];
            data.push({
                'index': `stash@\{${i}\}`,
                'hash': line.hash,
                'date': line.date,
                'label': `stash@\{${i}\}` + ': ' + line.message
            });
        };

        hx.window.showQuickPick(data, {
            placeHolder: "请选择您要弹出的储藏.."
        }).then(function(result) {
            if (!result) {
                return;
            };
            let stashID = result.index;
            utils.gitStash(ProjectInfo, ['pop', stashID], 'Git: 弹出储藏');
        });
    };
};


module.exports = {
    action
}
