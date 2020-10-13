const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');

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

    let iconData = {helpIcon,refreshIcon,searchIcon,noIcon};
    let uiData = Object.assign(iconData,colorData);
    return uiData
};

// UI: color and svg icon
let uiData = getUIData();


class GitLogAction {
    constructor(gitBasicData, userConfig, webView) {
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
        if (condition!='default' &&
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
            condition!='default' &&
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
    async setView(searchType, condition) {

        if (condition != 'default' && condition == undefined) {
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
        let gitLogInfo = await utils.gitLog(this.projectPath, searchType, condition);

        if (!gitLogInfo.success && gitLogInfo.errorMsg == '') {
            return hx.window.showErrorMessage('获取日志失败，未知错误。请重新尝试操作，或通过运行日志查看错误。',['关闭']);
        };
        if (!gitLogInfo.success && gitLogInfo.errorMsg != '') {
            let emsg = `日志搜索失败，原因：<span>${gitLogInfo.errorMsg}。</span>请查看: <a href="https://ext.dcloud.net.cn/plugin?id=2475">git log搜索方法</a>`
            return hx.window.showErrorMessage(emsg,['关闭']);
        };

        // 获取提交数量
        let CommitTotal = 0;
        try{
            CommitTotal = await utils.gitRaw(this.projectPath, ["rev-list", "--all", "--count"], "获取commit提交总数", "result");
            CommitTotal = parseInt(CommitTotal);
        }catch(e){}

        // 设置git log数据
        this.gitData = Object.assign(
            this.gitData,
            { "branchNum": 1, "CommitTotal": CommitTotal },
            { "logData": gitLogInfo.data },
        );

        if (condition != 'default') {
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
        if (condition != 'default') {
            let isHtml = this.webviewPanel.webView._html;
            if (isHtml == '') {
                let htmlContent = generateLogHtml(this.userConfig, this.uiData, this.gitData);
                this.webviewPanel.webView.html = htmlContent;
            } else {
                this.webviewPanel.webView.postMessage({
                    command: "search",
                    searchType: searchType,
                    projectName: this.projectName,
                    gitData: this.gitData,
                    CommitTotal: CommitTotal,
                });
            };
        } else {
            this.webviewPanel.webView.html = generateLogHtml(this.userConfig, this.uiData, this.gitData);
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
                this.setView('branch', 'default')
            }
        };
    }

    async cherryPick(hash) {
        let cmd = ['cherry-pick', '-x', hash];
        let status = await utils.gitRaw(this.projectPath, cmd, 'cherry-pick');
        if (status == 'fail' || status == 'error') {
            hx.window.showErrorMessage(`Git: ${cmd}操作失败`);
            return;
        } else {
            let data = {
                'projectPath': this.projectPath,
                'projectName': this.projectName,
                'easyGitInner': true
            };
            hx.window.showInformationMessage('Git: cherry-pick 操作成功！', ['现在push','以后push' ,'关闭']).then((result) => {
                if (result == '现在push') {
                    hx.commands.executeCommand('EasyGit.push', data);
                } else {
                    hx.commands.executeCommand('EasyGit.main',data);
                };
            });
            return;
        }
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
            this.setView('branch', 'default');
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
                this.setView('branch', 'default');
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
        let tagName = await hx.window.showInputBox({
            prompt:`在${shortHashValue}上创建标签`,
            placeHolder: '标签名称, 创建后会自动推送到远端......'
        }).then((result)=>{
            if (result.length == 0) {
                hx.window.showErrorMessage('请输入有效的标签', ['我知道了']);
                return;
            };
            return result;
        });
        if (tagName.length) {
            let options = [tagName, hash];
            let status = await utils.gitTagCreate(this.projectPath, options, tagName);
            if (status == 'success') {
                hx.window.showInformationMessage(`Git: 在${hash}上创建标签成功！`, ['我知道了']);
                this.setView('branch', 'default');
            }
        }
    }

};


module.exports = {
    getUIData,
    GitLogAction
}
