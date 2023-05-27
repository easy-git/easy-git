const path = require('path');
const os = require('os');
const fs = require('fs');
const process = require('process');
const uuid = require('uuid');
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
    createOutputViewForHyperLinksForCommand,
    hxShowMessageBox
} = require('../common/utils.js');
const { goSetEncoding } = require('./base.js');

const count = require('../common/count.js');
const { Gitee, Github, gitRepoCreate } = require('../common/oauth.js');

// 获取操作系统SSH目录
const osName = os.platform();
const USERHOME = osName == 'darwin'
    ? process.env.HOME
    : path.join(process.env.HOMEDRIVE, process.env.HOMEPATH);
const SSHDIR = path.join(USERHOME, '.ssh');

var gitUserName;
var gitEmail;

let giteeOAuth = new Gitee();
let githubOAuth = new Github();

let tmpProjectInfo = {};

// 记录用户选择的git服务
let gitServiceUserSelect = undefined;

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

    createOutputChannel("当前仓库，初始化成功，还未关联到远程仓库上, 请在弹窗输入框中输入仓库地址。如不需要关联远程仓库、或后期设置，请直接关闭弹窗。", "info");
    createOutputChannel("新建仓库、及获取远程仓库地址，参考: https://easy-git.github.io/connecting/init\n");

    // 打开源代码管理器
    ProjectInfo.easyGitInner = true;

    // 打开源代码管理器视图
    // let pinfo = {"easyGitInner": true, "projectPath": projectPath, "projectName": projectName};
    // hx.commands.executeCommand('EasyGit.main', pinfo);

    // 关联远程仓库
    try {
        let pdata = Object.assign(ProjectInfo)
        let set_1 = new gitInitAfterSetting();
        set_1.main(pdata);
    } catch (e) {
        createOutputChannel(`项目【${projectName}】, 打开仓库设置窗口失败。`, "fail");
    };
};


/**
 * @description 关联远程仓库
 */
class gitInitAfterSetting {
    constructor(arg) {
        this.projectName = '';
        this.projectPath = '';
        this.giteeInfo = false;
        this.githubInfo = false;
        this.giteeOrgs = '';
        this.githubOrgs = '';
    };

    /**
     * @description 校验输入
     * @param {Object} formData
     * @param {Object} that
     */
    async goValidate(formData, that) {
        let {action, RepositoryName, oauth_desc_gitee, oauth_desc_github, isHttp} = formData;

        if (action == 'github' && oauth_desc_github === null) {
            that.showError(`您点击了【确认】按钮，需要先授权登录Github账号。如果您不想授权登录，可以点击【取消】按钮。`);
            return false;
        };
        if (action == 'gitee' && oauth_desc_gitee === null) {
            that.showError(`您点击了【确认】按钮，需要先授权登录Gitee账号。如果您不想授权登录，可以点击【取消】按钮。`);
            return false;
        };

        if (action == 'ManualInput') {
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
        };

        if (action == 'github') {
            let t1 = RepositoryName.trim();
            if (/[a-zA-Z0-9_\-\.]{1,100}$/.test(t1) == false || t1 == '.') {
                that.showError('仓库名只允许包含字母、数字或者下划线(_)、中划线(-)、英文句号(.)，且长度为1~100个字符');
                return false;
            };
        };
        if (action == 'gitee') {
            let t2 = RepositoryName.trim();
            if (/^[a-zA-Z][a-zA-Z0-9_\-\.]{1,191}$/.test(t2) == false) {
                that.showError('仓库名只允许包含字母、数字或者下划线(_)、中划线(-)、英文句号(.)，必须以字母开头，且长度为2~191个字符');
                return false;
            };
        };

        if (["gitee", "github"].includes(action)) {
            if (!isHttp) {
                if (!fs.existsSync(SSHDIR)) {
                    let boxMsg = `使用SSH协议，添加远程仓库地址,需要本地存在SSH密钥，并在 ${action} 网站上进行SSH配置。否则Git pull、push等操作会失败。如果SSH已配置，请忽略。`;
                    let btnText = await hxShowMessageBox("提醒", boxMsg, ["返回修改", "确定使用SSH"]).then( btnText => {
                        return btnText;
                    });
                    return btnText == "确定使用SSH" ? true : false;
                };
            };
        };
        return true;
    };

