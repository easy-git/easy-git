const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');
const git = require('simple-git');

const file = require('./file.js');
const utils = require('./utils.js');

const MainView = require('./view/main.js');
const LogView = require('./view/log.js');
const initView = require('./view/init.js');
const cloneView = require('./view/clone.js');


/**
 * @description 检查文件列表是否包含node_modules，并返回文件数量
 * @param {Object} GitStatusResult
 */
function checkFileList(GitStatusResult) {
    let gitFileList = JSON.parse(GitStatusResult.gitStatusResult);

    let staged = gitFileList.staged;
    let modified = gitFileList.modified;
    let deleted = gitFileList.deleted;
    let not_added = gitFileList.not_added;
    let renamed = gitFileList.renamed;
    let created = gitFileList.created;

    let all = [...staged,...modified,...deleted,...not_added,...renamed,...created];
    let num = all.length;

    let isNodeModules = false;
    let tmp = [...modified,...not_added,...created]
    for (let s of tmp) {
        if (s.includes('node_modules')) {
            isNodeModules = true;
            break;
        };
    };
    return {num,isNodeModules}
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
async function FromFilesExplorer(viewType, param, webviewPanel, userConfig, FilesExplorerProjectInfo) {

    // 当焦点不再编辑器，从菜单【工具】【easy-git】【源代码管理】触发，此时param == null
    if (param == null) {

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
                if (viewType == 'log') {
                    LogView.show(webviewPanel, userConfig, gitData);
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
        return;
    };

    // 获取项目名称、项目路径
    let {easyGitInner} = param;
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
            } catch (e) {
                projectName = param.document.workspaceFolder.name;
                projectPath = param.document.workspaceFolder.uri.fsPath;
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
        'projectPath': projectPath
    });

    // Git文件视图：检查git项目是否包含node_modules
    if (viewType == 'main' && isGitProject) {
        let {num,isNodeModules} = checkFileList(gitInfo);
        if (isNodeModules) {
            hx.window.showErrorMessage(
                '检测到当前git项目下，包含node_modules，且未设置.gitignore, 是否设置?',['设置.gitignore','以后再说'],
            ).then((result) => {
                if (result == '设置.gitignore') {
                    file.gitignore({
                        'projectPath': projectPath
                    });
                }
            })
        };
        if (num >= 10000) {
            hx.window.showErrorMessage(
                `easy-it: 项目${projectName}下, ${num}个文件发生了变化，easy-git插件需要一定的时间来加载。\n`,
                ['我知道了'],
            )
        };
    };

    // 设置项目路径(暂时无用)
    webviewPanel._projectPath = projectPath;

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
            hx.window.showView({
               containerid: "EasyGitSourceCodeView"
            });
        } else {
            initView.show(webviewPanel, userConfig, FilesExplorerProjectInfo);
            hx.window.showView({
               containerid: "EasyGitSourceCodeView"
            });
        };
        return;
    };

    // show git log view
    if (viewType == 'log') {
        LogView.show(webviewPanel, userConfig, gitData);
        hx.window.showView({
           containerid: "EasyGitCommonView"
        });
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
            if (viewType == 'log') {
                LogView.show(webviewPanel, userConfig, gitData);
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

    if (!['main','log', 'clone'].includes(viewType)) {
        return;
    };

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

    // 获取来源
    let {source} = context;

    let filesExplorer = utils.getHBuilderXiniConfig('filesExplorer')
    if (filesExplorer <= 0) {
        hx.commands.executeCommand('workbench.action.toggleSidebarVisibility');
    };

    // user config
    let config = hx.workspace.getConfiguration();
    let DisableDevTools = config.get('EasyGit.DisableDevTools');
    let userConfig = {
        'DisableDevTools': DisableDevTools
    };

    // 项目管理器所有项目信息
    let FilesExplorerProjectInfo = await utils.getFilesExplorerProjectInfo();
    FilesExplorerProjectInfo.source = source;

    // 克隆
    if (viewType == 'clone') {
        cloneView.show(webviewPanel, userConfig);
        hx.window.showView({
           containerid: "EasyGitSourceCodeView"
        });
        return;
    };

    // 从菜单【视图】【显示扩展视图】进入
    if (source == "viewMenu") {
        FromViewMenu(viewType, webviewPanel, userConfig, FilesExplorerProjectInfo);
    };

    if (source == "filesExplorer") {
        param = param;
        FromFilesExplorer(viewType, param, webviewPanel, userConfig, FilesExplorerProjectInfo);
    };
};


module.exports = {
    main
}
