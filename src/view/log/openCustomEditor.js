const hx = require('hbuilderx');
const path = require('path');

const {GitLogAction} = require('./action.js');

// 解决hx启动后，已打开的自定义编辑器空白的问题
let HistoryProjectPath;
let HistoryProjectName;

let isCustomFirstOpen = false;
let GitLogCustomEditorStatus;

let CustomDocument = class {};
let CustomEditorProvider = class {};
let CustomDocumentEditEvent;

try{
    CustomDocument = hx.CustomEditor.CustomDocument;
    CustomEditorProvider = hx.CustomEditor.CustomEditorProvider;
    CustomDocumentEditEvent = hx.CustomEditor.CustomDocumentEditEvent;
}catch(e){}

let GitLogCustomWebViewPanal = {};

class CatCustomDocument extends CustomDocument {
    constructor(uri) {
        super(uri)
    }
    dispose() {
        super.dispose();
    }
};

class CatCustomEditorProvider extends CustomEditorProvider {

    constructor(context) {
        super();
    }

    openCustomDocument(uri) {
        return Promise.resolve(new CatCustomDocument(uri));
    }

    resolveCustomEditor(document, webViewPanel) {
        GitLogCustomEditorStatus = true;
        GitLogCustomWebViewPanal = webViewPanel;

        // First Open: render html to customEditor
        // if (isCustomFirstOpen == false) {
        //     GitLogCustomEditorRenderHtml({},{});
        // };

        // close customEditor
        webViewPanel.onDidDispose(function() {
            GitLogCustomEditorStatus = false;
        });
    }
};

/**
 * @param {Object} gitData
 * @description 解决hx启动后，已打开的自定义编辑器空白的问题
 */
function history(gitData) {
    const {projectPath, projectName} = gitData;
    if (HistoryProjectPath == projectPath && HistoryProjectName == projectName) {
        return;
    };

    HistoryProjectPath = projectPath;
    HistoryProjectName = projectName;

    let config = hx.workspace.getConfiguration();
    config.update("EasyGit.HistoryProjectPath", HistoryProjectPath).then(() => {
        config.update("EasyGit.HistoryProjectName", HistoryProjectName).then(() => {});
    });
};


function GitLogCustomEditorRenderHtml(gitData, userConfig) {
    let {projectPath, projectName, selectedFile, currentBranch} = gitData;

    if (JSON.stringify(gitData) == '{}' && isCustomFirstOpen == false) {
        isCustomFirstOpen = true;
        let config = hx.workspace.getConfiguration();
        projectPath = config.get("EasyGit.HistoryProjectPath");
        projectName = config.get("EasyGit.HistoryProjectName");

        if (projectPath == undefined || projectName == undefined) {return;};

        gitData.projectPath = projectPath;
        gitData.projectName = projectName;
    };

    history(gitData);

    let Log = new GitLogAction(gitData, userConfig, GitLogCustomWebViewPanal, 'customEditor');

    // 默认在当前分支搜索，当搜索全部时，此值为all
    let searchType = 'branch';

    try{
        selectedFile = path.normalize(selectedFile);
        projectPath = path.normalize(projectPath);
    }catch(e){}

    // 选中文件或目录，则查看此文件的log记录
    if (selectedFile != '' && selectedFile != undefined) {
        let sfile = selectedFile.replace(path.join(projectPath, path.sep), '');
        if (selectedFile != projectPath) {
            Log.setView(searchType, sfile);
        } else {
            Log.setView(searchType, 'default');
        }
    } else {
        Log.setView(searchType, 'default');
    };

    GitLogCustomWebViewPanal.webView.onDidReceiveMessage(function(msg) {
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
            case 'showCommitFileChange':
                Log.showCommitFileChange(msg.data);
                break;
            default:
                break;
        };
    });
}


module.exports = {
    CatCustomEditorProvider,
    GitLogCustomWebViewPanal,
    GitLogCustomEditorStatus,
    GitLogCustomEditorRenderHtml
}