    async isOAuth(service="all") {
        if (service == "all" || service == "gitee") {
            try{
                let giteeOAuthInfo = await giteeOAuth.readLocalToken();
                if (giteeOAuthInfo.status == 'success-authorize') {
                    this.giteeInfo = giteeOAuthInfo;
                    let {orgs, login} = giteeOAuthInfo;
                    if (orgs.length && Array.isArray(orgs)) {
                        let orgs_list = orgs.map(item => {if(item != login) {return item} });
                        this.giteeOrgs = orgs_list.join(' ');
                    };
                };
            }catch(e){};
        };

        if (service == "all" || service == "github") {
            try{
                let githubOAuthInfo = await githubOAuth.readLocalToken();
                if (githubOAuthInfo.status == 'success-authorize') {
                    this.githubInfo = githubOAuthInfo;
                    let orgs2 = githubOAuthInfo.orgs;
                    if (orgs2.length && Array.isArray(orgs2)) {
                        this.githubOrgs = orgs2.join(' ');
                    };
                };
            }catch(e){};
        };
    };

    /**
     * @description 绘制视图
     * @description {Object} preFillData 预填充数据
     * @param {String} action
     * @param {Object} formData
     */
    getFormItems(preFillData={}, action='ManualInput', formData) {

        let {local_email, local_username, projectName, projectPath} = preFillData;

        let title = projectName ? 'Git仓库设置' + ' - ' + projectName : 'Git仓库设置';
        let subtitle = fs.existsSync(projectPath) ? `<span style="color: #a0a0a0;font-size: 12px;">本地路径 ${projectPath}</span>`: '';
        let footer = '<a href="https://easy-git.github.io/extensions/create-remote-repo">了解在HBuilderX内创建远程仓库</a>';
        let RepositoryName = projectName ? projectName : '';

        let tService = action;
        gitServiceUserSelect = action;

        var oauth_desc = `<span>您使用此功能之前，需要先授权插件访问 ${tService}。
            <br/><br/>通过OAuth授权后，可以在本地操作远程Git服务器某些功能；比如无需再登录浏览器，直接在本地创建远程仓库。
            <br/><br/>授权后Git访问凭证仅会存储在您的个人电脑上，不会上传网络，且本地信息已加密。
            <br/><br/><span style="font-weight: 600;">点击【打开${action}授权】按钮后，将跳转到浏览器 ${tService} 认证页面。授权成功后，请点击刷新按钮。</span></span><br/><br/>`;

        let formItems = [{
                type: "radioGroup",name: "action", "value": action,
                items: [
                    {"label": "手动输入仓库地址", "id": "ManualInput"}, {"label": "托管到Github.com", "id": "github"}, {"label": "托管到Gitee.com", "id": "gitee"}
                ]
            }
        ];
        let service_items = [
            {type: "input",name: "RepositoryName",label: "仓库名称",placeholder: '英文字母或数字, 比如abc',value: RepositoryName},
            {type: "input",name: "owner",label: "归属组织",placeholder: '可选；不填写，则为默认组织',value: ''},
            // {type: "label",name: "blank_line_1",text: ""},
            {type: "checkBox",name: "isPrivate",label: "是否私有；私有，仅仓库成员可见；不勾选，则代表公开，即所有人可见", value: true},
            // {type: "label",name: "blank_line_2",text: ""},
            {type: "checkBox",name: "isAddRemoteOrigin",label: `${tService}远程仓库创建成功后，并添加远程仓库地址到${this.projectName}项目 ，即执行 git add remote origin url`, value: true},
            // {type: "label",name: "blank_line_3",text: ""},
            {type: "checkBox",name: "isHttp",label: '使用HTTP，添加远程仓库地址；不勾选，则代表使用SSH', value: true}
        ];

        if (action == 'ManualInput') {
            let mi_info = [
                {type: "input",name: "RepositoryURL",label: "仓库地址",placeholder: '请添加的仓库地址，以https://或git@开头',value: ''},
                {type: "input",name: "new_username",label: "user.name",placeholder: "user.name", value: local_username},
                {type: "input",name: "new_email",label: "user.email",placeholder: "user.email，比如xxx@xx.com", value: local_email},
                {type: "label",name: "remark_desc_1",text: '<span style="color: #a0a0a0; font-size: 12px;"><br/>1. 若无仓库，可到<a href="https://github.com">Github</a>、<a href="https://gitee.com/">Gitee</a>等托管服务器创建仓库获取仓库URL。</span>'},
                {type: "label",name: "remark_desc_2",text: "<span style='color: #a0a0a0; font-size: 12px;'>2. user.name和user.email用于身份标识，每个 Git 提交都会使用这些信息，它们会写入到每一次提交中。<br/></span>"}
            ];
            formItems = [...formItems, ...mi_info];
        };
        if (action == 'gitee') {
            if (this.giteeInfo && typeof this.giteeInfo == "object") {
                if (this.giteeOrgs) {
                    service_items.splice(2, 0, {type: "label",name: "gitee_orgs_desc",text: `<span style='color: #a0a0a0; font-size: 12px;'>Gitee上，除默认组织外，其它用户组织列表: ${this.giteeOrgs}。<a href="https://gitee.com/organizations/new">创建新组织</a></span>`})
                };
                formItems = [...formItems, ...service_items];
            } else {
                formItems.push({type: "label",name: "blank_line_10",text: ""});
                formItems.push({type: "label",name: "oauth_desc_gitee",text: oauth_desc});
                formItems.push(
                    {
                        type: 'widgetGroup',
                        name: 'authWidget',
                        widgets: [
                            {type: 'button',name: 'authButton',text: `打开${action}授权`,size: 'small'},
                            {type: 'button',name: 'RefreshButton',text: '刷新',size: 'small'},
                        ]
                    }
                );
            };
        };
        if (action == "github") {
            if (this.githubInfo && typeof this.githubInfo == "object") {
                if (this.githubOrgs) {
                    service_items.splice(2, 0, {type: "label",name: "github_orgs_desc",text: `<span style='color: #a0a0a0; font-size: 12px;'>Github上，除默认组织外，其它用户组织列表: ${this.githubOrgs} 。<a href="https://github.com/organizations/plan">创建新组织</a></span>`})
                };
                formItems = [...formItems, ...service_items];
            } else {
                formItems.push({type: "label",name: "blank_line_10",text: ""});
                formItems.push({type: "label",name: "oauth_desc_github",text: oauth_desc});
                formItems.push(
                    {
                        type: 'widgetGroup',
                        name: 'authWidget',
                        widgets: [
                            {type: 'button',name: 'authButton',text: `打开${action}授权`,size: 'small'},
                            {type: 'button',name: 'RefreshButton',text: '刷新',size: 'small'},
                        ]
                    }
                );
            };
        };
        if (["github", "gitee"].includes(action)) {
            footer = '<a href="https://easy-git.github.io/oauth">了解OAuth详情</a>';
        };

        return {
            title: title,
            subtitle: subtitle,
            width: 400,
            height: 320,
            footer: footer,
            formItems: formItems,
        };
    };

