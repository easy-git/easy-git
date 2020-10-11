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

        // render html to customEditor
        if (isCustomFirstOpen == false) {
            GitLogCustomEditorRenderHtml({},{});
        };

        // close customEditor
        webViewPanel.onDidDispose(function() {
            GitLogCustomEditorStatus = false;
        });

        let provider = this;
        webViewPanel.webView.onDidReceiveMessage(function(msg) {
            let action = msg.command;
            switch (action) {
                case 'refresh':
                    Log.setView('webview', webviewPanel, searchType, 'default');
                    break;
                case 'openFile':
                    let furi = path.join(projectPath,msg.filename);
                    hx.workspace.openTextDocument(furi);
                    break;
                case 'copy':
                    hx.env.clipboard.writeText(msg.text);
                    break;
                case 'search':
                    Log.setView('webview', webviewPanel, msg.searchType, msg.condition);
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
                default:
                    break;
            };
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
    isCustomFirstOpen = true;

    let {projectPath, projectName, selectedFile, currentBranch} = gitData;

    if (JSON.stringify(gitData) == '{}') {
        let config = hx.workspace.getConfiguration();
        projectPath = config.get("EasyGit.HistoryProjectPath");
        projectName = config.get("EasyGit.HistoryProjectName");

        if (projectPath == undefined || projectName == undefined) {return;};

        gitData.projectPath = projectPath;
        gitData.projectName = projectName;
    };

    history(gitData);

    let Log = new GitLogAction(gitData, userConfig);

    // 选中文件或目录，则查看此文件的log记录
    if (selectedFile != '' && selectedFile != undefined) {
        let sfile = selectedFile.replace(path.join(projectPath,path.sep), '');
        if (projectPath == selectedFile ) {
            Log.setView('CustomEditor', GitLogCustomWebViewPanal, 'branch', 'default');
        } else {
            Log.setView('CustomEditor', GitLogCustomWebViewPanal, 'branch', sfile);
        }
    } else {
        Log.setView('CustomEditor', GitLogCustomWebViewPanal, 'branch', 'default');
    };

}


module.exports = {
    CatCustomEditorProvider,
    GitLogCustomWebViewPanal,
    GitLogCustomEditorStatus,
    GitLogCustomEditorRenderHtml
}
