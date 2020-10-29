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
}catch(e){}


// 用于保存自定义编辑器信息
let GitDiffCustomWebViewPanal = {};


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
                            GitDiffCustomEditorRenderHtml({},{});
                        }
                    }, 2000);
                };
            }, 3000);
        };

        // close customEditor
        webViewPanel.onDidDispose(function() {
            GitDiffCustomWebViewPanal = {};
            isCustomFirstOpen = false;
        });
    }
};


function GitDiffCustomEditorRenderHtml(ProjectData, userConfig) {
    let { projectPath, projectName, selectedFile } = ProjectData;
    isSelectedFile = selectedFile;
    isCustomFirstOpen = true;

    if (selectedFile == undefined || selectedFile == null) {
        setTimeout(function() {
            if (selectedFile == undefined || selectedFile == null) {
                GitDiffCustomWebViewPanal.webView.html = getDefaultContent();
            };
        }, 2000);
        return;
    };

    try{
        projectPath = path.normalize(projectPath);
        ProjectData.projectPath = projectPath;

        let fileAbsPath = path.join(projectPath, selectedFile);
        let fstate = fs.statSync(fileAbsPath);
        if (fstate.isFile() != true) {
            return hx.window.showErrorMessage('EasyGit: 选中有效的文件后，再进行操作！', ['我知道了']);
        };
    }catch(e){};

    let GitDiff = new Diff(ProjectData, userConfig, GitDiffCustomWebViewPanal);
    GitDiff.SetView(selectedFile);

    GitDiffCustomWebViewPanal.webView.onDidReceiveMessage(function(msg) {
        let action = msg.command;
        switch (action) {
            case 'update':
                GitDiff.SetView(msg.selectedFile);
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
