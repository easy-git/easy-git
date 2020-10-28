const fs = require('fs');
const path = require('path');

const Diff2Html = require('diff2html');

const hx = require('hbuilderx');

let utils = require('../../common/utils.js');
const gitAction = require('../../git.js');

const icon = require('../static/icon.js');
const getWebviewDiffContent = require('./html.js')

/**
 * @description 获取图标、各种颜色
 * @return {Object} UIData
 */
function getUIData() {

    // 根据主题适配颜色
    let colorData = utils.getThemeColor('right');
    let {fontColor} = colorData;

    // svg icon
    let AddIconSvg = icon.getAddIcon(fontColor);
    let iconRefresh = icon.getRefreshIcon(fontColor);
    let UpArrowIcon = icon.getUpArrowIcon(fontColor);
    let UpArrowIcon2 = icon.getUpArrowIcon2(fontColor);
    let BackIcon = icon.getBackIcon(fontColor);
    let DownArrowIcon = icon.getDownArrowIcon(fontColor);
    let BranchIcon = icon.getBranchIcon(fontColor);
    let XIcon = icon.getXIcon(fontColor);
    let SyncIcon = icon.getSyncIcon(fontColor);
    let MergeIcon = icon.getMergeIcon(fontColor);
    let TagIcon = icon.getTagIcon(fontColor);
    let uploadIcon = icon.getUploadIcon(fontColor);
    let cloudIcon = icon.getCloudIcon(fontColor);
    let ShowIcon = icon.getShowIcon(fontColor);

    let iconData = {
        AddIconSvg,
        iconRefresh,
        UpArrowIcon,
        UpArrowIcon2,
        BackIcon,
        DownArrowIcon,
        BranchIcon,
        XIcon,
        SyncIcon,
        MergeIcon,
        TagIcon,
        uploadIcon,
        cloudIcon,
        ShowIcon
    };

    let uiData = Object.assign(iconData,colorData);
    return uiData;
};

let uiData = getUIData();


class Diff {
    constructor(ProjectData, userConfig, webviewPanel) {
        this.webviewPanel = webviewPanel;
        this.projectPath = ProjectData.projectPath;
        this.uiData = uiData;
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
            this.uiData,
            diffData
        );
    }
}


module.exports = {
    getUIData,
    Diff
};
