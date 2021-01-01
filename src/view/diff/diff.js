const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
        if (statusInfo == undefined) {
            return 'error';
        };

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
                };
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

    /**
     * @description 设置文件对比视图
     * @param {String} selectedFile
     */
    async SetView(selectedFile) {
        let init = await this.getDiffOptions(selectedFile);

        // 设置html默认内容
        if (init == 'error') {
            this.webviewPanel.webView.html = getDefaultContent(selectedFile);
            return;
        };

        let {diff_options, titleLeft, titleRight, isConflicted} = init;

        let result = await utils.gitRaw(this.projectPath, diff_options, undefined, 'result');
        if (result == 'success' || result == 'fail' || result == 'error') {
            return;
        };

        // 使用Diff2Html将文件对比结果转换为html
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
            "isDiffHtml": true,
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

    read_file(path,callback){
        return new Promise(function(resolve, reject) {
            try{
                let fRead = fs.createReadStream(path);
                let objReadline = readline.createInterface({
                    input:fRead
                });
                let arr = new Array();
                objReadline.on('line',function (line) {
                    arr.push(line);
                });
                objReadline.on('close',function () {
                    resolve(arr);
                });
            }catch(e){
                reject(e);
            };
        });
    };

    /**
     * @description 设置处理冲突之后的视图
     * @param {Object} selectedFile
     */
    async setConflictedView(selectedFile) {
        let fpath = path.join(this.projectPath, selectedFile);
        let content = await this.read_file(fpath,function (data) {
            return data;
        });
        if (content) {
            let diffData = {
                "isDiffHtml": false,
                "diffResult": content,
                "titleLeft": '',
                "titleRight": '',
                "isConflicted": true
            };
            this.webviewPanel.webView.postMessage({
                command: "update",
                result: diffData
            });
        };
    };

    /**
     * @description 解决冲突 git checkout --ours|--theris <filename>
     * @param {Object} selectedFile 选择的文件路径
     * @param {Object} options
     */
    async handleConflict(selectedFile, options) {
        let result = await utils.gitRaw(this.projectPath, options, '处理冲突');
        if (result == 'success') {
            this.setConflictedView(selectedFile);
            let msg = options[1] == '--ours' ? 'EasyGit：保留当前分支文件，操作成功。' : 'EasyGit：采用传入的文件，操作成功。'
            hx.window.setStatusBarMessage(msg);
        };
    }

    /**
     * @description 打开文件并跳转到指定的行
     * @param {filepath} 项目文件相对路径
     */
    async openFile(filepath) {
        let fspath = path.join(this.projectPath, filepath);

        let checkResult = await utils.gitRaw(this.projectPath, ['diff', '--check', filepath], undefined, 'result');
        if (checkResult.length && checkResult.includes('conflict')) {
            let data = checkResult.split('\n');
            let conflictList = data.filter(item => item.includes(filepath) );
            let num = conflictList.length;

            let firstConflict = 0;
            try{
                firstConflict = conflictList[0].split(':')[1];
            }catch(e){};

            hx.workspace.openTextDocument(fspath).then(doc => {
                hx.window.showTextDocument(doc, {
                    selection: {start: {line: Number(firstConflict), character: 0}}
                });
            });
        } else {
            let fPath = path.join(this.projectPath, filepath);
            hx.workspace.openTextDocument(fPath);
        };
    };
}


module.exports = {
    Diff
};
