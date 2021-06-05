const hx = require('hbuilderx');

const count = require('../common/count.js');

let packageFile = require('../../package.json');
let commands = packageFile.contributes.commands;

/**
 * @description 命令面板
 * @datetime 2020-10-30 10:16:00
 */
function showCommandPanel(param) {
    try{
        count('CommandPanel').catch( error=> {});
    }catch(e){};

    let tmp = [];
    for (let s of commands) {
        if (s.command != 'EasyGit.CommandPanel') {
            // s["title"] = s["title"].replace('easy-git:', 'git ')
            tmp.push(s);
        }
    };

    let data = JSON.parse(JSON.stringify(tmp).replace(/title/g,"label"));
    const pickResult = hx.window.showQuickPick(data, {
        placeHolder: '请选择要执行的操作'
    });

    pickResult.then(function(result) {
        if (!result) { return; };
        let cmd = result.command;
        hx.commands.executeCommand(cmd, param);
    });
};

module.exports = showCommandPanel;
