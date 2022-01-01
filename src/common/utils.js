const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');
const {exec} = require('child_process');
const dayjs = require('dayjs');

const hx = require('hbuilderx');
const spawn = require('cross-spawn');
const ini = require('ini');

const gitRemoteOriginUrl = require('git-remote-origin-url');
const git = require('simple-git');

const count = require('./count.js');
const voiceSay = require('./voice.js');

const fileIO= require('./file.js');

const osName = os.platform();

const cmp_hx_version = require('./cmp.js');
// let hxVersion = hx.env.appVersion;
// hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');

// const cmpVersionResult = cmp_hx_version(hxVersion, '2.9.12');
// const cmpVersionResult_for_outputChannel = cmp_hx_version(hxVersion, '3.1.1');

// 2021-4-16: 是否忽略Git钩子
let config = hx.workspace.getConfiguration();
let ignoreGitHooksForCommit = config.get('EasyGit.ignoreGitHooksForCommit');
let noVerify = ignoreGitHooksForCommit ? '--no-verify' : false;

/**
 * @description 判断是否是object
 * @param {Object} object
 */
function isObj(object){
    return object && typeof (object) == 'object' && Object.prototype.toString.call(object).toLowerCase() == "[object object]";
};

/**
 * @description 获取跟主题相匹配的颜色
 *   - fontFamily              字体
 *   - fontSize                字号
 *   - fontColor               字体颜色
 *   - lefeSideVeiwBackground  左侧视图背景色
 *   - background              编辑器背景色
 *   - liHoverBackground       li类元素，悬停背景色
 *   - inputColor              输入框颜色
 *   - inputBgColor            输入框背景色
 *   - inputLineColor          输入框线条颜色
 *   - lineColor               其它线条颜色
 *   - menuBackground          菜单背景色
 *   - menuCutLineColor        菜单分割线
 *   - scrollbarColor          滚动条颜色
 *   - cursorColor             光标颜色
 *   - remarkTextColor         备注颜色，主要用于左侧视图文件目录名颜色
 *   - lineForBorderTopColor   日志视图，commit详情 border-top
 * @param {String} area - HBuilderX区域，当area=undefinded，返回编辑器区域的背景色；当area=siderBar时，返回项目管理器背景色
 * @return {Object}
 */
function getThemeColor(area) {
    let fontColor;
    let background;
    let lefeSideVeiwBackground;
    let liHoverBackground;
    let inputColor;
    let inputBgColor;
    let inputLineColor;
    let cursorColor;
    let lineColor;
    let menuBackground;
    let menuCutLineColor;
    let scrollbarColor;
    let remarkTextColor;
    let lineForBorderTopColor;

    let config = hx.workspace.getConfiguration();
    let colorScheme = config.get('editor.colorScheme');
    let colorCustomizations = config.get('workbench.colorCustomizations');
    let explorerIconTheme = config.get('explorer.iconTheme');

    if (colorScheme == undefined) {
        colorScheme = 'Default';
    };
    if (explorerIconTheme == '' || !explorerIconTheme) {
        explorerIconTheme = "vs-seti"
    };

    if (!["hx-file-icons", "vs-seti", "hx-file-icons-colorful"].includes(explorerIconTheme)) {
        explorerIconTheme = "vs-seti"
    };

    // 用于确定图标颜色 light | dark
    let explorerIconScheme = 'light';
    if (colorScheme == 'Monokai' || colorScheme == 'Atom One Dark') {
        explorerIconScheme = "dark";
    };

    // 获取HBuilderX编辑器字体大小
    let fontSize = config.get('editor.fontSize');
    if (fontSize == '' || fontSize == undefined) {
        fontSize = 14;
    };

    // 获取HBuilderX编辑器字体
    let fontFamily = config.get("editor.fontFamily");
    if (fontFamily) {
        fontFamily = "Monaco"
    };

    let customColors = {};
    try{
        customColors = colorCustomizations[`[${colorScheme}]`];
        if (!isObj(customColors)) {
            customColors = {};
        };
    } catch (e) {};

    let viewBackgroundOptionName = area == 'siderBar' ? 'sideBar.background' : 'editor.background';
    let viewFontOptionName = area == 'siderBar' ? 'list.foreground' : undefined;
    let viewLiHoverBgOptionName = area == 'siderBar' ? 'list.hoverBackground' : 'list.hoverBackground';

    switch (colorScheme){
        case 'Monokai':
            fontColor = 'rgb(227,227,227)';
            remarkTextColor = 'rgb(154,154,154)';
            lefeSideVeiwBackground = 'rgb(39,40,34)';
            background = 'rgb(39,40,34)';
            menuBackground = 'rgb(58,58,58)';
            menuCutLineColor = 'rgb(119,119,119)';
            liHoverBackground = 'rgb(78,80,73)';
            inputColor = 'rgb(255,254,250)';
            inputBgColor = '#2E2E2E';
            inputLineColor = '#CECECE';
            cursorColor = 'rgb(255,255,255)';
            lineColor = 'rgb(23,23,23)';
            lineForBorderTopColor = 'rgb(23,23,23)';
            scrollbarColor = '#6F6F6F';
            break;
        case 'Atom One Dark':
            fontColor = 'rgb(171,178,191)';
            remarkTextColor = 'rgb(154,154,154)';
            lefeSideVeiwBackground = 'rgb(33,37,43)';
            background = 'rgb(40,44,53)';
            menuBackground = 'rgb(53,59,69)';
            menuCutLineColor = 'rgb(119,119,119)';
            liHoverBackground = 'rgb(44,47,55)';
            inputColor = 'rgb(255,254,250)';
            inputBgColor = '#282c35';
            inputLineColor = 'rgb(65, 111, 204)';
            cursorColor = 'rgb(255,255,255)';
            lineColor = '#282c35';
            lineForBorderTopColor = 'rgb(24,26,31)';
            scrollbarColor = '#6F6F6F';
            break;
        default:
            fontColor = 'rgb(51, 51, 51)';
            remarkTextColor = 'rgb(104,104,104)';
            lefeSideVeiwBackground = 'rgb(255,250,232)';
            background = 'rgb(255,250,232)';
            menuBackground = 'rgb(255,254,250)';
            menuCutLineColor = 'rgb(207,207,207)';
            liHoverBackground = 'rgb(224,237,211)';
            inputColor = 'rgb(255,252,243)';
            inputBgColor = 'rgb(248, 243, 226)';
            inputLineColor = 'rgb(65,168,99)';
            cursorColor = 'rgb(0,0,0)';
            lineColor = 'rgb(225,212,178)';
            lineForBorderTopColor = 'rgb(225,212,178)';
            scrollbarColor = 'rgb(207,181,106)';
            break;
    };

    if (customColors != undefined && JSON.stringify(customColors) != '{}') {
        if (customColors[viewBackgroundOptionName] && viewBackgroundOptionName in customColors) {
            background = customColors[viewBackgroundOptionName];
            menuBackground = customColors[viewBackgroundOptionName];
        };
        if (customColors[viewFontOptionName] && viewFontOptionName in customColors) {
            fontColor = customColors[viewFontOptionName];
        };
        if (customColors[viewLiHoverBgOptionName] && viewLiHoverBgOptionName in customColors) {
            liHoverBackground = customColors[viewLiHoverBgOptionName];
        };
    };

    // 文件对比相关颜色
    let d2h_ins_bg, d2h_ins_border;
    let d2h_del_bg, d2h_del_border;
    let d2h_code_side_line_del_bg, d2h_code_side_line_ins_bg;
    let d2h_emptyplaceholder_bg, d2h_emptyplaceholder_border;
    let d2h_linenum_color;
    let diff_scrollbar_color;
    if (colorScheme == 'Monokai' || colorScheme == 'Atom One Dark') {
        d2h_ins_bg = '#004D40';
        d2h_del_bg = '#400C12';
        d2h_code_side_line_del_bg = '#423133';
        d2h_code_side_line_ins_bg = '#00695C';
        d2h_emptyplaceholder_bg = '#303131';
        d2h_linenum_color = fontColor;
        diff_scrollbar_color = '#6F6F6F';
    } else {
        d2h_ins_bg = '#DDFFDD';
        d2h_ins_border = '#b4e2b4'
        d2h_del_bg = '#fee8e9';
        d2h_del_border = '#e9aeae';
        d2h_code_side_line_del_bg = '#ffb6ba';
        d2h_code_side_line_ins_bg = '#97f295';
        d2h_emptyplaceholder_bg = '#f1f1f1';
        d2h_emptyplaceholder_border = '#e1e1e1';
        d2h_linenum_color = fontColor;
        diff_scrollbar_color = '#CFB56A';
    };

    return {
        fontSize,
        fontFamily,
        explorerIconScheme,
        explorerIconTheme,
        lefeSideVeiwBackground,
        background,
        menuBackground,
        menuCutLineColor,
        liHoverBackground,
        inputColor,
        inputLineColor,
        inputBgColor,
        cursorColor,
        fontColor,
        remarkTextColor,
        lineColor,
        lineForBorderTopColor,
        scrollbarColor,
        d2h_ins_bg,
        d2h_ins_border,
        d2h_del_bg,
        d2h_del_border,
        d2h_code_side_line_del_bg,
        d2h_code_side_line_ins_bg,
        d2h_emptyplaceholder_bg,
        d2h_emptyplaceholder_border,
        d2h_linenum_color,
        diff_scrollbar_color
    };
};

/**
 * @description 检查目录是否存在内容
 * @param {Object} dirname
 */
function isDirEmpty(dirname) {
    return new Promise(function(resolve, reject) {
        return fs.readdir(dirname, function(err,files) {
            if (err) {
                reject(0);
            };
            resolve(files.length);
        });
    });
};

/**
 * @description 获取指定目录文件列表
 * @param {type} dirname 目录名
 * @param {type} suffix 后缀
 */
function getDirFileList(dirname, suffix=false) {
    return new Promise(function(resolve, reject) {
        return fs.readdir(dirname, function(err,files) {
            if (err) {
                reject([]);
            };
            if (files && suffix) {
                files = files.filter( x => x.includes(suffix) );
            };
            resolve(files);
        });
    });
};

/**
 * @description 向临时文件插入文本
 * @param {Object} text
 */
function applyEdit(text) {
    let editorPromise = hx.window.getActiveTextEditor();
    editorPromise.then((editor) => {
        let workspaceEdit = new hx.WorkspaceEdit();
        let edits = [];
        edits.push(new hx.TextEdit({
            start: 0,
            end: 0
        }, text));

        workspaceEdit.set(editor.document.uri, edits);
        hx.workspace.applyEdit(workspaceEdit);
    });
};

/**
 * @description 更新或写入HBuilderX配置
 * @param {String} key
 * @param {String} value
 * @param {String} desc 消息，用于显示到状态栏
 */
function updateHBuilderXConfig(key, value, desc=undefined) {
    let config = hx.workspace.getConfiguration();
    config.update(key, value).then((data) => {
        let msg = desc ? desc : `EasyGit: 更新 ${key} 成功。`;
        hx.window.setStatusBarMessage(msg, 5000, 'info');
    });
};

