const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');
const git = require('simple-git');

const file = require('./common/file.js');
const utils = require('./common/utils.js');
const count = require('./common/count.js');
const cmp_hx_version = require('./common/cmp.js');

const MainView = require('./view/main.js');
const GitBranchView = require('./view/branch/branch.js');
const initView = require('./view/init.js');
const cloneView = require('./view/clone.js');

// Easy-Git log view, hbuilderx 2.9.2-, use webview
const openLogWebView = require('./view/log/openWebView.js');

// Easy-Git log view, hbuilderx 2.9.2+, use customEditor
let { RenderGitLogCustomEditor } = require('./view/log/openCustomEditor.js');

// get hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');

// CustomEditor 首次启动缓慢，因此在状态栏增加提示
let isShowLogMessage = false;

/**
 * @description 打开日志视图
 * @param {Object} userConfig
 * @param {Object} gitData
 * @param {Object} webviewPanel. hbuilderx 2.9.2-, use webview; hbuilderx 2.9.2+, use customEditor
 */
async function openGitLog(userConfig, gitData, webviewPanel) {
    let cmp = cmp_hx_version(hxVersion, '2.9.2');
    if (cmp <= 0) {
        if (isShowLogMessage == false) {
            hx.window.setStatusBarMessage('EasyGit: 正在加载Git日志，首次加载较慢，请耐心等待......', 5000, 'info');
            isShowLogMessage = true;
        };
        RenderGitLogCustomEditor(gitData, userConfig);
    } else {
        openLogWebView(webviewPanel, userConfig, gitData);
        hx.window.showView({
           containerid: "EasyGitCommonView"
        });
    };
};


/**
 * @description 当焦点不在编辑器、项目管理器上
 */
async function FromNotFocus(viewType, param, webviewPanel, userConfig, FilesExplorerProjectInfo) {
    // 当焦点不再编辑器，从菜单【工具】【easy-git】【源代码管理】触发，此时param == null
    let {FoldersNum, Folders} = FilesExplorerProjectInfo;

    // 如果项目管理器只有一个项目, 且是git项目。直接打开
    if (FoldersNum == 1) {
        let {FolderName,FolderPath,isGit} = Folders[0];
        let isGitProject = isGit;

        // 如果是git项目，直接打开
        if (isGitProject) {
            let gitInfo = await utils.gitStatus(FolderPath);
            let gitData = Object.assign(gitInfo, {
                'projectName': FolderName,
                'projectPath': FolderPath
            });
            if (viewType == 'main') {
                MainView.active(webviewPanel, userConfig, gitData);
            };
            if (viewType == 'branch') {
                GitBranchView(webviewPanel, userConfig, gitData);
            };
            if (viewType == 'log') {
                openGitLog(userConfig, gitData, webviewPanel);
            };
        } else {
            initView.show(webviewPanel, userConfig, FilesExplorerProjectInfo);
        };
    } else {
        // 非git项目，则进入初始化
        initView.show(webviewPanel, userConfig, FilesExplorerProjectInfo);
    };

    let containerid = viewType == 'log' ? 'EasyGitCommonView': 'EasyGitSourceCodeView';
    hx.window.showView({
       containerid: containerid
    });
};


/**
 * @description
 *
 * 项目管理器，选中项目，右键菜单入口:
 *  - 是Git项目，则直接打开
 *  - 不是Git项目，显示【初始化存储库】按钮
 *
 * 菜单【工具】【easy-git】:
 *   - 只有一个项目，如果是git，直接打开，不是则进入初始化页面
 *   - 多个页面进入初始页面
 */
async function FromFilesFocus(viewType, param, webviewPanel, userConfig, FilesExplorerProjectInfo) {
    // 获取项目名称、项目路径
    let projectName, projectPath, selectedFile;

    // easyGitInner: 用于标记外部点击还是插件内部点击
    // GitAssignAction: 特定操作
    let {easyGitInner, GitAssignAction} = param;
    if (easyGitInner != undefined || easyGitInner) {
        try{
            projectName = param.projectName;
            projectPath = param.projectPath;
        }catch(e){
            return hx.window.showErrorMessage('easy-git: 插件运行异常, 无法获取到项目。', ['我知道了']);
        }
    } else {
        try{
            try {
                projectName = param.workspaceFolder.name;
                projectPath = param.workspaceFolder.uri.fsPath;
                selectedFile = param.fsPath;
            } catch (e) {
                projectName = param.document.workspaceFolder.name;
                projectPath = param.document.workspaceFolder.uri.fsPath;
                selectedFile = param.document.uri.fsPath;
            };
        } catch(e){
            return hx.window.showErrorMessage('easy-git: 无法获取到项目，请在项目管理器选中后再试。', ['我知道了']);
        }
    };

    // git project status
    let gitInfo = await utils.gitStatus(projectPath);
    isGitProject = gitInfo.isGit;
    let gitData = Object.assign(gitInfo, {
        'projectName': projectName,
        'projectPath': projectPath,
        'selectedFile': selectedFile,
        'GitAssignAction': GitAssignAction
    });

    if (viewType == 'main' && isGitProject) {
        // Git文件视图：检查git项目是否包含node_modules
        utils.checkNodeModulesFileList(projectPath, projectName, gitInfo);
        // 检查是否设置了user.name和user.email
        utils.checkGitUsernameEmail(projectPath, projectName, userConfig)
    };

    // 设置项目路径(暂时无用)
    webviewPanel._projectPath = projectPath;

    // 清空webview html
    let isActive = webviewPanel._webView._html;
    if (isActive != '') {
        webviewPanel._webView._html = '';
        webviewPanel._webView._msgListeners = [];
    };

    // 如果在项目管理器，当前选择的项目不是git项目
    let currentSelectedProject = {
        'FolderPath': projectPath,
        'FolderName':projectName,
        'isGit': false
    };
    FilesExplorerProjectInfo = Object.assign(
        FilesExplorerProjectInfo, {'currentSelectedProject':currentSelectedProject}
    );

    // show git Main view
    if (viewType == 'main') {
        if (isGitProject) {
            MainView.active(webviewPanel, userConfig, gitData);
        } else {
            initView.show(webviewPanel, userConfig, FilesExplorerProjectInfo);
        };
        hx.window.showView({
           containerid: "EasyGitSourceCodeView"
        });
        return;
    };

    // show git Main view
    if (viewType == 'branch') {
        if (isGitProject) {
            GitBranchView(webviewPanel, userConfig, gitData);
        } else {
            initView.show(webviewPanel, userConfig, FilesExplorerProjectInfo);
        };
        hx.window.showView({
           containerid: "EasyGitSourceCodeView"
        });
        return;
    };

    // show git log view
    if (viewType == 'log') {
        openGitLog(userConfig, gitData, webviewPanel);
        return;
    };

};


