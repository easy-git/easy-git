const hx = require('hbuilderx');

const os = require('os');
const fs = require('fs');
const path = require('path');
const { debounce } = require('throttle-debounce');

const chokidar = require('chokidar');

const { Diff } = require('./diff.js');
const { getDefaultContent, getWebviewDiffContent } = require('./html.js');

let getThemeColor = require('../../common/theme.js');

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

// Git触发途径：HBuilderX内触发、外部Git命令（或其它工具）触发
let GitHBuilderXInnerTrigger = false;

// 监听器、监听的文件路径
let watchListener;
let watchFilePathName;


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
            if (watchListener != undefined) {
                watchListener.close();
            };
        });

        // 监听主题切换
        let configurationChangeDisplose = hx.workspace.onDidChangeConfiguration(function(event){
            if(event.affectsConfiguration("editor.colorScheme")){
                let ThemeColor = getThemeColor();
                GitDiffCustomWebViewPanal.webView.postMessage({
                    "command": "themeColor",
                    "data": ThemeColor
                });
            };
        });
    };
};


/**
 * @description 监听文件
 * @param {String} absolutePath 文件绝对路径
 * @param {String} selectedFile 项目下的文件相对路径
 */
function watchCurrentDiffFile(absolutePath, selectedFile, func) {
    const watchOpt = {
        persistent: true
    };
    try {
        const debounceView = debounce(500, () => {
            func.SetView(selectedFile)
        });
        watchListener = chokidar.watch(absolutePath, {
            ignoreInitial: true
        }).on('change', fpath => {
            if (GitHBuilderXInnerTrigger == false) {
                debounceView();
            };
        });
    } catch (e) {
        console.log(e);
    };
};

/**
 * @description 生成文件对比视图HTML
 * @param {Object} ProjectData
 * @param {Object} userConfig
 */
function GitDiffCustomEditorRenderHtml(ProjectData, userConfig) {
    // 文件绝对路径，因为selectedFile是相对路径
    let absolutePath;

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
        absolutePath = path.join(projectPath, selectedFile);

        let fstate = fs.statSync(absolutePath);
        if (fstate.isFile() != true) {
            return hx.window.showErrorMessage('EasyGit: 选中有效的文件后，再进行操作！', ['我知道了']);
        };
    }catch(e){};

    try{
        let msgListeners = GitDiffCustomWebViewPanal._webView._msgListeners;
        if (msgListeners) {
            GitDiffCustomWebViewPanal._webView._msgListeners = [];
        };
    }catch(e){};

    let GitDiff = new Diff(ProjectData, userConfig, GitDiffCustomWebViewPanal);
    GitDiff.SetView();

    // 记录监听的项目路径, 避免重复监听
    if (watchFilePathName != undefined && watchFilePathName != absolutePath) {
        if (watchListener != undefined) {
            watchListener.close();
            watchListener = undefined;
        };
    };
    watchFilePathName = absolutePath;

    // 监听文件变动，自动更新对比视图
    watchCurrentDiffFile(absolutePath, selectedFile, GitDiff);

    GitDiffCustomWebViewPanal.webView.onDidReceiveMessage(function(msg) {
        let action = msg.command;
        GitHBuilderXInnerTrigger = true;
        switch (action) {
            // 在编辑器打开文件
            case 'openFile':
                GitDiff.openFile(selectedFile);
                break;
            // 打开日志视图
            case 'openLog':
                let data = {
                    'projectPath': projectPath,
                    'projectName': projectName,
                    'selectedFile': selectedFile,
                    'easyGitInner': true
                };
                hx.commands.executeCommand('EasyGit.log', data);
                break;
            // 处理冲突
            case 'handleConflict':
                let options = ['checkout', msg.options, selectedFile];
                GitDiff.handleConflict(selectedFile, options);
                break;
            // 文件对比配置：全文对比、三行差异对比
            case 'fileDiffLineSet':
                GitDiff.setFileDiffConfig();
                break;
            // 获取文件历史提交记录 Return: List
            case 'getFileHistoryCommitHashList':
                GitDiff.getFileHistoryCommitHashList();
                break;
            // 点击previous或next获取对比数据
            case 'historyRevision':
                GitDiff.SetViewForRevision(msg.param, msg.isPrevious);
                break;
            // 选择某条历史提交记录进行对比
            case 'selectOneRevisionToDiff':
                GitDiff.selectOneRevisionToDiff();
                break;
            // 刷新
            case 'refresh':
                GitDiff.SetView();
                break;
            default:
                break;
        };

        setTimeout(function() {
            GitHBuilderXInnerTrigger = false;
        }, 1200);
    });
}


module.exports = {
    CatDiffCustomEditorProvider,
    GitDiffCustomWebViewPanal,
    GitDiffCustomEditorRenderHtml
}