/**
 * @description 读取HBuilderX.ini, 获取ProjectWizard
 */
function getHBuilderXiniConfig(v) {
    let iniFile = '';
    try{
        const appData = hx.env.appData;
        const iniFile = path.join(appData,'HBuilder X.ini')
        let fileinfo = ini.parse(fs.readFileSync(iniFile, 'utf-8'));
        let value = '';
        if (v == 'filesExplorer') {
            value = fileinfo["uistate"]["window\\closedProWidgetHeight"];
        };
        return value;
    } catch(e){
        return '';
    };
};


/**
 * @description 导入项目到项目管理
 * @param {String} projectPath 目录路径
 */
function importProjectToExplorer(projectPath) {
    try{
        let cmd_args = [projectPath];
        let hxExecutableProgram;
        let appRoot = hx.env.appRoot;
        let appVersion = hx.env.appVersion;

        if (osName == 'darwin') {
            hxExecutableProgram = path.join(path.dirname(appRoot),'MacOS/cli');
        } else {
            hxExecutableProgram = path.join(appRoot,'cli.exe');
        };
        cmd_args = [ "project", "open", "--path", projectPath];

        const command = spawn.sync(hxExecutableProgram, cmd_args, {
          stdio: 'ignore'
        });
    }catch(e){
        console.error(e);
    }
};

/**
 * @description 检查项目是否Git项目
 * @return {String} git-dir
 */
function checkIsGitProject(projectPath) {
    process.chdir(projectPath);
    return new Promise((resolve, reject) => {
        try{
            exec('git rev-parse --git-dir', function(error, stdout, stderr) {
                if (error) {
                    reject(error)
                };
                if (stderr.includes('not a git repository')) {
                    reject('No');
                };
                let tmp = stdout.trim();
                if (tmp.length > 5) {
                    let ppath = path.dirname(tmp);
                    resolve(ppath);
                } else {
                    resolve(projectPath);
                };
            });
        }catch(e){
            reject(e);
        };
    }).catch((error) => {
        throw new Error(error);
    });
};

/**
 * @description 获取项目管理器的项目数量，以及每个项目名称、项目路径、是否git等信息。
 */
async function getFilesExplorerProjectInfo() {
    let data = {
        "success": true,
        "msg": '',
        "FoldersNum": 0,
        "Folders": []
    };

    let wsFolders = await hx.workspace.getWorkspaceFolders().then(function(wsFolders) {
        return wsFolders;
    });

    try{
        let Folders = [];
        for (let item of wsFolders) {
            let selectPath = item.uri.fsPath;
            let tmp = {
                'FolderPath': selectPath,
                'FolderName': item.name,
                'isGit': false,
                'GitRepository': undefined
            };
            // 判断是否是Git项目
            let gitfsPath = path.join(selectPath, '.git', 'config');
            if (!fs.existsSync(gitfsPath)) {
                try{
                    let checkResult = await checkIsGitProject(selectPath);
                    if (checkResult != 'No') {
                        tmp.GitRepository = checkResult;
                        tmp.isGit = true;
                    };
                }catch(e){
                    tmp.isGit = false;
                };
            } else {
                tmp.GitRepository = selectPath;
                tmp.isGit = true;
            };
            Folders.push(tmp);
        };
        data.FoldersNum = wsFolders.length;
        data.Folders = Folders;
    } catch (e) {
        data.msg = "获取项目管理器项目信息失败";
        data.success = false;
    };
    return data;
};

/**
 * @description 控制台链接跳转
 * @param {String} message
 * @param {String} linkText
 */
function createOutputViewForHyperLinksForCommand(message, linkText, commandName, commandParam={}) {
    let outputView = hx.window.createOutputView({
        name: "easy-git",
        id: ""
    });
    outputView.show();

    let msg = message;
    outputView.appendLine({
        line: msg + linkText,
        level: "info",
        hyperlinks:[
            {
                linkPosition: {
                    start: msg.length,
                    end: (msg + linkText).length
                },
                onOpen: function() {
                    hx.commands.executeCommand(commandName, commandParam);
                }
            }
        ]
    });
};


/**
 * @description 创建输出控制台
 * @param {String} msg
 * @param {msgLevel} msgLevel (warning | success | error | info), 控制文本颜色
 */
function createOutputChannel(msg, msgLevel=undefined) {
    let channel_name = "easy-git";
    let outputChannel = hx.window.createOutputChannel(channel_name);
    outputChannel.show();

    // 采用try{} catch{} 写法的原因：颜色输出在3.1.0才支持，为了兼容老版本
    try {
        outputChannel.appendLine({ line: msg, level: msgLevel });
    } catch (e) {
        console.log(e)
        outputChannel.appendLine(msg);
    };
};

/**
 * @description 创建输出控制台, 支持文件链接跳转
 * @param {String} msg
 * @param {String} msgLevel (warning | success | error | info), 控制文本颜色
 * @param {String} linkText 链接文本
 */
function createOutputView(msg, msgLevel='info', linkText) {
    let outputView = hx.window.createOutputView({"id":"easy-git","title":"Git控制台"});
    outputView.show();

    if (linkText == undefined || linkText == '') {
        outputView.appendLine({
            line: msg,
            level: msgLevel,
        });
        return;
    };

    let start;
    if (msg.includes(linkText) && linkText != undefined) {
        start = msg.indexOf(linkText);
    };

    outputView.appendLine({
        line: msg,
        level: msgLevel,
        hyperlinks:[
            {
                linkPosition: {
                    start: start,
                    end: start + linkText.length
                },
                onOpen: function() {
                    if (fs.existsSync(linkText)) {
                        return hx.workspace.openTextDocument(linkText);
                    };
                    const file_content = linkText.includes('.ssh/config') ? `#Host github\n#\tHostName github.com\n#\tPreferredAuthentications publickey\n#\tIdentityFile ~/.ssh/<private-key-filename>` : '';
                    fs.appendFile(linkText, file_content , (error) => {
                        if (error) {return};
                        hx.workspace.openTextDocument(linkText);
                    });
                }
            }
        ]
    });
};

/**
 * @description 创建输出控制台
 */
function createOutputChannelForClone(msg, newline=true) {
    let channel_name = "easy-git";
    let outputChannel = hx.window.createOutputChannel(channel_name);
    outputChannel.show();

    let text = `${msg}`;
    if (newline) {
        outputChannel.appendLine('\n' + text);
    } else {
        outputChannel.appendLine(text);
    };
};

/**
 * @description 运行命令
 */
async function runCmd(cmd) {
    let label = '执行:' + cmd;
    createOutputChannel(label);
    exec(cmd, function(error, stdout, stderr) {
        createOutputChannel(`${stdout} \n ${stderr}`)
    });
};


/**
 * @description 检查是否安装了Git
 */
function isGitInstalled() {
    const command = spawn.sync('git', ['--version'], {
        stdio: 'ignore'
    });
    if (command.error) {
        return false;
    };
    return true;
};

/**
 * @description get git version
 */
function getGitVersion() {
    return new Promise((resolve, reject) => {
        exec('git --version', function(error, stdout, stderr) {
            if (error) {
                reject(undefined)
            };
            try {
                let gitLocalVersion = stdout.match(/(\d{1,3}.\d{1,3}.\d{1,3})/g)[0];
                resolve(gitLocalVersion);
            } catch (e) {
                reject(undefined)
            };
        });
    }).catch((error) => {
        throw new Error(error);
    });
};

/**
 * @description 检查是否设置了username和email，如未设置，弹窗提示
 * @param {String} projectPath 项目路径
 * @param {String} projectName 项目名称
 * @param {Object} userConfig
 */
async function checkGitUsernameEmail(projectPath, projectName, userConfig) {
    let configData = await gitConfigShow(projectPath, false);
    let gitUserName = configData['user.name'];
    let gitEmail = configData['user.email'];

    // 用户是否设置过不再提示
    let { GitConfigUserPrompt } = userConfig;

    if ((gitEmail == '' || gitUserName == '') && (GitConfigUserPrompt != false)) {
        let msg = `当前项目 ${projectName} 未设置`
        if (gitUserName == '') {
            msg = msg + 'user.name'
        };
        if (gitEmail == '') {
            msg = msg + 'user.email'
        };
        msg = msg + ", 点击菜单【工具】【easy-git】可进行设置。\n"
        hx.window.showErrorMessage(msg,['我知道了','不再提示']).then((result)=> {
            if (result == '不再提示') {
                let config = hx.workspace.getConfiguration();
                config.update("EasyGit.GitConfigUserPrompt", false).then(() => {});
            }
        });
    }
};

/**
 * @description git version比较： 不同的Git版本，windows credential.helper值不一样。
 */
async function JudgeGitVersion() {
    try{
        let version = await getGitVersion();
        cmp_git = cmp_hx_version('2.29.0', version);
        if (cmp_git >= 0 ) {
            return true;
        };
        return false;
    }catch(e){
        return true;
    };
};

/**
 * @description 检查用户凭证
 */
async function checkGitCredentials(projectPath, unset=false) {
    if (unset == true) {
        await gitRaw(projectPath, ['config', '--global', '--unset', 'credential.helper']);
        await gitRaw(projectPath, ['config', '--local', '--unset', 'credential.helper']);
        // await gitRaw(projectPath, ['config', '--system', '--unset', 'credential.helper']);
        return;
    };
    let configData = await gitConfigShow(projectPath, false);
    let remoteOriginUrl = configData['remote.origin.url'];
    if (remoteOriginUrl.slice(0,4) == 'git@') { return 'ssh'; };

    let credential = configData['credential.helper'];
    if (osName == 'win32' && !['manager', 'manager-core'].includes(credential) ) {
        hx.window.setStatusBarMessage(`Git: 正在校验身份，如弹出授权，请同意或输入凭证信息！`, 30000, 'info');
        let versionCheck = await JudgeGitVersion();
        let credentialValue = versionCheck >= 0 ? 'manager-core' : 'manager';
        let winCredentialResult = await gitRaw(projectPath, ['config', '--global', 'credential.helper', credentialValue]);
        return wincredentialResult;
    };
    if (osName == 'darwin' && credential != 'osxkeychain') {
        hx.window.setStatusBarMessage(`Git: 正在校验身份，如弹出授权，请同意或输入凭证信息！`, 30000, 'info');
        await gitRaw(projectPath, ['config', '--local', '--unset', 'credential.helper']);
        let macCredentialResult = await gitRaw(projectPath, ['config', '--local', 'credential.helper', 'osxkeychain']);
        return macCredentialResult;
    };
}

/**
 * @description 检查文件列表是否包含node_modules
 * @param {String} projectPath 项目路径
 * @param {String} projectName 项目名称
 * @param {Object} GitStatusResult
 */
