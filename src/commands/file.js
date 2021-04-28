const hx = require('hbuilderx');

const fs = require('fs');
const path = require('path');

const {
    gitAdd,
    gitFileListStatus,
    gitFileStatus,
    getGitVersion,
    gitClean,
    gitRaw
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

    let prompt = amend ? 'Git commit - 修改最后提交的commit消息' : `Git commit - 请输入commit消息 <p style="font-size: 12px;">注意: 当前暂存区已暂存 ${stageFileNum} 个文件。</p>`;
    let inputResult = await hx.window.showInputBox({
        prompt: prompt,
        placeHolder: '消息必填'
    }).then((result)=>{
        return result
    });
    if (inputResult.trim() == '' && inputResult.length <= 3) {
        hx.window.showErrorMessage('EasyGit: 请输入有效的信息！', ['我知道了']);
        return;
    };

    let options = ['commit', '-m', inputResult];
    if (amend) {
        options = ['commit', '--amend', '-m', inputResult];
    };

    let msg = amend ? 'commit --amend' : 'commit';
    let commitResult = await gitRaw(projectPath, options, msg);
    if (commitResult == 'success') {
        // 2021-03-26 命令面板commit操作，不再打开日志视图
        // setTimeout(function() {
        //     hx.commands.executeCommand('EasyGit.log', ProjectInfo);
        // }, 1500);
    };
};


class gitRestore {
    constructor() {
        this.isUseRestore = undefined
    }

    // 提示框
    showGitVersionPrompt() {
        hx.window.showInformationMessage('Git提醒:  此操作，用到了restore命令。\n本机Git命令行版本太低, 没有restore命令，将使用旧版命令。建议升级电脑的Git命令行工具！', ['安装高版本Git工具', '关闭']).then( (res)=> {
            if (res == '安装高版本Git工具') {
                hx.env.openExternal('https://git-scm.com/downloads');
            };
        });
    };

    // Git: resotre git 2.23.0版本的命令
    async JudgeGitRestore() {
        try{
            if (cmp_git == undefined) {
                let version = await getGitVersion();
                cmp_git = cmp_hx_version(version, '2.23.0');
                if (cmp_git > 0 ) {
                    this.showGitVersionPrompt();
                    return false;
                };
                return true;
            } else {
                if (cmp_git > 0 ) {
                    this.showGitVersionPrompt();
                    return false;
                }
                return true;
            };
        }catch(e){
            return true;
        };
    };

    // get option
    getRestoreOptions(projectPath, selectedFile) {
        let options = selectedFile;

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
        return options;
    };

    async restore(SelectedInfo, actionName) {
        if (this.isUseRestore == undefined) {
            this.isUseRestore = await this.JudgeGitRestore();
        };

        let { projectPath, selectedFile, easyGitInner} = SelectedInfo;

        // 检查是否是否修改
        let checkResult = await gitFileStatus(projectPath, selectedFile, ['s', selectedFile]);
        if (checkResult == undefined || checkResult == 'error') {
            let { index, working_dir } = checkResult;
            if (actionName == 'restoreStaged') {
                hx.window.setStatusBarMessage('EasyGit: 操作中止，当前文件没有暂存。', 30000, 'error')
            };
            if (actionName == 'restoreChanged') {
                hx.window.setStatusBarMessage('EasyGit: 操作中止，当前文件没有修改。', 30000, 'error')
            };
            return;
        };

        let options = this.getRestoreOptions(projectPath, selectedFile);

        if (this.isUseRestore == false) {
            let cmd, msg;
            if (actionName == 'restoreStaged') {
                cmd = ['reset', 'HEAD', '--', options];
                msg = '文件取消暂存，';
            };
            if (actionName == 'restoreChanged') {
                cmd = ['checkout', '--', options];
                msg = '撤消对文件的修改，';
            };

            let cancelStatus = await gitRaw(projectPath, cmd, msg);
            if (cancelStatus == 'success') {
                SelectedInfo.easyGitInner = true;
                hx.commands.executeCommand('EasyGit.main', SelectedInfo);
            };
            return;
        };

        if (this.isUseRestore == true) {
            let cmd1, msg1;
            if (actionName == 'restoreStaged') {
                cmd1 = ['restore', '--staged', options];
                msg1 = '文件取消暂存，';
            };
            if (actionName == 'restoreChanged') {
                cmd1 = ['restore', options];
                msg1 = '撤消对文件的修改，';
            };

            let cancelStatus = await gitRaw(projectPath, cmd1, msg1);
            if (cancelStatus == 'success') {
                SelectedInfo.easyGitInner = true;
                hx.commands.executeCommand('EasyGit.main', SelectedInfo);
            };
        };
    };
}


module.exports = {
    gitAddFile,
    gitRestore,
    goCleanFile,
    goCommit
}
