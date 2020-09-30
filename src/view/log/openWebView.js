const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');
const {GitLogAction} = require('./action.js');

/**
 * @description log view
 * @param {Object} viewType
 * @param {Object} param
 * @param {Object} webviewPanel
 */
async function openLogWebView(webviewPanel, userConfig, gitData) {
    const view = webviewPanel.webView;

    // get project info
    const {projectPath, projectName, selectedFile, currentBranch} = gitData;

    // 默认在当前分支搜索，当搜索全部时，此值为all
    let searchType = 'branch';

    let Log = new GitLogAction(webviewPanel, gitData, userConfig);

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
            default:
                break;
        };
    });

};


module.exports = openLogWebView;
