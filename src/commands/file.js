const hx = require('hbuilderx');

const fs = require('fs');
const path = require('path');

const {
    gitAdd,
    gitFileListStatus,
    gitFileStatus,
    getGitVersion,
    gitClean,
    gitRaw,
    gitPush
} = require('../common/utils.js');

const cmp_hx_version = require('../common/cmp.js');
let cmp_git;

/**
 * @description 添加文件到暂存区
 */
async function gitAddFile(ProjectInfo) {
    let options = [];
    let { projectPath, selectedFile, easyGitInner} = ProjectInfo;

    projectPath = path.normalize(projectPath);
    selectedFile = path.normalize(selectedFile);

    // 检查是否存在修改的文件
    let changeList = [];
    let StatusInfo = await gitFileListStatus(projectPath);
    let { msg, conflicted, notStaged } = StatusInfo;
    if (msg == 'success' ) {
        if (conflicted.length || notStaged.length) {
            changeList = [...conflicted, ...notStaged];
            changeList = changeList.map( item => item.path);
            let filename = selectedFile.replace(path.join(projectPath, path.sep), '').replace(/\\/g, '/');
            if (!changeList.includes(filename)) {
                return hx.window.showErrorMessage('EasyGit: 当前文件没有任何更改，无需进行暂存操作。', ['我知道了']);
            };
        } else {
            return hx.window.showErrorMessage('EasyGit: 当前目录或文件没有任何更改，无需进行暂存操作。', ['我知道了']);
        };
    };

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

/**
 * @description 清除本地未跟踪的文件
 */
async function goCleanFile(ProjectInfo) {
    let { projectPath, projectName } = ProjectInfo;
    let cleanResult = await gitClean(projectPath, '*');
    if (cleanResult == 'success') {
        ProjectInfo.easyGitInner = true;
        hx.commands.executeCommand('EasyGit.main', ProjectInfo);
    };
};

/**
 * @description 验证用户填写数据
 * @param {Object} formData
 */
 async function goValidateCommitMsg(formData, that) {
    let {commit_msg} = formData;
    if (commit_msg.replace(/(^\s*)|(\s*$)/g,"") == '') {
        that.showError(`git commit消息不能为空`);
        return false;
    };
    return true;
};

/**
 * @description commit 或 commit --amend
 */
async function goCommit(ProjectInfo, amend=false) {
    let { projectPath } = ProjectInfo;
    ProjectInfo.easyGitInner = true;

    // 检查暂存区是否存在文件
    let stageFileNum;
    if (!amend) {
        let StatusInfo = await gitFileListStatus(projectPath);
        let {msg, staged} = StatusInfo;
        if (msg == 'success' ) {
            if (staged.length) {
                stageFileNum = staged.length;
            } else {
                return hx.window.showErrorMessage('EasyGit: 当前暂存区没有任何文件，无需进行commit操作。', ['我知道了']);
            };
        };
    };

    let msc = stageFileNum ? `当前暂存区已暂存 ${stageFileNum} 个文件。`: '';
    let subtitle = amend ? '修改最后提交的commit消息内容' : '';

    var formItems = [];
    let userItems = [
        {type: "label",name: "add_msg","text": msc},
        {type: "input",name: "commit_msg",label: "消息",placeholder: "请输入commit消息" },
        {type: "label",name: "blank","text": ""},
        {type: "checkBox",name: "isPush",label: "是否立即推送到远端", value: false}
    ];

    let Info = await hx.window.showFormDialog({
        formItems: userItems,
        title: "Git提交",
        subtitle: subtitle,
        width: 480,
        height: 230,
        submitButtonText: "确定(&S)",
        cancelButtonText: "取消(&C)",
        validate: function(formData) {
            let checkResult = goValidateCommitMsg(formData, this);
            return checkResult;
        }
    }).then((res) => {
        return res;
    }).catch(error => {
        console.log(error);
    });

    if (Info == undefined) return;
    let {commit_msg, isPush} = Info;

    let options = ['commit', '-m', commit_msg];
    if (amend) {
        options = ['commit', '--amend', '-m', commit_msg];
    };

    let msg = amend ? 'commit --amend' : 'commit';
    let commitResult = await gitRaw(projectPath, options, msg);
    if (commitResult == 'success' && isPush) {
        gitPush(projectPath)
    };
};

module.exports = {
    gitAddFile,
    goCleanFile,
    goCommit
}