let gitignorePrompt = false;
function checkNodeModulesFileList(projectPath, projectName, GitStatusResult) {
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

    if (isNodeModules) {
        if (gitignorePrompt) {
            return;
        };
        hx.window.showErrorMessage(
            '检测到当前git项目下，包含node_modules，且未设置.gitignore, 是否设置?',['设置.gitignore','以后再说'],
        ).then((result) => {
            if (result == '设置.gitignore') {
                fileIO.gitignore({'projectPath': projectPath});
            } else {
                gitignorePrompt = true;
            }
        })
    };
    if (num >= 300) {
        hx.window.setStatusBarMessage(
            `easy-it: 项目${projectName}下, ${num}个文件发生了变化，easy-git插件需要一定的时间来加载。`, 'error', 5000
        );
    };
};


/**
 * @description 获取git信息
 * @param {Object} projectPath
 */
async function gitInit(projectPath, projectName) {
    try{
        createOutputChannel(`项目【${projectName}】正在初始化.....`);
        let status = await git(projectPath).init()
            .then((res) => {
                return 'success'
            })
            .catch((err) => {
                let errMsg = '\n' + (err).toString();
                createOutputChannel(`项目【${projectName}】初始化Git存储库失败！\n ${errMsg}`);
                return 'fail';
            });

        try {
            // 创建.gitignore文件
            let createInfo = {
                "filename": ".gitignore",
                "projectPath": projectPath,
                "isOpenFile": false
            };
            let createStatus = await fileIO.create(createInfo);
            if (createStatus == 'success') {
                let createMsg = `已自动创建.gitignore文件。如不需要，请自行删除。`;
                createOutputChannel(createMsg);
            };
        } catch(e) {};

        if (status == 'success') {
            createOutputChannel(`项目【${projectName}】初始化存储库成功！\n`, 'success');
        };
        return status;
    } catch(e) {
        createOutputChannel(`easy-git插件，执行初始化，出现异常！\n ${e}`, 'error');
        return 'error';
    }
};


/**
 * @param {Object} info
 */
function runGitClone(options) {
    let totalProgress = 0;
    let previousProgress = 0;
    let match;
    let isPrint = [];
    let errorMsg;
    return new Promise((resolve, reject) => {
        let default_options = ['clone', '-v', '--progress']
        let cmd = [...default_options, ...options]
        const run = spawn('git', cmd);
        run.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        run.stderr.on('data', (data) => {
            if (!data.includes("remote: Compressing objects") && !data.includes('remote: Counting objects') && !data.includes('remote: Total')) {
                if (data.includes('Receiving objects') || data.includes('Resolving deltas')) {
                    if (totalProgress == 0) {
                        createOutputChannelForClone('Git clone进度: 0%', false);
                    };
                    if (match = /Counting objects:\s*(\d+)%/i.exec(data)) {
                        totalProgress = Math.floor(parseInt(match[1]) * 0.1);
                    } else if (match = /Compressing objects:\s*(\d+)%/i.exec(data)) {
                        totalProgress = 10 + Math.floor(parseInt(match[1]) * 0.1);
                    } else if (match = /Receiving objects:\s*(\d+)%/i.exec(data)) {
                        totalProgress = 20 + Math.floor(parseInt(match[1]) * 0.4);
                    } else if (match = /Resolving deltas:\s*(\d+)%/i.exec(data)) {
                        totalProgress = 60 + Math.floor(parseInt(match[1]) * 0.4);
                    };
                    if ([0,1,2,3,5,7,10,20,25,30,37,45,50,60,70,80,90,91,95,99,100].includes(totalProgress) && !isPrint.includes(totalProgress)) {
                        createOutputChannelForClone(`Git clone进度: ${totalProgress}%`, false);
                        isPrint.push(totalProgress);
                    };
                    if (data.includes("Resolving deltas: 100%") && data.includes("done.")) {
                        createOutputChannelForClone('Git clone完成！', false);
                        createOutputChannelForClone(data, false);
                    };
                } else if (data.includes('publickey') && data.includes('Permission denied')) {
                    createOutputChannelForClone(data, false);
                    errorMsg = 'ssh publickey error';
                } else if (data.includes('Incorrect username or password') || data.includes('Authentication failed')) {
                    createOutputChannelForClone(data, false);
                    errorMsg = 'Incorrect username or password'
                } else {
                    createOutputChannelForClone(data, false);
                };
            };

        });

        run.on('close', (code) => {
            if (code == 0) {
                resolve('success');
            } else {
                if (errorMsg) {
                    reject(errorMsg);
                } else {
                    reject('fail');
                };
            };
        });
    });
}


/**
 * @description clone
 */
