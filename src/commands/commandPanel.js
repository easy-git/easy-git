const hx = require('hbuilderx');

const count = require('../common/count.js');

let packageFile = require('../../package.json');
let commands = packageFile.contributes.commands;

/**
 * @description 失焦操作
 */
async function unfocusedAction() {
    hx.window.setStatusBarMessage('EasyGit: 如果出现错误、或没有任何提示，请将焦点置于项目管理器或在编辑器中打开文件。');
    // 将焦点置于编辑器
    try{
        await hx.commands.executeCommand('workbench.action.focusEditor');
    }catch(e){
        return null;
    };
    // 2022-02-27 屏蔽此段。 即使焦点不在项目管理器也应该打开命令面板
    // // 获取激活的项目信息
    // let activeEditor = await hx.window.getActiveTextEditor().then(function(editor){
    //     return editor;
    // }).catch( error => {
    //     return "fouceEditorFail";
    // });
    // if (activeEditor == 'fouceEditorFail') {
    //     hx.commands.executeCommand('workbench.view.explorer');
    // };
    // return activeEditor;
};

/**
 * @description 命令面板
 * @datetime 2020-10-30 10:16:00
 */
async function showCommandPanel(param, name) {
    if (param == null) {
        let unfocusedResult = await unfocusedAction();
        if (unfocusedResult == null || unfocusedResult == 'fouceEditorFail' || unfocusedResult == undefined) {
            hx.window.setStatusBarMessage('EasyGit: 请将焦点置于项目管理器Git项目上、或在编辑器中打开Git项目下文件，再进行操作。', 5000, 'info');
        };
    };

    try{
        count('CommandPanel').catch( error=> {});
    }catch(e){};

    let tmp = [];
    if (name) {
        for (let s of commands) {
            if (['EasyGit.CommandPanel', 'EasyGit.CommandListForDiff'].includes(s.command)) {
                continue;
            };
            if (name && (s.title).includes(name)) {
                tmp.push(s);
            };
        };
        tmp.push({"title": "返回 - 查看其它Git操作", "command": "back"});
    } else {
        for (let s of commands) {
            if (s.command == 'EasyGit.CommandPanel') {
                continue;
            };
            tmp.push(s);
        };
    };

    let data = JSON.parse(JSON.stringify(tmp).replace(/title/g,"label"));
    let pickResult = hx.window.showQuickPick(data, {
        placeHolder: '请选择要执行的Git操作'
    });

    pickResult.then(function(result) {
        if (!result) { return; };
        let cmd = result.command;
        if (cmd == 'back') {
            hx.commands.executeCommand("EasyGit.CommandPanel", param);
        } else {
            hx.commands.executeCommand(cmd, param);
        };
    });
};

module.exports = showCommandPanel;
