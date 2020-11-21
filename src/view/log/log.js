const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');
const Diff2Html = require('diff2html');

const utils = require('../../common/utils.js');
const icon = require('../static/icon.js');
const generateLogHtml = require('./html.js');


/**
 * @description 获取图标、各种颜色
 * @return {Object} UIData
 */
function getUIData() {
    // 根据主题适配颜色
    let colorData = utils.getThemeColor('right');
    let {fontColor,lineColor} = colorData;

    // svg icon
    let helpIcon = icon.getHelpIcon(fontColor);
    let refreshIcon = icon.getRefreshIcon(fontColor);
    let searchIcon = icon.getSearchIcon(fontColor);
    let noIcon = icon.getNoIcon(lineColor);
    let OpenFileIconSvg = icon.getOpenFileIcon(fontColor);

    let iconData = {helpIcon, refreshIcon, searchIcon, noIcon, OpenFileIconSvg};
    let uiData = Object.assign(iconData,colorData);
    return uiData
};

// UI: color and svg icon
let uiData = getUIData();


class GitLogAction {
    constructor(gitBasicData, userConfig, webView, renderType) {
        this.renderType = renderType;
        this.webviewPanel = webView;
        this.projectPath = gitBasicData.projectPath;
        this.projectName = gitBasicData.projectName;
        this.uiData = uiData;
        this.userConfig = userConfig;
        this.gitData = gitBasicData;
        this.currentProjectInfoForFlush = {
            'projectPath': gitBasicData.projectPath,
            'projectName': gitBasicData.projectName,
            'easyGitInner': true
        }
    };

    // 验证搜索条件是否是日期
    validateData(str) {
        if (['yesterday','today'].includes(str)) {
            return true;
        };
        return  /^(\d{4})(\/|\-)(\d{2})(\/|\-)(\d{2}) (\d{2})(?:\:\d{2}|:(\d{2}):(\d{2}))$/.test(str) || /^(\d{4})\-(\d{2}|\d{1})\-(\d{2}|\d{1})$/.test(str) || /^(\d{4})\/(\d{2}|\d{1})\/(\d{2}|\d{1})$/.test(str);
    };

    // 验证Email
    validateEmail(condition) {
        if (condition !='' &&
            !condition.includes(',') &&
            !condition.includes('--author=') &&
            (/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(condition))
        ) {
            return true;
        } else {
            return false;
        }
    };

    // set --group
    setGroupSearch(condition) {
        if (!this.validateData(condition) &&
            condition!='' &&
            !(fs.existsSync(path.join(this.projectPath, condition)))&&
            !(condition.includes('.')) &&
            !condition.includes(',') &&
            !condition.includes('-n ') &&
            !condition.includes('--grep=') &&
            !(/\-([A-Za-z]+)/.test(condition)) &&
            !(/\-\-([A-Za-z0-9]+)(\=?)/.test(condition)) &&
            !(/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(condition))
        ) {
            return true;
        } else {
            return false;
        };
    };

    // get webview html content, set html
    // searchType: ['branch', 'all']
    async setView(searchType, condition, refname) {
        if (condition != '' && condition == undefined) {
            // 引导用户正确的使用日期查询
            if(this.validateData(condition)){
                return hx.window.showErrorMessage(
                    '检测到您只输入了一个日期, 日期查询, 请使用--after、--before、--since、--until。例如:--after=2020/8/1 \n',
                    ['我知道了']
               );
            };

            // 引导email搜索
            if (this.validateEmail(condition)) {
                condition = '--author=' + condition;
            };

            // 引导使用--grep
            if (this.setGroupSearch(condition)) {
                condition = '--grep=' + condition;
            };
        };

        // 搜索，并获取搜索结果
        let gitLogInfo = await utils.gitLog(this.projectPath, searchType, condition, refname);

        // 获取提交数量
        // todo: 当查询具体文件的log时，CommitTotal计算错误
        let CommitTotal = 0;
        if (gitLogInfo.success) {
            try{
                let query = ["rev-list", "--branches", "--count"];
                if (condition.includes("all")) {
                    query = ["rev-list", "--all", "--count"];
                };
                CommitTotal = await utils.gitRaw(this.projectPath, query, undefined, "result");
                CommitTotal = parseInt(CommitTotal);
            }catch(e){}
        };

        // 设置git log数据
        this.gitData = Object.assign(
            this.gitData,
            { "branchNum": 1, "CommitTotal": CommitTotal },
            { "logData": gitLogInfo.data, 'LogErrorMsg': gitLogInfo.errorMsg },
        );

        if (condition != '' && condition != undefined) {
            this.gitData.searchText = condition;
        } else {
            delete this.gitData.searchText;
        };

        // 获取当前分支名称, 避免在某些情况下，在外部改变分支，此处未刷新的问题。
        try{
            let gitBranchInfo = await utils.gitRawGetBranch(this.projectPath, 'branch');
            this.gitData.branchNum = gitBranchInfo.length;
            let currentBranchName = gitBranchInfo.filter( (item) => { return item.current });
            if (currentBranchName) {
                this.gitData.currentBranch = (currentBranchName[0]['name']).replace('* ','');
            };
        }catch(e){};

        // set webview
        try{
            let isHtml = this.webviewPanel.webView._html;
            if (isHtml == '') {
                this.webviewPanel.webView.html = generateLogHtml(this.userConfig, this.uiData, this.gitData, this.renderType);
            } else {
                this.webviewPanel.webView.postMessage({
                    projectName: this.projectName,
                    refname: refname,
                    command: "search",
                    searchType: searchType,
                    searchText: condition,
                    gitData: this.gitData
                });
            };
        }catch(e){
            this.webviewPanel.webView.html = generateLogHtml(this.userConfig, this.uiData, this.gitData, this.renderType);
        }
    }

