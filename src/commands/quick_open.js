const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');

const {
    mkdirsSync,
    getFilesExplorerProjectInfo,
    checkIsGitProject
} = require('../common/utils.js');
const count = require('../common/count.js');

const appDataDir = hx.env.appData;
const gitHistoryDir = path.join(appDataDir, 'easy-git', 'history');
const gitHistoryFile = path.join(appDataDir, 'easy-git', 'history', 'project.json');

/**
 * @description 快速打开项目管理器的Git项目、或本地的Git项目
 * @param {Object} param
 */
async function quickOpen(param) {
    let gitList = [];

    // 读取曾打开的历史数据
    let h = new History();

    let ExplorerReulst = await getFilesExplorerProjectInfo();
    let { success, Folders } = ExplorerReulst;
    if (success && Folders.length) {
        for (let s of Folders) {
            if (s.isGit) {
                gitList.push({"label": s.FolderName, "description": s.GitRepository, "projectPath":s.GitRepository, "action": "open"});
            };
        };
        let flist = Folders.map( item => {return item.GitRepository});
        await h.save(flist);
    };

    let historyData = await h.main();
    if (historyData.length && historyData) {
        gitList = [...historyData];
    };

    let pickerList = [
        {"label": "没有找到? 克隆仓库", "action": "clone"},
        {"label": "没有找到? 打开本地磁盘上的Git项目", "action": "openLocal"},
        ...gitList
    ];
    let selected = await hx.window.showQuickPick(pickerList, {
        'placeHolder': '请选择要打开的Git项目...'
    }).then( (res)=> {
        return res;
    });

    if (selected) {
        let {projectPath, label, action} = selected;
        let info = {
            "projectPath": projectPath,
            "projectName": label,
            "easyGitInner": true
        };

        if (action == 'clone') {
            hx.commands.executeCommand("EasyGit.clone");
        };
        if (action == 'openLocal') {
            selecteOpenLocalProject();
        };
        if (action == 'open') {
            hx.commands.executeCommand("EasyGit.main", info);
        };
    };
};



/**
 * @description 曾经打开的历史项目列表
 */
class History {
    constructor() {
        this.local_list = [];
    };

    // project: Array | String
    async save(project) {
        if (!project) return;
        try{

            let oldData = await this.read();
            if (Array.isArray(project)) {
                project = project.sort();
                if (JSON.stringify(project) == JSON.stringify(oldData)) return;
                oldData = [...project, ...oldData]
            } else {
                oldData.push(project);
            };

            const status = fs.existsSync(gitHistoryFile);
            if (!status) {
                mkdirsSync(gitHistoryDir);
            };

            let last = [...new Set(oldData)];
            fs.writeFile(gitHistoryFile, JSON.stringify(last), function (err) {
               if (err) throw err;
            });
        }catch(e){
            console.log(e);
        };
    };

    async read() {
        try{
            let fileRawContent = fs.readFileSync(gitHistoryFile, 'utf-8');
            let fileLastContent = JSON.parse(fileRawContent);

            let check = fileLastContent instanceof Object;
            if (!check) {return []};
            if (!fileLastContent.length || !fileLastContent) {return []};
            return fileLastContent.sort();
        }catch(e){
            return [];
        };
    };

    async main() {
        let historyData = await this.read();
        if (!historyData) return [];

        for (let s of historyData) {
            if (!fs.existsSync(s)) {
                continue;
            };
            let isCheckGit = await checkIsGitProject(s).catch( error => {
                return 'No'
            });
            let basename = path.basename(s);
            if (isCheckGit != 'No') {
                this.local_list.push({"projectPath": s,"description": s,"label": basename,"action": 'open'});
            };
        };
        return this.local_list;
    }
}


async function goValidate(formData, that) {
    // 检查：所有项不能为空
    for (let v in formData) {
        let info = (formData[v]).trim();
        if (info == "" || !info) {
            that.showError(`不能为空或填写错误`);
            return false;
        };
    };

    let {GitDir} = formData;

    let isExists = fs.existsSync(GitDir);
    if (!isExists) {
        that.showError(`选择的路径不存在！`);
        return false;
    };
    let state = fs.statSync(GitDir);
    if (!state.isDirectory()) {
        that.showError(`请选择正确的目录`);
        return false;
    };

    if (GitDir) {
        let isCheck = await checkIsGitProject(GitDir).catch( error => {
            return 'No'
        });
        if (isCheck != 'No') {
            return true;
        } else {
            that.showError(`当前选择的目录不是Git项目！`);
        };
    };
    return false;
};

/**
 * @description 选择并打开本地磁盘上的项目
 */
async function selecteOpenLocalProject() {
    let subtitle = '请选择本地磁盘上的Git项目';
    let formItems = [
        {type: "fileSelectInput",name: "GitDir",label: "选择",placeholder: '请选择本地磁盘上的Git项目', mode: "folder"},
    ];

    let Selected = await hx.window.showFormDialog({
        formItems: formItems,
        title: "打开Git项目",
        subtitle: subtitle,
        width: 480,
        height: 240,
        submitButtonText: "确定(&S)",
        cancelButtonText: "取消(&C)",
        validate: function(formData) {
            this.showError('');
            let checkResult = goValidate(formData, this);
            return checkResult;
        }
    }).then((res) => {
        return res;
    }).catch(error => {
        console.log(error);
    });

    if (!Selected) return;
    try{
        let {GitDir} = Selected;
        let projectName = path.basename(GitDir);
        let info = {
            "projectPath": GitDir,
            "projectName": projectName,
            "easyGitInner": true
        };
        hx.commands.executeCommand("EasyGit.main", info);

        // save history
        let h = new History();
        await h.save(GitDir);
    }catch(e){
        hx.window.showErrorMessage('EasyGit: 打开项目失败', ['我知道了']);
    }
};

module.exports = quickOpen;
