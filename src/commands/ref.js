const hx = require('hbuilderx');
const path = require('path');
const dayjs = require('dayjs');

const {
    gitRaw,
    gitTagsList,
    gitTagCreate,
    gitTagDelete,
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
    gitRefs,
    hxShowMessageBox,
    createOutputChannel,
    applyEdit,
    FileWriteAndOpen
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

    /**
     * @description 显示所有标签列表
     */
    async showTagsList() {
        let result = await gitTagsList(this.projectPath);

        let { error, data } = result;
        if (error == true) return;
        if (data.length == 0) {
            return hx.window.showErrorMessage('当前项目下，不存在标签。',['关闭']);
        } else {
            let pickData = data.map( item => { return {"label": item} } );
            let selected = await hx.window.showQuickPick(pickData, {
                placeHolder: "请选择您要操作的数据"
            }).then( (result) => {
                return result;
            });
            return selected;
        };
    };

    /**
     * @description 获取tag详情
     * @param {Object} tagName
     */
    async showDetails(tagName) {
        // 当tag=undefined, 显示所有tag列表，以便用户选择
        if (tagName == undefined) {
            let selectedTag = await this.showTagsList();
            if (selectedTag) {
                let { label } = selectedTag;
                return this.showDetails(label);
            };
        };

        if (tagName.length == 0) {
            return hx.window.showErrorMessage('tag名称无效。',['关闭']);
        };

        let options = [ 'show', '-s', '--format=medium', tagName ]
        let details = await gitRaw(this.projectPath, options, undefined, 'result');
        if (details) {
            createOutputChannel(`Git: ${tagName} 标签详情如下: `, details);
        };
    };

    /**
     * @description 创建标签
     */
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
                let desc = `标签 ${tagName} 创建成功！是否推送到远端？`;
                hxShowMessageBox('Git 标签', desc, ['立即推送到远端','以后再说']).then( (result)=> {
                    if (result == '立即推送到远端') {
                        gitPush(this.projectPath, ['origin', tagName]);
                    };
                });
                if (param != null && JSON.stringify(param) != '{}') {
                    hx.commands.executeCommand('EasyGit.branch', param);
                };
            };
        };
    };

    /**
     * @description 删除标签
     * @param {Object} param
     */
    async delete(tagName) {
        let tag;
        // 当tag=undefined, 显示所有tag列表，以便用户选择
        if (tagName == undefined) {
            let selectedTag = await this.showTagsList();
            if (selectedTag) {
                let { label } = selectedTag;
                tag = label;
            };
        };

        if (tag == undefined) return;

        let msg = `注意: 删除远端标签后，无法恢复。`;
        let btns = ['删除本地', '同时删除本地和远端', '关闭'];
        let selectedBtn = await hxShowMessageBox(`Git 删除标签 ${tag}`, msg , btns).then(btnText => {
            return btnText;
        });

        if (selectedBtn == '删除本地') {
            gitTagDelete(this.projectPath, tag);
        };
        if (selectedBtn == '同时删除本地和远端') {
            await gitTagDelete(this.projectPath, tag, true);
        };
    };

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

            let that = this;
            setTimeout(function() {
                let msg = `${that.currentBranch} 合并 ${selected} 分支成功，请选择接下来的操作？`;
                let btns = ['稍后推送', '立即推送'];
                if (mergeResult == 'conflicts') {
                    msg = `${that.currentBranch} 合并 ${selected} 分支，部分文件存在冲突，请选择接下来的操作？`;
                    btns = ['关闭', '取消合并', '去解决冲突']
                };
                if (mergeResult == 'fail') {
                    msg = `${that.currentBranch} 合并 ${selected} 分支，合并失败，请解决错误后，再进行合并。\n 错误信息，请查看控制台。`;
                    btns = ['好的', '关闭']
                };

                hxShowMessageBox('Git 分支合并', msg, btns).then(btnText => {
                    if (btnText == '取消合并') {
                        that.mergeAbort(ProjectInfo);
                    };
                    if (btnText == '立即推送') {
                        hx.commands.executeCommand('EasyGit.push', ProjectInfo);
                        setTimeout(function() {
                            hx.commands.executeCommand('EasyGit.main', ProjectInfo);
                        }, 1200);
                    };
                });
            }, 1000);
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

        let delMsg = `确定要删除 ${selected} 分支?`;
        let btn = await hxShowMessageBox('Git: 分支删除', delMsg, ['删除','关闭']).then((result) =>{
            return result;
        });
        if (btn == '删除') {
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
        let { projectPath, hash } = ProjectInfo;

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
            hx.window.showErrorMessage('Git: cherry-pick 操作异常，请手动排查错误！', ['我知道了'])
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

    // 查看另一个分支的文件内容
    async showAnotherBranchFile(data) {
        let {projectPath, selectedFile} = data;
        if (projectPath == undefined || selectedFile == undefined) {
            hx.window.showErrorMessage('EasyGit: 请选择有效的文件。', ['我知道了']);
            return;
        };

        let branchs = await this.getAllBranch(projectPath, 'local');
        let selectedBranch = await hx.window.showQuickPick(branchs, {
            'placeHolder': '请选择要查看文件内容的分支名称...'
        }).then( (res)=> {
            return res.label;
        });
        if (!selectedBranch) return;

        // 获取文件的相对路径
        let filename = path.relative(projectPath, selectedFile);
        let param = `${selectedBranch}:${filename}`;
        let fileDetails = await gitRaw(projectPath, ['show', param], undefined, 'result');
        if (fileDetails) {
            try{
                const basename = path.basename(filename);
                const fname = `temp_${selectedBranch}__${basename}`;
                FileWriteAndOpen(fname, fileDetails);
            } catch(e) {
                await hx.commands.executeCommand('workbench.action.files.newUntitledFile');
                applyEdit(fileDetails);
            };
        };
    }

};


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
};


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

    // Git: git reset --hard version
    async resetHard(ProjectInfo, version) {
        if (!["HEAD", "HEAD^"].includes(version)) {return};

        let { projectPath } = ProjectInfo;

        let options = ['--hard', version];
        let msg = version == 'HEAD' ? 'Git: 重置代码到当前版本' : 'Git: 重置代码到上个版本';

        let runResult = await gitReset(projectPath, options, msg);
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

        let cmd = ["--hard", hash];
        let runResult = await gitReset(projectPath, cmd, `重置到代码 ${hash}`);
        if (runResult == 'success') {
            ProjectInfo.easyGitInner = true;
            hx.commands.executeCommand('EasyGit.main',ProjectInfo);
        };
    };
};


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
        let { projectPath, projectName, hash } = this.ProjectInfo;

        let PickerData = this.initPickerData;

        // 日志视图：选中记录，右键菜单，点击【归档】
        if (hash != '' && hash != undefined) {
            let tmp = [{"label": `打包已选择的${hash}`, "name": hash}];
            PickerData = [...tmp, ...this.initPickerData];
        };

        let selected = await hx.window.showQuickPick(PickerData, {
            'placeHolder': '请选择要打包的内容...'
        }).then( (res)=> {
            return res.name;
        });

        if (selected == hash) {
            this.Run(projectPath, projectName, hash);
        };

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
};


/**
 * @description git reflog
 */
async function reflog(ProjectInfo) {
    let { projectPath } = ProjectInfo;
    let result = await gitRaw(projectPath, ['reflog'], 'reflog', 'result');
    if (result != undefined && result != '') {
        await hx.commands.executeCommand('workbench.action.files.newUntitledFile');
        applyEdit(result);
    } else {
        hx.window.showErrorMessage("Git: reflog没有获取到信息。", ['我知道了']);
    };
};


module.exports = {
    Tag,
    Branch,
    Revert,
    Reset,
    Archive,
    reflog
};
