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
async function goStash(ProjectInfo, option) {
    ProjectInfo.easyGitInner = true;
    let isStashALL = option == '-a' ? true : false;

    let setInfo = await hx.window.showFormDialog({
        title: "Git Stash - 储藏",
        subtitle: "git stash 能够将所有未提交的修改保存至堆栈中，用于后续恢复当前工作目录",
        submitButtonText: "确定(&S)",
        cancelButtonText: "取消(&C)",
        width: 400,
        height: 210,
        validate: function(formData) {
            let {message} = formData;
            if (message.replace(/(^\s*)|(\s*$)/g, "") == '') {
                this.showError(`储藏消息不能为空！`);
                return false;
            };
            return true;
        },
        formItems:[
            {type: "input",name: "message",label: "储藏消息",placeholder: "必填，请输入储藏消息"},
            {type: "checkBox",name: "isAll",label: "是否储藏全部，包含未跟踪的文件", value: isStashALL},
            {type: "label",name: "blank_line_0",text: ""}
        ]
    }).then((res) => {
        return res;
    }).catch(error => {
        console.log(error);
    });

    if (!setInfo) return;
    let {message, isAll} = setInfo;

    if (message) {
        let options = ['save', message];
        if (isAll) {
            options = ['save', '-a', message]
        };
        await gitStash(ProjectInfo, options, "git stash 储藏");
    };
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
            {"label": "查看储藏的文件列表 - show stash@{n}", "actionId": "filelist"},
            {"label": "查看储藏的文件内容差异 - show stash@{n} -p", "actionId": "diff"},
            {"label": "应用储藏 - apply stash@{n}", "actionId": "apply"},
            {"label": "弹出储藏 - pop stash@{n}", "actionId": "pop"},
            {"label": "删除存储 - drop stash@{n}", "actionId": "drop"}
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
        } else if (actionId == "pop") {
            let cmd3 = ["stash", "pop", stashID];
            gitRaw(projectPath, cmd3, "弹出储藏", 'result');
        } else if (actionId == "apply") {
            let cmd4 = ["stash", "apply", stashID];
            gitRaw(projectPath, cmd4, "应用储藏", 'result');
        } else if (actionId == "drop") {
            let cmd5 = ["stash", "drop", stashID];
            gitRaw(projectPath, cmd5, '删除储藏', 'result');
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
