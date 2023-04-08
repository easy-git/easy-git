const os = require('os');
const fs = require('fs');
const path = require('path');
const process = require('process');
const {debounce} = require('throttle-debounce');

const ini = require('ini');
const hx = require('hbuilderx');

const MainView = require('../main.js');
const {
    getDirFileList,
    gitClone,
    updateHBuilderXConfig,
    importProjectToExplorer
} = require('../../common/utils.js');
const {axiosGet} = require('../../common/axios.js');
const {Gitee,Github,openOAuthBox} = require('../../common/oauth.js');

const osName = os.platform();
const appDataDir = hx.env.appData;

// Git仓库地址，用于数据填充
var GitRepoUrl = '';

// 克隆目录
var ProjectWizard = '';

/**
 * @description 设置初始克隆目录
 */
function getProjectWizard() {
    try{
        let config = hx.workspace.getConfiguration();
        let LastCloneDir = config.get('EasyGit.LastCloneDir');
        if (LastCloneDir && LastCloneDir != '') {
            return LastCloneDir;
        };
        if (osName == 'darwin') {
            return path.join(process.env.HOME, 'Documents')
        } else {
            return path.join("C:", process.env.HOMEPATH, 'Documents')
        };
    }catch(e){
        return '';
    };
};


/**
 * @description 验证窗口输入项
 * @param {String} param
 */
function goValidate(formData, that) {
    let {repo,Protocol,localPath, isHttpAuth} = formData;

    if (repo.replace(/\s*/g,"").length == 0 || repo.length < 9) {
        that.showError("请输入有效的Git仓库地址");
        return false;
    };
    let isHttp = /^(http|https):\/\//.test(repo);
    let isSSH = /^git@/.test(repo);
    if ( !isHttp && repo.substring(repo.length-4) != '.git') {
        that.showError("Git存储库URL无效，必须以git@或http开头");
        return false;
    };
    if ( !isSSH && repo.substring(repo.length-4) != '.git') {
        that.showError("Git存储库URL无效，必须以git@或http开头");
        return false;
    };
    if (/^git@/.test(repo) && isHttpAuth) {
        that.showError("您输入的Git仓库地址是以Git@开头，它是通过SSH协议来克隆的。请去掉复选框勾选。");
        return false;
    }

    if (localPath.replace(/\s*/g,"").length == 0 && localPath.length < 2) {
        that.showError("请输入有效本地目录");
        return false;
    };
    return true;
};


/**
 * @description from视图内容项
 * @param {String} selectedDir
 */
function getFormItems(formData={}, changeValue) {
    let { repo, isHttpAuth } = formData;

    // 克隆协议
    let selectProtocol = "";
    if (repo && /^(http|https):\/\//.test(repo)) {
        selectProtocol = "HTTP";
    };
    if (repo && /^git@/.test(repo)) {
        selectProtocol = "SSH";
    };

    // let from_Protocol = {
    //     type: 'widgetGroup',
    //     name: 'Protocol',
    //     widgets: [
    //         {type: "label",name: "ProtocolText",text:"克隆协议"},
    //         {
    //             type: 'radioGroup',name: 'Protocol',checkedRadio: selectProtocol,
    //             radios: [
    //                 {name: 'HTTP',text: "HTTP协议    ",checked: true},
    //                 {name: 'SSH',text: "SSH协议",checked: false}
    //             ],
    //         },
    //     ]
    // };

    let from_Protocol = {
        type: "radioGroup",name: "Protocol",label: "克隆协议", "value": "",
        items: [
            {"label": "SSH协议", "id": "SSH"},
            {"label": "HTTP协议", "id": "HTTP"}
        ]
    }

    // Git 仓库URL
    let repoURL = '';
    if (repo) {
        repoURL = repo;
    };
    let from_repo = {
        "label": "Git仓库","type": "input","name": "repo",
        "placeholder": "输入Git存储库URL（以git@或http开头）, 或选择仓库地址",
        "disabled": false,"value": repoURL
    };

    // Git要克隆的分支
    let from_branch = {"label": "Git分支","type": "input","name": "branch","placeholder": "Git分支，选填，如不填写，则默认克隆master分支","value": ""};

    // Git 克隆后的本地路径
    let localPath = ProjectWizard && ProjectWizard != '' ? ProjectWizard : '';
    let from_localPath = {
        "label": "本地目录","type": "fileSelectInput","mode": "folder","name": "localPath",
        "placeholder": "选择要克隆后本地存储目录","value": localPath
    };

    let isAuth = isHttpAuth ? true : false;
    let from_is_httpAuth = {type: "checkBox",name: "isHttpAuth",label: "是否输入Git服务器账号密码。HTTP协议，克隆私有仓库，需要提供账号密码。", value: isAuth};

    // 账号密码
    let from_username = { "label": "Git账号","type": "input","name": "username","placeholder": "选填, Git服务器账号，通常是邮箱或用户名","value": ""};
    let from_password = { "label": "Git密码","type": "input","name": "pssword","placeholder": "选填, Git服务器密码","value": ""};

    let help_text_1 = '<span style="color: #a0a0a0; font-size: 12px;">EasyGit支持Github、Gitee OAuth授权。授权后，此窗口自动加载Git仓库URL列表，无需输入。<br/>在HBuilderX内，使用远程Git服务器某些功能，比如创建远程仓库。<a href="https://easy-git.github.io/oauth">详情</a></span>';
    let from_help_1 = {type: "label",name: "text_1",text:help_text_1};

    // ssh帮助
    let ssh_help_text = '<span style="color: #a0a0a0; font-size: 12px;margin-top:80px;"> 基于 SSH 协议克隆Git仓库之前，需要先在Git服务器配置SSH公钥。<br/>EasyGit支持一键生成SSH Key，HBuilderX 顶部菜单【工具 - easygit】。</span>';
    let from_ssh_help = {type: "label",name: "text_3",text:ssh_help_text};

    let from_blank = {type: "label",name: "text",text:""};
    let from_blank_2 = {type: "label",name: "text_2",text:""};

    let formItems = [
        // from_Protocol,
        from_repo,
        from_branch,
        from_localPath
    ];

    if (selectProtocol == 'HTTP') {
        formItems.push(from_is_httpAuth);
    };

    if (isHttpAuth) {
        formItems.splice(4,0, from_username);
        formItems.splice(5,0, from_password);
        formItems.push(from_blank_2);
    };

    if (selectProtocol == 'SSH') {
        formItems.push(from_ssh_help);
    };

    let footer = '<a href="https://ext.dcloud.net.cn/plugin?id=2475">寻求帮助或反馈问题</a>';
    let subtitle = '<span style="color: #a0a0a0; font-size: 12px;">EasyGit支持Github、Gitee OAuth授权。授权后，在HBuilderX内，即可使用Git服务器某些功能。<a href="https://easy-git.github.io/oauth">详情</a></span>';
    let height = selectProtocol == "HTTP" ? 410 : 390;
    return {
        title: "Git Clone - 克隆",
        subtitle: subtitle,
        width: 640,
        height: height,
        footer: footer,
        formItems: formItems
    };
};

