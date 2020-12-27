const fs = require('fs');
const path = require('path');

const Diff2Html = require('diff2html');

const hx = require('hbuilderx');

let utils = require('../../common/utils.js');

const icon = require('../static/icon.js');
const {getWebviewDiffContent, getDefaultContent} = require('./html.js')


class Diff {
    constructor(ProjectData, userConfig, webviewPanel) {
        this.webviewPanel = webviewPanel;
        this.projectPath = ProjectData.projectPath;
        this.userConfig = userConfig;
        this.isFullTextDiffFile = 3;
    }

    async getFileDiffConfig() {
        let config = await hx.workspace.getConfiguration();
        let isFullTextDiffFile = config.get('EasyGit.isFullTextDiffFile');
        if (isFullTextDiffFile != 'full' && isFullTextDiffFile) {
            try{
                let result = parseInt(isFullTextDiffFile);
                if (typeof result === 'number' && !isNaN(result)) {
                    this.isFullTextDiffFile = result;
                } else {
                    this.isFullTextDiffFile = 3;
                };
            }catch(e){
                this.isFullTextDiffFile = 3;
            };
        };
        if (isFullTextDiffFile == 'full' || isFullTextDiffFile == true) {
            this.isFullTextDiffFile = 100000;
        };

        let msg = `EasyGit: 目前文件对比使用 ${this.isFullTextDiffFile} 行上下文生成差异, 是否修改？修改后，下次生效。`;
        setTimeout(function() {
            if (isFullTextDiffFile == undefined) {
                hx.window.showInformationMessage(msg, ['使用全文对比', '保持默认']).then( (res)=> {
                    if (res == '保持默认') {
                        config.update("EasyGit.isFullTextDiffFile", "3").then(() => {});
                    };
                    if (res == '使用全文对比') {
                        this.isFullTextDiffFile = 100000;
                        config.update("EasyGit.isFullTextDiffFile", "full").then(() => {});
                    };
                });
            };
        }, 3500);
    }

    async getDiffOptions(selectedFile) {

        // 是否全文显示对比
        await this.getFileDiffConfig();

        let resut = await utils.gitFileStatus(this.projectPath, selectedFile, ['-s', selectedFile]);

        // 目前仅支持对比本地有更改的文件
        if (resut == undefined || resut == 'error') {
            return 'error';
        };

        let {statusInfo, isConflicted} = resut;
        let gitIndex = statusInfo.index;
        let gitWorking_dir = (statusInfo.working_dir).trim();

        let lineOption = `-U${this.isFullTextDiffFile}`;
        let options = ['diff', lineOption, selectedFile];

        let fileName = selectedFile.replace(this.projectPath, '').replace(/\\/g, '\/');
        let titleLeft, titleRight;

        switch (gitIndex){
            case 'M':
                options = ['diff', lineOption, '--staged', selectedFile];
                titleRight = 'Working Tree';
                break;
            case 'A':
                options = ['diff', lineOption, '--cached', selectedFile];
                break;
            case 'U':
                if (gitWorking_dir == 'U') {
                    options = ['diff',  lineOption, selectedFile];
                } else {
                    options = ['diff', lineOption, 'HEAD', selectedFile];
                }
                titleRight = 'HEAD';
                break;
            default:
                break;
        };
        let data = {
            "diff_options": options,
            "titleLeft": titleLeft,
            "titleRight": titleRight,
            "isConflicted": isConflicted
        };
        return data;
    }

    async SetView(selectedFile) {
        let init = await this.getDiffOptions(selectedFile);

        if (init == 'error') {
            this.webviewPanel.webView.htm = getDefaultContent();
            return;
        };

        let {diff_options, titleLeft, titleRight, isConflicted} = init;

        let result = await utils.gitRaw(this.projectPath, diff_options, undefined, 'result');
        if (result == 'success' || result == 'fail' || result == 'error') {
            return;
        };

        let diffJson = Diff2Html.parse(result);;
        let diffResult;

        diffResult = Diff2Html.html(diffJson, {
            drawFileList: false,
            matching: 'lines',
            outputFormat: 'side-by-side',
        });

        // 替换特殊字符
        diffResult = diffResult.replace(new RegExp("`","gm"), '&#x60;').replace(new RegExp("{","gm"), '&#123;').replace(new RegExp("}","gm"), '&#125;');

        let diffData = {
            "diffResult": diffResult,
            "titleLeft": titleLeft,
            "titleRight": titleRight,
            "isConflicted": isConflicted
        };

        let selectedFilePath = path.normalize(path.join(this.projectPath, selectedFile));
        this.webviewPanel.webView.html = getWebviewDiffContent(
            selectedFilePath,
            this.userConfig,
            diffData
        );
    };

    async handleConflict(selectedFile, options) {
        let result = await utils.gitRaw(this.projectPath, options, '处理冲突');
        if (result == 'success') {
            this.SetView(selectedFile);
            setTimeout(function() {
                let msg = options[1] == '--ours' ? 'EasyGit：保留当前分支文件，操作成功。' : 'EasyGit：采用传入的文件，操作成功。'
                hx.window.setStatusBarMessage(msg);
            }, 3000);
        };
    }
}


module.exports = {
    Diff
};
