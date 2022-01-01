const path = require('path');
const fs = require('fs');

const hx = require('hbuilderx');
const {
    gitRaw,
    gitInit,
    gitCurrentBranchName,
    gitAddRemoteOrigin,
    gitLocalBranchToRemote,
    gitConfigShow,
    gitConfigSet,
    createOutputChannel,
    createOutputViewForHyperLinksForCommand
} = require('../common/utils.js');
const { goSetEncoding } = require('./base.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'bootstrap.min.css');
const customCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'custom.css');

var gitUserName;
var gitEmail;

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
    gitUserName = configData['user.name'];
    gitEmail = configData['user.email'];
    if (gitUserName == false || gitEmail == false) {
        createOutputChannel("当前仓库，未设置user.name或user.email。提交代码到Git远程仓库，必须设置用户名和邮箱。", "warning");
        createOutputChannel("如需设置，请在弹窗中输入。或后期HBuilderX选中项目，点击顶部菜单【工具 -> easy-git -> 设置user.name】\n");
    };

    // 设置编码, 解决中文问题
    let i18n = configData['i18n.logoutputencoding'];
    if (!i18n) {
        goSetEncoding("core.quotepath", 'StatusBar');
        goSetEncoding("i18n.logoutputencoding", 'StatusBar');
    };

    createOutputChannel("当前仓库，还未关联到远程仓库上, 请在弹窗输入框中输入仓库地址。如不需要关联远程仓库、或后期设置，请直接关闭弹窗。", "warning");
    createOutputChannel("新建仓库、及获取远程仓库地址，参考: https://easy-git.github.io/connecting/init");

    createOutputViewForHyperLinksForCommand("EasyGit插件，授权Gitee、GitHub后，支持在HBuilderX内，创建远程仓库。", "点击创建远程仓库", "EasyGit.CreateRemoteRepository", ProjectInfo);

    // 打开源代码管理器
    ProjectInfo.easyGitInner = true;

    // 打开源代码管理器视图
    // let pinfo = {"easyGitInner": true, "projectPath": projectPath, "projectName": projectName};
    // hx.commands.executeCommand('EasyGit.main', pinfo);

    // 关联远程仓库
    try {
        let pdata = Object.assign(ProjectInfo)
        let gas = new gitInitAfterSetting();
        gas.main(pdata)
    } catch (e) {
        let relationResult = await gitAddRemoteOrigin(projectPath);
        if (relationResult == 'success') {
            createOutputChannel(`项目【${projectName}】远程仓库添加地址成功。`, "success");
        };
    };
};


/**
 * @description 关联远程仓库
 */
class gitInitAfterSetting {
    constructor(arg) {
        this.projectName = '';
        this.projectPath = '';
    }

    /**
     * @description 校验输入
     * @param {Object} formData
     * @param {Object} that
     */
    async goValidate(formData, that) {
        let {RepositoryURL, new_email} = formData;
        let reg = /^(https:\/\/|http:\/\/|git@)/g;
        if (RepositoryURL.length == 0 || !reg.test(RepositoryURL)) {
            that.showError(`仓库地址无效`);
            return false;
        };
        if (!new_email.includes('@')) {
            that.showError(`git user.email无效`);
            return false;
        };
        return true;
    };

    /**
     * @description 绘制视图
     * @description {Object} preFillData 预填充数据
     * @param {String} action
     * @param {Object} formData
     */
    getFormItems(preFillData={}, action='ManualInput', formData) {
        let {local_email, local_username, projectName, projectPath, repo_url} = preFillData;
        let formItems = [];
        // let formItems = [{
        //         type: "radioGroup",name: "action", "value": action,
        //         items: [
        //             {"label": "手动输入仓库地址", "id": "ManualInput"},{"label": "托管到Github", "id": "github"},{"label": "托管到Gitee", "id": "gitee"}
        //         ]
        //     }
        // ];
        // if (fs.existsSync(projectPath)) {
        //     let displayProjectPath = projectPath;
        //     if (displayProjectPath.length > 50) {
        //         displayProjectPath = displayProjectPath.slice(0, 50) + "......";
        //     };
        //     formItems.push({type: "label",name: "remark_1",text: `本地路径 ${displayProjectPath}`});
        // };
        if (action == 'ManualInput') {
            let mi_info = [{type: "input",name: "RepositoryURL",label: "仓库地址",placeholder: '请添加的仓库地址，以https://或git@开头',value: ''},
            {type: "input",name: "new_username",label: "user.name",placeholder: "user.name", value: local_username},
            {type: "input",name: "new_email",label: "user.email",placeholder: "user.email，比如xxx@xx.com", value: local_email},
            {type: "label",name: "remark_desc_1",text: '<span style="color: #a0a0a0; font-size: 12px;">1. 若无仓库，可到<a href="https://github.com">Github</a>、<a href="https://gitee.com/">Gitee</a>等托管服务器创建仓库获取仓库URL。</span>'},
            {type: "label",name: "remark_desc_2",text: "<span style='color: #a0a0a0; font-size: 12px;'>2. user.name和user.email用于身份标识，每个 Git 提交都会使用这些信息，它们会写入到每一次提交中。</span>"}];
            formItems = [...formItems, ...mi_info];
        };
        if (action == "github") {};
        if (action == "gitee") {};

        let title = projectName ? 'Git仓库设置' + ' - ' + projectName : 'Git仓库设置';
        let subtitle = fs.existsSync(projectPath) ? `<span style="color: #a0a0a0;font-size: 12px;">本地路径 ${projectPath}</span>`: '';
        return {
            title: title,
            subtitle: subtitle,
            width: 400,
            height: 320,
            footer: '<a href="https://easy-git.github.io/extensions/create-remote-repo">了解在HBuilderX内创建远程仓库</a>',
            formItems: formItems,
        };
    };

    async main(ProjectInfo) {
        // 获取项目信息
        let { projectName, projectPath, repo_url } = ProjectInfo;
        if (repo_url == undefined) {
            repo_url = "";
        };

        // 用于填充html中的email和username字段
        let local_username = '', local_email = '';
        if (gitUserName != undefined && gitUserName) {
            local_username = gitUserName;
        };
        if (gitEmail != undefined && gitEmail) {
            local_email = gitEmail;
        };

        let preFillData = {local_email, local_username, projectName, projectPath, repo_url};

        let that = this;
        let setInfo = await hx.window.showFormDialog({
            submitButtonText: "确定(&S)",
            cancelButtonText: "取消(&C)",
            validate: function(formData) {
                let checkResult = that.goValidate(formData, this);
                return checkResult;
            },
            onChanged: function (field, value, formData) {
              if (field == "action") {
                this.updateForm(that.getFormItems(preFillData, value, formData));
              }
            },
            ...that.getFormItems(preFillData)
        }).then((res) => {
            return res;
        }).catch(error => {
            console.log(error);
        });

        if (setInfo == undefined) return;
        let {RepositoryURL, new_username, new_email} = setInfo;

        // 添加远程仓库
        let addOriginResult = await gitAddRemoteOrigin(projectPath, RepositoryURL);
        if (addOriginResult == 'success') {
            createOutputChannel(`本地项目【${projectName}】，添加远程仓库地址成功。`, "success");
        };

        if (new_email != local_email) {
            gitConfigSet(projectPath, {"key": "user.email", "value": new_email});
        };

        if (new_username != local_username) {
            gitConfigSet(projectPath, {"key": "user.name", "value": new_username});
        };
    };
};

function gitSetForWebDialog() {

}
module.exports = {
    gitInitProject,
    gitSetForWebDialog,
    gitInitAfterSetting
}
