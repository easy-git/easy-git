const hx = require('hbuilderx');
const fs = require('fs');
const path = require('path');

// 模板目录
const github_gitignore_template_dir = path.join(path.resolve(__dirname, '..'), "template", "github_gitignore_template");

// gitignore模板汇总的json文件内容
var github_gitignore_template = {};

// 用于from窗口模板展示
var gitignore_json_file = [];


/**
 * @description from视图内容项
 * @param {String} selectedDir
 */
function getFormItems(selectedDir="") {
    try{
        github_gitignore_template = require('../template/github_gitignore_template.json');
        for (let s of Object.values(github_gitignore_template)) {
            let label = s["label"];
            let t = {"columns":[{"label": label }, {"label": ".gitignore " + s["desc"]}]}
            gitignore_json_file.push(t)
        }
    }catch(e){
        gitignore_json_file = [
            {"columns":[ {"label": "default"}, {"label": ".gitignore 默认模板"}] }
        ];
    };

    let templates = [...gitignore_json_file];

    return {
        formItems: [{
            "type": "input",
            "name": "filename",
            "placeholder": "文件名，必须为.gitignore",
            "disabled": true,
            "value": ".gitignore"
        }, {
            "type": "fileSelectInput",
            "name": "createDir",
            "placeholder": "创建目录",
            "value": selectedDir
        }, {
            "type": "list",
            "title": "选择模板",
            "name": "template",
            "columnStretches": [1, 2],
            "items": templates,
            "value": 0
        }]
    }
};

/**
 * @description 复制文件
 */
function copyFile(template_path, target_path, isOpenFile) {
    return new Promise((resolve, reject) => {
        fs.copyFile(template_path, target_path, (err) => {
            if (err) {
                hx.window.setStatusBarMessage('.gitignore创建失败!');
                reject('fail');
            } else {
                if (isOpenFile) {
                    hx.workspace.openTextDocument(target_path);
                };
                hx.window.setStatusBarMessage('.gitignore创建成功!');
                resolve('success');
            };
        });
    });
};

/**
 * @description 验证窗口输入项
 * @param {String} param
 */
function goValidate(formData, that) {
    let {createDir} = formData;

    let target_path = path.join(createDir, '.gitignore');
    let isExist = fs.existsSync(target_path);
    if (isExist) {
        that.showError("当前选择的目录下，已存在.gitignore文件");
        return false;
    };

    let stat = fs.statSync(createDir);
    if (!stat.isDirectory()) {
        that.showError("请选择或输入正确的目录路径");
        return false;
    };
    return true;
};

/**
 * @description 创建.gitignore主程序入口
 * @param {*} param
 */
async function gitignore(param) {
    let {selectedFile} = param;
    let selectedDir = "";
    if (selectedFile != undefined) {
        let stat = fs.statSync(selectedFile);
        if (stat.isDirectory()) {
            selectedDir = selectedFile;
        };
        if (stat.isFile()) {
            selectedDir = path.dirname(selectedFile);
        };
    };

    let formInfo = await hx.window.showFormDialog({
        title: "新建.gitignore",
        width: 640,
        height: 480,
        submitButtonText: "创建(&S)",
        cancelButtonText: "取消(&C)",
        validate: function(formData) {
            let checkResult = goValidate(formData, this);
            return checkResult;
        },
        ...getFormItems(selectedDir)
    }).then((res) => {
        return res;
    }).catch(error => {
        console.log(error);
    });
    if (formInfo == undefined) return;

    try{
        let {createDir, template} = formInfo;
        let langID = gitignore_json_file[template]["columns"][0]["label"];
        let templateContext = github_gitignore_template[langID];
        let template_file_name = templateContext["name"];

        let source_path = path.join(github_gitignore_template_dir, template_file_name);
        let target_path = path.join(createDir, '.gitignore');
        await copyFile(source_path, target_path, true);
    }catch(e){
        hx.window.setStatusBarMessage("EasyGit: 创建.gitignore失败", 5000, "error");
        hx.window.s
    }
};

module.exports = gitignore;
