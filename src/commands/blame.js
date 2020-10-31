const hx = require('hbuilderx');

const { gitRaw } = require('../common/utils.js');

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
            let result = await gitRaw(projectPath, commands, undefined, 'result');
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
};

module.exports = gitBlameForLineChange;