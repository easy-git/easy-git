const hx = require('hbuilderx');

const {
    gitStash,
    gitStashList,
    gitRaw,
    createOutputChannel,
    applyEdit
} = require('../common/utils.js');

/**
 * @description 储藏
 */
async function goStash(ProjectInfo, option, stashMsg) {
    let msg = option == '-a' ? '消息必填' : '消息选填';
    let inputResult = await hx.window.showInputBox({
        prompt: "stash - 储藏消息",
        placeHolder: msg
    }).then((result)=>{
        return result
    });

    ProjectInfo.easyGitInner = true;
    let options = [];
    if (inputResult != '' && inputResult) {
        if (option == '-a') {
            options = ['save', '-a', inputResult]
        } else {
            options = ['save', inputResult]
        };
    };
    gitStash(ProjectInfo, options, stashMsg);
};

/**
 * @description 弹出储藏
 */
async function goStashPop(ProjectInfo, isNew) {
    let {projectPath} = ProjectInfo;
    ProjectInfo.easyGitInner = true;

    if (isNew == 'isNew') {
        gitStash(ProjectInfo, ['pop'], 'Git: 弹出最新储藏');
    } else {
        let stashList = await gitStashList(projectPath);
        let stashAllList = stashList.all;

        let data = [];
        for (let i in stashAllList) {
            let line = stashAllList[i];
            data.push({
                'index': `stash@\{${i}\}`,
                'hash': line.hash,
                'date': line.date,
                'label': `stash@\{${i}\}` + ': ' + line.message
            });
        };

        hx.window.showQuickPick(data, {
            placeHolder: "请选择您要弹出的储藏.."
        }).then(function(result) {
            if (!result) {
                return;
            };
            let stashID = result.index;
            gitStash(ProjectInfo, ['pop', stashID], 'Git: 弹出储藏');
        });
    };
};

/**
 * @description 清除所有储藏
 */
async function goStashClear(ProjectInfo) {
    ProjectInfo.easyGitInner = true;
    hx.window.showErrorMessage('确定要删除所有储藏吗？\n一旦清除后无法恢复!',['确定','取消']).then((result) => {
        if (result == '确定') {
            gitStash(ProjectInfo, ['clear'], 'Git: 清除所有储藏');
        };
    });
};

/**
 * @description 查看储藏内容
 */
class goStashShow {
    constructor(ProjectInfo) {
        this.ProjectInfo = ProjectInfo;
    }

    async showStash(stashID) {
        let { projectPath } = this.ProjectInfo;

        let data = [
            {"label": "返回到上一个操作", "actionId": "back"},
            {"label": "查看储藏的文件列表", "actionId": "filelist"},
            {"label": "查看储藏的文件内容差异", "actionId": "diff"}
        ];

        let result = await hx.window.showQuickPick(data, {
            placeHolder: "请选择您接下来要进行的储藏操作"
        }).then(function(result) {
            return result;
        });

        let { actionId } = result;
        if (actionId == "back") {
            this.main();
        } else if (actionId == "filelist") {
            let cmd1 = ["stash", "show", stashID];
            let filelist = await gitRaw(projectPath, cmd1, undefined, 'result');
            if (filelist) {
                createOutputChannel(`Git: ${stashID} 文件列表如下:\n\n${filelist}`);
            };
        } else if (actionId == "diff") {
            let cmd2 = ["stash", "show", stashID, "-p"];
            let diffDetails = await gitRaw(projectPath, cmd2, undefined, 'result');
            if (diffDetails) {
                await hx.commands.executeCommand('workbench.action.files.newUntitledFile');
                applyEdit(diffDetails);
            };
        };
    }

    // 获取储藏列表
    async main() {
        let {projectPath} = this.ProjectInfo;
        if (projectPath == undefined) return;

        let stashList = await gitStashList(projectPath);
        let stashAllList = stashList.all;

        let data = [];
        for (let i in stashAllList) {
            let line = stashAllList[i];
            data.push({
                'index': `stash@\{${i}\}`,
                'hash': line.hash,
                'date': line.date,
                'label': `stash@\{${i}\}` + ': ' + line.message
            });
        };

        let result = await hx.window.showQuickPick(data, {
            placeHolder: "请选择您要查看的储藏"
        }).then(function(result) {
            return result;
        });

        let {index} = result;
        if (index) {
            let stashId = index;
            this.showStash(stashId);
        };
    }
};


module.exports = {
    goStash,
    goStashPop,
    goStashClear,
    goStashShow
}
