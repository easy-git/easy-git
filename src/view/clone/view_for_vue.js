var hx = require("hbuilderx");
var path = require('path')

const regex_for_gitURL = /^(https?:\/\/|git@)([\w.-]+)(:[0-9]+)?(\/|:)([\w.-]+)\/([\w.-]+)(\.git)?$/;

/**
 * @description 校验表单输入
 */
function validate(formData, that) {
    let data = formData.UITest;
    let action = data.action;
    console.log("action -->", action, data)
    let git_repo = data.cloneInfo.repo;
    if (action == "userInput" && (git_repo.length == 0 || /^\s+$/.test(git_repo)) ) {
        that.showError("请填写Git仓库地址");
        return;
    };
    if (!regex_for_gitURL.test(git_repo)) {
        that.showError("Git仓库地址无效。以git@或http://开头，且以.git结尾");
        return;
    };
    return true;
};

async function cloneMainForVue() {
    hx.vue.defineComponent('UITest', path.join(path.dirname(__filename), "./vue/static.vue"));

    let form = await hx.window.showFormDialog({
        title: "Git Clone - 克隆仓库",
        submitButtonText: "开始克隆(&S)",
        cancelButtonText: "取消(&C)",
        footer: "<a href=\"https://easy-git.github.io/connecting/\">相关文档</a>",
        width: 800,
        height: 520,
        showModal: false,
        validate: async function(formData) {
            this.showError("");
            return validate(formData, this)
        },
        formItems: [{
            "type": "vue:UITest",
            "name": "UITest"
        }]
    }).then((res) => {
        console.error("返回结果：", JSON.stringify(res));
    });
    return true;
};


module.exports = cloneMainForVue;
