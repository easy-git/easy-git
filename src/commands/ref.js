const hx = require('hbuilderx');
const path = require('path');
const dayjs = require('dayjs');

const {
    gitRaw,
    createOutputChannel,
    gitTagCreate,
    gitPush,
    gitBranch,
    gitBranchMerge,
    gitBranchSwitch,
    gitCurrentBranchName,
    gitLocalBranchToRemote,
    gitDeleteRemoteBranch,
    gitDeleteLocalBranch,
    gitLog,
    gitCherryPick,
    gitRevert,
    gitReset,
    gitRefs
} = require('../common/utils.js');

/**
 * @description get log
 * @param {Object} projectPath
 */
async function getProjectLogs(projectPath, isAll='branch') {
    let Logs = await gitLog(projectPath, isAll, 'default');
    let {success} = Logs;

    let data = [];
    if (success && success != undefined) {
        for (let s of Logs.data) {
            let shortHash = s.hash.slice(0,12);
            let date = dayjs(s.date).format('YY/MM/DD HH:mm:ss');
            data.push({
                "label": date + ' - ' + shortHash,
                "description": s.message,
                "hash": s.hash
            });
        };
    };
    return data;
};


/**
 * @description Tag操作
 */
class Tag {
    constructor(projectPath) {
        this.projectPath = projectPath;
    }

    // Git: git show <tag-name>
    async showDetails(tagName) {
        if (tagName.length == 0) {
            return hx.window.showErrorMessage('tag名称无效。',['关闭']);
        };
        let options = [ 'show', '-s', '--format=medium', tagName ]
        let details = await gitRaw(this.projectPath, options, undefined, 'result');
        if (details) {
            createOutputChannel(`Git: ${tagName} 标签详情如下: `, details);
        };
    }

    // Git: git tag <tag-name>
    async create(hash=null, param=null) {
        let titleLabel = '当前代码';
        if (hash != null && hash != undefined) {
            titleLabel = hash.slice(0,12);
        };
        let tagName = await hx.window.showInputBox({
            prompt:`在${titleLabel}上创建标签`,
            placeHolder: '标签名称，必填'
        }).then((result)=>{
            if (result.length == 0) {
                hx.window.showErrorMessage('请输入有效的标签名称', ['我知道了']);
                return;
            };
            return result;
        });
        if (tagName.length) {
            let options = hash == null ? [tagName] : [tagName, hash];
            let status = await gitTagCreate(this.projectPath, options, tagName);
            if (status == 'success') {
                hx.window.showInformationMessage(`Git: 在${titleLabel}上创建标签成功！`, ['立即推送到远端','以后再说']).then( (result)=> {
                    if (result == '立即推送到远端') {
                        gitPush(this.projectPath, ['origin', tagName]);
                    }
                });
                if (param != null && JSON.stringify(param) != '{}') {
                    hx.commands.executeCommand('EasyGit.branch', param);
                };
            }
        }
    }
};


/**
 * @description 分支操作
 */
class Branch {
    constructor() {
        this.currentBranch = '';
    }

    // Git: get project all branchs
    async getAllBranch(projectPath, type) {
        let { localBranchList, remoteBranchList } = await gitBranch(projectPath, ['-avvv']);

        let branchs = [...localBranchList];
        if (type == 'all') {
            branchs = [...localBranchList, ...remoteBranchList];
        };

        let data = [];
        for (let s of branchs) {
            if (s.current) {
                this.currentBranch = s.name;
                continue;
            } ;
            data.push({'label': s.name, 'description': s.label});
        };
        return data;
    }

    // Git: git checkout <branch-name>
    async switchBranch(ProjectInfo) {
        let { projectPath } = ProjectInfo;
        let branchs = await this.getAllBranch(projectPath, 'local');

        let data = [...[{"label": "切换到之前的分支"}], ...branchs];
        let selected = await hx.window.showQuickPick(data, {
            'placeHolder': '请选择要切换的分支名称'
        }).then( (res)=> {
            return res.label;
        });

        if (selected == undefined && !selected) { return; };
        if (selected == '切换到之前的分支') { selected = '-' };

        let switchResult = await gitBranchSwitch(projectPath, selected);
        if (switchResult) {
            ProjectInfo.easyGitInner = true;
            hx.commands.executeCommand('EasyGit.main', ProjectInfo);
        };
    }

