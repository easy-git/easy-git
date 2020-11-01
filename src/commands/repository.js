const hx = require('hbuilderx');

const { gitInit, gitAddRemoteOrigin } = require('../common/utils.js');

/**
 * @description Git项目初始化
 */
async function gitInitProject(ProjectInfo) {
    let {projectPath,projectName} = ProjectInfo;
    let status = await gitInit(projectPath,projectName);

    if (status == 'success') {
        ProjectInfo.easyGitInner = true;
        hx.commands.executeCommand('EasyGit.main', ProjectInfo);

        let btnSelect = await hx.window.showInformationMessage(
            `EasyGit: 项目【${projectName}】初始化存储库成功！当前仓库，还未关联到远程仓库上。\n`,
            ['关联远程仓库','关闭'],
        ).then( (result)=> {
            return result;
        });

        if (btnSelect == '关联远程仓库') {
            let relationResult = await gitAddRemoteOrigin(projectPath);
            if (relationResult == 'success') {
                hx.commands.executeCommand('EasyGit.main', ProjectInfo);
            };
        };
    };
};


module.exports = {
    gitInitProject
}
