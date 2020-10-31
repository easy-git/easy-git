const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');
const git = require('simple-git');

const file = require('../common/file.js');
const utils = require('../common/utils.js');

const { goStash, goStashPop, goStashClear } = require('./stash.js');

/**
 * @description 提供webview视图外Git的操作
 */
function action(param,action_name) {
    if (param == null) {
        return hx.window.showErrorMessage('easy-git: 请在项目管理器选中项目后再试。', ['我知道了']);
    };

    let projectName, projectPath, selectedFile, easyGitInner;
    try{
        let {easyGitInner} = param;
        if (easyGitInner != undefined) {
            projectName = param.projectName;
            projectPath = param.projectPath;
        } else {
            try {
                projectName = param.workspaceFolder.name;
                projectPath = param.workspaceFolder.uri.fsPath;
                selectedFile = param.fsPath;
            } catch (e) {
                projectName = param.document.workspaceFolder.name;
                projectPath = param.document.workspaceFolder.uri.fsPath;
                selectedFile = param.document.uri.fsPath;
            };
        };
    } catch(e){
        console.log(e);
        return hx.window.showErrorMessage('easy-git: 无法获取到项目路径，请在项目管理器选中项目后再试。');
    };

    let ProjectInfo = {
        'projectName': projectName,
        'projectPath': projectPath,
        'selectedFile': selectedFile,
        'easyGitInner': easyGitInner
    };

    // git tag: 标签相关操作
    let tag = new Tag(projectPath);

    switch (action_name){
        case 'init':
            gitInitProject(ProjectInfo);
            break;
        case 'addRemoteOrigin':
            utils.gitAddRemoteOrigin(projectPath);
            break;
        case 'add':
            gitAddFile(ProjectInfo);
            break;
        case 'pull':
            utils.gitPull(projectPath, {'rebase': true});
            break;
        case 'fetch':
            utils.gitFetch(projectPath);
            break;
        case 'push':
            utils.gitPush(projectPath);
            break;
        case 'stash':
            goStash(ProjectInfo, '', 'Git: 储藏(stash)');
            break;
        case 'stashAll':
            goStash(ProjectInfo, '-a', 'Git: 全部储藏(stash)')
            break;
        case 'stashPop':
            goStashPop(ProjectInfo, 'isOther');
            break;
        case 'stashPopNew':
            goStashPop(ProjectInfo, 'isNew');
            break;
        case 'stashClear':
            goStashClear(ProjectInfo);
            break;
        case 'setUserName':
            goSetConfig(projectPath, action_name);
            break;
        case 'setEmail':
            goSetConfig(projectPath, action_name);
            break;
        case 'BlameForLineChange':
            gitBlameForLineChange(projectPath, selectedFile);
            break;
        case 'tagCreate':
            let { hash } = param;
            tag.create(hash, param);
            break;
        case 'tagDetails':
            let { tagName } = param;
            tag.showDetails(tagName);
            break;
        default:
            break;
    };
};

/**
 * @description Git项目初始化
 */
async function gitInitProject(ProjectInfo) {
    let {projectPath,projectName} = ProjectInfo;
    let status = await utils.gitInit(projectPath,projectName);

    if (status == 'success') {
        ProjectInfo.easyGitInner = true;
        hx.commands.executeCommand('EasyGit.main', ProjectInfo);

        let btnSelect = await hx.window.showInformationMessage(
            `EasyGit: 项目【${projectName}】初始化存储库成功！当前仓库，还未关联到远程仓库上。\n`,
            ['关联远程仓库','关闭'],
        ).then( (result)=> {
            return result;
        });

        if (btnSelect == '关联远程仓库') {
            let relationResult = await utils.gitAddRemoteOrigin(projectPath);
            if (relationResult == 'success') {
                hx.commands.executeCommand('EasyGit.main', ProjectInfo);
            };
        };
    };
};

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
    let addResult = await utils.gitAdd(projectPath, selectedFile);
    if (easyGitInner && addResult == 'success') {
        hx.commands.executeCommand('EasyGit.main', ProjectInfo);
    };
};


/**
 * @description 设置config
 */
async function goSetConfig(projectPath, action_name) {
    let prompt = '';
    let key = '';
    if (action_name == 'setUserName') {
        prompt = '设置user.name';
        key = 'user.name';
    }
    if (action_name == 'setEmail') {
        prompt = '设置user.email';
        key = 'user.email';
    };

    let inputResult = await hx.window.showInputBox({
        prompt: prompt,
        placeHolder: "必填"
    }).then((result)=>{
        return result
    });

    if (inputResult.replace(/(^\s*)|(\s*$)/g,"") == '') {
        return hx.window.showErrorMessage('用户名或邮箱不能为空',['我知道了'])
    };

    utils.gitConfigSet(projectPath, {'key':key, 'value':inputResult});
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
        let commands = ['blame', '-L', range, selectedFile];

        let errorMsg = 'Git: 获取当前行，最后修改的信息失败!'
        try{
            let result = await utils.gitRaw(projectPath, commands, undefined, 'result');
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


class Tag {
    constructor(projectPath) {
        this.projectPath = projectPath;
    }

    async showDetails(tagName) {
        if (tagName.length == 0) {
            return hx.window.showErrorMessage('tag名称无效。',['关闭']);
        };
        let options = [ 'show', '-s', '--format=medium', tagName ]
        let details = await utils.gitRaw(this.projectPath, options, undefined, 'result');
        if (details) {
            utils.createOutputChannel(`Git: ${tagName} 标签详情如下: `, details);
        };
    }

    async create(hash=null, param=null) {
        let titleLabel = '当前代码';
        if (hash != null && hash != undefined) {
            titleLabel = hash.slice(0,12);
        };
        let tagName = await hx.window.showInputBox({
            prompt:`在${titleLabel}上创建标签`,
            placeHolder: '标签名称，必填'
        }).then((result)=>{
            if (result.length == 0) {
                hx.window.showErrorMessage('请输入有效的标签名称', ['我知道了']);
                return;
            };
            return result;
        });
        if (tagName.length) {
            let options = hash == null ? [tagName] : [tagName, hash];
            let status = await utils.gitTagCreate(this.projectPath, options, tagName);
            if (status == 'success') {
                hx.window.showInformationMessage(`Git: 在${titleLabel}上创建标签成功！`, ['立即推送到远端','以后再说']).then( (result)=> {
                    if (result == '立即推送到远端') {
                        utils.gitPush(this.projectPath, ['origin', tagName]);
                    }
                });
                if (param != null && JSON.stringify(param) != '{}') {
                    hx.commands.executeCommand('EasyGit.branch', param);
                };
            }
        }
    }
}


module.exports = {
    action
}
