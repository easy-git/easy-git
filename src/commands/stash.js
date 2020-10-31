const hx = require('hbuilderx');

const {
    gitStash,
    gitStashList,
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

module.exports = {
    goStash,
    goStashPop,
    goStashClear
}
