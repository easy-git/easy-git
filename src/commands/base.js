const hx = require('hbuilderx');

const {
    gitConfigSet,
    gitRaw,
    applyEdit
} = require('../common/utils.js');


/**
 * @description 设置config
 */
async function goSetConfig(projectPath, action_name) {
    let prompt = '';
    let key = '';
    if (action_name == 'setUserName') {
        prompt = '设置user.name';
        key = 'user.name';
    }
    if (action_name == 'setEmail') {
        prompt = '设置user.email';
        key = 'user.email';
    };

    let inputResult = await hx.window.showInputBox({
        prompt: prompt,
        placeHolder: "必填"
    }).then((result)=>{
        return result
    });

    if (inputResult.replace(/(^\s*)|(\s*$)/g,"") == '') {
        return hx.window.showErrorMessage('用户名或邮箱不能为空',['我知道了'])
    };

    gitConfigSet(projectPath, {'key':key, 'value':inputResult});
};

/**
 * @description 查看配置
 */
async function goShowConfig(projectPath, action) {
    if (!projectPath) return;
    if (!action) return;

    if (["--global", "--system", "--local", "--show-origin"].includes(action)) {
        let options = ['config', '--list', action];
        let contents = await gitRaw(projectPath, options, '获取Git配置', 'result');
        if (contents && contents != 'error' && contents != 'fail') {
            await hx.commands.executeCommand('workbench.action.files.newUntitledFile');
            applyEdit(contents);
        };
    };
};

/**
 * @description 设置中文编码
 */
async function goSetEncoding(info) {
    let projectPath = '';
    if (info == 'core.quotepath') {
        let cmd1 = ['config', '--global', 'core.quotepath', false];
        let status1 = await gitRaw(projectPath, cmd1, '设置core.quotepath', 'statusCode');
        if (status1 == 'success') {
            hx.window.showInformationMessage("设置core.quotepath=false，操作成功。", ["我知道了"]);
        } else {
            hx.window.showErrorMessage("设置core.quotepath=false，操作失败。", ["我知道了"]);
        };
    };

    if (info == 'i18n.logoutputencoding') {
        let cmd2 = ['config', '--global', 'i18n.logoutputencoding', 'utf-8'];
        let status2 = await gitRaw(projectPath, cmd2, '设置i18n.logoutputencoding', 'statusCode');
        if (status2 == 'success') {
            hx.window.showInformationMessage("设置i18n.logoutputencoding=utf-8，操作成功。", ["我知道了"]);
        } else {
            hx.window.showErrorMessage("设置i18n.logoutputencoding=utf-8，操作失败。", ["我知道了"]);
        };
    };
};


module.exports = {
    goSetConfig,
    goShowConfig,
    goSetEncoding
}
