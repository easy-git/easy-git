const fs = require('fs');
const os = require('os');
const path = require('path');
const {exec} = require('child_process');

const hx = require('hbuilderx');
const spawn = require('cross-spawn')
const ini = require('ini');

const gitRemoteOriginUrl = require('git-remote-origin-url');
const git = require('simple-git');
// const git = simpleGit();

/**
 * @description 背景颜色、输入框颜色、字体颜色、线条颜色
 */
function getThemeColor() {
    let config = hx.workspace.getConfiguration();
    let colorScheme = config.get('editor.colorScheme');

    // 背景颜色、输入框颜色、字体颜色、线条颜色
    let background, liHoverBackground,inputColor, inputLineColor, cursorColor, fontColor, lineColor, menuBackground;

    if (colorScheme == 'Monokai') {
        background = 'rgb(39,40,34)';
        inputColor = 'rgb(255,254,250)';
        inputLineColor = 'rgb(210,210,210)';
        cursorColor = 'rgb(255,255,255)';
        fontColor = 'rgb(179,182,166)';
        lineColor = 'rgb(23,23,23)';
        liHoverBackground = 'rgb(78,80,73)';
        menuBackground = 'rgb(83,83,83)';
    } else if (colorScheme == 'Atom One Dark') {
        background = 'rgb(40,44,53)';
        inputColor = 'rgb(255,254,250)';
        inputLineColor = 'rgb(81,140,255)';
        cursorColor = 'rgb(255,255,255)';
        fontColor = 'rgb(171,178,191)';
        lineColor = 'rgb(33,37,43)';
        liHoverBackground = 'rgb(44,47,55)';
        menuBackground = 'rgb(50,56,66)';
    } else {
        background = 'rgb(255,250,232)';
        inputColor = 'rgb(255,252,243)';
        inputLineColor = 'rgb(65,168,99)';
        cursorColor = 'rgb(0,0,0)';
        fontColor = '#333';
        lineColor = 'rgb(225,212,178)';
        liHoverBackground = 'rgb(224,237,211)';
        menuBackground = 'rgb(255,252,243)';
    };
    return {
        background,
        menuBackground,
        liHoverBackground,
        inputColor,
        inputLineColor,
        cursorColor,
        fontColor,
        lineColor
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
        const osName = os.platform();
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
 * @description 检查文件列表是否包含node_modules，并返回文件数量
 * @param {Object} GitStatusResult
 */
function checkNodeModulesFileList(GitStatusResult) {
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
 * @description 获取git信息
 * @param {Object} projectPath
 */
async function gitInit(projectPath,projectName) {
    try{
        let status = await git(projectPath).init()
            .then(() => {
                hx.window.showInformationMessage(`项目【${projectName}】初始化Git存储库成功！`,['好的']);
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 项目【${projectName}】 初始化Git存储库失败！`, errMsg);
                return 'fail';
            });
        return status
    } catch(e) {
        hx.window.showErrorMessage(`项目【${projectName}】初始化Git存储库异常！`, ['我知道了']);
        return 'error';
    }
};

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
        if (repo.includes('https://') || repo.includes('https//')) {
            repo = repo.replace(/(^http:\/\/|^https:\/\/)/, "");
        };
        repo = `http://${username}:${password}@${repo}`;
    };

    try{
        let options = []

        if (branch) {
            let t = '-b ' + branch;
            options.push(t);
        };

        createOutputChannelForClone(`开始克隆 ${projectName}！受网络影响，需要一定时间，请耐心等待。请不要重复点击【克隆】按钮。`, false);

        let status = await git()
            .clone(repo, localPath, options)
            .then((res) => {
                createOutputChannelForClone(`克隆成功。本地路径: ${localPath}`, false);
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannelForClone('Git: 克隆仓库失败！' + errMsg);
                createOutputChannelForClone('Git: 克隆失败，请参考: https://ext.dcloud.net.cn/plugin?id=2475', false);
                return 'fail';
            });
        return status
    } catch(e) {
        createOutputChannelForClone('克隆仓库异常' + e);
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
        'gitStatusResult': [],
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
        result.isGit = true;
        result.tracking = statusSummary.tracking
        // set branch info
        result.currentBranch = statusSummary.current;
        result.BranchTracking = statusSummary.tracking;
        result.ahead = statusSummary.ahead;
        result.behind = statusSummary.behind;
        result.gitStatusResult = JSON.stringify(statusSummary);
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
async function gitAddCommitPush(workingDir, commitComment) {
    let dir = path.join(workingDir, '*');

    // status bar show message
    hx.window.setStatusBarMessage('Git: 正在提交...');
    try {
        let status = await git(workingDir).init()
            .add(dir)
            .commit(commitComment)
            .push()
            .then(() => {
                hx.window.setStatusBarMessage('Git: 提交成功', 3000, 'info');
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel('Git: add -> commit -> push 失败', errMsg);
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
    hx.window.setStatusBarMessage('Git: 正在添加...');
    if (files == 'all') {
        files = './*'
    };
    try {
        let status = await git(workingDir).init()
            .add(files)
            .then(() => {
                hx.window.setStatusBarMessage('Git: 添加成功', 3000, 'info');
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
    hx.window.setStatusBarMessage(`Git: 正在向远端推送......`, 2000, 'info');
    try {
        let status = await git(workingDir).init()
            .push(options)
            .then(() => {
                hx.window.setStatusBarMessage('Git: push success', 3000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n" + (err).toString();
                createOutputChannel('Git: push操作失败', errMsg);
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
                let errMsg = "\n\n" + (err).toString();
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
async function gitCheckout(workingDir, filename) {
    // status bar show message
    hx.window.setStatusBarMessage(`Git: ${filename} 正在撤销对文件的修改`,2000,'info');

    let args = ['--', filename]
    if (filename == 'all') {
        args = ['.']
    };
    try {
        let status = await git(workingDir).init()
            .checkout(args)
            .then(() => {
                hx.window.setStatusBarMessage('Git: 操作成功', 3000, 'info');
                return 'success'
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: ${filename} 操作失败`, errMsg);
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
async function gitBranch(workingDir) {
    try {
        let status = await git(workingDir).init()
            .branch(['-avv'])
            .then((info) => {
                let branchs = [];
                for (let s in info.branches) {
                    branchs.push(info.branches[s]);
                }
                return branchs;
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: ${workingDir} 查看分支信息失败'`, errMsg);
                return 'fail';
            });
        return status;
    } catch (e) {
        return 'error';
    }
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
                hx.window.setStatusBarMessage('Git: 分支切换成功', 3000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 分支${branchName}切换失败`, errMsg);
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
                hx.window.setStatusBarMessage('Git: 本地分支强制删除成功 !', 3000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 本地分支${branchName}强制删除失败`, errMsg);
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
    hx.window.setStatusBarMessage(`Git: 正在对 ${branchName} 远程分支进行删除，请耐心等待!`, 5000, 'info');

    try {
        branchName = await branchName.replace('remotes/origin/','');
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
                .push(["origin",HEAD])
                .then(() => {
                    hx.window.setStatusBarMessage(`Git: ${newBranchName} 新分支创建成功`, 30000, 'info');
                    return 'success';
                })
                .catch((err) => {
                    let errMsg = "\n\n" + (err).toString();
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
                    let errMsg = "\n\n" + (err).toString();
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
                let errMsg = "\n\n" + (err).toString();
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
    hx.window.setStatusBarMessage('Git: 正在进行合并...', 3000, 'info');

    try {
        let status = await git(workingDir).init()
            .mergeFromTo(fromBranch,toBranch)
            .then((res) => {
                let Msg = "\n\n" + (res).toString();
                createOutputChannel(`Git: 分支合并`, Msg);
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 分支合并失败`, errMsg);
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
                return 'success';
            })
            .catch((err) => {
                tagsList.error = true;
                let errMsg = "\n\n" + (err).toString();
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
async function gitTagCreate(workingDir,tagName) {
    // status bar show message
    hx.window.setStatusBarMessage('Git: 正在当前分支上创建标签..., 创建后会自动推送到远端。', 2000, 'info');

    try {
        let status = await git(workingDir).init()
            .tag([tagName])
            .push(['origin',tagName])
            .then(() => {
                hx.window.setStatusBarMessage(`Git: 标签 ${tagName} 创建成功`, 5000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 标签${tagName}创建失败`, errMsg);
                return 'fail';
            });
        return status;
    } catch (e) {
        return 'error';
    }
};


/**
 * @description clean
 */
async function gitClean(workingDir) {
    // status bar show message
    hx.window.setStatusBarMessage('Git: 开始删除本地未跟踪的文件', 2000, 'info');

    try {
        let status = await git(workingDir).init()
            .clean('f',['-d'])
            .then(() => {
                hx.window.setStatusBarMessage(`Git: 成功删除未跟踪的文件`, 5000, 'info');
                return 'success';
            })
            .catch((err) => {
                let errMsg = "\n\n" + (err).toString();
                createOutputChannel(`Git: 删除未跟踪的文件失败`, errMsg);
                return 'fail';
            });
        return status;
    } catch (e) {
        return 'error';
    }
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
 */
async function gitLog(workingDir, searchType, filterCondition) {
    filter = ['-n 100']
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
        filter.push('--all')
    };

    try {
        let result = {
            "success": true,
            "errorMsg": '',
            "data": []
        }
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
                hx.window.setStatusBarMessage(msg + '成功', 5000, 'info');
                hx.commands.executeCommand('EasyGit.main', projectInfo);
                return 'success';
            })
            .catch((err) => {
                createOutputChannel(msg + '失败', err);
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

module.exports = {
    isGitInstalled,
    getHBuilderXiniConfig,
    getThemeColor,
    importProjectToExplorer,
    getFilesExplorerProjectInfo,
    checkNodeModulesFileList,
    gitInit,
    gitClone,
    gitStatus,
    gitAdd,
    gitAddCommit,
    gitAddCommitPush,
    gitCancelAdd,
    gitCommit,
    gitReset,
    gitPush,
    gitPull,
    gitFetch,
    gitCheckout,
    gitDiffFile,
    gitBranch,
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
    gitAddRemote
}
