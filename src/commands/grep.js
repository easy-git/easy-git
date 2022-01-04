const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const hx = require('hbuilderx');

const {
    applyEdit,
    gitRaw,
    FileWriteAndOpen,
    createOutputChannel,
} = require('../common/utils.js');

class gitGrep {
    constructor(projectInfo) {
        this.projectPath = projectInfo.projectPath;
        this.projectName = projectInfo.projectName;
        this.selected = projectInfo.selectedFile;
    };

    /**
     * @description 校验输入
     * @param {Object} formData
     * @param {Object} that
     */
    async goValidate(formData, that) {
        let {find_str, is_untracked, find_version} = formData;
        let tmp = find_str;
        if (tmp.length == 0) {
            that.showError('要查找的字符串不能为空');
            return false;
        };
        if (find_str.match(/^[ ]*$/)) {
            that.showError('要查找的字符串不能全部为空格！');
            return false;
        };
        if (find_version && is_untracked) {
            that.showError('指定分支查询时，请勿勾选--untracked！');
            return false;
        };
        return true;
    };

    /**
     * @description 绘制视图
     * @param {Object} formData
     */
    getFormItems(formData) {
        let title = 'Git grep - 在Git仓库中查找字符串';
        let subtitle = '';
        let footer = '<a href="https://easy-git.github.io/extensions/grep">git grep技巧</a>';
        let find_dir = this.selected ? this.selected : '';
        let current_branch = "";

        let formItems = [
            {type: "input",name: "find_str",label: "查找内容",placeholder: '输入要查找的字符',value: ""},
            {type: "input",name: "find_version",label: "查找的版本库",placeholder: `可选 ${current_branch}`, value: ''},
            {type: "label",name: "find_version_desc",text: '<span style="color: #a0a0a0; font-size: 11px;">默认为当前分支, 可指定查找其它分支、tag、或指定commitID</span>'},
            {type: "input",name: "find_dir",label: "查找目录或文件",placeholder: '可选，默认为当前选中的目录或文件',value: find_dir},
            {type: "label",name: "find_dir_desc",text: '<span style="color: #a0a0a0; font-size: 11px;">默认在当前项目下查找；可指定目录或文件；或指定特定后缀的文件，如*.js；或在包含特定名称的文件中搜索，如package*</span>'},
            {type: "label",name: "blank_line_1",text: ""},
            {type: "checkBox",name: "is_show_line_number",label: "查找结果，是否显示行号", value: true},
            {type: "checkBox",name: "is_name_only",label: "查找结果，是否仅显示文件名", value: false},
            {type: "checkBox",name: "is_ignore_case",label: "查找，是否忽略大小写。默认忽略。去掉勾选，则匹配大小写。", value: true},
            {type: "checkBox",name: "is_untracked",label: "查找，是否包含未跟踪的文件，即--untracked参数。", value: false},
            {type: "label",name: "blank_line_2",text: ""},
        ];

        return {
            title: title,
            subtitle: subtitle,
            width: 430,
            height: 320,
            footer: footer,
            formItems: formItems,
        };
    };

    async view() {
        let that = this;
        let info = await hx.window.showFormDialog({
            submitButtonText: "开始搜索(&S)",
            cancelButtonText: "取消(&C)",
            validate: function(formData) {
                let checkResult = that.goValidate(formData, this);
                return checkResult;
            },
            onChanged: function (field, value, formData) {
                this.showError('');
                if (field == "action") {
                    this.updateForm(that.getFormItems(value, formData));
                }
            },
            ...that.getFormItems()
        }).then((res) => {
            return res;
        }).catch(error => {
            console.log(error);
        });
        return info;
    };

    async main() {
        let inputResult = await this.view();
        if (!inputResult) return;

        let {find_dir, find_str, find_version, is_ignore_case, is_name_only, is_show_line_number, is_untracked} = inputResult;

        let grep_cmd = ["grep", "--break", "--heading"];
        if (is_show_line_number) {
            grep_cmd.push("-n");
        };
        if (is_ignore_case) {
            grep_cmd.push("-i");
        };
        if (is_untracked) {
            grep_cmd.push('--untracked')
        };
        if (find_version) {
            grep_cmd.push("-p");
        };
        if (find_str) {
            grep_cmd.push(find_str);
        };
        if (find_version) {
            grep_cmd.push(find_version);
        };
        if (find_dir){
            grep_cmd.push(find_dir);
        };

        console.error("git搜索命令：", grep_cmd);

        let grep_result = await gitRaw(this.projectPath, grep_cmd, undefined, 'result');
        console.log('---', grep_result)
        const fname = 'git-grep.js';
        try{
            if (['fail','error','',undefined].includes(grep_result)) {
                grep_result = "";
                hx.window.setStatusBarMessage("EasyGit: grep操作，发生错误.", 10000, "error");
            };
            await FileWriteAndOpen(fname, grep_result);
        } catch(e) {
            hx.window.setStatusBarMessage("EasyGit: grep操作，发生异常.", 10000, "error");
        };
    }
};

module.exports = gitGrep;
