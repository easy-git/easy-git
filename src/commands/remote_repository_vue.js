var hx = require("hbuilderx");
var path = require('path')
var fs = require('fs');

const { gitRepoCreate } = require('../common/oauth.js');

/**
 * @description 校验表单输入
 */
async function validate(formData, that) {
    let data = formData.UITest;
    let { host, repos_owner, repos_name, isPrivate } = data;

    if (repos_name.length == 0 || /^\s+$/.test(repos_name) ) {
        that.showError("请填写仓库名称");
        return;
    };

    let CreateInfo = {
        "host": host.toLowerCase(),
        "name": repos_name,
        "owner": repos_owner,
        "isPrivate": isPrivate
    };
    let createResult = await gitRepoCreate(CreateInfo);
    let { status, ssh_url, http_url } = createResult;

    if (status == 'auth_error') {
        that.showError('错误: 访问服务器的token无效，请重新授权。');
        return;
    };
    if (status != 'success') {
        that.showError('错误: 创建失败');
        return;
    };
    return true;
};


async function gitRemoteRepositoryCreate() {
    hx.vue.defineComponent('UITest', path.join(path.dirname(__filename), "./remote_repository_vue.vue"));

    let form = await hx.window.showFormDialog({
        title: "Git - 创建远程仓库",
        submitButtonText: "开始创建(&S)",
        cancelButtonText: "取消(&C)",
        footer: "<a href=\"https://easy-git.github.io/connecting/\">相关文档</a>",
        width: 800,
        height: 430,
        showModal: false,
        validate: async function(formData) {
            this.showError("");
            return await validate(formData, this);
        },
        formItems: [{
            "type": "vue:UITest",
            "name": "UITest",
            // "value": {
            //     cloneInfo: cfg_git_clone_data,
            //     cacheRepoName: cfg_git_clone_data.repo ? cfg_git_clone_data.repo : ''
            // }
        }]
    }).then( async (res) => {
        const repoInfo = res.UITest;
        console.error("返回结果：", JSON.stringify(repoInfo));
        // let result = await clone(cloneInfo);
        // console.error("[克隆结果] ->", result);
    });
    return true;
};

module.exports = gitRemoteRepositoryCreate;
