const hx = require('hbuilderx');

const os = require('os');
const fs = require('fs');
const path = require('path');

const { Diff } = require('./diff.js');
const { getDefaultContent, getWebviewDiffContent } = require('./html.js');


let isSelectedFile;
let isCustomFirstOpen = false;

let CustomDocument = class {};
let CustomEditorProvider = class {};
let CustomDocumentEditEvent;

try{
    CustomDocument = hx.CustomEditor.CustomDocument;
    CustomEditorProvider = hx.CustomEditor.CustomEditorProvider;
    CustomDocumentEditEvent = hx.CustomEditor.CustomDocumentEditEvent;
} catch(e) {};


// 用于保存自定义编辑器信息
let GitDiffCustomWebViewPanal = {};

// 用于保存watchFile
let watchFile;
let watchListener;

class CatCustomDocument extends CustomDocument {
    constructor(uri) {
        super(uri)
    }
    dispose() {
        super.dispose();
    }
};

class CatDiffCustomEditorProvider extends CustomEditorProvider {
    constructor(context) {
        super();
    }

    openCustomDocument(uri) {
        return Promise.resolve(new CatCustomDocument(uri));
    }

    resolveCustomEditor(document, webViewPanel) {
        GitDiffCustomWebViewPanal = webViewPanel;

        // First Open: render html to customEditor
        if (isCustomFirstOpen == false) {
            let isHtml = webViewPanel.webView._html;
            // 使用setTimeout主要是解决首次激活customEditor，重复渲染的问题
            setTimeout(function() {
                hx.window.setStatusBarMessage('EasyGit: 正在加载文件差异内容，请耐心等待......', 3000, 'info');
                if (isSelectedFile == undefined) {
                    setTimeout(function() {
                        if (isHtml == '') {
                            GitDiffCustomWebViewPanal.webView.html = getDefaultContent();
                        };
                    }, 2000);
                };
            }, 3000);
        };

        // close customEditor
        webViewPanel.onDidDispose(function() {
            GitDiffCustomWebViewPanal = {};
            isCustomFirstOpen = false;

            // 移除文件监听
            try{
                if (watchFile) {
                    fs.unwatchFile(watchFile, watchListener);
                };
            }catch(e){};

            hx.window.setStatusBarMessage('EasyGit: 文件对比视图已关闭!', 5000, 'info');
        });
    };
};


/**
 * @description 生成文件对比视图HTML
 * @param {Object} ProjectData
 * @param {Object} userConfig
 */
function GitDiffCustomEditorRenderHtml(ProjectData, userConfig) {
    let fileAbsPath;
    let { projectPath, projectName, selectedFile } = ProjectData;

    if (selectedFile == undefined || selectedFile == null) {
        return;
    };

    isSelectedFile = selectedFile;
    isCustomFirstOpen = true;
    try{
        GitDiffCustomWebViewPanal.webView._html = '';
    }catch(e){};

    try{
        projectPath = path.normalize(projectPath);
        ProjectData.projectPath = projectPath;
        fileAbsPath = path.join(projectPath, selectedFile);

        let fstate = fs.statSync(fileAbsPath);
        if (fstate.isFile() != true) {
            return hx.window.showErrorMessage('EasyGit: 选中有效的文件后，再进行操作！', ['我知道了']);
        };
    }catch(e){};

    let GitDiff = new Diff(ProjectData, userConfig, GitDiffCustomWebViewPanal);
    GitDiff.SetView(selectedFile);

    // 监听文件
    watchFile = fileAbsPath;
    watchListener = fs.watchFile(fileAbsPath, (curr, prev) => {
        if (curr != prev) {
            GitDiff.SetView(selectedFile);
        };
    });

    GitDiffCustomWebViewPanal.webView.onDidReceiveMessage(function(msg) {
        let action = msg.command;
        switch (action) {
            case 'update':
                GitDiff.SetView(msg.selectedFile);
                break;
            case 'openFile':
                let fPath = path.join(projectPath, selectedFile);
                hx.workspace.openTextDocument(fPath);
                break;
            case 'openLog':
                let data = {
                    'projectPath': projectPath,
                    'projectName': projectName,
                    'selectedFile': selectedFile,
                    'easyGitInner': true
                };
                hx.commands.executeCommand('EasyGit.log', data);
                break;
            case 'handleConflict':
                // let options = ['checkout', msg.options, selectedFile];
                // GitDiff.handleConflict(selectedFile, options);
                break;
            default:
                break;
        };
    });
}


module.exports = {
    CatDiffCustomEditorProvider,
    GitDiffCustomWebViewPanal,
    GitDiffCustomEditorRenderHtml
}