/**
 * @description 菜单【视图】【显示扩展视图】
 *
 *  项目管理器，只有1个项目，如果已是git，直接打开；否则，则显示【初始化存储库】按钮
 *  项目管理器，没有项目，显示【导入本地项目】按钮
 *  项目管理器，多个项目，显示【导入本地项目】按钮和【选择项目管理器中的Git项目】按钮
 *
 */
async function FromViewMenu(viewType, webviewPanel, userConfig, FilesExplorerProjectInfo) {

    let isGitProject = false;
    let {FoldersNum, Folders} = FilesExplorerProjectInfo;

    if (FoldersNum == 1) {
        let {FolderName,FolderPath,isGit} = Folders[0];
        isGitProject = isGit;

        // 如果是git项目，直接打开
        if (isGitProject) {
            let gitInfo = await utils.gitStatus(FolderPath);
            let gitData = Object.assign(gitInfo, {
                'projectName': FolderName,
                'projectPath': FolderPath
            });
            if (viewType == 'main') {
                MainView.active(webviewPanel, userConfig, gitData);
            };
            if (viewType == 'branch') {
                GitBranchView(webviewPanel, userConfig, gitData);
            };
            if (viewType == 'log') {
                openGitLog(userConfig, gitData, webviewPanel);
            };
        };
    };
    if (FoldersNum != 1 || !isGitProject) {
        initView.show(webviewPanel, userConfig, FilesExplorerProjectInfo);
        return;
    };
};


/**
 * @description 统一入口
 * @param {Object} param
 * @param {Object} webviewPanel
 */
async function main(viewType, param, webviewPanel, context) {

    if (!['main', 'branch', 'log', 'clone'].includes(viewType)) {
        return;
    };

    // 获取来源
    let {source} = context;

    // 因为从扩展视图进入，会执行两遍，所以从扩展视图进入，不执行此处
    if (source != "viewMenu") {
        // 检查用户电脑Git环境是否正常
        let isInstall = utils.isGitInstalled();
        if (!isInstall) {
            hx.window.showErrorMessage('检测到您本机未安装Git环境! 如已安装，还提示此错误，请重启HBuilderX',['现在安装','关闭']).then((result) => {
                if (result == '现在安装') {
                    hx.env.openExternal('https://git-scm.com/downloads');
                };
            });
            return;
        };
    };

    // user config
    let config = hx.workspace.getConfiguration();
    let DisableDevTools = config.get('EasyGit.DisableDevTools');
    let GitConfigUserPrompt = config.get('EasyGit.GitConfigUserPrompt');
    let isShareUsageData = config.get('EasyGit.isShareUsageData');
    let userConfig = {
        'DisableDevTools': DisableDevTools,
        'GitConfigUserPrompt': GitConfigUserPrompt
    };

    // 项目管理器所有项目信息
    let FilesExplorerProjectInfo = await utils.getFilesExplorerProjectInfo();
    let {FoldersNum} = FilesExplorerProjectInfo;
    FilesExplorerProjectInfo.source = source;

    // @todo ? 获取左侧视图开启情况，当没有开启时，则展开。
    // let filesExplorer = utils.getHBuilderXiniConfig('filesExplorer')
    if (FoldersNum == 0 && ['main', 'clone'].includes(viewType)) {
        hx.commands.executeCommand('workbench.view.explorer');
    };

    // count
    try{
        if (isShareUsageData == undefined && !isShareUsageData) {
            count(viewType).catch( error=> {});
        };
    }catch(e){};

    // 从菜单【视图】【显示扩展视图】进入
    if (source == "viewMenu") {
        FromViewMenu(viewType, webviewPanel, userConfig, FilesExplorerProjectInfo);
        return;
    };

    // 克隆
    if (viewType == 'clone') {
        cloneView.show(webviewPanel, userConfig);
        hx.window.showView({
           containerid: "EasyGitSourceCodeView"
        });
        return;
    };

    // 项目管理器、编辑器，右键菜单 (获取到焦点)
    if (source == "filesExplorer" && param != null) {
        param = param;
        FromFilesFocus(viewType, param, webviewPanel, userConfig, FilesExplorerProjectInfo);
        return;
    };

    // 没有获取到焦点
    if (source == "filesExplorer" && param == null) {
        param = param;
        FromNotFocus(viewType, param, webviewPanel, userConfig, FilesExplorerProjectInfo);
        return;
    };
};


module.exports = {
    main
}