    async view(preFillData, action='ManualInput', ProjectInfo) {
        let that = this;
        let setInfo = await hx.window.showFormDialog({
            submitButtonText: "确定(&S)",
            cancelButtonText: "取消(&C)",
            validate: function(formData) {
                let checkResult = that.goValidate(formData, this);
                return checkResult;
            },
            onChanged: function (field, value, formData) {
                this.showError('');
                if (field == "action") {
                    this.updateForm(that.getFormItems(preFillData, value, formData));
                };
                if (field == "authWidget") {
                    let btn = value.changedWidget.name;
                    let services = formData.action;
                    if (btn == "authButton") {
                        that.gotoOAuth(services, preFillData, ProjectInfo);
                    };
                    if (btn == "RefreshButton") {
                        (async () => {
                            await that.isOAuth(services);
                        })();
                        let this2 = this;
                        setTimeout(function() {
                            this2.updateForm(that.getFormItems(preFillData, services, formData));
                        }, 1500);
                    };
                }
            },
            ...that.getFormItems(preFillData, action)
        }).then((res) => {
            return res;
        }).catch(error => {
            console.error(error);
        });
        return setInfo;
    };

    // 跳转到认证
    async gotoOAuth(action, ProjectInfo) {
        if (action == 'gitee' && !this.giteeInfo) {
            createOutputChannel(`正在打开 ${action} 进行认证........`, "success");
            createOutputViewForHyperLinksForCommand(`如 ${action} 认证授权成功，请重新打开Git仓库设置窗口。`, "Git仓库设置", "success", "EasyGit.addRemoteOrigin", ProjectInfo);
            giteeOAuth.authorize(true);
            return;
        };
        if (action == 'github' && !this.githubInfo) {
            createOutputChannel(`正在打开 ${action} 进行认证........`, "success");
            createOutputChannel(`注意：认证之前，请确认本地可以正常访问Github。`, "info");
            createOutputViewForHyperLinksForCommand(`如 ${action} 认证授权成功，请重新打开Git仓库设置窗口。`, "Git仓库设置", "success", "EasyGit.addRemoteOrigin", ProjectInfo);
            githubOAuth.authorize(true);
            return;
        };
        return true;
    };

