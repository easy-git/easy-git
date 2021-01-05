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
}


module.exports = {
    goSetConfig,
    goShowConfig
}
