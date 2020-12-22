const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');

const { GitLogAction } = require('./log.js');

// 解决hx启动后，已打开的自定义编辑器空白的问题
let HistoryProjectPath;
let HistoryProjectName;

let isSelectedFile;
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

// 监听器
let watcher;

// Git触发途径：HBuilderX内触发、外部Git命令（或其它工具）触发
let GitHBuilderXInnerTrigger = false;

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
        if (isCustomFirstOpen == false) {
            // 使用setTimeout主要是解决首次激活customEditor，重复渲染的问题
            setTimeout(function() {
                hx.window.setStatusBarMessage('EasyGit: 正在加载Git日志，请耐心等待......', 3000, 'info');
                if (isSelectedFile == undefined) {
                    setTimeout(function() {
                        let isHtml = '';
                        try{
                            let isHtml = GitLogCustomWebViewPanal.webView._html;
                            if (isHtml == '') {
                                GitLogCustomEditorRenderHtml({},{});
                            };
                        }catch(e){};
                    }, 2000);
                };
            }, 3000);
        };

        // close customEditor
        webViewPanel.onDidDispose(function() {
            if (watcher != undefined) {
                watcher.close();
            };

            GitLogCustomWebViewPanal = {};
            GitLogCustomEditorStatus = false;

            hx.window.setStatusBarMessage('EasyGit: 日志视图已关闭, 如需要，请重新打开！', 5000, 'info');
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


/**
 * @description 监听文件
 */
function watchProjectDir(projectDir, func) {
    const watchOpt = {
        persistent: true,
        recursive: false
    };
    try {
        let dir = path.join(projectDir, '.git');
        watcher = fs.watch(dir, watchOpt, (eventType, filename) => {
            if (GitHBuilderXInnerTrigger == false) {
                if (eventType && filename == 'index') {
                    setTimeout(function(){
                        func.setView('branch', '');
                    }, 1500);
                };
            };
        });
    } catch (e) {
        console.log(e);
    };
};

function GitLogCustomEditorRenderHtml(gitData, userConfig) {
    let {projectPath, projectName, selectedFile, currentBranch} = gitData;
    isSelectedFile = selectedFile;

    if (JSON.stringify(gitData) == '{}' && isCustomFirstOpen == false) {
        isCustomFirstOpen = true;
        let config = hx.workspace.getConfiguration();
        projectPath = config.get("EasyGit.HistoryProjectPath");
        projectName = config.get("EasyGit.HistoryProjectName");

        if (projectPath == undefined || projectName == undefined) {return;};

        gitData.projectPath = projectPath;
        gitData.projectName = projectName;
    } else {
        isCustomFirstOpen = true;
    };

    history(gitData);

    let Log = new GitLogAction(gitData, userConfig, GitLogCustomWebViewPanal, 'customEditor');

    // 默认在当前分支搜索，当搜索全部时，此值为all
    let searchType = 'branch';

    try{
        selectedFile = path.normalize(selectedFile);
        projectPath = path.normalize(projectPath);
    }catch(e){}

    // 监听.git，当关闭日志视图自动刷新时，则不再监听
    let { logViewAutoRefresh } = userConfig;
    if (logViewAutoRefresh) {
        watchProjectDir(projectPath, Log);
    };

    // 选中文件或目录，则查看此文件的log记录
    if (selectedFile != '' && selectedFile != undefined) {
        let sfile = selectedFile.replace(path.join(projectPath, path.sep), '');
        if (selectedFile != projectPath) {
            Log.setView(searchType, sfile);
        } else {
            Log.setView(searchType, '');
        }
    } else {
        Log.setView(searchType, '');
    };

    let easyGitInnerParams = {
        'projectPath': projectPath,
        'projectName': projectName,
        'easyGitInner': true
    };

    GitLogCustomWebViewPanal.webView.onDidReceiveMessage(function(msg) {
        GitHBuilderXInnerTrigger = true;
        let action = msg.command;
        switch (action) {
            case 'refresh':
                Log.setView(searchType, '', msg.refname);
                break;
            case 'openFile':
                let furi = path.join(projectPath,msg.filename);
                hx.workspace.openTextDocument(furi).then((res) => {
                    if (res == null) {
                        hx.window.showErrorMessage('Git: 打开文件失败，文件不存在，可能被删除！', ['我知道了']);
                    };
                });
                break;
            case 'copy':
                hx.env.clipboard.writeText(msg.text);
                hx.window.setStatusBarMessage("EasyGit: 已成功复制到剪切板。", 5000, 'info');
                break;
            case 'search':
                Log.setView(msg.searchType, msg.condition, msg.refname);
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
            case 'revert':
                Log.revert(msg.hash);
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
            case 'openCommandPanel':
                hx.commands.executeCommand('EasyGit.CommandPanel', easyGitInnerParams);
                break;
            case 'showRefList':
                Log.goRefs();
                break;
            case 'archive':
                let archvieParams = Object.assign({'hash': msg.hash}, easyGitInnerParams);
                hx.commands.executeCommand('EasyGit.archive', archvieParams);
                break;
            default:
                break;
        };
        setTimeout(function() {
            GitHBuilderXInnerTrigger = false;
        }, 1000);
    });
}


module.exports = {
    CatCustomEditorProvider,
    GitLogCustomWebViewPanal,
    GitLogCustomEditorStatus,
    GitLogCustomEditorRenderHtml
}
