var hx = require("hbuilderx");
var path = require('path')
var fs = require('fs');

const {
    isDirEmpty,
    getDirFileList,
    gitClone,
    updateHBuilderXConfig,
    importProjectToExplorer
} = require('../../common/utils.js');

const { getDefaultClonePath } = require("./clone_utils.js");

const regex_for_gitURL = /^(https?:\/\/|git@)([\w.-]+)(:[0-9]+)?(\/|:)([\w.-]+)\/([\w.-]+)(\.git)?$/;

// 克隆目录
var cfg_git_clone_wizard_path = '';

// 记忆当前填充
var cfg_git_clone_data = {};


/**
 * @description 校验表单输入
 */
function validate(formData, that) {
    let data = formData.UITest;
    let action = data.action;
    let UIFillData = data.cloneInfo;
    let { repo, branch, local_destination_path, username, password } = UIFillData;
    // console.log("action -->", action, UIFillData);

    if (action == "userInput" && (repo.length == 0 || /^\s+$/.test(repo)) ) {
        that.showError("请填写Git仓库地址");
        return;
    };
    if (!regex_for_gitURL.test(repo)) {
        that.showError("Git仓库：地址无效。以git@或http://开头，且以.git结尾");
        return;
    };
    if (/^\s+$/.test(branch)) {
        that.showError("Git分支：填写数据全是空格，不符合规则");
        return;
    };
    if (/^\s+$/.test(local_destination_path) || local_destination_path.length < 2) {
        that.showError("克隆目录校验失败，请重新填写。");
        return;
    };
    if ( (repo.startsWith("http://") || repo.startsWith("https://")) && /^\s+$/.test(username) ) {
        that.showError("Git账号用户名校验失败");
        return;
    };
    if ( (repo.startsWith("http://") || repo.startsWith("https://")) && /^\s+$/.test(password) ) {
        that.showError("Git账号密码校验失败");
        return;
    };
    return true;
};


async function cloneMainForVue(cloneParams={}, isSwitchSearchGithub=false) {
    hx.vue.defineComponent('UITest', path.join(path.dirname(__filename), "./vue/static.vue"));

    // 设置默认Git克隆目录
    cfg_git_clone_wizard_path = getDefaultClonePath();

    if (JSON.stringify(cloneParams) != '{}') {
        cfg_git_clone_data = cloneParams;
    };
    // console.error("--->", cfg_git_clone_data);

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
            "name": "UITest",
            "value": {
                action: isSwitchSearchGithub ? 'search_github' : 'userInput',
                cloneInfo: cfg_git_clone_data,
                cacheRepoName: cfg_git_clone_data.repo ? cfg_git_clone_data.repo : ''
            }
        }]
    }).then( async (res) => {
        const cloneInfo = res.UITest.cloneInfo;
        // console.error("返回结果：", JSON.stringify(res));
        let result = await clone(cloneInfo);
        console.error("[克隆结果] ->", result);
    });
    return true;
};

/**
 * @description 开始克隆
 */
var isDisplayError;
async function clone(info) {
    let {username, password, repo, branch, local_destination_path} = info;
    let cloneData = {
        'projectName': '',
        'username': '',
        'password': '',
        'repo': repo,
        'branch': branch,
        'localPath': local_destination_path,
        'isAuth': false
    };

    let gitRepoName = repo.split('/').pop();
    gitRepoName = gitRepoName.slice(0, gitRepoName.length -4);
    cloneData.projectName = gitRepoName;

    if (path.basename(local_destination_path) != gitRepoName) {
        local_destination_path = path.join(local_destination_path, gitRepoName);
        cloneData.localPath = local_destination_path;
    };

    // currentCloneDir: 用于记忆填写克隆的目录，避免下次重复填写
    let currentCloneDir = path.dirname(local_destination_path);
    if (cfg_git_clone_wizard_path != currentCloneDir) {
        updateHBuilderXConfig('EasyGit.LastCloneDir', currentCloneDir);
    };

    // 操作: 用户名和密码
    if (repo.startsWith('http://') || repo.startsWith('https://')) {
        if (username && username.trim().length != 0 && password && password.trim().length != 0 ) {
            cloneData.isAuth = true;
            cloneData.username = username;
            cloneData.password = password;
        };
    };

    // console.error("[克隆数据]--->", cloneData);
    // return;
    cfg_git_clone_data = cloneData;
    let result = await gitClone(cloneData);
    if (result == 'success') {
        // 清除缓存数据
        global_git_repo_url = '';
        // 导入克隆项目到项目管理器
        importProjectToExplorer(local_destination_path);
        let pinfo = {
            'easyGitInner': true,
            'projectName': gitRepoName,
            'projectPath': local_destination_path
        };
        hx.commands.executeCommand('EasyGit.main', pinfo);
        hx.commands.executeCommand('workbench.view.explorer');
        cfg_git_clone_data = {};
    };
};

module.exports = cloneMainForVue;