    async main(ProjectInfo) {
        // 获取项目信息
        let { projectName, projectPath, git_service } = ProjectInfo;
        this.projectName = projectName;
        this.projectPath = projectPath;
        if (!['ManualInput', 'gitee', 'github'].includes(git_service)) {
            git_service = "ManualInput";
        };

        // 获取github和gitee认证信息
        await this.isOAuth();

        // 获取配置, 填充user.name和user.email
        let configData = await gitConfigShow(projectPath, false);
        gitUserName = configData['user.name'];
        gitEmail = configData['user.email'];

        // 用于填充html中的email和username字段
        let local_username = '', local_email = '';
        if (gitUserName != undefined && gitUserName) {
            local_username = gitUserName;
        };
        if (gitEmail != undefined && gitEmail) {
            local_email = gitEmail;
        };

        // 打开Git设置窗口
        let preFillData = {local_email, local_username, projectName, projectPath};
        let setInfo = await this.view(preFillData, git_service, ProjectInfo);

        if (setInfo == undefined) {
            let nextPreData = Object.assign(ProjectInfo, {"git_service": gitServiceUserSelect});
            createOutputViewForHyperLinksForCommand(`您手动关闭了设置窗口，如需要，请点击【Git仓库设置】链接打开Git仓库设置窗口。`, "Git仓库设置", "info", "EasyGit.addRemoteOrigin", nextPreData);
            return;
        };
        let {action, isHttp} = setInfo;

        // 手动添加远程仓库
        if (action == 'ManualInput') {
            let {RepositoryURL, new_username, new_email} = setInfo;
            let addOriginResult = await gitAddRemoteOrigin(projectPath, RepositoryURL);
            if (addOriginResult == 'success') {
                createOutputChannel(`本地项目【${projectName}】，添加远程仓库地址成功。`, "success");
            } else {
                return {"status": "fail"};
            };
            if (new_email != local_email) {
                gitConfigSet(projectPath, {"key": "user.email", "value": new_email});
            };
            if (new_username != local_username) {
                gitConfigSet(projectPath, {"key": "user.name", "value": new_username});
            };
            return {"status": "success"};
        };

        if (['github', 'gitee'].includes(action)) {
            let {RepositoryName, isPrivate, owner, isAddRemoteOrigin} = setInfo;

            let CreateInfo = {
                "name": RepositoryName,
                "host": action,
                "isPrivate": isPrivate,
                "owner": owner
            };

            try{
                let createResult = await gitRepoCreate(CreateInfo);
                if (createResult.status == 'success') {
                    let {ssh_url, http_url} = createResult;
                    if (!isAddRemoteOrigin) return;
                    let useUrl = isHttp ? http_url : ssh_url;
                    let addOriginResult = await gitAddRemoteOrigin(projectPath, useUrl);
                    if (addOriginResult == 'success') {
                        createOutputChannel(`本地项目【${projectName}】，添加远程仓库地址成功。即执行git add remote origin ${useUrl} 成功。`, "info");
                        return {"status": "success"};
                    } else {
                        createOutputChannel(`本地项目【${projectName}】，添加远程仓库地址失败。即执行git add remote origin ${useUrl} 失败。`, "error");
                    };
                } else {
                    let innerParams = Object.assign(ProjectInfo, {"easyGitInner": true, "git_service": action});
                    hx.commands.executeCommand("EasyGit.addRemoteOrigin", innerParams)
                };
            }catch(e){console.error(e)};
            return {"status": "fail"};
        };
    };
};


module.exports = {
    gitInitProject,
    gitInitAfterSetting
}