/**
 * @description 打开克隆视图窗口
 */
async function openCloneView() {

    let clone_protocol = "";
    let formInfo = await hx.window.showFormDialog({
        submitButtonText: "开始克隆(&S)",
        cancelButtonText: "取消(&C)",
        validate: function(formData) {
            let checkResult = goValidate(formData, this);
            return checkResult;
        },
        onChanged: function (field, value, formData) {
            if (field == "isHttpAuth") {
                this.updateForm(getFormItems(formData));
            }
            if (field == "Protocol") {
                this.updateForm(getFormItems(formData));
            }
            if (field == "repo") {
                let tmp = '';
                let is_match_git_url_end =  /\/(.*)\.git$/.test(value);
                if (/^git@/.test(value) && is_match_git_url_end) { tmp = 'SSH' };
                if (/^(http|https):\/\//.test(value) && is_match_git_url_end) { tmp = 'HTTP' };
                if (tmp == '') return;
                if (clone_protocol == tmp) return;
                clone_protocol = tmp;
                this.updateForm(getFormItems(formData));
            }
          },
        ...getFormItems()
    }).then((res) => {
        return res;
    }).catch(error => {
        console.log(error);
        return 'error';
    });
    return formInfo;
};

/**
 * @description git clone主程序入口
 * @param {*} param
 */
async function cloneMain(param) {
    // 获取克隆目录
    ProjectWizard = getProjectWizard();

    let formInfo = await openCloneView();
    if (formInfo == undefined || formInfo == 'error') return;

    // 解析仓库地址、本地目录
    let { localPath, repo, isHttpAuth } = formInfo;

    // 记录仓库地址
    GitRepoUrl = repo;

    // 从url解析Git仓库名称
    let gitRepoName = repo.split('/').pop();
    if (gitRepoName.substring(gitRepoName.length - 4) === '.git') {
        gitRepoName = gitRepoName.replace('.git', '');
    };

    // 从路径解析项目名称，主要用于HBuilderX导入
    let local_path_basename = path.basename(localPath);
    if (local_path_basename != gitRepoName) {
        localPath = path.join(localPath, gitRepoName)
    };

    let pinfo = {
        'easyGitInner': true,
        'projectName': gitRepoName,
        'projectPath': localPath
    };

    // 开始克隆
    formInfo["localPath"] = localPath;
    formInfo["isAuth"] = isHttpAuth;
    let CloneInfo = Object.assign(pinfo, formInfo);
    let cloneResult = await gitClone(CloneInfo);

    if (cloneResult == 'success') {
        // 导入克隆项目到项目管理器
        importProjectToExplorer(localPath);

        // 打开Git视图
        hx.commands.executeCommand('EasyGit.main', pinfo);
        hx.commands.executeCommand('workbench.view.explorer');

        // 清除缓存数据
        GitRepoUrl = '';
    } else {
        hx.window.setStatusBarMessage("EasyGit: 克隆失败", 10000, "error");
    };

    // 记忆上次位置
    if (ProjectWizard != currentCloneDir) {
        updateHBuilderXConfig('EasyGit.LastCloneDir', currentCloneDir);
    };
};

module.exports = cloneMain;