    // refresh
    async refreshView() {
        let that = this;
        setTimeout(function() {
            that.setView('branch', '');
        }, 1500);
    }

    // 显示commit 文件具体修改
    async showCommitFileChange(msg) {
        let {commitId, filePath} = msg;
        let options = [commitId, filePath];
        let result = await utils.gitShowCommitFileChange(this.projectPath, options);

        result.filePath = filePath;
        if ((result.data).length) {
            let diffHtml = Diff2Html.html(result.data, {
                drawFileList: false,
                matching: 'lines',
                outputFormat: 'line-by-line',
            });
            result.data = diffHtml;
            this.webviewPanel.webView.postMessage({
                command: "showCommitFileChange",
                result: result,
            });
        };
    }

    // 切换分支
    async switchBranch() {
        let BranchInfo = await utils.gitRawGetBranch(this.projectPath, 'branch');
        if (BranchInfo == 'fail' || BranchInfo == 'error') {
            return;
        };

        let LocalBranch = [];
        if (BranchInfo && BranchInfo != []) {
            for (let s of BranchInfo) {
                // let branch = s.current ? '*' + s.name : s.name;
                LocalBranch.push({ 'label': s.name, 'id': s.name })
            };
        };

        let branchID = await hx.window.showQuickPick(LocalBranch, {
            placeHolder: "请选择您要切换的分支.."
        }).then(function(result) {
            if (!result) {
                return;
            };
            return result.id;
        });

        if (branchID) {
            let status = await utils.gitBranchSwitch(this.projectPath, branchID);
            if (status == 'success') {
                this.setView('branch', '')
            }
        };
    }

    async cherryPick(hash) {
        let cherryPickInfo = {
            'hash': hash,
            'projectName': this.projectName,
            'projectPath': this.projectPath,
            'easyGitInner': true
        };
        hx.commands.executeCommand('EasyGit.cherryPick', cherryPickInfo);
        this.refreshView();
    }

    async revert(hash) {
        let revertInfo = {
            'hash': hash,
            'projectName': this.projectName,
            'projectPath': this.projectPath,
            'easyGitInner': true,
            'isFromGitView': true
        };
        let runResult = await hx.commands.executeCommand('EasyGit.revert', revertInfo);
        this.refreshView();
    }

    // 重置回退代码到某次提交
    async resetHardCommit(hash) {
        let shortHashValue = hash.slice(0,12);
        let options = ['--hard', hash];
        let status = await utils.gitReset(this.projectPath, options, `回退${shortHashValue}`);
        if (status == 'fail' || status == 'error') {
            hx.window.showErrorMessage(`Git: 回退${shortHashValue}操作失败`);
            return;
        } else {
            hx.window.showInformationMessage(`Git: 回退${shortHashValue} 操作成功！\n 后期可在[源代码管理器]视图中进行后续操作。`, ['我知道了']);
            this.setView('branch', '');
            let that = this;
            setTimeout(function() {
                hx.commands.executeCommand('EasyGit.main', that.currentProjectInfoForFlush);
            }, 1500);
        }
    }

    // 检出具体的commit
    async checkoutCommit(hash) {
        let result = await hx.window.showInformationMessage('检出该提交将创建一个分离的HEAD, 此时不在任何分支上。', ['确定检出', '取消']).then( (result) => {
            return result;
        });
        if (result == '确定检出') {
            let options = ['checkout', hash];
            let shortHashValue = hash.slice(0,12);
            let status = await utils.gitRaw(this.projectPath, options, `检出${shortHashValue}`);
            if (status == 'fail' || status == 'error') {
                hx.window.showErrorMessage(`Git: 检出${shortHashValue}操作失败`);
                return;
            } else {
                this.setView('branch', '');
                let that = this;
                setTimeout(function() {
                    hx.commands.executeCommand('EasyGit.main', that.currentProjectInfoForFlush);
                }, 1500);
            }
        };
    }

    // 检出具体commit并创建新分支
    async checkoutCommitForCreateBranch(hash) {
        hx.window.setStatusBarMessage('EasyGit: 请在【左侧视图】源代码管理器视图内，进行操作。', 5000, 'info');
        let data = Object.assign(this.currentProjectInfoForFlush, {
            "GitAssignAction": {
                "name": "create-branch",
                "value": hash
            }
        });
        hx.commands.executeCommand('EasyGit.branch', data);
    }

    // 创建tag
    async createTag(hash) {
        let shortHashValue = hash.slice(0,12);
        let data = {
            "hash": shortHashValue,
            "projectPath": this.projectPath,
            "projectName": this.projectName,
            "easyGitInner": true
        };
        hx.commands.executeCommand('EasyGit.tagCreate', data);
    }

    // 显示所有的分支、tags
    async goRefs() {
        let pickerData = [];
        let info = await utils.gitRefs(this.projectPath);
        let { localBranchList, remoteBranchList, tags } = info;

        if (localBranchList != undefined) {
            for (let s of localBranchList) {
                pickerData.push({"label": s.name});
            };
        };
        if (remoteBranchList != undefined) {
            for (let s of remoteBranchList) {
                pickerData.push({"label": s.name});
            };
        };
        if (tags != undefined) {
            for (let s of tags) {
                pickerData.push({"label": s});
            };
        };

        let refs = [];
        for (let s of pickerData) {
            refs.push(s.label);
        };

        let selected = await hx.window.showQuickPick(pickerData, {
            placeHolder: "请选择您查看的分支或tag.."
        }).then( (selected) => {
            return selected;
        });

        if (selected == undefined) { return; };
        this.setView('branch', '', selected.label);
    }
};


module.exports = {
    getUIData,
    GitLogAction
}