    // Git: git merge <branch-name>
    async merge(ProjectInfo) {
        let { projectPath } = ProjectInfo;
        let branchs = await this.getAllBranch(projectPath, 'local');

        let selected = await hx.window.showQuickPick(branchs, {
            'placeHolder': '请选择要合并的分支名称'
        }).then( (res)=> {
            return res.label;
        });
        if (selected == undefined && !selected) { return; };

        let mergeResult = await gitBranchMerge(projectPath, selected, this.currentBranch);
        if (mergeResult) {
            ProjectInfo.easyGitInner = true;
            hx.commands.executeCommand('EasyGit.main', ProjectInfo);
        };
        if (mergeResult == 'fail') {
            let that = this;
            setTimeout(function() {
                hx.window.showErrorMessage('EasyGit: 分支合并存在冲突，是否取消本次合并？', ['取消合并', '关闭']).then( (btn)=> {
                    if (btn == '取消合并') {
                        that.mergeAbort(ProjectInfo);
                    }
                })
            }, 2000);
        };
    }

    // Git: git merge --abort
    async mergeAbort(ProjectInfo) {
        let { projectPath } = ProjectInfo;
        let abortResult = await gitRaw(projectPath, ['merge', '--abort'], '取消分支合并 ');
        if (abortResult) {
            ProjectInfo.easyGitInner = true;
            hx.commands.executeCommand('EasyGit.main', ProjectInfo);
        };
    }

    // Git: git branch -D <branch-name>
    async del(ProjectInfo){
        let { projectPath } = ProjectInfo;
        let branchs = await this.getAllBranch(projectPath, 'all');

        let selected = await hx.window.showQuickPick(branchs, {
            'placeHolder': '请选择要删除的分支名称'
        }).then( (res)=> {
            return res.label;
        });

        if (selected == undefined && !selected) { return; };

        let delResult;
        if (selected.startsWith('origin/')) {
            delResult = await gitDeleteRemoteBranch(projectPath, selected);
        } else {
            delResult = await gitDeleteLocalBranch(projectPath, selected);
        };
        if (delResult) {
            ProjectInfo.easyGitInner = true;
            hx.commands.executeCommand('EasyGit.branch', ProjectInfo);
        };
    };

    // Git: git push --set-upstream origin master
    async LocalBranchToRemote(ProjectInfo) {
        let { projectPath } = ProjectInfo;
        let currentBranch = await gitCurrentBranchName(projectPath);
        if (currentBranch.length == 0) {
            currentBranch = 'master';
        };
        let btn = await hx.window.showInformationMessage(`Git: 将设置本地分支追踪远程分支 ${currentBranch} \n`, ['确定', '取消']).then((result) => {
            return result;
        });
        if (btn == '确定') {
            gitLocalBranchToRemote(this.projectPath, currentBranch);
        };
    }

