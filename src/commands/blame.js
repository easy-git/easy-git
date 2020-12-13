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
        let commands = ['blame', '--date=format:"%Y-%m-%d %H:%M:%S"' ,'-L', range, selectedFile];

        let errorMsg = 'Git: 获取当前行，最后修改的信息失败!'
        try{
            let result = await gitRaw(projectPath, commands, undefined, 'result');
            let m = result.match(/(?<=\()[^\(\)]+(?=\))/g)[0];
            if (m == '' || m == undefined) {
                return hx.window.setStatusBarMessage(errorMsg, 5000, 'error');
            };
            m = m.substr(0, m.length - 1);
            hx.window.setStatusBarMessage(`Git: 当前行最后修改信息:  ${m}`, 20000, 'info');
        }catch(e){
            console.log(e)
            return hx.window.setStatusBarMessage(errorMsg, 20000, 'error');
        };
    } else {
        return hx.window.showErrorMessage('EasyGit: 请将焦点置于打开的文件内容行上。', ['我知道了']);
    };
};

module.exports = gitBlameForLineChange;
