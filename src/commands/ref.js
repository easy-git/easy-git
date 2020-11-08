const hx = require('hbuilderx');

const {
    gitRaw,
    createOutputChannel,
    gitTagCreate,
    gitPush,
    gitBranch,
    gitBranchMerge,
    gitBranchSwitch,
    gitDeleteRemoteBranch,
    gitDeleteLocalBranch,
    gitLog,
    gitCherryPick,
    gitRevert
} = require('../common/utils.js');


class Tag {
    constructor(projectPath) {
        this.projectPath = projectPath;
    }

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


class Branch {
    constructor() {
        this.currentBranch = '';
    }

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

    async getProjectLogs(projectPath) {
        let Logs = await gitLog(projectPath, 'all', 'default');
        let {success} = Logs;

        let data = [];
        if (success && success != undefined) {
            for (let s of Logs.data) {
                let shortHash = s.hash.slice(0,12);
                data.push({
                    "label": shortHash,
                    "description": s.date + s.message,
                    "hash": s.hash
                });
            };
        };
        return data;
    }

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

    async mergeAbort(ProjectInfo) {
        let { projectPath } = ProjectInfo;
        let abortResult = await gitRaw(projectPath, ['merge', '--abort'], '取消分支合并 ');
        if (abortResult) {
            ProjectInfo.easyGitInner = true;
            hx.commands.executeCommand('EasyGit.main', ProjectInfo);
        };
    }

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
    }

    async cherryPick(ProjectInfo) {
        let { projectPath, hash } = ProjectInfo;

        if (hash == undefined || hash == '') {
            let data = await this.getProjectLogs(projectPath);
            let selected = await hx.window.showQuickPick(data, {
                'placeHolder': '请选择要应用的commit......'
            }).then( (res)=> {
                return res;
            });

            hash = selected.hash;
        };

        if (hash == undefined) { return; };

        let cmd = ['cherry-pick', '-x', hash];
        let cherryPickResult = await gitCherryPick(projectPath, cmd);
        if (cherryPickResult == 'fail' || cherryPickResult == 'error') {
            return;
        } else if ( cherryPickResult == 'conflicts') {
            // 刷新源代码管理器
            setTimeout(function() {
                ProjectInfo.easyGitInner = true;
                hx.commands.executeCommand('EasyGit.main',ProjectInfo);
            }, 1000);

            let btn = await hx.window.showInformationMessage('Git: cherry-pick操作过程中，出现代码冲突。 请选择要进行的操作。\n', ['放弃合并', '退出CheryPick', '我知道了']).then((result) => {
                return result;
            });
            if (btn == '我知道了') { return; };
            if (btn == '退出CheryPick') {
                await gitCherryPick(projectPath, ['cherry-pick', '--quit']);
            } else if (btn == '放弃合并') {
                await gitCherryPick(projectPath, ['cherry-pick', '--abort']);
            };
            // 刷新源代码管理器
            hx.commands.executeCommand('EasyGit.main',ProjectInfo);
        } else {
            hx.window.showInformationMessage('Git: cherry-pick 操作成功！', ['现在push','以后push' ,'关闭']).then((result) => {
                if (result == '现在push') {
                    hx.commands.executeCommand('EasyGit.push', ProjectInfo);
                };
                setTimeout(function() {
                    hx.commands.executeCommand('EasyGit.main',ProjectInfo);
                }, 1500);
            });
        };
    }
}


class Revert {
    constructor(arg) {

    }

    async getProjectLogs(projectPath) {
        let Logs = await gitLog(projectPath, 'branch', 'default');
        let {success} = Logs;

        let data = [];
        if (success && success != undefined) {
            for (let s of Logs.data) {
                let shortHash = s.hash.slice(0,12);
                data.push({
                    "label": shortHash,
                    "description": s.date + s.message,
                    "hash": s.hash
                });
            };
        };
        return data;
    }

    async run(ProjectInfo) {
        let { projectPath, hash } = ProjectInfo;

        if (hash == undefined || hash == '') {
            let data = await this.getProjectLogs(projectPath);
            let selected = await hx.window.showQuickPick(data, {
                'placeHolder': '请选择要还原撤销的commit......'
            }).then( (res)=> {
                return res;
            });
            hash = selected.hash;
        };
        if (hash == undefined) { return; };

        let revertResult = await gitRevert(projectPath, ['revert', hash])
        if ( revertResult == 'conflicts') {
            // 刷新源代码管理器
            setTimeout(function() {
                ProjectInfo.easyGitInner = true;
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
        };
        ProjectInfo.easyGitInner = true;
        hx.commands.executeCommand('EasyGit.main',ProjectInfo);
    }
}


module.exports = {
    Tag,
    Branch,
    Revert
};
