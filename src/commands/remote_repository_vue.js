var hx = require("hbuilderx");
var path = require('path')
var fs = require('fs');

const { gitRepoCreate } = require('../common/oauth.js');
const cloneMainForVue = require("../view/clone/view_for_vue.js");
/**
 * @description 校验表单输入
 */
async function validate(formData, that) {
    let data = formData.UITest;
    // console.log(formData);
    let { host, repos_owner, repos_name, isPrivate, isClone, clone_protocol } = data;

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

    if (isClone) {
        let cloneData = { "repo": http_url };
        if (clone_protocol == "ssh") {
            cloneData["repo"] = ssh_url;
        };
        try {
            cloneMainForVue(cloneData);
        } catch (error) {};
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
        height: 450,
        showModal: false,
        validate: async function(formData) {
            this.showError("");
            return await validate(formData, this);
        },
        formItems: [{
            "type": "vue:UITest",
            "name": "UITest",
            "value": {}
        }]
    }).then( async (res) => {
        const repoInfo = res.UITest;
        console.error("返回结果：", JSON.stringify(repoInfo));
    });
    return true;
};

module.exports = gitRemoteRepositoryCreate;