async function gitClone(info) {

    let remote = '';
    let {username, password, repo, branch, localPath, projectName, isAuth} = info;

    if (username.includes('@')) {
        username = username.replace('@','%40')
    };
    if (password.includes('@')) {
        password = password.replace('@','%40')
    };

    let cloneWay = repo.substring(0,4) == 'git@' ? 'ssh' : 'http';

    if (isAuth) {
        if (/(http|https):\/\//.test(repo)) {
            let http = 'http://';
            if (/https:\/\//.test(repo)) { http = "https://"};
            repo = repo.replace(/(^http:\/\/|^https:\/\/)/, "");
            repo = `${http}${username}:${password}@${repo}`;
        };
    };

    try{
        let options = [];
        if (branch) {
            options.push("-b");
            options.push(branch);
        };
        options.push(repo);
        options.push(localPath);

        let clone_cmd = options.join(' ');

        createOutputChannel(`开始克隆 ${projectName}！`, 'success');
        createOutputChannel(`执行的git命令如下: git clone ${clone_cmd}\n`, 'info');

        createOutputChannel(`备注1：克隆进度跟项目大小、网络有关，需要一定时间，请不要重复点击【克隆】按钮。`, 'info');
        createOutputChannel(`备注2：克隆成功后，会自动将克隆项目，加入到HBuilderX项目管理器。如未显示在项目管理器，请手动导入或拖入。\n`, 'info');

        let status = await runGitClone(options)
        if (status == 'success') {
            createOutputChannel(`克隆成功。本地路径: ${localPath}`, 'success');
            createOutputChannel(`如果克隆项目没有自动导入HBuilderX，请手动将项目导入或拖入到HBuilderX。`, 'info');
            count(`clone_${cloneWay}_success`);
        } else {
            createOutputChannel('Git: 克隆失败，请参考: https://easy-git.github.io/connecting/clone', 'error');
            count(`clone_${cloneWay}_${status}`);
        };
        return status;
    } catch(e) {
        if (e == 'ssh publickey error') {
            createOutputChannel('- SSH publickey无效，克隆失败。', 'error');
            createOutputChannel('配置SSH, 请参考: https://easy-git.github.io/auth/ssh-generate', false);
        } else if (e == 'Incorrect username or password') {
            createOutputChannel('账号密码错误，克隆失败。', 'error');
        } else {
            createOutputChannel('克隆仓库异常 ' + e, 'error');
        };
        createOutputChannel('如果无法解决问题，请到插件市场或ask论坛寻求帮助 https://ext.dcloud.net.cn/plugin?name=easy-git', false);

        // add count
        count(`clone_${cloneWay}_exception`);
        return 'error';
    };
};

/**
 * @description 获取具体文件状态
 * @param {Object} workingDir
 * @param {Object} options ["-s", selectedFile]
 */
async function gitFileStatus(workingDir, selectedFile, options) {
    try {
        let result = {
            "isConflicted": false,
            "statusInfo": {}
        };
        let statusSummary = await git(workingDir)
            .status(options)
            .then( (res) => {
                if ((res['files']).length == 0) {
                    return 'error';
                };
                result.statusInfo = res['files'][0];
                let conflicted = res.conflicted;
                if (conflicted.length != 0) {
                    if (conflicted[0] == selectedFile) {
                        result.isConflicted = true;
                    };
                };
                return result;
            })
            .catch( (error)=> {
                return 'error';
            })
        return statusSummary;
    } catch (e) {
        return 'error';
    };
};

/**
 * @description 获取git文件列表
 * @param {String} workingDir Git工作目录
 */
async function gitFileListStatus(workingDir, options=['status', '-s', '-u'], isReturnDefault=undefined) {
    var reg = /^['|"](.*)['|"]$/;

    // 文件后缀，作用：用于Git源代码管理器，显示文件图标
    let file_suffix = "";
    let fsuffix_list = [
        "folder",
        "html", "js", "ts", "vue", "md",
        "css", "less", "scss", "sass", "styl",
        "py", "java", "php", "c", "cpp", "go", "sql",
        "img", "zip", "json",
        "xml", "sh", "bat",
        "csv", "xls", "xlsx", "doc", "docx", "license"];
    let img_suffix_list = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg", "ico"];
    let config_suffix_list = ["config", "cfg", "conf", "editorconfig", "env"];
    let git_suffix_list = ["gitconfig", "gitkeep", "gitattributes", "gitmodules", "gitignore"];

    let all_suffix_list = [...fsuffix_list, ...img_suffix_list, ...config_suffix_list, ...git_suffix_list];

    let data = {
        'msg': 'success',
        'conflicted': [],
        'staged': [],
        'notStaged': [],
        'fileTotal': 0,
        'conflictedLength': 0,
        'stagedLength': 0,
        'notStagedLength': 0
    };
    if (isReturnDefault) {return data};

    try {
        let errorList = [];
        await git(workingDir).raw(options)
            .then((res) => {
                let files = res.split('\n');
                for (let s of files) {
                    if (s != '') {
                        let tag = s.slice(0,2);
                        let fpath = s.slice(3);
                        // 处理带有空格的文件
                        if (reg.test(fpath) && fpath.indexOf(" ") != -1) {
                            fpath = fpath.replace(reg, "$1");
                        };
                        file_suffix = s.split('.').pop().toLowerCase();
                        if (!all_suffix_list.includes(file_suffix)) {
                            file_suffix = '';
                        };
                        if (img_suffix_list.includes(file_suffix)) {
                            file_suffix = "img";
                        };
                        if (file_suffix == 'markdown') {
                            file_suffix = "md";
                        };
                        if (file_suffix == 'htm') {
                            file_suffix = "html";
                        };
                        if (config_suffix_list.includes(file_suffix)){
                            file_suffix = "config";
                        };
                        if (git_suffix_list.includes(file_suffix)) {
                            file_suffix = "git";
                        };
                        if (fpath == "license") {
                            file_suffix = "license";
                        };
                        let f_icon = file_suffix + "_icon";

                        let basename = path.basename(fpath);
                        let dirname = path.dirname(fpath);
                        if (dirname == '.') {
                            dirname = '';
                        };

                        if (['DD','AU','UD','UA','DU','AA','UU'].includes(tag)) {
                            if (['DD','UD','DU'].includes(tag)) {
                                data.conflicted.push({"tag": "D", "path": fpath, "dir": dirname, "name": basename,"icon": f_icon});
                            } else {
                                data.conflicted.push({"tag": "C", "path": fpath, "dir": dirname, "name": basename, "icon": f_icon});
                            };
                        } else if (tag == 'MM' || tag == 'AM') {
                            data.staged.push({"tag": "M", "path": fpath, "dir": dirname, "name": basename,"icon": f_icon});
                            data.notStaged.push({"tag": "M", "path": fpath, "dir": dirname, "name": basename,"icon": f_icon});
                        } else if (tag == 'AD' || tag == 'MD') {
                            data.staged.push({"tag": "D", "path": fpath, "dir": dirname,"name": basename, "icon": f_icon});
                            data.notStaged.push({"tag": "D", "path": fpath, "dir": dirname,"name": basename, "icon": f_icon});
                        } else if (tag == 'RD') {
                            data.staged.push({"tag": "R", "path": fpath, "dir": dirname,"name": basename, "icon": f_icon});
                            data.notStaged.push({"tag": "R", "path": fpath, "dir": dirname,"name": basename, "icon": f_icon});
                        } else if (tag.slice(0,1) == ' ' || tag == '??') {
                            data.notStaged.push({"tag": tag.trim(), "path": fpath, "dir": dirname,"name": basename, "icon": f_icon});
                        } else if (tag.slice(1,2) == ' ') {
                            data.staged.push({"tag": tag.trim(), "path": fpath, "dir": dirname,"name": basename, "icon": f_icon});
                        } else {
                            errorList.push(s);
                        };
                    };
                };

                if (errorList.length) {
                    let outputChannel = hx.window.createOutputChannel('EasyGit插件');
                    outputChannel.show();
                    outputChannel.appendLine("下列文件状态获取错误，请手动操作在命令行操作。");
                    outputChannel.appendLine("如果您愿意帮助作者改进，反馈地址: https://ext.dcloud.net.cn/plugin?name=easy-git#rating");

                    for (let s of errorList) {
                        outputChannel.appendLine(s);
                    };
                    outputChannel.appendLine("\n\n");
                };
                data["conflictedLength"] = (data["conflicted"]).length;
                data["stagedLength"] = (data["staged"]).length;
                data["notStagedLength"] = (data["notStaged"]).length;
                data["fileTotal"] = data["conflictedLength"] + data["stagedLength"] + data["notStagedLength"];
            })
            .catch((err) => {
                console.log(err)
                hx.window.showInformationMessage('EasyGit: 获取文件列表失败, 请重试或联系作者反馈问题。', ['我知道了']);
                data.msg = 'error';
            });
        return data;
    } catch (e) {
        console.log(e);
        hx.window.showInformationMessage('EasyGit: 获取文件列表失败，请重试或联系作者反馈问题', ['我知道了']);
        data.msg = 'error';
    };
    return data;
};


/**
 * @description 获取git信息
 * @param {Object} projectPath
 * @param {Boolean} isShowFileList 是否显示文件列表，默认true
 */
async function gitStatus(workingDir, isShowFileList=true) {
    let result = {
        'gitEnvironment': true,
        'isGit': false,
        'GitRepository': undefined,
        'tracking': '',
        'gitStatusResult': {},
        'FileResult': {
            'conflicted': [],
            'notStaged': [],
            'staged': []
        },
        'ahead': '',
        'behind': '',
        'currentBranch': '',
        'BranchTracking': '',
        'originurl': undefined
    };

    // 仓库url
    result.originurl = await gitRemoteOriginUrl(workingDir).catch(function (err){
        return undefined
    });

    try {
        let statusSummary = await git(workingDir).status();
        result.gitStatusResult = JSON.stringify(statusSummary);

        result.isGit = true;
        result.tracking = statusSummary.tracking

        // set branch info
        result.currentBranch = statusSummary.current;
        result.BranchTracking = statusSummary.tracking;

        result.ahead = statusSummary.ahead;
        result.behind = statusSummary.behind;

        // 所有文件列表
        if (isShowFileList == true) {
            let files = statusSummary.files;
            if (files.length) {
                result.FileResult = await gitFileListStatus(workingDir);
            } else {
                result.FileResult = await gitFileListStatus(workingDir);
            };
        };
    } catch (e) {
        result.gitEnvironment = false;
        return result;
    };
    return result;
};


/**
 * @description git: add -> commit -> push
 * @param {String} projectPath 项目路径
 * @param {String} commitComment 注释
 */
async function gitCommitPush(workingDir, commitComment) {
    let dir = path.join(workingDir, '*');

    // status bar show message
    hx.window.setStatusBarMessage('Git: 正在执行 commit 和 push操作...');
    try {
        let checkCert = await checkGitCredentials(workingDir);
        let status = await git(workingDir)
            .commit(commitComment, noVerify)
            .push()
            .then(() => {
                hx.window.setStatusBarMessage('Git: commit 和 push操作执行成功！');
                return 'success'
            })
            .catch((err) => {
                hx.window.clearStatusBarMessage();
                let errMsg = (err).toString();
                let title = "Git: commit -> push 失败!";
                if (errMsg.includes('Authentication failed') || errMsg.includes('could not read Username')) {
                    checkGitCredentials(workingDir, true);
                    let osErrorMsg = osName == 'darwin'
                        ? "方法2：Mac, 打开钥匙串，清除此Git仓库的账号密码信息。"
                        : "方法2：windows, 打开控制面板 -> 用户账户 -> 管理windows凭据，在【普通凭据】列表中，删除此Git仓库的账号密码信息。";
                    errMsg = errMsg + "\n" + "原因：账号密码错误，如是使用账号密码方式（非SSH KEY）登录Git，可通过以下方法解决。\n"
                        + "方法1：打开终端，进入此项目，执行git push，此时输入正确的账号密码。\n"
                        + osErrorMsg;
                };
                createOutputChannel(`${title} \n${errMsg}`);
                return 'fail';
            });
        return status
    } catch (e) {
        return 'error'
    }
};


/**
 * @description git: add
 * @param {String} projectPath 项目路径
 * @param {Array} files 文件列表
 */
async function gitAdd(workingDir, files) {
    // status bar show message
    hx.window.setStatusBarMessage('Git: 正在添加文件到暂存区...');
    if (files == 'all') {
        files = './*'
    };
    try {
        let status = await git(workingDir)
            .add(files)
            .then(() => {
                hx.window.setStatusBarMessage('Git: 成功添加文件到暂存区。');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: ${files} add失败。${errMsg}`);
                return 'fail';
            });
        return status
    } catch (e) {
        return 'error';
    }
};


/**
 * @description git: commit
 * @param {String} projectPath 项目路径
 * @param {String} commnet 注释
 */
async function gitCommit(workingDir, comment) {
    try {
        let status = await git(workingDir)
            .commit(comment, noVerify)
            .then(() => {
                hx.window.setStatusBarMessage('Git: commit操作成功!');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                if (errMsg.includes('user.email') || errMsg.includes('user.name')) {
                    createOutputChannel(`Git: commit操作失败。原因：未设置user.name或user.email。`, 'error');
                    createOutputChannel(`备注：user.name和user.email用于标识身份，Git提交会用到这些信息。`, 'info');
                    createOutputChannel(`解决方法: 点击顶部菜单【工具 -> easy-git】，设置user.name和user.email。`, 'info');
                } else {
                    createOutputChannel(`Git: commit操作失败。\n${errMsg}`);
                };
                return 'fail';
            });
        return status
    } catch (e) {
        return 'error';
    }
};


/**
 * @description git add -> commit
 * @param {String} projectPath 项目路径
 * @param {String} commnet 注释
 */
async function gitAddCommit(workingDir,commitComment) {
    if ((commitComment.trim()).length == 0) {
        hx.window.showErrorMessage("EasyGit: Git commit消息不能为空。", ["我知道了"]);
        return 'fail';
    };
    // status bar show message
    hx.window.setStatusBarMessage('Git: commit...');
    try {
        let status = await git(workingDir)
            .add('*')
            .commit(commitComment, noVerify)
            .then((res) => {
                hx.window.setStatusBarMessage('Git: commit成功');
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                if (errMsg.includes('user.email') || errMsg.includes('user.name')) {
                    createOutputChannel(`Git: commit操作失败。原因：未设置user.name或user.email。`, 'error');
                    createOutputChannel(`备注：user.name和user.email用于标识身份，Git提交会用到这些信息。`, 'info');
                    createOutputChannel(`解决方法: 点击顶部菜单【工具 -> easy-git】，设置user.name和user.email。`, 'info');
                } else {
                    createOutputChannel(`Git: add and commit失败 ${errMsg}`);
                };
                return 'fail';
            });
        return status
    } catch (e) {
        return 'error'
    }
};


/**
 * @description git: push
 * @param {String} projectPath 项目路径
 */
async function gitPush(workingDir, options=[]) {
    // status bar show message
    let msg = `Git: 正在向远端推送.....`;
    if (options.length) {
        let tmsg = options.join(' ');
        msg = `Git: git push ${tmsg} 正在向远端推送.....`;
    };
    hx.window.setStatusBarMessage(msg, 30000, 'info');
    try {
        let checkResult = await checkGitCredentials(workingDir);
        let status = await git(workingDir)
            .push(options)
            .then((result) => {
                hx.window.clearStatusBarMessage();
                let pushResult = result.pushed;
                let updateResult = result.update;
                if (JSON.stringify(pushResult) === '[]' || updateResult != undefined) {
                    hx.window.setStatusBarMessage('Git: push操作成功', 30000, 'info');
                    voiceSay('push.success')
                };
                if (updateResult == undefined) {
                    hx.window.setStatusBarMessage('Git: push操作成功, Everything up-to-date。', 30000, 'info');
                };
                return 'success';
            })
            .catch((err) => {
                hx.window.clearStatusBarMessage();
                let errMsg = (err).toString();
                let title = "Git: push操作失败。";
                if (errMsg.includes('Authentication failed') || errMsg.includes('could not read Username')) {
                    checkGitCredentials(workingDir, true);
                    let osErrorMsg = osName == 'darwin'
                        ? "方法2：Mac, 打开钥匙串，清除此Git仓库的账号密码信息，如没有请忽略。\n\n"
                        : "方法2：windows, 打开控制面板 -> 用户账户 -> 管理windows凭据，在【普通凭据】列表中，删除此Git仓库的账号密码信息。";
                    errMsg = errMsg + "\n" + "原因：账号密码错误，如是使用账号密码方式（非SSH KEY）登录Git，可通过以下方法解决。\n\n"
                        + "方法1：打开操作系统终端，进入此项目，执行git push，此时输入正确的账号密码。\n"
                        + osErrorMsg;
                };
                createOutputChannel(`${title} \n ${errMsg}`, 'error');
                return 'fail';
            });
        return status
    } catch (e) {
        return 'error';
    }
};

/**
 * @description 处理git pull --rebase失败的情况
 */
async function gitPullRebaseForFail(title, msg, workingDir) {
    let btns = ["git pull","git pull --rebase --autostash","关闭"];
    let btnText = await hxShowMessageBox(title, msg, btns).then( btnText => {
        return btnText;
    });
    if (btnText == 'git pull') {
        gitPull(workingDir);
    };
    if (btnText == 'git pull --rebase --autostash') {
        gitPull(workingDir, ["--rebase", "--autostash"]);
    };
};

/**
 * @description git: pull
 * @param {String} projectPath 项目路径
 * @param {Object} options git-pull参数
 */
async function gitPull(workingDir, options) {
    let args = [];
    let msg = 'Git: git pull 正在从服务器拉取代码...';

    // 为了兼容老功能
    if (Object.prototype.toString.call(options) === "[object Object]") {
        let {rebase, BranchTracking} = options;
        if (rebase) {
            args.push('--rebase')
            msg = 'Git: git pull --rebase 正在从服务器拉取代码...';
        };
        if (BranchTracking) {
            try{
                let remoteName = BranchTracking.replace('origin/', '');
                if (remoteName) {
                    args = [...args, ...['origin', remoteName]]
                };
            } catch(e){
                console.log(e)
            };
        };
    };

    // 2021-6-5 增加
    if (Object.prototype.toString.call(options) === "[object Array]") {
        args = options;
        if (options.length) {
            let pullOptions = options.join(' ');
            msg = `Git: git pull ${pullOptions} 正在从服务器拉取代码...`;
        };
    };

    // status bar show message
    hx.window.setStatusBarMessage(msg, 5000,'info');

    try {
        let status = await git(workingDir)
            .pull(args)
            .then((res) => {
                let msg = 'Git: pull 操作成功。';
                if (res) {
                    let fnum = (res.files).length;
                    msg = `Git: pull 操作成功, 项目下共有 ${fnum} 个文件发生变动。`;
                };
                hx.window.setStatusBarMessage(msg);
                return 'success';
            })
            .catch((err) => {
                let cmd_details = args.join(' ');
                let msgForPullOther = "提醒：如需执行其它pull选项操作，将焦点置于当前要查看的项目上；然后打开命令面板，输入pull，即可看到其它相关的git pull选项。"
                let errMsg = (err).toString();
                if (errMsg.includes('cannot pull with rebase')) {
                    let msg1 = "\n原因：项目下存在未提交的文件，请处理后再操作。\n\n如需执行其它pull命令, 请点击下列按钮。"
                    errMsg = errMsg + msg1;
                    let title = `Git pull ${cmd_details} 执行失败。`;
                    gitPullRebaseForFail(title, errMsg, workingDir);
                } else if (errMsg.includes('could not read Username')) {
                    createOutputChannel(`Git: pull ${cmd_details} 执行失败。 \n ${errMsg}`, 'error');
                    createOutputChannel('关于身份认证信息的解决方法: https://easy-git.github.io/question/username', 'info')
                } else if (errMsg.includes('Permission denied (publickey)')) {
                    createOutputChannel(`Git: pull ${cmd_details} 执行失败。 \n ${errMsg}`, 'error');
                    createOutputChannel('关于Permission denied (publickey)的解决方法: https://easy-git.github.io/question/Permission_denied_publickey', 'info')
                } else if (errMsg.includes("local changes")) {
                    createOutputChannel(`Git: pull ${cmd_details} 执行失败。 \n ${errMsg}`, 'error');
                    createOutputChannel(msgForPullOther, 'info');
                } else if (errMsg.includes("git --help")){
                    createOutputChannel(`Git: pull ${cmd_details} 执行失败。 \n ${errMsg}`, 'error');
                } else {
                    createOutputChannel(`Git: pull ${cmd_details}失败。 \n ${errMsg}`, 'error');
                    createOutputChannel(msgForPullOther, 'info');
                }
                return 'fail';
            });
        return status
    } catch (e) {
        console.log(e);
        return 'error';
    }
};


/**
 * @description git: fetch
 * @param {String} projectPath 项目路径
 * @param {String} isShowMsg 是否显示错误消息，默认ture
 * @param {String} showZone 显示区域：console - 控制台， statusBar 状态栏
 */
async function gitFetch(workingDir, isShowMsg=true, showZone="console") {
    // status bar show message
    if (isShowMsg) {
        hx.window.setStatusBarMessage(`Git: 正在同步信息 (fetch) ......`);
    };
    try {
        // '--all','--prune'
        let status = await git(workingDir)
            .fetch(['--all'])
            .then((res) => {
                if (isShowMsg) {
                    hx.window.setStatusBarMessage('Git: Fetch success', 3000, 'info');
                };
                return 'success';
            })
            .catch((err) => {
                hx.window.clearStatusBarMessage();
                if (!isShowMsg) return;
                let errMsg = (err).toString();
                if (showZone && showZone =="statusBar") {
                    let projectName = path.basename(workingDir);
                    hx.window.setStatusBarMessage(`EasyGit: 项目${projectName}, Git fetch操作失败。`, 10000, 'error');
                    return 'fail';
                };
                if (errMsg.includes('Could not resolve host')) {
                    createOutputChannel(`Git: fetch失败，原因：Could not resolve host`, 'error');
                } else {
                    createOutputChannel(`Git: fetch失败 \n\n ${errMsg}`, 'error');
                };
                createOutputChannel("fetch操作说明：\n1. 当您打开Git源代码管理器时，easy-git插件会自动进行git fetch操作；git fetch 并没更改本地仓库的代码，只是拉取了远程 commit 等数据。\n2. fetch操作，错误说明及解决方法: https://easy-git.github.io/docs/file/fetch\n", "info");
                return 'fail';
            });
        return status
    } catch (e) {
        return 'error';
    }
};


/**
 * @description 取消add (取消暂存)
 * @description 暂时废弃，采用 git restore --staged <file>
 */
async function gitCancelAdd(workingDir, filename) {
    // status bar show message
    hx.window.setStatusBarMessage(`Git: ${filename} 正在取消暂存`);

    try {
        let status = await git(workingDir)
            .reset(['HEAD', '--' ,filename])
            .then(() => {
                hx.window.setStatusBarMessage('Git: 取消暂存成功', 3000, 'info');
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: ${filename}取消暂存失败 \n ${errMsg}`);
                return 'fail';
            });
        return status;
    } catch (e) {
        return 'error';
    }
};


/**
 * @description reset操作
 * @param {Object} workingDir
 */
async function gitReset(workingDir, options, msg) {
    let boxMsg = "确认重置后，您本地未提交的代码，将会丢失。\n\n执行的Git命令为：git reset " + options.join(" ");
    let btnText = await hxShowMessageBox(`${msg}`, boxMsg, ['确认重置', '关闭']).then( btn => {
        return btn;
    });
    if (btnText != '确认重置') return;

    try {
        let status = await git(workingDir)
            .reset(options)
            .then(() => {
                hx.window.setStatusBarMessage(msg + '成功');
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n" + (err).toString();
                createOutputChannel(`${msg} 失败 \n ${errMsg}`, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        return 'error';
    };
};


/**
 * @description 撤销对文件的修改
 */
async function gitCheckoutFile(workingDir, filename, isConfirm=false) {
    let args = ['--', filename]
    if (filename == '*') {
        args = ['*']
    };

    let msg = filename == '*' ? 'Git: 正在撤销全部文件的修改...' : `Git: ${filename} 正在撤销对文件的修改!`;
    hx.window.setStatusBarMessage(msg,2000,'info');

    if (isConfirm) {
        let boxMsg = `确定要放弃 ${filename} 中的更改吗？`;
        let btnText = await hxShowMessageBox('放弃更改', boxMsg, ['放弃更改', '取消']).then( btn => {
            return btn;
        });
        if (btnText != '放弃更改') {
            return;
        };
    };

    try {
        let status = await git(workingDir)
            .checkout(args)
            .then(() => {
                hx.window.setStatusBarMessage('Git: 撤销修改操作成功。', 3000, 'info');
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 撤销修改操作失败。\n ${errMsg}`, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        return 'error';
    }
};


/**
 * @description 处理合并冲突，即git checkout ----theirs|--ours <filename>
 */
async function gitCheckoutConflicted(workingDir, filename) {
    let boxMsg = `${filename} 存在处理，请选择解决冲突的方案。\n\n保留本地：git checout --ours \n保留远端：git checkout --theirs`;
    let btnText = await hxShowMessageBox('Git 合并冲突', boxMsg, ['保留远端', '保留本地', '关闭']).then( btn => {
        return btn;
    });

    if (btnText != '保留远端' && btnText != '保留本地') {
        return;
    };

    let parm = btnText == '保留远端' ? '--theirs' : '--ours';
    let cmd = [parm, filename];
    console.log(cmd)
    let status = await git(workingDir)
        .checkout(cmd)
        .then(() => {
            hx.window.setStatusBarMessage(`Git: ${btnText}，操作成功。`, 5000, 'info');
            return 'success'
        })
        .catch((err) => {
            let errMsg = "\n\n" + (err).toString();
            createOutputChannel(`Git: ${btnText}，操作成功。\n ${errMsg}`, 'error');
            return 'fail';
        });
    return status;
};

/**
 * @description 获取本地及远程分支列表
 */
async function gitBranchList(workingDir, options='-avvv') {
    let local = [];
    let remote = [];
    try {
        let argv = ["--sort=-committerdate", options];
        let status = await git(workingDir)
            .branch(argv)
            .then((info) => {
                let branches = info.branches;
                for (let s in branches) {
                    let name = branches[s]['name'];
                    if (name.startsWith('remotes/origin/')) {
                        let tmp = info.branches[s];
                        tmp.name = name.replace('remotes/', '');
                        remote.push(tmp);
                    } else {
                        let tmp2 = branches[s];
                        local.push(tmp2);
                    };
                };
                return { 'localBranchList':local, 'remoteBranchList': remote };
            })
            .catch((err) => {
                hx.window.setStatusBarMessage('Git: 获取分支列表失败，请稍后再试', 3000, 'error');
                return { 'localBranchList':local, 'remoteBranchList': remote };;
            });
        return status;
    } catch (e) {
        return { 'localBranchList':local, 'remoteBranchList': remote };;
    }
};


/**
 * @description 某些情况下，gitBranch无法获取到分支信息
 * @param {Object} workingDir
 * @param {Object} commands, 比如branch
 */
async function gitRawGetBranch(workingDir, commands) {
    try {
        let status = await git(workingDir).raw(commands)
            .then((res) => {
                let branchs = res.split('\n');
                let result = [];
                for (let s of branchs) {
                    let tmp = s.replace(/^\s+|\s+$/g,"");
                    if (tmp) {
                        let current = tmp.includes('*') ? true : false;
                        result.push({"name": tmp, "current": current});
                    };
                };
                return result;
            })
            .catch((err) => {
                hx.window.setStatusBarMessage('Git: 获取分支列表失败，请稍后再试', 3000, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        hx.window.setStatusBarMessage('Git: 获取分支列表失败，请稍后再试', 3000, 'error');
        return 'error';
    };
};


/**
 * @description 获取当前分支名称
 */
async function gitCurrentBranchName(workingDir) {
    try {
        let name = await git(workingDir)
            .raw(['symbolic-ref', '--short', 'HEAD'])
            .then((info) => {
                info = info.trim();
                return info == undefined || info == '' ? false : info;
            })
            .catch((err) => {
                hx.window.setStatusBarMessage('Git: 获取当前分支信息失败', 30000, 'error');
                return false;
            });
        return name;
    } catch (e) {
        return false;
    };
};

/**
 * @description 分支切换
 */
async function gitBranchSwitch(workingDir,branchName) {
    try {
        let status = await git(workingDir)
            .checkout([branchName])
            .then(() => {
                hx.window.setStatusBarMessage(`Git: 分支切换成功, 当前分支是 ${branchName}`, 20000, 'info');
                voiceSay(`branch.switch.success`, `当前分支是 ${branchName}`);
                return 'success';
            })
            .catch((err) => {
                let errMsg = (err).toString();
                if (errMsg.includes("error: pathspec '-'")) {
                    hx.window.setStatusBarMessage('Git: 当前您本地只存在一个分支，无法切换到上一个分支。', 20000, 'error');
                } else {
                    createOutputChannel(`Git: 分支${branchName}切换失败! \n ${errMsg}`, 'error');
                };
                return 'fail';
            });
        return status;
    } catch (e) {
        return 'error';
    }
};

/**
 * @description 分支重命名
 * @param {type} workingDir Git工作目录
 * @param {type} newBranchName 新分支名称
 */
async function gitBranchRename(workingDir,newBranchName) {
    if (newBranchName.trim() == '') {
        hx.window.showErrorMessage('easy-git: 分支重命名，新分支名称不能为空。', ['我知道了']);
        return;
    };
    try {
        let argv = ["-m", newBranchName];
        let status = await git(workingDir)
            .branch(argv)
            .then(() => {
                hx.window.setStatusBarMessage(`Git: 分支重命名成功, 当前分支是 ${newBranchName}`, 20000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = (err).toString();
                createOutputChannel(`Git: 分支${newBranchName}重命名失败! \n ${errMsg}`, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        return 'error';
    }
};

/**
 * @description 强制删除本地分支
 */
async function gitDeleteLocalBranch(workingDir,branchName) {
    try {
        let status = await git(workingDir)
            .branch(['-D',branchName])
            .then(() => {
                hx.window.setStatusBarMessage('Git: 本地分支强制删除成功!', 3000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n" + (err).toString();
                createOutputChannel(`Git: 本地分支${branchName}强制删除失败! \n ${errMsg}`);
                return 'fail';
            });
        return status
    } catch (e) {
        return 'error';
    }
};


/**
 * @description 删除远程分支
 */
async function gitDeleteRemoteBranch(workingDir, branchName) {
    // status bar show message
    hx.window.setStatusBarMessage(`Git: 正在对 ${branchName} 远程分支进行删除，请耐心等待!`, 60000, 'info');

    try {
        branchName = await branchName.replace('remotes/origin/','').replace('origin/','');
        let status = await git(workingDir)
            .push(['origin', '--delete', branchName])
            .then(() => {
                setTimeout(function() {
                    hx.window.setStatusBarMessage(`Git: 远程分支${branchName}删除成功!`, 30000, 'info');
                },2000);
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 远程分支${branchName}删除失败! ${errMsg}`, 'error');
                return 'fail';
            });
        return status
    } catch (e) {
        return 'error';
    }
};


/**
 * @description 分支创建
 */
async function gitBranchCreate(data) {
    let {
        projectPath,
        newBranchName,
        ref,
        isPush
    } = data;

    let args = ['-b',newBranchName];
    if (ref) {
        args = ['-b', newBranchName, ref]
    };

    // status bar show message
    hx.window.setStatusBarMessage(`Git: 正在创建${newBranchName}, 创建成功后会自动刷新当前页面，请勿进行其它操作。`, 5000, 'info');
    if (isPush) {
        try {
            let HEAD = "HEAD:" + newBranchName;
            let status = await git(projectPath)
                .checkout(args)
                .push(["--set-upstream","origin",newBranchName])
                .then(() => {
                    hx.window.setStatusBarMessage(`Git: ${newBranchName} 新分支，创建、并推送分支到远端成功。`, 30000, 'info');
                    return 'success';
                })
                .catch((err) => {
                    let errMsg = "\n" + (err).toString();
                    createOutputChannel(`Git: 分支${newBranchName}创建失败 ${errMsg}`);
                    return 'fail';
                });
            return status;
        } catch (e) {
            return 'error';
        }
    } else {
        try {
            let status = await git(projectPath)
                .checkout(args)
                .then(() => {
                    hx.window.setStatusBarMessage(`Git: ${newBranchName} 新分支创建成功`, 30000, 'info');
                    return 'success';
                })
                .catch((err) => {
                    let errMsg = "\n" + (err).toString();
                    createOutputChannel(`Git: 分支${newBranchName}创建失败 ${errMsg}`, 'error');
                    return 'fail';
                });
            return status;
        } catch (e) {
            return 'error';
        }
    }
};


/**
 * @description push本地新建的分支到远程
 */
async function gitLocalBranchToRemote(workingDir,branchName) {
    // status bar show message
    hx.window.setStatusBarMessage(`Git: 正在把 ${branchName} 推送到远端，请耐心等待!`, 10000, 'info');

    try {
        let status = await git(workingDir)
            .push(['--set-upstream', 'origin', branchName])
            .then(() => {
                setTimeout(function() {
                    hx.window.setStatusBarMessage(`Git: ${branchName}推送远端成功!`, 30000, 'info');
                },2000);
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 分支${branchName} push远端失败 ${errMsg}`, 'error');
                return 'fail';
            });
        return status
    } catch (e) {
        return 'error';
    }
};


/**
 * @description 分支创建并push
 * @param {String} workingDir Git工作目录
 * @param {String} branchName 分支名称
 */
async function gitBranchCreatePush(workingDir,branchName) {
    // status bar show message
    hx.window.setStatusBarMessage('Git: create and push, in progress....!', 10000, 'info');
    try {
        let status = await git(workingDir)
            .checkout(['-b',branchName])
            .push(['--set-upstream', 'origin', branchName])
            .then(() => {
                setTimeout(function() {
                    hx.window.setStatusBarMessage(`Git: ${branchName} 创建、并成功推送远端!`, 30000, 'info');
                },2000);
                return 'success';
            })
            .catch((err) => {
                let errMsg = (err).toString();
                createOutputChannel(`Git: 分支${branchName} 创建、推送分支失败 \n ${errMsg}`, 'error');
                return 'fail';
            });
        return status
    } catch (e) {
        return 'error';
    }
};


/**
 * @description 分支合并
 */
async function gitBranchMerge(workingDir,fromBranch,toBranch) {
    // status bar show message
    hx.window.setStatusBarMessage(`'Git: 正在将 ${fromBranch} 合并到 ${toBranch}...`, 2000, 'info');

    try {
        let status = await git(workingDir)
            .mergeFromTo(fromBranch,toBranch)
            .then((res) => {
                if ((res.files).length == 0) {
                    return 'Already up to date.';
                };
                hx.window.setStatusBarMessage(`Git: 分支${toBranch}，合并${fromBranch}的代码，合并成功！在命令面板中，可取消合并。`, 10000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = (err).toString();
                createOutputChannel(`Git: 分支合并失败, 请根据控制台提示手动处理。\n ${errMsg}`, 'error');
                voiceSay('merge.conflict');
                if (errMsg.includes('CONFLICTS')) {
                    return 'conflicts';
                };
                return 'fail';
            });
        return status
    } catch (e) {
        return 'error';
    }
};


/**
 * @description tags
 * @param {String} workingDir Git工作目录
 */
async function gitTagsList(workingDir) {
    let tagsList = {
        "error": false,
        "data": []
    }
    try {
        let status = await git(workingDir)
            .tags(["--sort=-taggerdate"])
            .then((res) => {
                tagsList.data = res.all;
            })
            .catch((err) => {
                tagsList.error = true;
                let errMsg = (err).toString();
                createOutputChannel(`Git: tag获取失败 \n ${errMsg}`, 'error');
            });
    } catch (e) {
        tagsList.error = true;
        return tagsList;
    }
    return tagsList;
};

/**
 * @description  git create tag
 * @param {String} workingDir git工作目录
 * @param {String} tagName 标签名称
 */
async function gitTagCreate(workingDir,tagOptions, tagName) {
    // status bar show message
    hx.window.setStatusBarMessage(`Git: 正在创建标签 ${tagName} ....`, 2000, 'info');

    try {
        let status = await git(workingDir)
            .tag(tagOptions)
            .then(() => {
                return 'success';
            })
            .catch((err) => {
                let errMsg = (err).toString();
                createOutputChannel(`Git: 标签 ${tagName} 创建失败! ${errMsg}`, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        console.log(e)
        return 'error';
    }
};


/**
 * @description  git delete tag
 * @param {String} workingDir git工作目录
 * @param {String} tagName 标签名称
 */
async function gitTagDelete(workingDir, tagName, isDeleteRemote=false) {
    if (isDeleteRemote == true) {
        let commands = ['push', '--delete', 'origin', tagName];
        let delResult = await gitRaw(workingDir, commands);
        if (delResult == 'success') {
            hx.window.showInformationMessage(`Git：远程标签 ${tagName} 删除成功。`, ['我知道了']);
        } else {
            hx.window.showErrorMessage(`Git: 远程标签 ${tagName} 删除失败。`, ['我知道了'])
            return;
        };
    };

    try {
        let options = ['-d', tagName];
        let status = await git(workingDir)
            .tag(options)
            .then(() => {
                hx.window.setStatusBarMessage(`Git: 本地标签 ${tagName} 删除成功。`, 5000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = (err).toString();
                createOutputChannel(`Git: 本地标签 ${tagName} 删除失败! ${errMsg}`, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        console.log(e)
        return 'error';
    };
};


/**
 * @description clean
 * @param {isConfirm} 布尔值，默认值false 用于源代码管理器视图，点击后弹窗确认。命令面板调用，不需要弹窗确认。
 */
async function gitClean(workingDir, filepath, isConfirm=true) {
    let cleanMsg = 'Git: 确认删除当前【所有未跟踪的文件】吗？\n\n此操作不可撤销！\n如果继续操作，此文件将永久丢失。';
    let options = ['-d'];

    if (filepath != '*') {
        cleanMsg = `Git: 确认要删除${filepath} 吗？\n\n此操作不可撤销！\n如果继续操作，此文件将永久丢失。`;
        options = ['-d', filepath];
    } else {
        options = ['-d', '*'];
    };

    if (isConfirm) {
        let isDeleteBtn = await hxShowMessageBox('放弃更改', cleanMsg, ['删除文件', '取消']).then( btn => {
            return btn;
        });
        if (isDeleteBtn != '删除文件') {
            return;
        };
    };

    try {
        hx.window.setStatusBarMessage('Git: 开始删除本地未跟踪的文件', 2000, 'info');
        let status = await git(workingDir)
            .clean('f', options)
            .then(() => {
                hx.window.setStatusBarMessage(`Git: 成功删除未跟踪的文件`, 5000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n" + (err).toString();
                createOutputChannel(`Git: 删除未跟踪的文件失败 ${errMsg}`, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        return 'error';
    };
};

/**
 * @description clean
 * @param {Boolean} isPrint 是否在控制台打印
 */
async function gitConfigShow(workingDir, isPrint=true) {
    try {
        let status = await git(workingDir)
            .listConfig()
            .then((res) => {
                res = Object.values(res.values);
                let data = {};
                for (let i of res) {
                    data = Object.assign(data,i);
                };

                if (isPrint == true) {
                    let Msg = "\n\n";
                    for (let i2 in data) {
                        Msg = Msg + i2 + '=' + data[i2] + '\n';
                    };
                    createOutputChannel(`Git: 配置文件如下: \n ${Msg}`);
                };
                return data;
            })
            .catch((err) => {
                hx.window.setStatusBarMessage(`Git: git config读取失败`, 5000, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        return 'error';
    }
};

/**
 * @description 获取log, 主要用于日志视图
 * @param {Object} workingDir
 * @param {String} searchType 搜索类型 (all|branch)
 * @param {String} filterCondition 过滤条件，逗号分割
 * @param {String} refname 特定的本地分支、远程分支、tag名称
 */
async function gitLog(workingDir, searchType, filterCondition, refname) {
    filter = ['-n 80']
    if (filterCondition != 'default') {
        if (filterCondition.includes('-n')) {
            filter = filterCondition.split(',');
        } else {
            let tmp = filterCondition.split(',');
            filter = [...filter, ...tmp]
        };
    };

    // 去除空格
    filter = filter.filter( s => s && s.trim());

    if (searchType == 'all') {
        filter = ['--all', ...filter];
    };

    // 去除数组中元素两边的空格
    let tmpFilter = [];
    for (let s of filter) {
        tmpFilter.push(s.trim())
    };

    if (refname != undefined && refname != '') {
        filter = [refname, ...tmpFilter]
    } else {
        filter = [...tmpFilter];
    };

    try {
        let result = {
            "success": true,
            "errorMsg": '',
            "data": []
        };
        if (workingDir == undefined || workingDir == '') {
            result.errorMsg = '无法获取项目路径，git log执行失败。请重试。';
            result.success = false;
            return result;
        };

        let LogResult = await git(workingDir)
            .log(filter)
            .then((res) => {
                let data = res.all;
                result.data = data
                return data;
            })
            .catch((err) => {
                result.errorMsg = err.message;
                result.success = false;
                return result;
            });

        try{
            let parseResult = await parseLogData(LogResult);
            if (parseResult){
                result.data = parseResult;
            };
        }catch(e){
            console.log(e)
        };
        return result;
    } catch (e) {
        result.errorMsg = e;
        result.success = false;
        return result;
    };
};

/**
 * @description 解析log数据：格式化日期、标签等
 */
async function parseLogData(LogList) {
    if (!Array.isArray(LogList)) return LogList;
    let tmp = [];
    for (let i of LogList) {
        i["date"] = dayjs(i["date"]).format('YYYY/MM/DD HH:mm:ss');
        if (i["refs"]) {
            i["refs"] = i["refs"].split(',');
        };
        tmp.push(i);
    };
    return tmp;
};

/**
 * @description 获取log
 * @param {Object} workingDir
 * @param {Array} filter 过滤条件，必须是数组
 */
async function gitLog2(workingDir, filter) {
    try {
        let result = {
            "success": true,
            "data": []
        };
        let status = await git(workingDir)
            .log(filter)
            .then((res) => {
                let data = res.all;
                result.data = data
                return result;
            })
            .catch((err) => {
                errorMsg = err.message;
                createOutputChannel(`【${workingDir}】获取日志失败。${errorMsg}`, "fail");
                result.success = false;
                return result;
            });
        return result;
    } catch (e) {
        createOutputChannel(`【${workingDir}】获取日志失败。${e}`, "fail");
        result.success = false;
        return result;
    };
};

/**
 * @description 获取文件历史hash
 * @param {Object} workingDir
 * @param {Object} filter
 */
async function gitFileHistoryLogHash(workingDir, filter) {
    try {
        let result = [];
        let status = await git(workingDir).log(filter).then((res) => {
            let data = res.all;
            if (data) {
                result = data.map(item => {
                    return {
                        'hash': item.hash,
                        'date': item.date,
                        'msg': item.author_name + ': ' + item.message
                    };
                });
            };
        }).catch((err) => {
            return result;
        });
        return result;
    } catch (e) {
        return result;
    };
};

/**
 * @description 显示远程仓库信息
 */
async function gitRemoteshowOrigin(workingDir){
    hx.window.setStatusBarMessage('Git: 正在运行 git remote show origin',5000,'info');
    let cmd = "cd " + workingDir + "&& git remote show origin"
    await runCmd(cmd)
};

/**
 * @description 文件对比
 */
async function gitDiffFile(workingDir,filename) {
    const cmd = "cd " + workingDir + " && git diff " + filename;
    runCmd(cmd);
};

/**
 * @description stash
 * @option {String} Stash选项
 */
async function gitStash(projectInfo, options, msg) {
    try {
        let {projectPath} = projectInfo;
        let status = await git(projectPath)
            .stash(options)
            .then((res) => {
                if (res.length == 0) {
                    createOutputChannel(`${msg} 操作失败！\n`, 'error');
                    return 'fail';
                };
                if (res.includes('Saved') || res == '' || res.includes('Dropped')) {
                    hx.window.setStatusBarMessage(msg + '成功', 5000, 'info');
                    hx.commands.executeCommand('EasyGit.main', projectInfo);
                    return 'success';
                };
                if (res.includes('needs merge')) {
                    throw `可能有文件存在冲突，请解决后再进行储藏！\n\n${res}`;
                } else {
                    throw res;
                };
            })
            .catch((err) => {
                createOutputChannel(`${msg} 操作失败！\n ${err}`, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        createOutputChannel(`${msg}, 插件运行异常 \n ${e}`);
        return 'error';
    };
};

/**
 * @description 弹出储藏列表
 */
async function gitStashList(workingDir) {
    try {
        let status = await git(workingDir)
            .stashList()
            .then((res) => {
                return res;
            })
            .catch((err) => {
                hx.window.setStatusBarMessage('Git: 获取储藏列表失败。', 5000, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        createOutputChannel(`Git: 获取储藏列表失败, 插件运行异常。\n ${e}`);
        return 'error';
    };
};

/**
 * @description 设置config
 */
async function gitConfigSet(workingDir, data) {
    try {
        let {key, value} = data;
        let status = await git(workingDir)
            .addConfig(key, value)
            .then((res) => {
                hx.window.setStatusBarMessage(`Git: 设置${key}成功。`, 5000, 'info');
                return 'success';
            })
            .catch((err) => {
                console.log(err);
                hx.window.setStatusBarMessage(`Git: 设置${key}失败。`, 5000, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        createOutputChannel(`Git: 设置失败, 插件运行异常 \n${e}`);
        return 'error';
    };
};

/**
 * @description add remote
 */
async function gitAddRemote(workingDir, url) {
    try {
        let status = await git(workingDir)
            .addRemote('origin', url)
            .then((res) => {
                hx.window.setStatusBarMessage('Git: add remote操作成功。', 5000, 'info');
                return 'success';
            })
            .catch((err) => {
                createOutputChannel(`Git: add remote操作失败 \n ${err}`, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        createOutputChannel(`Git: 操作失败，插件运行异常。\n ${e}`);
        return 'error';
    };
};

/**
 * @description raw
 * @param {String} workingDir Git工作目录
 * @param {Array} commands []
 * @param {String} msg 消息
 */
async function gitRaw(workingDir, commands, msg, resultType='statusCode') {
    try {
        let status = await git(workingDir).raw(commands)
            .then((res) => {
                if (msg != undefined) {
                    hx.window.setStatusBarMessage(`Git: ${msg} 操作成功。`, 60000, 'info');
                };
                if (resultType != 'statusCode') {
                    return res;
                } else {
                    return 'success';
                };
            })
            .catch((err) => {
                if (msg != undefined) {
                    let cmd_details = commands.join(' ');
                    createOutputChannel(`Git: ${msg} 操作失败，执行命令：git ${cmd_details} \n ${err}`, 'error');
                };
                return 'fail';
            });
        return status;
    } catch (e) {
        if (msg != undefined) {
            createOutputChannel(`Git: ${msg} 操作失败，插件运行异常。\n ${e}`);
        };
        return 'error';
    };
};


/**
 * @description git Cherry-pick
 * @param {String} workingDir Git工作目录
 * @param {Array} commands []
 * @param {String} msg 消息
 */
async function gitCherryPick(workingDir, commands) {
    try {
        hx.window.setStatusBarMessage('Git: cherry-pick 操作进行中......', 2000, 'info');
        let status = await git(workingDir).raw(commands)
            .then((res) => {
                hx.window.setStatusBarMessage('Git: cherry-pick 操作成功！', 10000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = err.toString();
                if (errMsg.includes('resolving the conflicts')) {
                    voiceSay("merge.conflict");
                    return 'conflicts';
                };
                createOutputChannel(`Git: ${commands} 操作失败。\n ${err}`, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        createOutputChannel(`Git: ${commands} 操作失败，插件运行异常。\n ${e}`);
        return 'error';
    };
};


/**
 * @description
 */
async function gitShowCommitFileChange(workingDir, options) {
    try {
        let result = {
            "success": true,
            "errorMsg": '',
            "data": []
        }
        let status = await git(workingDir)
            .show(options)
            .then((res) => {
                result.data = res
                return result;
            })
            .catch((err) => {
                result.errorMsg = err.message;
                result.success = false;
                return result;
            });
        return result;
    } catch (e) {
        result.success = false;
        return result;
    };
};

/**
 * @description 提取
 */
function parseRemoteBranch(info) {
    try{
        let remote = /\[origin\/(.+?)\]/g.exec(info)[0].replace(/\[|]/g,'')
        return remote;
    }catch(e){
        return '';
    };
};

/**
 * @description 关联远程分支
 */
async function getTrackingRemoteBranch(projectPath) {
    try{
        let result = await gitRaw(projectPath, ['branch', '-vv'], undefined, 'result')
        if (result) {
            let data = result.split('\n');
            let tracking;
            for (let s of data) {
                if (s.charAt(0) == '*') {
                    tracking = parseRemoteBranch(s);
                    break;
                };
            };
            return tracking;
        };
        return '';
    }catch(e){
        return '';
    }
};


/**
 * @description 关联远程仓库
 * @param {Object} projectPath
 * @param {String} originUrl
 */
async function gitAddRemoteOrigin(projectPath, originUrl=false) {
    if (originUrl == false || originUrl == undefined || originUrl == '') {
        originUrl = await hx.window.showInputBox({
            prompt:"关联Git远程仓库",
            placeHolder: "必填，请输入远程仓库地址"
        }).then((result)=>{
            return result
        });
    };
    let reg = /^(https:\/\/|http:\/\/|git@)/g;
    if (reg.test(originUrl)) {
        let commands = ['remote', 'add', 'origin', originUrl];
        let rResult = await gitRaw(projectPath, commands, '关联远程仓库', 'statusCode');
        if (rResult == 'success') {
            hx.window.setStatusBarMessage('EasyGit: 添加远程仓库成功。', 10000, 'info');
        };
        return rResult;
    } else {
        hx.window.showErrorMessage('EasyGit: 远程仓库地址无效。如还需要进行关联，请在源代码管理器底部或命令面板内操作。', ['我知道了']);
        return 'fail';
    };
};


/**
 * @description 关联远程仓库
 * @param {Object} projectPath
 * @param {String} originUrl
 */
async function gitRmRemoteOrigin(projectPath, projectName) {
    let commands = ['remote', 'rm', 'origin'];
    let rResult = await gitRaw(projectPath, commands, '删除远程仓库', 'result');
    if (rResult.length == 0) {
        createOutputChannel(`项目【${projectName}】删除远程仓库成功。`, "success");
        createOutputChannel(`项目【${projectName}】如需再次添加，请打开Git【命令面板】，搜索：添加远程仓库`, "success");
    } else {
        createOutputChannel(`项目【${projectName}】删除远程仓库失败。`, "error");
    };
};


/**
 * Git Commit Message Fill
 * @constructor
 * @param {String} repositoryRoot
 */
class FillCommitMessage {
    constructor(repositoryRoot) {
        this.repositoryRoot = repositoryRoot
    }

    handleMsgComments(message) {
        return message.replace(/^\s*#.*$\n?/gm, '').trim();
    }

    readFile(mergeMsgPath) {
        return new Promise((resolve,reject) => {
            fs.readFile(mergeMsgPath, 'utf8', (err, data) => {
                if (err) {
                    reject(undefined)
                }
                resolve(data);
            });
        })
    }

    async getMergeMsg() {
        const mergeMsgPath = path.join(this.repositoryRoot, '.git', 'MERGE_MSG');
        try {
            const raw = await this.readFile(mergeMsgPath);
            if (raw != undefined) {
                return this.handleMsgComments(raw);
            };
            return undefined;
        } catch (e) {
            return undefined;
        }
    }
}

/**
 * @description git revert <commit-id>
 * @param {String} workingDir Git工作目录
 * @param {Array} commands []
 * @param {String} msg 消息
 */
async function gitRevert(workingDir, commands) {
    try {
        hx.window.setStatusBarMessage('Git: revert 操作进行中......', 3000, 'info');
        let status = await git(workingDir).raw(commands)
            .then((res) => {
                hx.window.setStatusBarMessage('Git: revert 操作成功。', 5000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = err.toString();
                if (errMsg.includes('Reverting is not possible') || errMsg.includes('resolving the conflicts')) {
                    hx.window.setStatusBarMessage('Git: revert 操作出现冲突！', 10000, 'info');
                    return 'conflicts';
                };
                createOutputChannel(`Git: ${commands} 操作失败。\n ${err}`, 'error');
                return 'fail';
            });
        return status;
    } catch (e) {
        createOutputChannel(`Git: ${commands} 操作失败，插件运行异常。\n ${e}`);
        return 'error';
    };
};


/**
 * @description 获取所有分支、tags
 * @param {Object} workingDir
 */
async function gitRefs(workingDir) {
    if (workingDir == undefined) {
        return {};
    };
    try{
        let refs = {};
        let branches = await gitBranchList(workingDir);
        refs = Object.assign(branches);

        let tags = await gitTagsList(workingDir);
        let {error} = tags;
        if (!error) {
            refs.tags = tags.data;
        };
        return refs;
    }catch(e){
        return {}
    }
};

/**
 * @description 对话框
 *     - 插件API: hx.window.showMessageBox, 本身存在很大问题，请谨慎使用
 *     - 已屏蔽esc事件，不支持esc关闭弹窗；因此弹窗上的x按钮，也无法点击。
 *     - 按钮组中必须提供`关闭`操作。且关闭按钮需要位于数组最后。
 * @param {String} title
 * @param {String} text
 * @param {String} buttons 按钮，必须大于1个
 */
function hxShowMessageBox(title, text, buttons = ['关闭']) {
    return new Promise((resolve, reject) => {
        try {
            let escape = -10;
            if ( buttons.length > 1 && (buttons.includes('关闭') || buttons.includes('取消')) ) {
                if (osName == 'darwin') {
                    buttons = buttons.reverse();
                };
            };
            hx.window.showMessageBox({
                type: 'info',
                title: title,
                text: text,
                buttons: buttons,
                defaultButton: 0,
                escapeButton: escape
            }).then(button => {
                resolve(button);
            });
        } catch (e) {
            hx.window.showInformationMessage(text, buttons).then((result) => {
                resolve(result);
            });
        }
    });
};

/**
 * @description Git文件删除
 */
async function gitRemoveFile(filepath,filename) {
    let desc = `确定要删除${filename}吗？删除后无法恢复!`;
    let status = await hxShowMessageBox('Git 文件删除', desc, ['确定','取消']).then(btnText => {
        if (btnText == '确定') {
            fs.unlinkSync(filepath)
            hx.window.setStatusBarMessage(`${filename}删除成功!`);
            return true;
        } else {
            hx.window.setStatusBarMessage(`${filename}删除操作被取消!`);
            return false;
        }
    });
    return status;
};

/**
 * @description 在浏览器查看Git仓库
 */
async function gitRepositoryUrl(projectPath) {
    let result = await gitRaw(projectPath, ['ls-remote', '--get-url', 'origin'], '获取仓库URL', 'result');
    if (typeof(result) == 'string') {
        let url = result;
        if (result.includes('.git')) {
            if (result.includes('git@') == true) {
                url = result.replace('git@', '').replace(':','/').replace('.git','');
                url = 'http://' + url;
            };
            url = url.replace(/\r\n/g,"").replace(/\n/g,"");
            setTimeout(function() {
                hx.env.openExternal(url);
            }, 1000);
        };
    } else {
        hx.window.showErrorMessage('获取仓库地址失败');
    };
};

/**
 * @description 新建文件、写入文件内容保存，并在hx打开
 */
async function FileWriteAndOpen(filename, filecontent){
    let appDataDir = hx.env.appData;
    let EasyGitDir = path.join(appDataDir, 'easy-git');
    let status = fs.existsSync(EasyGitDir);
    if (!status) {
        fs.mkdirSync(EasyGitDir);
    };
    let fpath = path.join(EasyGitDir, filename);
    fs.writeFile(fpath, filecontent, function (err) {
       if (err) throw err;
       hx.workspace.openTextDocument(fpath);
    });
};

/**
 * @description 创建多级目录，同步方法
 * @param {Object} dirname
 */
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        };
    };
};


/**
 * @description git 取消暂存
 *  - resotre git 2.23.0版本的命令
 *  - 高版本的git 废弃了checkout，采用了restore命令， 因此easy-git采用restore
 */
class gitRestore {
    constructor() {
        this.isUseRestore = undefined
    }

    // 提示框
    showGitVersionPrompt() {
        hx.window.showInformationMessage('Git提醒:  此操作，用到了restore命令。\n本机Git命令行版本太低, 没有restore命令，将使用旧版命令。建议升级电脑的Git命令行工具！', ['安装高版本Git工具', '关闭']).then( (res)=> {
            if (res == '安装高版本Git工具') {
                hx.env.openExternal('https://git-scm.com/downloads');
            };
        });
    };

    // Git: resotre git 2.23.0版本的命令
    async JudgeGitRestore() {
        try{
            if (cmp_git == undefined) {
                let version = await getGitVersion();
                cmp_git = cmp_hx_version(version, '2.23.0');
                if (cmp_git > 0 ) {
                    this.showGitVersionPrompt();
                    return false;
                };
                return true;
            } else {
                if (cmp_git > 0 ) {
                    this.showGitVersionPrompt();
                    return false;
                }
                return true;
            };
        }catch(e){
            return true;
        };
    };

    /**
     * @param {Object} projectInfo
     * @param {Object} actionName  restoreChanged | restoreChanged
     */
    async restore(projectInfo, actionName) {
        let {projectPath, selectedFile} = projectInfo;
        if (this.isUseRestore == undefined) {
            this.isUseRestore = await this.JudgeGitRestore();
        };

        let options = selectedFile;
        if (selectedFile != '*') {
            // 检查是否是否修改
            let checkResult = await gitFileStatus(projectPath, selectedFile, ['s', selectedFile]);
            if (checkResult == undefined || checkResult == 'error') {
                let { index, working_dir } = checkResult;
                if (actionName == 'restoreStaged') {
                    hx.window.setStatusBarMessage('EasyGit: 操作中止，当前文件没有暂存。', 30000, 'error')
                };
                if (actionName == 'restoreChanged') {
                    hx.window.setStatusBarMessage('EasyGit: 操作中止，当前文件没有修改。', 30000, 'error')
                };
                return;
            };
        };

        if (this.isUseRestore == false) {
            let cmd, msg;
            if (actionName == 'restoreStaged') {
                cmd = ['reset', 'HEAD', '--', options];
                msg = '文件取消暂存，';
            };
            if (actionName == 'restoreChanged') {
                cmd = ['checkout', '--', options];
                msg = '撤消对文件的修改，';
            };

            let cancelStatus = await gitRaw(projectPath, cmd, msg);
            return cancelStatus;
        };

        if (this.isUseRestore == true) {
            let cmd1, msg1;
            if (actionName == 'restoreStaged') {
                cmd1 = ['restore', '--staged', options];
                msg1 = '文件取消暂存，';
            };
            if (actionName == 'restoreChanged') {
                cmd1 = ['restore', options];
                msg1 = '撤消对文件的修改，';
            };
            let cancelStatus = await gitRaw(projectPath, cmd1, msg1);
            return cancelStatus;
        };
    };
}

module.exports = {
    hxShowMessageBox,
    applyEdit,
    updateHBuilderXConfig,
    isDirEmpty,
    checkIsGitProject,
    getDirFileList,
    FileWriteAndOpen,
    createOutputChannel,
    createOutputView,
    createOutputViewForHyperLinksForCommand,
    isGitInstalled,
    getGitVersion,
    getHBuilderXiniConfig,
    getThemeColor,
    importProjectToExplorer,
    getFilesExplorerProjectInfo,
    checkNodeModulesFileList,
    checkGitUsernameEmail,
    gitInit,
    gitAddRemoteOrigin,
    gitRmRemoteOrigin,
    getTrackingRemoteBranch,
    gitClone,
    gitStatus,
    gitFileStatus,
    gitFileListStatus,
    gitAdd,
    gitAddCommit,
    gitCommitPush,
    gitCancelAdd,
    gitCommit,
    gitReset,
    gitPush,
    gitPull,
    gitFetch,
    gitCheckoutFile,
    gitDiffFile,
    gitShowCommitFileChange,
    gitBranchList,
    gitRawGetBranch,
    gitCurrentBranchName,
    gitBranchSwitch,
    gitBranchCreate,
    gitDeleteLocalBranch,
    gitDeleteRemoteBranch,
    gitLocalBranchToRemote,
    gitBranchRename,
    gitBranchCreatePush,
    gitBranchMerge,
    gitTagsList,
    gitTagCreate,
    gitTagDelete,
    gitClean,
    gitConfigShow,
    gitConfigSet,
    gitRemoteshowOrigin,
    gitLog,
    gitLog2,
    gitFileHistoryLogHash,
    gitStash,
    gitStashList,
    gitAddRemote,
    gitRaw,
    gitCherryPick,
    FillCommitMessage,
    gitRevert,
    gitRefs,
    gitRemoveFile,
    gitRepositoryUrl,
    gitCheckoutConflicted,
    mkdirsSync,
    gitRestore
}
