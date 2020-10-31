const hx = require('hbuilderx');

const fs = require('fs');
const path = require('path');

const {
    gitAdd,
} = require('../common/utils.js');


/**
 * @description 添加文件到暂存区
 */
async function gitAddFile(ProjectInfo) {
    let options = [];
    let { projectPath, selectedFile, easyGitInner} = ProjectInfo;

    projectPath = path.normalize(projectPath);
    selectedFile = path.normalize(selectedFile);

    // 选择：整个项目
    if (projectPath == selectedFile) {
        options = '*';
    } else {
        let state = fs.statSync(selectedFile);
        if (state.isFile()) {
            options = selectedFile;
        };
        if (state.isDirectory()) {
            let dirName = selectedFile.replace(projectPath, '');
            options = path.join('.', path.sep, dirName.slice(1), path.sep, '*');
        };
    };
    let addResult = await gitAdd(projectPath, selectedFile);
    if (easyGitInner && addResult == 'success') {
        hx.commands.executeCommand('EasyGit.main', ProjectInfo);
    };
};


module.exports = {
    gitAddFile
}
