const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');

const {
    gitRaw
} = require('../common/utils.js');

/**
 * @description 验证用户填写数据
 * @param {Object} formData
 */
async function goValidate(formData, that) {
    let {username, useremail} = formData;
    if (username.replace(/(^\s*)|(\s*$)/g,"") == '') {
        that.showError(`user.name不能为空`);
        return false;
    };
    if (useremail.replace(/(^\s*)|(\s*$)/g,"") == '') {
        that.showError(`user.email不能为空`);
        return false;
    };
    return true;
};


/**
 * @description 设置config 主要用于设置user.name和user.email
 * @param {type} projectPath 项目路径
 */
async function setConfig(projectPath) {

    var formItems = [];
    let subtitle = '';

    let userItems = [
        {
            type: "radioGroup",label: "仓库配置级别",name: "level",value: "global",
            items: [
                {label: "local",id: "local"},{label: "global",id: "global"},{label: "system",id: "system"}
            ]
        },
        {type: "input",name: "username",label: "user.name",placeholder: "设置git user.name"},
        {type: "input",name: "useremail",label: "user.email",placeholder: "设置git user.email"},
    ];

    if (projectPath) {
        subtitle = '项目路径: ' + projectPath;
        userItems[0].value = 'local';
        formItems.push(...userItems);
    } else {
        formItems.push(...userItems);
    };

    let ConfigInfo = await hx.window.showFormDialog({
        formItems: formItems,
        title: "Git仓库设置",
        subtitle: subtitle,
        width: 480,
        height: 290,
        submitButtonText: "确定(&S)",
        cancelButtonText: "取消(&C)",
        validate: function(formData) {
            let checkResult = goValidate(formData, this);
            return checkResult;
        }
    }).then((res) => {
        return res;
    }).catch(error => {
        console.log(error);
    });

    if (!ConfigInfo) return;
    
    let {username, useremail,level} = ConfigInfo;
    git_level = '--' + level;

    let username_set_result, useremail_set_result;
    if (username) {
        let options = ['config', git_level, 'user.name', username];
        username_set_result = await gitRaw(projectPath, options, 'Git配置user.name');
    };
    if (useremail) {
        let options = ['config', git_level, 'user.email', useremail];
        useremail_set_result = await gitRaw(projectPath, options, 'Git配置user.email');
    };
    if (username_set_result == 'success' && useremail_set_result == 'success') {
        hx.window.showInformationMessage('Git: user.name和user.email，设置成功。', ["我知道了"]);
    }
};

module.exports = setConfig;
