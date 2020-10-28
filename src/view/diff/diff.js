const fs = require('fs');
const path = require('path');

const Diff2Html = require('diff2html');

const hx = require('hbuilderx');

let utils = require('../../common/utils.js');
const gitAction = require('../../git.js');

const icon = require('../static/icon.js');
const {getWebviewDiffContent} = require('./html.js')


class Diff {
    constructor(ProjectData, userConfig, webviewPanel) {
        this.webviewPanel = webviewPanel;
        this.projectPath = ProjectData.projectPath;
        this.userConfig = userConfig;
    }

    async getDiffOptions(selectedFile) {
        let statusInfo = await utils.gitFileStatus(this.projectPath, ['-s', selectedFile]);

        let gitIndex = statusInfo.index;
        let gitWorking_dir = (statusInfo.working_dir).trim();

        let options = ['diff', selectedFile];

        let fileName = selectedFile.replace(this.projectPath, '').replace(/\\/g, '\/');
        let titleLeft = fileName;
        let titleRight = fileName;

        switch (gitIndex){
            case 'M':
                options = ['diff','--staged', selectedFile];
                titleRight = 'Working Tree : ' + titleRight;
                break;
            case 'A':
                options = ['diff','--cached', selectedFile];
                break;
            case 'U':
                options = ['diff','HEAD', selectedFile];
                titleRight = 'HEAD : ' + titleRight;
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
        this.webviewPanel.webView.html = getWebviewDiffContent(
            this.selectedFile,
            this.userConfig,
            diffData
        );
    }
}


module.exports = {
    Diff
};
