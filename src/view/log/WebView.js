const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');
const { GitLogAction } = require('./log.js');

/**
 * @description log view
 * @param {Object} webviewPanel
 * @param {Object} userConfig
 * @param {Object} gitBasicData 基本的Git信息
 */
async function openLogWebView(webviewPanel, userConfig, gitBasicData) {
    const view = webviewPanel.webView;

    // get basic info
    const {projectPath, projectName, selectedFile, currentBranch} = gitBasicData;

    // 默认在当前分支搜索，当搜索全部时，此值为all
    let searchType = 'branch';

    let Log = new GitLogAction(gitBasicData, userConfig, webviewPanel, 'webView');

    // 选中文件或目录，则查看此文件的log记录
    if (selectedFile != '' && selectedFile != undefined) {
        let sfile = selectedFile.replace(path.join(projectPath,path.sep),'');
        if (projectPath == selectedFile ) {
            Log.setView(searchType, 'default');
        } else {
            Log.setView(searchType, sfile);
        }
    } else {
        Log.setView(searchType, 'default');
    };


    view.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'refresh':
                Log.setView(searchType, 'default');
                break;
            case 'openFile':
                let furi = path.join(projectPath,msg.filename);
                hx.workspace.openTextDocument(furi);
                break;
            case 'copy':
                hx.env.clipboard.writeText(msg.text);
                break;
            case 'search':
                Log.setView(msg.searchType, msg.condition);
                break;
            case 'branch':
                Log.switchBranch();
                break;
            case 'cherry-pick':
                Log.cherryPick(msg.hash);
                break;
            case 'reset-hard-commit':
                Log.resetHardCommit(msg.hash);
                break;
            case 'checkout-commit':
                Log.checkoutCommit(msg.hash);
                break;
            case 'checkout-commit-for-create-branch':
                Log.checkoutCommitForCreateBranch(msg.hash);
                break;
            case 'create-tag':
                Log.createTag(msg.hash);
                break;
            default:
                break;
        };
    });

};


module.exports = openLogWebView;