    // Git: git cherry-pick <commit-id>
    async cherryPick(ProjectInfo) {
        let { projectPath, hash, actionSource } = ProjectInfo;

        if (hash == undefined || hash == '') {
            let data = await getProjectLogs(projectPath, 'all');
            let selected = await hx.window.showQuickPick(data, {
                'placeHolder': '请选择要cherry-Pick的commit......'
            }).then( (res)=> {
                return res;
            });

            hash = selected.hash;
        };

        if (hash == undefined) { return; };

        let cmd = ['cherry-pick', '-x', hash];
        let cherryPickResult = await gitCherryPick(projectPath, cmd);

        ProjectInfo.easyGitInner = true;

        if (cherryPickResult == 'error') {
            return;
        } else if ( ['conflicts', 'fail'].includes(cherryPickResult)) {
            // 刷新源代码管理器
            setTimeout(function() {
                hx.commands.executeCommand('EasyGit.main',ProjectInfo);
            }, 1000);

            let btn = await hx.window.showInformationMessage('Git: cherry-pick操作过程中，出现异常或代码冲突。 请选择要进行的操作。\n', ['放弃合并', '退出CheryPick', '我知道了']).then((result) => {
                return result;
            });
            if (btn == '我知道了') { return; };
            if (btn == '退出CheryPick') {
                await gitCherryPick(projectPath, ['cherry-pick', '--quit']);
            } else if (btn == '放弃合并') {
                await gitCherryPick(projectPath, ['cherry-pick', '--abort']);
            };
            // 刷新视图
            hx.commands.executeCommand('EasyGit.main', ProjectInfo);
        } else {
            hx.commands.executeCommand('EasyGit.main', ProjectInfo);
            let bResult = await hx.window.showInformationMessage('Git: cherry-pick 操作成功！', ['现在push','以后push' ,'关闭']).then((result) => {
                return result
            });
            if (bResult == '现在push') {
                hx.commands.executeCommand('EasyGit.push', ProjectInfo);
                setTimeout(function() {
                    hx.commands.executeCommand('EasyGit.main', ProjectInfo);
                }, 1200);
            };
        };
    };
}


/**
 * @description Git Revert
 */
class Revert {
    constructor(arg) {
    }

    async run(ProjectInfo) {
        let { projectPath, hash, isFromGitView } = ProjectInfo;
        ProjectInfo.easyGitInner = true;

        if (hash == undefined || hash == '') {
            let data = await getProjectLogs(projectPath);
            let selected = await hx.window.showQuickPick(data, {
                'placeHolder': '请选择要还原撤销的commit......'
            }).then( (res)=> {
                return res;
            });
            hash = selected.hash;
        };
        if (hash == undefined) { return; };

        let revertResult = await gitRevert(projectPath, ['revert', hash]);
        if ( revertResult == 'conflicts') {
            // 刷新源代码管理器
            setTimeout(function() {
                hx.commands.executeCommand('EasyGit.main',ProjectInfo);
            }, 1000);

            let btn = await hx.window.showInformationMessage('Git: revert操作过程中，出现代码冲突。 请选择要进行的操作。\n', ['放弃revert', 'skip', 'continue']).then((result) => {
                return result;
            });
            if (btn == 'skip') {
                await gitRevert(projectPath, ['revert', '--skip']);
            } else if (btn == '放弃revert') {
                await gitRevert(projectPath, ['revert', '--abort']);
            } else if (btn == 'continue') {
                await gitRevert(projectPath, ['revert', '--continue']);
            }
            // 刷新源代码管理器
            hx.commands.executeCommand('EasyGit.main',ProjectInfo);
        } else {
            hx.commands.executeCommand('EasyGit.main',ProjectInfo);
        };
        return revertResult;
    }
}


/**
 * @description Git Reset
 */
class Reset {
    constructor(arg) {
    }

    // Git: git reset --soft HEAD^
    async resetSoftLastCommit(ProjectInfo) {
        let { projectPath } = ProjectInfo;

        let git_options = ['--soft', 'HEAD^'];
        let runResult = await gitReset(projectPath, git_options, 'Git: 插销上次commit');
        if (runResult == 'success') {
            ProjectInfo.easyGitInner = true;
            hx.commands.executeCommand('EasyGit.main',ProjectInfo);
        };
    }

    // Git: git reset --hard HEAD^
    async resetHardLastCommit(ProjectInfo) {
        let { projectPath } = ProjectInfo;

        let options = ['--hard', 'HEAD^'];
        let runResult = await gitReset(projectPath, options, 'Git: 重置代码到上次提交');
        if (runResult == 'success') {
            ProjectInfo.easyGitInner = true;
            hx.commands.executeCommand('EasyGit.main',ProjectInfo);
        };
    }

