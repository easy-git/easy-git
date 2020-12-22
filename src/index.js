const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');
const git = require('simple-git');

const utils = require('./common/utils.js');
const file = require('./common/file.js');

const cmp_hx_version = require('./common/cmp.js');
const upgrade = require('./common/upgrade.js');
const count = require('./common/count.js');

const MainView = require('./view/main.js');
const GitBranchView = require('./view/branch/branch.js');
const initView = require('./view/init/init.js');
const cloneView = require('./view/clone/clone.js');
const openLogView = require('./view/log/index.js');
const openDiffFileView = require('./view/diff/index.js');

// 用户本地是否安装Git
let isInstallGitForLocal;


class Common {
    constructor() {}

    // check: PC local git env
    async CheckGitEnv() {
        isInstallGitForLocal = await utils.isGitInstalled();
        if (!isInstallGitForLocal) {
            hx.window.showErrorMessage('检测到您本机未安装Git环境! 如已安装，还提示此错误，请重启HBuilderX',['现在安装','关闭']).then((result) => {
                if (result == '现在安装') {
                    hx.env.openExternal('https://git-scm.com/downloads');
                };
            });
        };
        return isInstallGitForLocal;
    };

    // easy-git plugin: user config info
    async getUserConfig() {
        let config = await hx.workspace.getConfiguration();
        let DisableDevTools = config.get('EasyGit.DisableDevTools');
        let GitConfigUserPrompt = config.get('EasyGit.GitConfigUserPrompt');
        let isShareUsageData = config.get('EasyGit.isShareUsageData');
        let GitAlwaysAutoCommitPush = config.get('EasyGit.AlwaysAutoCommitPush');
        let mainViewAutoRefreshFileList = config.get('EasyGit.mainViewAutoRefreshFileList');
        let logViewAutoRefresh = config.get('EasyGit.logViewAutoRefresh');
        return {
            'DisableDevTools': DisableDevTools,
            'mainViewAutoRefreshFileList': mainViewAutoRefreshFileList,
            'logViewAutoRefresh': logViewAutoRefresh,
            'GitConfigUserPrompt': GitConfigUserPrompt,
            'GitAlwaysAutoCommitPush': GitAlwaysAutoCommitPush
        };
    };

    // 项目管理器
    async getExplorerInfo(viewType) {
        let FilesExplorerProjectInfo = await utils.getFilesExplorerProjectInfo();
        let { FoldersNum } = FilesExplorerProjectInfo;

        // @todo ? 获取左侧视图开启情况，当没有开启时，则展开。
        // let filesExplorer = utils.getHBuilderXiniConfig('filesExplorer')
        if (FoldersNum == 0 && ['main', 'clone'].includes(viewType)) {
            hx.commands.executeCommand('workbench.view.explorer');
        };
        return FilesExplorerProjectInfo;
    };

    // 解析项目信息
    async getProjectInfo(param) {
        // 获取项目名称、项目路径
        let projectName, projectPath, selectedFile;

        // easyGitInner: 用于标记外部点击还是插件内部点击
        // GitAssignAction: 特定操作
        let {easyGitInner, GitAssignAction} = param;
        if (easyGitInner != undefined || easyGitInner) {
            try{
                projectName = param.projectName;
                projectPath = param.projectPath;
                selectedFile = param.selectedFile;
            }catch(e){
                hx.window.showErrorMessage('easy-git: 插件运行异常, 无法获取到项目。', ['我知道了']);
                return 'error';
            };
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
                let res = await hx.window.showErrorMessage('easy-git: 请在项目管理器选中项目后再试，或克隆一个项目', ['克隆','我知道了']).then( res => {
                    if (res == '克隆') {
                        return 'goClone';
                    } else {
                        return 'error';
                    };
                });
                return res;
            };
        };

        return {
            'projectName': projectName,
            'projectPath': projectPath,
            'selectedFile': selectedFile,
            'GitAssignAction': GitAssignAction
        };
    }
};


class Main extends Common {
    constructor(viewType, param, webviewPanel, context) {
        super();
        this.viewType = viewType;
        this.param = param;
        this.webviewPanel = webviewPanel;
        this.context = context;

        this.ProjectData = {};
        this.userConfig = {};
        this.ExplorerInfo = {};
    };

    async before() {
        if (!['main', 'branch', 'log', 'clone', 'diff'].includes(this.viewType)) {
            return 'error';
        };

        let { source } = this.context;
        if (source != "viewMenu" && (isInstallGitForLocal == undefined || !isInstallGitForLocal)) {
            let isInstall = await super.CheckGitEnv();
            if (!isInstall) { return 'error'; };
        };

        this.userConfig = await super.getUserConfig();
        this.ExplorerInfo = await super.getExplorerInfo(this.viewType);
        this.ExplorerInfo.source = source;
    };

