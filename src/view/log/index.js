const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');
const { checkIsGitProject, getThemeColor } = require('../../common/utils.js');

const chokidar = require('chokidar');
const { debounce } = require('throttle-debounce');

const { GitLogAction } = require('./log.js');
const generateLogHtml = require('./html.js');

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
                            isHtml = GitLogCustomWebViewPanal.webView._html;
                            if (isHtml == '') {
                                GitLogCustomEditorRenderHtml({},{});
                            };
                        }catch(e){};
                    }, 1000);
                };
            }, 1000);
        };

        // close customEditor
        webViewPanel.onDidDispose(function() {
            if (watcher != undefined) {
                watcher.close();
            };

            GitLogCustomWebViewPanal = {};
            GitLogCustomEditorStatus = false;
        });
    }
};

/**
 * @param {Object} gitData
 * @description 解决hx启动后，已打开的自定义编辑器空白的问题
 */
function history(gitData) {
    if (HistoryProjectPath != undefined) return;

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
let watcher;
let watchProjectPath;
async function watchProjectDir(projectDir, func) {
    const watchOpt = {
        persistent: true,
        recursive: true
    };
    try {
        const debounceView = debounce(800, () => {
            func.setView('branch', '');
        });

        let GitDir;
        GitDir = await checkIsGitProject(projectDir);
        if (GitDir == 'error') return;
        GitDir = path.join(GitDir, '.git');

        let ignoredDir = path.join(GitDir, 'objects');
        watcher = chokidar.watch(GitDir, {
            ignored: ignoredDir,
            ignoreInitial: true
        }).on('all', (event, vpath) => {
            let fpath = vpath.replace(path.join(GitDir,'/'),'');
            if (fpath == 'index.lock') return;
            if (['change', 'add', 'unlink', 'unlinkDir'].includes(event) && (['index','COMMIT_EDITMSG'].includes(fpath) || fpath.includes('refs/tags') || fpath.includes('refs/heads')) && GitHBuilderXInnerTrigger == false ){
                debounceView();
            };
        });
    } catch (e) {
        console.log(e);
    };
};

/**
 * @description 日志视图
 * @param {Object} projectData - {projectName, projectPath}
 * @param {Object} userConfig
 */
async function GitLogCustomEditorRenderHtml(projectData, userConfig) {
    let {projectPath, projectName, selectedFile} = projectData;
    isSelectedFile = selectedFile;

    if (JSON.stringify(projectData) == '{}' && isCustomFirstOpen == false) {
        isCustomFirstOpen = true;
        let config = hx.workspace.getConfiguration();
        projectPath = config.get("EasyGit.HistoryProjectPath");
        projectName = config.get("EasyGit.HistoryProjectName");

        if (projectPath == undefined || projectName == undefined) {return;};

        projectData.projectPath = projectPath;
        projectData.projectName = projectName;
    } else {
        isCustomFirstOpen = true;
    };

    // 仅首次运行
    history(projectData);

    // 获取git-dir来解决，hx项目管理器内项目为git项目子目录的情况
    let gitRootDir = await checkIsGitProject(projectPath).catch( error => { return error });
    if (gitRootDir == 'error') {
        gitRootDir = projectPath;
    };
    
    // 解决消息重复监听的Bug
    try{
        let msgListeners = GitLogCustomWebViewPanal._webView._msgListeners;
        if (msgListeners) {
            GitLogCustomWebViewPanal._webView._msgListeners = [];
        };
    }catch(e){};

    let LastGitData = Object.assign(projectData, {"gitRootDir": gitRootDir});
    let Log = new GitLogAction(LastGitData, userConfig, GitLogCustomWebViewPanal);

    // 默认在当前分支搜索，当搜索全部时，此值为all
    let searchType = 'branch';

    // 记录监听的项目路径, 避免重复监听
    if (watchProjectPath != undefined && watchProjectPath != projectPath) {
        if (watcher != undefined) {
            watcher.close();
            watcher = undefined;
        };
    };
    watchProjectPath = projectPath;

    // 监听.git，当关闭日志视图自动刷新时，即logViewAutoRefresh=false，则不再监听
    let { logViewAutoRefresh } = userConfig;
    if ((logViewAutoRefresh || logViewAutoRefresh == undefined) && watcher == undefined) {
        watchProjectDir(projectPath, Log);
    };

    // 选中文件或目录，则查看此文件的log记录
    let searchText = '';
    if (selectedFile != '' && selectedFile != undefined) {
        let sfile = selectedFile.replace(projectPath, '');
        if (sfile.slice(0,1) == '/') {
            sfile = sfile.slice(1);
        };
        if (selectedFile != projectPath) {
            searchText = sfile;
        };
    };

    // 渲染html
    let initData = Object.assign({"searchText": searchText},projectData);
    GitLogCustomWebViewPanal.webView.html = generateLogHtml(userConfig, initData);

    let easyGitInnerParams = {
        'projectPath': projectPath,
        'projectName': projectName,
        'easyGitInner': true
    };

    GitLogCustomWebViewPanal.webView.onDidReceiveMessage(function(msg) {
        GitHBuilderXInnerTrigger = true;
        let action = msg.command;
        switch (action) {
            case 'gitLog':
                Log.setView(msg.searchType, msg.condition, msg.refname);
                break;
            case 'refresh':
                Log.setView(searchType, '', msg.refname);
                break;
            case 'openFile':
                Log.inLogOpenFile(msg.filename)
                break;
            case 'copy':
                hx.env.clipboard.writeText(msg.text);
                hx.window.setStatusBarMessage('EasyGit: 消息已成功复制到剪切板。', 5000, 'info');
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
                let BcParams = Object.assign({'ref': msg.hash}, easyGitInnerParams);
                hx.commands.executeCommand('EasyGit.BranchCreate', BcParams)
                break;
            case 'create-tag':
                GitHBuilderXInnerTrigger = false;
                Log.createTag(msg.hash);
                break;
            case 'showCommitFileChange':
                Log.showCommitFileChange(msg.data);
                break;
            case 'showRefList':
                Log.goRefs();
                break;
            case 'archive':
                let archvieParams = Object.assign({'hash': msg.hash}, easyGitInnerParams);
                hx.commands.executeCommand('EasyGit.archive', archvieParams);
                break;
            case 'hxCommand':
                let {commandParam, commandName} = msg;
                hx.commands.executeCommand(commandName, {"viewName": commandParam, "easyGitInner": true});
                break;
            case 'openSearchHelp':
                hx.env.openExternal('https://easy-git.github.io/docs/log/search');
                break;
            default:
                break;
        };
        setTimeout(function() {
            GitHBuilderXInnerTrigger = false;
        }, 1000);
    });

    // 监听主题切换
    let configurationChangeDisplose = hx.workspace.onDidChangeConfiguration(function(event){
        if(event.affectsConfiguration("editor.colorScheme")){
            let ThemeColor = getThemeColor();
            GitLogCustomWebViewPanal.webView.postMessage({
                "command": "themeColor",
                "data": ThemeColor
            });
        }
    });
};

// CustomEditor 首次启动缓慢，因此在状态栏增加提示
let isShowLogMessage = false;

/**
 * @description 打开日志视图
 * @param {Object} userConfig
 * @param {Object} projectData - {projectName, projectPath}
 */
function openLogView(userConfig, projectData) {
    if (isShowLogMessage == false) {
        hx.window.setStatusBarMessage('EasyGit: 正在加载Git日志，首次加载较慢，请耐心等待......', 5000, 'info');
        isShowLogMessage = true;
        setTimeout(function() {
            GitLogCustomEditorRenderHtml(projectData, userConfig);
        }, 800);
    } else {
        setTimeout(function() {
            GitLogCustomEditorRenderHtml(projectData, userConfig);
        }, 300);
    };
};

module.exports = {
    CatCustomEditorProvider,
    GitLogCustomWebViewPanal,
    GitLogCustomEditorStatus,
    GitLogCustomEditorRenderHtml,
    openLogView
}