    // Git: git reset --hard <commit-id>
    async resetHardCommitID(ProjectInfo) {
        let { projectPath } = ProjectInfo;

        let data = await getProjectLogs(projectPath);
        let selected = await hx.window.showQuickPick(data, {
            'placeHolder': '请选择要重置的 commit_id '
        }).then( (res)=> {
            return res;
        });
        if (selected == undefined) { return; };
        let hash = selected.hash;
        if (hash == undefined) { return; };

        let cmd = ["reset", "--hard", hash]
        let runResult = await gitReset(projectPath, cmd, `重置到代码 ${hash}`);
        if (runResult == 'success') {
            ProjectInfo.easyGitInner = true;
            hx.commands.executeCommand('EasyGit.main',ProjectInfo);
        };
    };
}


/**
 * @description Git archive
 */
class Archive {
    constructor(ProjectInfo) {
        this.ProjectInfo = ProjectInfo;
        this.initPickerData = [
            {
                "label": "打包当前分支",
                "name": "currentBranch"
            }, {
                "label": "打包某个分支或tag",
                "name": "refs"
            }, {
                "label": "打包某个commit",
                "name": "commitID"
            }
        ]
    }

    // 打包本地分支、远程分支、tags
    async ArchiveRefs(projectPath) {
        let refs = [];
        let info = await gitRefs(projectPath);
        let { localBranchList, remoteBranchList, tags } = info;

        if (localBranchList != undefined) {
            for (let s of localBranchList) {
                refs.push({"label": s.name});
            };
        };
        if (remoteBranchList != undefined) {
            for (let s of remoteBranchList) {
                refs.push({"label": s.name});
            };
        };
        if (tags != undefined) {
            for (let s of tags) {
                refs.push({"label": s});
            };
        };

        let pickerData = [{"label": "回到上一步操作"}, ...refs];
        return await hx.window.showQuickPick(pickerData, {
            placeHolder: "请选择您要打包的分支或tag, 默认打包为zip"
        }).then( (selected) => {
            if (selected.label == '回到上一步操作') {
                this.set();
            } else {
                return selected.label;
            };
        });
    }

    // 打包指定commit id
    async ArchiveCommitID(projectPath){
        let data = await getProjectLogs(projectPath, 'all');
        let pickerData = [
            {"label": "回到上一步操作", "hash": ""}, ...data
        ]
        return await hx.window.showQuickPick(pickerData, {
            'placeHolder': '请选择commit id...'
        }).then( (res)=> {
            if (res.hash == '') {
                this.set();
            } else {
                return res.hash;
            };
        });
    }

    // 运行打包命令
    async Run(projectPath, projectName, refName) {

        let fname = refName;
        if (fname.startsWith('origin/')) {
            fname = fname.replace(/\//g, '-');
        };
        let ArchiveDir = path.join(projectPath, projectName + '_' + fname + '.zip');
        let options = ['archive', '--format=zip', '--output', ArchiveDir, refName];

        let ArchiveResult = await gitRaw(projectPath, options, 'Git: 归档');
        if (ArchiveResult == 'success') {
            let success_msg = `Git: ${projectName} ${refName} 归档成功。`
            createOutputChannel(success_msg, '路径:' + ArchiveDir);
        } else {
            let fail_msg = `Git: ${projectName} ${refName} 归档失败。`
            createOutputChannel(fail_msg, '路径:' + ArchiveDir);
        };
    }

    async set() {
        let { projectPath, projectName, hash, isFromGitView } = this.ProjectInfo;

        let selected = await hx.window.showQuickPick(this.initPickerData, {
            'placeHolder': '请选择要打包的内容...'
        }).then( (res)=> {
            return res.name;
        });

        switch (selected){
            case 'currentBranch':
                let currentBranch = await gitCurrentBranchName(projectPath);
                if (currentBranch.length == 0) {
                    currentBranch = 'master';
                };
                this.Run(projectPath, projectName, currentBranch);
                break;
            case 'commitID':
                let hash = await this.ArchiveCommitID(projectPath);
                if (hash != '' && hash != undefined) {
                    this.Run(projectPath, projectName, hash);
                };
                break;
            case 'refs':
                let refName = await this.ArchiveRefs(projectPath);
                if (refName != '' && refName != undefined) {
                    this.Run(projectPath, projectName, refName);
                };
                break;
            default:
                break;
        };
    }
}

module.exports = {
    Tag,
    Branch,
    Revert,
    Reset,
    Archive
};
