const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');
const git = require('simple-git');

const file = require('./common/file.js');
const utils = require('./common/utils.js');

const MainView = require('./view/main.js');
const initView = require('./view/init.js');
const cloneView = require('./view/clone.js');


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
        return hx.window.showErrorMessage('easy-git: 无法获取到项目路径，请在项目管理器选中项目后再试。');
    };

    const ProjectInfo = {
        'projectName': projectName,
        'projectPath': projectPath,
        'easyGitInner': true
    };

    switch (action_name){
        case 'pull':
            utils.gitPull(projectPath, {'rebase': true});
            break;
        case 'push':
            utils.gitPush(projectPath);
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
        default:
            break;
    };
};


/**
 * @description 储藏
 */
async function goStash(ProjectInfo, option, stashMsg) {
    let msg = option == '-a' ? '消息必填' : '消息选填';
    let inputResult = await hx.window.showInputBox({
        prompt: "stash - 储藏消息",
        placeHolder: msg
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

/**
 * @description 清除所有储藏
 */
async function goStashClear(ProjectInfo) {
    hx.window.showErrorMessage('确定要删除所有储藏吗？\n一旦清除后无法恢复!',['确定','取消']).then((result) => {
        if (result == '确定') {
            utils.gitStash(ProjectInfo, ['clear'], 'Git: 清除所有储藏');
        };
    });
};

/**
 * @description 设置config
 */
async function goSetConfig(projectPath, action_name) {
    let prompt = '';
    let key = '';
    if (action_name == 'setUserName') {
        prompt = '设置user.name';
        key = 'user.name';
    }
    if (action_name == 'setEmail') {
        prompt = '设置user.email';
        key = 'user.email';
    };

    let inputResult = await hx.window.showInputBox({
        prompt: prompt,
        placeHolder: "必填"
    }).then((result)=>{
        return result
    });

    if (inputResult.replace(/(^\s*)|(\s*$)/g,"") == '') {
        return hx.window.showErrorMessage('用户名或邮箱不能为空',['我知道了'])
    };

    utils.gitConfigSet(projectPath, {'key':key, 'value':inputResult});
};


/**
 * @description 显示文件的每一行最后修改的版本和作者
 */
async function gitBlameForLineChange(projectPath, selectedFile) {
    let activeEditor = hx.window.getActiveTextEditor();
    let lineNumber = await activeEditor.then(function(editor){
        let linePromise = editor.document.lineFromPosition(editor.selection.active);
        return linePromise.then((line)=>{
            return line.lineNumber;
        });
    });
    if (typeof(lineNumber) == 'number') {
        let tmp = (lineNumber + 1).toString();

        let range = tmp + ',' + tmp;
        let commands = ['blame', '-L', range, selectedFile];

        let errorMsg = 'Git: 获取当前行，最后修改的信息失败!'
        try{
            let result = await utils.gitRaw(projectPath, commands, undefined, 'result');
            let m = result.match(/(?<=\()[^\(\)]+(?=\))/g)[0];
            if (m == '' || m == undefined) {
                return hx.window.setStatusBarMessage(errorMsg, 5000, 'error');
            };
            hx.window.setStatusBarMessage(`Git: 当前行最后修改信息, ${m}`, 5000, 'info');
        }catch(e){
            return hx.window.setStatusBarMessage(errorMsg, 5000, 'error');
        };
    } else {
        return hx.window.showErrorMessage('EasyGit: 请将焦点置于打开的文件内容行上。', ['我知道了']);
    };
}


module.exports = {
    action
}
