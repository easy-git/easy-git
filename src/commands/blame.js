const hx = require('hbuilderx');

const {
    gitRaw,
    hxShowMessageBox,
    createOutputChannel
 } = require('../common/utils.js');

let config = hx.workspace.getConfiguration();

/**
 * @description 以何种方式显示blame信息
 */
async function getGitBlameDisplayMode() {
    let blameDisplayMode = config.get('EasyGit.blameDisplayMode');
    if (blameDisplayMode) {
        blameDisplayMode = blameDisplayMode.toLowerCase();
        if (["console", "statusbar", "message"].includes(blameDisplayMode)) {
            return blameDisplayMode;
        };
    };
    let Confirm = await hxShowMessageBox(
        "请选择Git Blame信息的展示方式",
        "此次选择后，后期不再提示。",
        ['右下角弹窗', "底部状态栏", "控制台"],
    ).then(btnText => {
        return btnText;
    });
    let mode;
    if (Confirm == "控制台") {
        mode = "console";
    } else if (Confirm == "底部状态栏") {
        mode = "statusbar";
    } else {
        mode = "message";
    };
    config.update("EasyGit.blameDisplayMode", mode).then(() => {});
    return mode;
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
        let commands = ['blame', '--date=format:"%Y-%m-%d %H:%M:%S"' ,'-L', range, selectedFile];

        let errorMsg = 'Git: 获取当前行，最后修改的信息失败!'
        try{
            let result = await gitRaw(projectPath, commands, undefined, 'result');
            let m = result.match(/(?<=\()[^\(\)]+(?=\))/g)[0];
            if (m == '' || m == undefined) {
                return hx.window.setStatusBarMessage(errorMsg, 5000, 'error');
            };
            m = m.substr(0, m.length - 1);

            let commit = result.split(' ')[0];
            let last_message = `Git: 当前选择行最后修改信息: \n\ncommit: ${commit}\n最后修改：${m}`;

            let displayMode = await getGitBlameDisplayMode();
            if (displayMode == 'statusbar') {
                hx.window.setStatusBarMessage(`Git: 当前选择行最后修改信息:  ${m}`, 20000, 'info');
            } else if (displayMode == 'message') {
                hx.window.showInformationMessage(last_message, ["我知道了"]);
            } else {
                createOutputChannel(last_message, "info");
            };
        }catch(e){
            console.log(e)
            return hx.window.setStatusBarMessage(errorMsg, 20000, 'error');
        };
    } else {
        return hx.window.showErrorMessage('EasyGit: 请将焦点置于打开的文件内容行上。', ['我知道了']);
    };
};

module.exports = gitBlameForLineChange;
