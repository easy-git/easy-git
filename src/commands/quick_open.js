const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');

const {
    getFilesExplorerProjectInfo
} = require('../common/utils.js');
const count = require('../common/count.js');

/**
 * @description 快速打开项目管理器的Git项目、或本地的Git项目
 * @param {Object} param
 */
async function quickOpen(param) {
    let gitList = [];

    let ExplorerReulst = await getFilesExplorerProjectInfo();
    let { success, Folders } = ExplorerReulst;
    if (success && Folders.length) {
        for (let s of Folders) {
            if (s.isGit) {
                gitList.push({"label": s.FolderName, "description": s.GitRepository, "projectPath":s.GitRepository });
            };
        };
    };

    let pickerList = [
         ...gitList
    ];
    let selected = await hx.window.showQuickPick(pickerList, {
        'placeHolder': '请选择要打开的项目...'
    }).then( (res)=> {
        return res;
    });

    if (selected) {
        let {projectPath, label} = selected;
        let info = {
            "projectPath": projectPath,
            "projectName": label,
            "easyGitInner": true
        };
        hx.commands.executeCommand("EasyGit.main", info);
    };
};

module.exports = quickOpen;
