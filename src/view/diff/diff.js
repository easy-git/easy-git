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
    }

    async getDiffOptions(selectedFile) {
        let statusInfo = await utils.gitFileStatus(this.projectPath, ['-s', selectedFile]);

        // 目前仅支持对比本地有更改的文件
        if (statusInfo == undefined) {
            return 'error';
        };

        let gitIndex = statusInfo.index;
        let gitWorking_dir = (statusInfo.working_dir).trim();

        let options = ['diff', selectedFile];

        let fileName = selectedFile.replace(this.projectPath, '').replace(/\\/g, '\/');
        let titleLeft, titleRight;

        switch (gitIndex){
            case 'M':
                options = ['diff','--staged', selectedFile];
                titleRight = 'Working Tree';
                break;
            case 'A':
                options = ['diff','--cached', selectedFile];
                break;
            case 'U':
                if (gitWorking_dir == 'U') {
                    options = ['diff', selectedFile];
                } else {
                    options = ['diff','HEAD', selectedFile];
                }
                titleRight = 'HEAD';
                break;
            default:
                break;
        }
        let data = {
            "diff_options": options,
            "titleLeft": titleLeft,
            "titleRight": titleRight
        }
        return data;
    }

    async SetView(selectedFile) {
        let init = await this.getDiffOptions(selectedFile);

        if (init == 'error') {
            this.webviewPanel.webView.htm = getDefaultContent();
            return;
        };
        let {diff_options, titleLeft, titleRight} = init;

        let result = await utils.gitRaw(this.projectPath, diff_options, '获取Git差异', 'result');
        if (result == 'success' || result == 'fail' || result == 'error') {
            return;
        };

        let diffJson = Diff2Html.parse(result);;
        let diffResult = Diff2Html.html(diffJson, {
            drawFileList: false,
            matching: 'lines',
            outputFormat: 'side-by-side',
        });

        // 替换特殊字符
        diffResult = diffResult.replace(new RegExp("`","gm"), '&#x60;').replace(new RegExp("{","gm"), '&#123;').replace(new RegExp("}","gm"), '&#125;');

        let diffData = {
            "diffResult": diffResult,
            "titleLeft": titleLeft,
            "titleRight": titleRight
        }

        let selectedFilePath = path.normalize(path.join(this.projectPath, selectedFile));
        this.webviewPanel.webView.html = getWebviewDiffContent(
            selectedFilePath,
            this.userConfig,
            diffData
        );
    }
}


module.exports = {
    Diff
};