    /**
     * @description 菜单【视图】【显示扩展视图】
     *
     *  项目管理器，没有项目，显示【导入本地项目】按钮
     *  项目管理器，只有1个项目，如果已是git，直接打开；否则，则显示【初始化存储库】按钮
     *  项目管理器，多个项目，显示【导入本地项目】按钮和【选择项目管理器中的Git项目】按钮
     */
    async notFocus() {
        let isGitProject = false;
        let { FoldersNum, Folders } = this.ExplorerInfo;
        if (FoldersNum != 1) {
            initView.show(this.webviewPanel, this.userConfig, this.ExplorerInfo);
            return;
        };

        if (FoldersNum == 1) {
            let { FolderName, FolderPath, isGit } = Folders[0];
            isGitProject = isGit;

            // 如果是git项目，直接打开
            if (isGitProject) {
                let gitInfo = await utils.gitStatus(FolderPath);
                let gitData = Object.assign(gitInfo, {
                    'projectName': FolderName,
                    'projectPath': FolderPath
                });
                switch (this.viewType){
                    case 'main':
                        MainView.active(this.webviewPanel, this.userConfig, gitData);
                        break;
                    case 'branch':
                        GitBranchView(this.webviewPanel, this.userConfig, gitData);
                        break;
                    case 'log':
                        openLogView(this.userConfig, gitData, this.webviewPanel);
                        break;
                    default:
                        break;
                };
            } else {
                initView.show(this.webviewPanel, this.userConfig, this.ExplorerInfo);
                return;
            };
        };
    };

    /**
     * 项目管理器，选中项目，右键菜单入口:
     *  - 是Git项目，则直接打开
     *  - 不是Git项目，显示【初始化存储库】按钮
     *
     * 菜单【工具】【easy-git】:
     *   - 只有一个项目，如果是git，直接打开，不是则进入初始化页面
     *   - 多个页面进入初始页面
     */
    async Focus() {
        this.ProjectData = await super.getProjectInfo(this.param);

        // 获取项目名称、项目路径
        let { projectName, projectPath, selectedFile, GitAssignAction } = this.ProjectData;

        // git project status
        let gitInfo = await utils.gitStatus(projectPath);
        let isGitProject = gitInfo.isGit;
        let gitData = Object.assign(
            gitInfo,
            this.ProjectData,
            {'GitAssignAction': GitAssignAction},
        );

        if (this.viewType == 'main' && isGitProject) {
            // 检查是否设置了user.name和user.email
            await utils.checkGitUsernameEmail(projectPath, projectName, this.userConfig);

            // Git文件视图：检查git项目是否包含node_modules
            setTimeout(function() {
                utils.checkNodeModulesFileList(projectPath, projectName, gitInfo);
            }, 10000);
        };

        // 如果在项目管理器，当前选择的项目不是git项目
        let currentSelectedProject = {
            'FolderPath': projectPath,
            'FolderName':projectName,
            'isGit': false
        };
        let FilesExplorerProjectInfo = Object.assign(
            this.ExplorerInfo, {'currentSelectedProject': currentSelectedProject}
        );

        if (!isGitProject) {
            initView.show(this.webviewPanel, this.userConfig, FilesExplorerProjectInfo);
            return;
        };

        try{
            let isActive = this.webviewPanel._webView._html;
            if (isActive != '') {
                this.webviewPanel._webView._html = '';
                this.webviewPanel._webView._msgListeners = [];
            };
        }catch(e){};

        switch (this.viewType){
            case 'diff':
                openDiffFileView(this.ProjectData, this.userConfig);
                break;
            case 'main':
                MainView.active(this.webviewPanel, this.userConfig, gitData);
                break;
            case 'branch':
                GitBranchView(this.webviewPanel, this.userConfig, gitData);
                break;
            case 'log':
                openLogView(this.userConfig, gitData, this.webviewPanel);
                break;
            default:
                break;
        };
    };

    async run() {
        let beforeResult = await this.before();
        if (beforeResult == 'error') { return; };

        try{
            count(this.viewType).catch( error=> {});
            upgrade.checkUpdate('auto');
        }catch(e){};

        // git clone
        if (this.viewType == 'clone' || beforeResult == 'goClone') {
            cloneView.show(this.webviewPanel, this.userConfig);
            return;
        };

        // 从菜单【视图】【显示扩展视图】进入
        let { source } = this.context;
        if (source == "viewMenu") {
            this.notFocus();
            return;
        };

        // git diff file
        if (this.viewType == 'diff' && this.param == null && this.param != undefined) {
            hx.window.showErrorMessage('EasyGit: 请选中具体的文件后，再进行操作！', ['我知道了']);
            return;
        };

        // 项目管理器、编辑器，右键菜单 (获取到焦点)
        if (source == "filesExplorer" && this.param != null) {
            this.Focus();
            return;
        };

        // 没有获取到焦点
        if (source == "filesExplorer" && this.param == null) {
            this.notFocus();
            return;
        };
    };
};

module.exports = Main;
