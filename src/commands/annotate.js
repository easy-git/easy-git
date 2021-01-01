const hx = require('hbuilderx');
const fs = require('fs');

const { applyEdit, gitRaw } = require('../common/utils.js');


/**
 * @description 显示文件的每一行最后修改的版本和作者
 */
async function gitAnnotate(ProjectInfo) {
    let {projectPath, selectedFile} = ProjectInfo;
    if (selectedFile == undefined || selectedFile == '') {
        hx.window.showErrorMessage('EasyGit: 请选中文件后再操作。', ['我知道了']);
        return;
    };
    let state = fs.statSync(selectedFile);

    let fsize = state.size;
    if (fsize >= 2097512) {
        return hx.window.showErrorMessage('EasyGit: 操作被中止。原因：输出结果太多，可能会引发性能问题。<br/>您可以在终端查看, Git命令: git annotate filename', ['我知道了']);
    };

    let result = await gitRaw(projectPath, ['annotate', selectedFile], 'annotate', 'result');
    if ( !['fail','error','',undefined].includes(result) ) {
        await hx.commands.executeCommand('workbench.action.files.newUntitledFile');
        applyEdit(result);
    } else {
        hx.window.showErrorMessage("Git: annotate没有获取到信息。", ['我知道了']);
    };
};

module.exports = gitAnnotate;
