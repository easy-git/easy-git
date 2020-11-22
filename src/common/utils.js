const fs = require('fs');
const os = require('os');
const path = require('path');
const {exec} = require('child_process');

const hx = require('hbuilderx');
const spawn = require('cross-spawn')
const ini = require('ini');

const gitRemoteOriginUrl = require('git-remote-origin-url');
const git = require('simple-git');

const voiceSay = require('./voice.js');

const osName = os.platform();


/**
 * @description 背景颜色、输入框颜色、字体颜色、线条颜色
 */
function getThemeColor(area) {
    let config = hx.workspace.getConfiguration();
    let colorScheme = config.get('editor.colorScheme');
    let colorCustomizations = config.get('workbench.colorCustomizations');

    if (colorScheme == undefined) {
        colorScheme = 'Default';
    };

    // 背景颜色、输入框颜色、字体颜色、线条颜色
    let background, liHoverBackground,inputColor, inputLineColor, cursorColor, fontColor, lineColor, menuBackground;

    // 修复 0.1版本引出的Bug （当未定义自定义主题时异常的Bug）
    let custom = {};
    try{
        custom = colorCustomizations[`[${colorScheme}]`];
    }catch(e){
        custom = {}
    };

    let viewBackgroundOptionName = area == 'siderBar' ? 'sideBar.background' : 'editor.background';
    let viewFontOptionName = area == 'siderBar' ? 'list.foreground' : undefined;
    let viewLiHoverBgOptionName = area == 'siderBar' ? 'list.hoverBackground' : 'list.hoverBackground';

    if (colorScheme == 'Monokai') {
        if (custom != undefined && custom[viewBackgroundOptionName] && viewBackgroundOptionName in custom) {
            background = custom[viewBackgroundOptionName];
            menuBackground = custom[viewBackgroundOptionName];
        } else {
            background = 'rgb(39,40,34)';
            menuBackground = 'rgb(83,83,83)';
        };
        if (custom != undefined && custom[viewFontOptionName] && viewFontOptionName in custom) {
            fontColor = custom[viewFontOptionName];
        } else {
            fontColor = 'rgb(179,182,166)';
        };
        if (custom != undefined && custom[viewLiHoverBgOptionName] && viewLiHoverBgOptionName in custom) {
            liHoverBackground = custom[viewLiHoverBgOptionName];
        } else {
            liHoverBackground = 'rgb(78,80,73)';
        };
        inputColor = 'rgb(255,254,250)';
        inputLineColor = 'rgb(210,210,210)';
        cursorColor = 'rgb(255,255,255)';
        lineColor = 'rgb(23,23,23)';
    } else if (colorScheme == 'Atom One Dark') {
        if (custom != undefined && custom[viewBackgroundOptionName] && viewBackgroundOptionName in custom) {
            background = custom[viewBackgroundOptionName];
            menuBackground = custom[viewBackgroundOptionName];
        } else {
            background = 'rgb(40,44,53)';
            menuBackground = 'rgb(50,56,66)';
        };
        if (custom != undefined && custom[viewFontOptionName] && viewFontOptionName in custom) {
            fontColor = custom[viewFontOptionName];
        } else {
            fontColor = 'rgb(171,178,191)';
        };
        if (custom != undefined && custom[viewLiHoverBgOptionName] && viewLiHoverBgOptionName in custom) {
            liHoverBackground = custom[viewLiHoverBgOptionName];
        } else {
            liHoverBackground = 'rgb(44,47,55)';
        };
        inputColor = 'rgb(255,254,250)';
        inputLineColor = 'rgb(81,140,255)';
        cursorColor = 'rgb(255,255,255)';
        lineColor = 'rgb(33,37,43)';
    } else {
        if (custom != undefined && custom[viewBackgroundOptionName] && viewBackgroundOptionName in custom) {
            background = custom[viewBackgroundOptionName];
            menuBackground = custom[viewBackgroundOptionName];
        } else {
            background = 'rgb(255,250,232)';
            menuBackground = 'rgb(255,252,243)';
        };
        if (custom != undefined && custom[viewFontOptionName] && viewFontOptionName in custom) {
            fontColor = custom[viewFontOptionName];
        } else {
            fontColor = '#333';
        };
        if (custom != undefined && custom[viewLiHoverBgOptionName] && viewLiHoverBgOptionName in custom) {
            liHoverBackground = custom[viewLiHoverBgOptionName];
        } else {
            liHoverBackground = 'rgb(224,237,211)';
        };
        inputColor = 'rgb(255,252,243)';
        inputLineColor = 'rgb(65,168,99)';
        cursorColor = 'rgb(0,0,0)';
        lineColor = 'rgb(225,212,178)';
    };

    // 文件对比相关颜色
    let d2h_ins_bg, d2h_ins_border;
    let d2h_del_bg, d2h_del_border;
    let d2h_code_side_line_del_bg, d2h_code_side_line_ins_bg;
    let d2h_emptyplaceholder_bg, d2h_emptyplaceholder_border;
    let d2h_linenum_color;
    if (colorScheme == 'Monokai' || colorScheme == 'Atom One Dark') {
        d2h_ins_bg = '#252C2F';
        d2h_del_bg = '#2E2527';
        d2h_code_side_line_del_bg = '#423133';
        d2h_code_side_line_ins_bg = '#303D44';
        d2h_emptyplaceholder_bg = '#303131';
        d2h_linenum_color = fontColor;
    } else {
        d2h_ins_bg = '#dfd';
        d2h_ins_border = '#b4e2b4'
        d2h_del_bg = '#fee8e9';
        d2h_del_border = '#e9aeae';
        d2h_code_side_line_del_bg = '#ffb6ba';
        d2h_code_side_line_ins_bg = '#97f295';
        d2h_emptyplaceholder_bg = '#f1f1f1';
        d2h_emptyplaceholder_border = '#e1e1e1';
        d2h_linenum_color = fontColor;
    };

    return {
        background,
        menuBackground,
        liHoverBackground,
        inputColor,
        inputLineColor,
        cursorColor,
        fontColor,
        lineColor,
        d2h_ins_bg,
        d2h_ins_border,
        d2h_del_bg,
        d2h_del_border,
        d2h_code_side_line_del_bg,
        d2h_code_side_line_ins_bg,
        d2h_emptyplaceholder_bg,
        d2h_emptyplaceholder_border,
        d2h_linenum_color
    };
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
 */
function importProjectToExplorer(projectPaht) {
    try{
        let hxExecutableProgram;
        let appRoot = hx.env.appRoot;
        if (osName == 'darwin') {
            hxExecutableProgram = path.join(path.dirname(appRoot),'MacOS/HBuilderX');
        } else {
            hxExecutableProgram = path.join(appRoot,'HBuilderX.exe');
        };
        const command = spawn.sync(hxExecutableProgram, [projectPaht], {
          stdio: 'ignore'
        });
    }catch(e){
        console.error(e)
        //TODO handle the exception
    }
};


/**
 * @description 获取项目管理器的项目数量
 */
async function getFilesExplorerProjectInfo() {
    let data = {
        "success": true,
        "msg": '',
        "FoldersNum": 0,
        "Folders": []
    };
    let result = hx.workspace.getWorkspaceFolders().then(function(wsFolders) {
        try{
            let Folders = []
            for (let item of wsFolders) {
                let tmp = {
                    'FolderPath': item.uri.fsPath,
                    'FolderName': item.name,
                    'isGit': false
                };
                let gitfsPath = path.join(item.uri.fsPath, '.git', 'config');
                if (fs.existsSync(gitfsPath)) {
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
    });
    return result;
};


/**
 * @description 创建输出控制台
 */
function createOutputChannel(label=false,msg) {
    let channel_name = "Git";
    let outputChannel = hx.window.createOutputChannel(channel_name);
    outputChannel.show();

    if (label) {
        outputChannel.appendLine(label);
    };

    let text = `${msg}`;
    outputChannel.appendLine('\n\n' + text);
};

/**
 * @description 创建输出控制台
 */
function createOutputChannelForClone(msg, newline=true) {
    let channel_name = "Git";
    let outputChannel = hx.window.createOutputChannel(channel_name);
    outputChannel.show();

    let text = `${msg}`;
    if (newline) {
        outputChannel.appendLine('\n\n' + text);
    } else {
        outputChannel.appendLine(text);
    };
};

/**
 * @description 运行命令
 */
async function runCmd(cmd) {
    let label = '执行:' + cmd + '\n';
    exec(cmd, function(error, stdout, stderr) {
        createOutputChannel(label,[stdout,stderr]);
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
 * @description 检查用户凭证
 */
async function checkGitCredentials(projectPath, unset=false) {
    if (unset == true) {
        await gitRaw(projectPath, ['config', '--global', '--unset', 'credential.helper']);
        await gitRaw(projectPath, ['config', '--local', '--unset', 'credential.helper']);
        await gitRaw(projectPath, ['config', '--system', '--unset', 'credential.helper']);
        return;
    };
    let configData = await gitConfigShow(projectPath, false);
    let remoteOriginUrl = configData['remote.origin.url'];
    if (remoteOriginUrl.slice(0,4) == 'git@') { return 'ssh'; };

    let credential = configData['credential.helper'];
    if (osName == 'win32' && credential != 'manager') {
        hx.window.setStatusBarMessage(`Git: 正在校验身份，如弹出授权，请同意或输入凭证信息！`, 30000, 'info');
        let winCredentialResult = await gitRaw(projectPath, ['config', '--global', 'credential.helper', 'manager']);
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
                file.gitignore({'projectPath': projectPath});
            } else {
                gitignorePrompt = true;
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


/**
 * @description 获取git信息
 * @param {Object} projectPath
 */
async function gitInit(projectPath,projectName) {
    try{
        let status = await git(projectPath).init()
            .then(() => {
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 项目【${projectName}】 初始化Git存储库失败！`, errMsg);
                return 'fail';
            });
        return status
    } catch(e) {
        hx.window.showErrorMessage(`Git: 项目【${projectName}】初始化存储库异常！`, ['我知道了']);
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
                } else {
                    createOutputChannelForClone(data, false);
                };
            };
        });

        run.on('close', (code) => {
            if (code == 0) {
                resolve('success');
            } else {
                reject('fail');
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
            let t = '-b ' + branch;
            options.push(t);
        };
        options.push(repo);
        options.push(localPath);

        createOutputChannelForClone(`开始克隆 ${projectName}！\n`, false);
        createOutputChannelForClone(`备注1：克隆进度跟项目大小、网络有关，需要一定时间，请不要重复点击【克隆】按钮。`, false);
        createOutputChannelForClone(`备注2：克隆成功后，会自动将克隆项目，加入到HBuilderX项目管理器。\n`, false);

        let status = await runGitClone(options)
        if (status == 'success') {
            createOutputChannelForClone(`克隆成功。本地路径: ${localPath}`, false);
        } else {
            createOutputChannelForClone('Git: 克隆失败，请参考: https://ext.dcloud.net.cn/plugin?id=2475', false);
        };
        return status
    } catch(e) {
        createOutputChannelForClone('克隆仓库异常' + e, false);
        return 'error';
    };
};

/**
 * @description 获取文件状态
 * @param {Object} workingDir
 * @param {Object} options
 */
async function gitFileStatus(workingDir, options) {
    try {
        let statusSummary = await git(workingDir)
            .status(options)
            .then( (res) => {
                return res['files'][0];
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
 * @description 获取git信息
 * @param {Object} projectPath
 */
async function gitStatus(workingDir) {
    let result = {
        'gitEnvironment': true,
        'isGit': false,
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
        let files = statusSummary.files;

        // 合并更改（冲突）
        let conflicted = statusSummary.conflicted ? statusSummary.conflicted : [];
        let conflicted_list = [];
        if (conflicted.length) {
            for (let c of files) {
                if (conflicted.includes(c.path)) {
                    if (c.index != ' ' && c.working_dir == 'D') {
                        conflicted_list.push({'path': c.path, 'tag': 'D'});
                    } else {
                        conflicted_list.push({'path': c.path, 'tag': 'C'});
                    }
                };
            };
        };
        result.FileResult.conflicted = conflicted_list;

        // 暂存的变更
        let staged = statusSummary.staged ? statusSummary.staged : [];
        let staged_list = [];
        if (files.length && files != undefined) {
            let tmp3 = [...conflicted];
            for (let s1 of files) {
                if ((!tmp3.includes(s1.path) || staged.includes(s1.path)) && (s1.index != ' ' && s1.index != '?')) {
                    let tag = s1.index != ' ' && s1.working_dir != ' ' ? s1.working_dir : s1.index;
                    staged_list.push({'path': s1.path, 'tag': tag});
                };
            };
        };
        result.FileResult.staged = staged_list;

        // 更改(未暂存)
        let not_staged_list = [];
        if (files.length && files != undefined) {
            let tmp = [...conflicted];
            for (let s of files) {
               if ( !tmp.includes(s.path) && (['M', 'A', 'R', 'D','?', '!'].includes(s.working_dir) && s.working_dir != ' ')) {
                    not_staged_list.push({'path': s.path, 'tag': s.working_dir});
               };
           };
        };
        result.FileResult.notStaged = not_staged_list;
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
        let status = await git(workingDir).init()
            .commit(commitComment)
            .push()
            .then(() => {
                hx.window.setStatusBarMessage('Git: commit 和 push操作执行成功！', 10000, 'info');
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
                createOutputChannel(title, errMsg);
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
        let status = await git(workingDir).init()
            .add(files)
            .then(() => {
                hx.window.setStatusBarMessage('Git: 成功添加文件到暂存区。', 3000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: ${files} add失败`, errMsg);
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
        let status = await git(workingDir).init()
            .commit(comment)
            .then(() => {
                hx.window.setStatusBarMessage('Git: commit success', 3000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel('Git: commit失败', errMsg);
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
    // status bar show message
    hx.window.setStatusBarMessage('Git: commit...');
    try {
        let status = await git(workingDir).init()
            .add('*')
            .commit(commitComment)
            .then((res) => {
                hx.window.setStatusBarMessage('Git: commit成功', 3000, 'info');
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel('Git: add and commit失败', errMsg);
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
    hx.window.setStatusBarMessage(`Git: 正在向远端推送.....`, 30000, 'info');
    try {
        let checkResult = await checkGitCredentials(workingDir);
        let status = await git(workingDir).init()
            .push(options)
            .then((result) => {
                hx.window.clearStatusBarMessage();
                let pushResult = result.pushed;
                if (JSON.stringify(pushResult) === '[]') {
                    hx.window.setStatusBarMessage('Git: push操作成功', 30000, 'info');
                    voiceSay('push.success')
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
                        ? "方法2：Mac, 打开钥匙串，清除此Git仓库的账号密码信息。"
                        : "方法2：windows, 打开控制面板 -> 用户账户 -> 管理windows凭据，在【普通凭据】列表中，删除此Git仓库的账号密码信息。";
                    errMsg = errMsg + "\n" + "原因：账号密码错误，如是使用账号密码方式（非SSH KEY）登录Git，可通过以下方法解决。\n"
                        + "方法1：打开终端，进入此项目，执行git push，此时输入正确的账号密码。\n"
                        + osErrorMsg;
                };
                createOutputChannel(title, errMsg);
                return 'fail';
            });
        return status
    } catch (e) {
        return 'error';
    }
};


/**
 * @description git: pull
 * @param {String} projectPath 项目路径
 */
async function gitPull(workingDir,options) {
    let args = [];
    let msg = 'Git: git pull 正在从服务器拉取代码...';

    let {rebase} = options;
    if (rebase) {
        args.push(['--rebase'])
        msg = 'Git: git pull --rebase 正在从服务器拉取代码...';
    };

    // status bar show message
    hx.window.setStatusBarMessage(msg, 10000,'info');

    try {
        let status = await git(workingDir).init()
            .pull(args)
            .then(() => {
                hx.window.setStatusBarMessage('Git: pull success', 3000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = (err).toString();
                createOutputChannel('Git: pull失败', errMsg);
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
 */
async function gitFetch(workingDir) {
    // status bar show message
    hx.window.setStatusBarMessage(`Git: 正在同步信息 ......`);

    try {
        let status = await git(workingDir).init()
            .fetch(['--all','--prune'])
            .then((res) => {
                hx.window.setStatusBarMessage('Git: Fetch success', 3000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel('Git: fetch失败', errMsg);
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
        let status = await git(workingDir).init()
            .reset(['HEAD', '--' ,filename])
            .then(() => {
                hx.window.setStatusBarMessage('Git: 取消暂存成功', 3000, 'info');
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: ${filename}取消暂存失败`, errMsg);
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
    try {
        let status = await git(workingDir).init()
            .reset(options)
            .then(() => {
                hx.window.setStatusBarMessage(msg + '成功', 5000, 'info');
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(msg + '失败', errMsg);
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
async function gitCheckoutFile(workingDir, filename) {
    // status bar show message
    hx.window.setStatusBarMessage(`Git: ${filename} 正在撤销对文件的修改!`,2000,'info');

    let args = ['--', filename]
    if (filename == 'all') {
        args = ['.']
    };
    try {
        let status = await git(workingDir).init()
            .checkout(args)
            .then(() => {
                hx.window.setStatusBarMessage(`Git: ${filename} 成功撤销修改!`, 3000, 'info');
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: ${filename} 撤销修改操作失败。`, errMsg);
                return 'fail';
            });
        return status;
    } catch (e) {
        return 'error';
    }
};


/**
 * @description 分支操作
 */
async function gitBranch(workingDir, options='-avvv') {
    let local = [];
    let remote = [];
    try {
        let status = await git(workingDir).init()
            .branch(options)
            .then((info) => {
                let branches = info.branches;
                for (let s in branches) {
                    let name = branches[s].name;
                    if (name.startsWith('remotes/origin/')) {
                        let tmp = info.branches[s];
                        tmp.name = name.replace('remotes/', '');
                        remote.push(tmp);
                    } else {
                        local.push(info.branches[s]);
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
 * @param {Object} commands
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
        let status = await git(workingDir).init()
            .branch()
            .then((info) => {
                let currentbranchName = '';
                for (let s in info.branches) {
                    if ((info.branches[s]).current) {
                        currentbranchName = (info.branches[s]).name;
                        break;
                    };
                }
                return currentbranchName;
            })
            .catch((err) => {
                hx.window.setStatusBarMessage('Git: 获取当前分支信息失败', 3000, 'error');
                return false;
            });
        return status;
    } catch (e) {
        return false;
    }
};

/**
 * @description 分支切换
 */
async function gitBranchSwitch(workingDir,branchName) {
    try {
        let status = await git(workingDir).init()
            .checkout([branchName])
            .then(() => {
                hx.window.setStatusBarMessage(`Git: 分支切换成功, 当前分支是 ${branchName}`, 3000, 'info');
                voiceSay(`branch.switch.success`, `当前分支是 ${branchName}`);
                return 'success';
            })
            .catch((err) => {
                let errMsg = (err).toString();
                createOutputChannel(`Git: 分支${branchName}切换失败!`, errMsg);
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
        let status = await git(workingDir).init()
            .branch(['-D',branchName])
            .then(() => {
                hx.window.setStatusBarMessage('Git: 本地分支强制删除成功!', 3000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 本地分支${branchName}强制删除失败!`, errMsg);
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
        let status = await git(workingDir).init()
            .push(['origin', '--delete', branchName])
            .then(() => {
                setTimeout(function() {
                    hx.window.setStatusBarMessage(`Git: 远程分支${branchName}删除成功!`, 30000, 'info');
                },2000);
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 远程分支${branchName}删除失败!`, errMsg);
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
            let status = await git(projectPath).init()
                .checkout(args)
                .push(["--set-upstream","origin",newBranchName])
                .then(() => {
                    hx.window.setStatusBarMessage(`Git: ${newBranchName} 新分支创建成功`, 30000, 'info');
                    return 'success';
                })
                .catch((err) => {
                    let errMsg = "\n" + (err).toString();
                    createOutputChannel(`Git: 分支${newBranchName}创建失败`, errMsg);
                    return 'fail';
                });
            return status;
        } catch (e) {
            return 'error';
        }
    } else {
        try {
            let status = await git(projectPath).init()
                .checkout(args)
                .then(() => {
                    hx.window.setStatusBarMessage(`Git: ${newBranchName} 新分支创建成功`, 30000, 'info');
                    return 'success';
                })
                .catch((err) => {
                    let errMsg = "\n" + (err).toString();
                    createOutputChannel(`Git: 分支${newBranchName}创建失败`, errMsg);
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
        let status = await git(workingDir).init()
            .push(['--set-upstream', 'origin', branchName])
            .then(() => {
                setTimeout(function() {
                    hx.window.setStatusBarMessage(`Git: ${branchName}推送远端成功!`, 30000, 'info');
                },2000);
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 分支${branchName} push远端失败`, errMsg);
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
        let status = await git(workingDir).init()
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
                createOutputChannel(`Git: 分支${branchName} 创建、推送分支失败`, errMsg);
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
        let status = await git(workingDir).init()
            .mergeFromTo(fromBranch,toBranch)
            .then((res) => {
                hx.window.setStatusBarMessage(`Git: 分支${toBranch}，合并${fromBranch}的代码，合并成功！在命令面板中，可取消合并。`, 10000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = (err).toString();
                createOutputChannel(`Git: 分支合并失败, 请根据控制台提示手动处理。`, errMsg);
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
        let status = await git(workingDir).init()
            .tags()
            .then((res) => {
                tagsList.data = res.all;
            })
            .catch((err) => {
                tagsList.error = true;
                let errMsg = (err).toString();
                createOutputChannel(`Git: tag获取失败`, errMsg);
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
        let status = await git(workingDir).init()
            .tag(tagOptions)
            .then(() => {
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n" + (err).toString();
                createOutputChannel(`Git: 标签 ${tagName} 创建失败!`, errMsg);
                return 'fail';
            });
        return status;
    } catch (e) {
        console.log(e)
        return 'error';
    }
};


/**
 * @description clean
 */
async function gitClean(workingDir) {
    let cleanMsg = 'Git: 确认删除当前所有未跟踪的文件，删除后无法恢复。';
    let isDeleteBtn = await hx.window.showInformationMessage(cleanMsg, ['删除','关闭']).then((result) =>{
        return result;
    });
    if (isDeleteBtn == '关闭') {
        return;
    };

    try {
        hx.window.setStatusBarMessage('Git: 开始删除本地未跟踪的文件', 2000, 'info');
        let status = await git(workingDir).init()
            .clean('f',['-d'])
            .then(() => {
                hx.window.setStatusBarMessage(`Git: 成功删除未跟踪的文件`, 5000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n" + (err).toString();
                createOutputChannel(`Git: 删除未跟踪的文件失败`, errMsg);
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
        let status = await git(workingDir).init()
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
                    createOutputChannel(`Git: 配置文件如下:`,Msg);
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
 * @description 获取log
 * @param {Object} workingDir
 * @param {String} searchType 搜索类型 (all|branch)
 * @param {String} filterCondition 过滤条件，逗号分割
 * @param {String} refname 特定的本地分支、远程分支、tag名称
 */
async function gitLog(workingDir, searchType, filterCondition, refname) {
    filter = ['-n 50']
    if (filterCondition != 'default') {
        if (filterCondition.includes('-n')) {
            filter = filterCondition.split(',');
        } else {
            let tmp = filterCondition.split(',');
            filter = [...filter, ...tmp]
        };
    };
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
            result.errorMsg = '无法获取项目路径，git log执行失败。请关闭当前Git日志视图后重试。';
            result.success = false;
            return result;
        };

        let status = await git(workingDir).init()
            .log(filter)
            .then((res) => {
                let data = res.all;
                result.data = data
                return result;
            })
            .catch((err) => {
                result.errorMsg = err.message;
                result.success = false;
                return result;
            });
        return result;
    } catch (e) {
        result.errorMsg = e;
        result.success = false;
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
        let status = await git(projectPath).init()
            .stash(options)
            .then((res) => {
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
                createOutputChannel(msg + '操作失败！', err);
                return 'fail';
            });
        return status;
    } catch (e) {
        createOutputChannel(msg + ', 插件运行异常', e);
        return 'error';
    };
};

/**
 * @description 弹出储藏列表
 */
async function gitStashList(workingDir) {
    try {
        let status = await git(workingDir).init()
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
        createOutputChannel('Git: 获取储藏列表失败, 插件运行异常', e);
        return 'error';
    };
};

/**
 * @description 设置config
 */
async function gitConfigSet(workingDir, data) {
    try {
        let {key, value} = data;
        let status = await git(workingDir).init()
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
        createOutputChannel('Git: 设置失败, 插件运行异常', e);
        return 'error';
    };
};

/**
 * @description add remote
 */
async function gitAddRemote(workingDir, url) {
    try {
        let status = await git(workingDir).init()
            .addRemote('origin', url)
            .then((res) => {
                hx.window.setStatusBarMessage(`Git: 操作成功。`, 5000, 'info');
                return 'success';
            })
            .catch((err) => {
                createOutputChannel('Git: 操作失败', err);
                return 'fail';
            });
        return status;
    } catch (e) {
        createOutputChannel('Git: 操作失败，插件运行异常。', e);
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
                    hx.window.setStatusBarMessage(`Git: ${msg} 操作成功。`, 5000, 'info');
                };
                if (resultType != 'statusCode') {
                    return res;
                } else {
                    return 'success';
                };
            })
            .catch((err) => {
                if (msg != undefined) {
                    createOutputChannel(`Git: ${msg} 操作失败。`, err);
                }
                return 'fail';
            });
        return status;
    } catch (e) {
        if (msg != undefined) {
            createOutputChannel(`Git: ${msg} 操作失败，插件运行异常。`, e);
        }
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
                createOutputChannel(`Git: ${commands} 操作失败。`, err);
                return 'fail';
            });
        return status;
    } catch (e) {
        createOutputChannel(`Git: ${commands} 操作失败，插件运行异常。`, e);
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
        let status = await git(workingDir).init()
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
 * @description 关联远程仓库
 * @param {Object} projectPath
 */
async function gitAddRemoteOrigin(projectPath) {
    let originUrl = await hx.window.showInputBox({
        prompt:"Git远程仓库地址",
        placeHolder: "必填"
    }).then((result)=>{
        return result
    });
    let reg = /^(https:\/\/|http:\/\/|git@)/g;
    if (reg.test(originUrl)) {
        let commands = ['remote', 'add', 'origin', originUrl];
        let rResult = await gitRaw(projectPath, commands, '关联远程仓库', 'statusCode');
        return rResult;
    } else {
        hx.window.showErrorMessage('EasyGit: 远程仓库地址无效。如还需要进行关联，请在源代码管理器底部操作。', ['我知道了']);
        return 'fail';
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

    async readFile(mergeMsgPath) {
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
                createOutputChannel(`Git: ${commands} 操作失败。`, err);
                return 'fail';
            });
        return status;
    } catch (e) {
        createOutputChannel(`Git: ${commands} 操作失败，插件运行异常。`, e);
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
        let branches = await gitBranch(workingDir);
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
}


module.exports = {
    createOutputChannel,
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
    gitClone,
    gitStatus,
    gitFileStatus,
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
    gitBranch,
    gitRawGetBranch,
    gitCurrentBranchName,
    gitBranchSwitch,
    gitBranchCreate,
    gitDeleteLocalBranch,
    gitDeleteRemoteBranch,
    gitLocalBranchToRemote,
    gitBranchCreatePush,
    gitBranchMerge,
    gitTagsList,
    gitTagCreate,
    gitClean,
    gitConfigShow,
    gitConfigSet,
    gitRemoteshowOrigin,
    gitLog,
    gitStash,
    gitStashList,
    gitAddRemote,
    gitRaw,
    gitCherryPick,
    FillCommitMessage,
    gitRevert,
    gitRefs
}
