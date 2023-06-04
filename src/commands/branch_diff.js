const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');

let {
    gitRawGetBranch,
    gitCurrentBranchName,
    FileWriteAndOpen,
    gitRaw
} = require('../common/utils.js');
const {
    type
} = require('os');

const vueFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'bootstrap.min.css');
const customCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'custom.css');

// get hbuilderx version
let hxVersion = hx.env.appVersion;

/**
 * @description 窗口控件
 * @param {Object} selected
 */
function getUIData(data) {

    let {
        projectPath,
        current_branch,
        selectedFile,
        isSpecificFile
    } = data;

    let formItems = [{
            type: "fileSelectInput",
            mode: "folder",
            name: "projectAbsPath",
            label: "Git项目",
            placeholder: '请输入或选择要操作的Git项目路径...',
            value: projectPath
        },
        {type: "input",name: "branch1",label: "分支1",placeholder: "要对比的Git分支名称，比如main",value: current_branch},
        {type: "input",name: "branch2",label: "分支2",placeholder: "要对比的Git分支名称，比如main",value: current_branch}
    ];

    if (isSpecificFile) {
        formItems.push(
            {
                type: "fileSelectInput",
                mode: "file",
                name: "selectedAbsFile",
                label: "要对比的文件",
                placeholder: '请输入或选择要操作的Git文件路径...',
                value: selectedFile
            }
        );
    } else {
        formItems.push(
            {
                "type": "list",
                "title": "Git对比操作",
                "name": "diff_action",
                "columnStretches": [1],
                "items": [{
                        "columns": [{
                            "label": `<span style='color: #00a6ae;'> 分支1 </span> 和 <span style='color: #00a6ae;'> 分支2 </span>，两个分支有差异的文件名称及路径`
                        }]
                    },
                    {
                        "columns": [{
                            "label": `<span style='color: #00a6ae;'> 分支1 </span> 和 <span style='color: #00a6ae;'> 分支2 </span>，两个分支所有有差异的文件的详细差异`
                        }]
                    },
                    {
                        "columns": [{
                            "label": `<span style='color: #00a6ae;'> 分支1 </span>有, <span style='color: #00a6ae;'> 分支2 </span>没有的提交(git log)`
                        }]
                    },
                    {
                        "columns": [{
                            "label": `<span style='color: #00a6ae;'> 分支2 </span>有, <span style='color: #00a6ae;'> 分支1 </span>没有的提交(git log)`
                        }]
                    },
                    {
                        "columns": [{
                            "label": `<span style='color: #00a6ae;'> 分支1 </span> 和 <span style='color: #00a6ae;'> 分支2 </span> 有哪些不一样的log记录(不关心分支哪个多哪个少)`
                        }]
                    }
                ],
                "value": 0
            }
        );
    };

    return formItems;
};


/**
 *@description 打开分支比较视图
 */
var isDisplayError;
async function openBranchDiffView(ProjectInfo, isSpecificFile = false) {

    // 获取项目信息
    let { projectName, projectPath } = ProjectInfo;

    // 获取项目本地分支
    let current_branch = await gitCurrentBranchName(projectPath);
    let hxdata = Object.assign(
        ProjectInfo, {
            'current_branch': current_branch,
            "isSpecificFile": isSpecificFile
        },
    );

    let dialogTitle = isSpecificFile ? 'Git 对比两个分支上的指定文件' : 'Git 分支对比';
    let height = isSpecificFile ? 300 : 520;

    let formItems = getUIData(hxdata);

    let result = await hx.window.showFormDialog({
        title: dialogTitle,
        subtitle: "",
        width: 600,
        height: height,
        footer: "",
        formItems: formItems,
        submitButtonText: "确定(&S)",
        cancelButtonText: "关闭(&C)",
        onChanged: function(field, value) {},
        validate: function(formData) {
            if (formData.branch2.trim() == "" || formData.branch1.trim() == "") {
                this.showError("分支名称不能为空，请重新填写");
                return false;
            };
            if (formData.branch2.trim() == formData.branch1.trim()) {
                this.showError("分支1 和 分支2, 不能相同，请重新填写");
                return false;
            };
            return true;
        }
    }).then((res) => {
        return res;
    }).catch((err) => {
        return undefined;
    });


    if (result == undefined) return;

    let git_cmd = [];
    let {projectAbsPath,branch1,branch2,diff_action, selectedAbsFile} = result;
    if (branch1) {
        branch1 = branch1.trim();
    };
    if (branch2) {
        branch2 = branch2.trim();
    };

    if (isSpecificFile) {
        git_cmd = ["diff", branch1, branch2, `${selectedAbsFile}`]
    } else {
        switch (diff_action) {
            case 0:
                git_cmd = ["diff", branch1, branch2, "--stat"];
                break;
            case 1:
                git_cmd = ["diff", branch1, branch2];
                break;
            case 2:
                git_cmd = ["log", "--date=format:'%Y-%m-%d %H:%M:%S'", "--stat", branch1, `^${branch2}`];
                break;
            case 3:
                git_cmd = ["log", "--date=format:'%Y-%m-%d %H:%M:%S'", "--stat", branch2, `^${branch1}`];
                break;
            case 4:
                git_cmd = ["log", "--date=format:'%Y-%m-%d %H:%M:%S'", "--stat", "--left-right", `${branch1}...${branch2}`];
                break;
            default:
                break;
        };
    };
    console.log("git_cmd", git_cmd);

    let diff_result = await gitRaw(projectAbsPath, git_cmd, '分支对比', 'result');

    if (diff_result == 'fail' || diff_result == 'error') {
        hx.window.showInformationMessage(`操作失败: ${diff_msg}`, ["我知道了"]);
    } else {
        if (diff_result == '') {
            let diff_msg = isSpecificFile ? '两个分支指定的文件比较，没有差异。' : `${branch1} 和 ${branch2} 提交没有差异。`;
            hx.window.showInformationMessage(diff_msg, ["我知道了"]);
        } else {
            let fname = isSpecificFile ? 'git-diff-two-branch-file' : 'git-diff-two-branch';
            FileWriteAndOpen(fname, diff_result);
        };
    };
};


module.exports = openBranchDiffView;
