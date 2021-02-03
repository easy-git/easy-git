const hx = require('hbuilderx');

const {
    gitInit,
    gitAddRemoteOrigin,
    gitConfigShow,
    createOutputChannel
} = require('../common/utils.js');
const { goSetEncoding } = require('./base.js');

/**
 * @description Git项目初始化; 初始化成功后，创建.gitignore文件, 并询问用户是否关联远程仓库
 * @param {Object} ProjectInfo 项目信息，即焦点在项目管理器、编辑器时，获取的文件信息
 */
async function gitInitProject(ProjectInfo) {
    let { projectPath, projectName } = ProjectInfo;

    let status = await gitInit(projectPath,projectName);
    if (status != 'success') {
        return;
    };

    // 获取配置
    let configData = await gitConfigShow(projectPath, false);

    // 检查是否设置user.name和user.email
    let gitUserName = configData['user.name'];
    let gitEmail = configData['user.email'];
    if (gitUserName == false || gitEmail == false) {
        createOutputChannel("当前仓库，未设置user.name或user.email。提交代码到Git远程仓库，必须设置用户名和邮箱。", "warning");
        createOutputChannel("如需设置，请在HBuilderX选中项目，点击顶部菜单【工具 -> easy-git -> 设置user.name】\n");
    };

    // 设置编码, 解决中文问题
    let i18n = configData['i18n.logoutputencoding'];
    if (!i18n) {
        goSetEncoding("core.quotepath", 'StatusBar');
        goSetEncoding("i18n.logoutputencoding", 'StatusBar');
    };

    // 打开源代码管理器
    ProjectInfo.easyGitInner = true;
    hx.commands.executeCommand('EasyGit.main', ProjectInfo);

    createOutputChannel("当前仓库，还未关联到远程仓库上, 请在弹窗输入框中输入仓库地址。如不需要关联远程仓库、或后期设置，请直接关闭弹窗。", "warning");
    createOutputChannel("新建仓库、及获取远程仓库地址，参考: https://easy-git.gitee.io/connecting/init\n")

    // 关联远程仓库
    let relationResult = await gitAddRemoteOrigin(projectPath);
    if (relationResult == 'success') {
        hx.commands.executeCommand('EasyGit.main', ProjectInfo);
    };
};


module.exports = {
    gitInitProject
}
