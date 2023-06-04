const fs = require('fs');
const path = require('path');

const hx = require('hbuilderx');

let {
    gitRawGetBranch,
    gitCurrentBranchName,
    FileWriteAndOpen,
    gitRaw
} = require('../common/utils.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'bootstrap.min.css');
const customCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'custom.css');

// get hbuilderx version
let hxVersion = hx.env.appVersion;

/**
 *@description 打开分支比较视图
 */
var isDisplayError;
async function openBranchDiffView(ProjectInfo, isSpecificFile=false) {

    // 获取项目信息
    let { projectName, projectPath } = ProjectInfo;

    // 获取项目本地分支
    let current_branch = await gitCurrentBranchName(projectPath);
    let hxdata = Object.assign(
        ProjectInfo,
        {'current_branch': current_branch, "isSpecificFile": isSpecificFile},
    );

    let dialogTitle = isSpecificFile ? 'Git 对比两个分支上的指定文件' : 'Git 分支对比';
    let height = isSpecificFile ? 400 : 450;
    // 创建webviewdialog
    let webviewDialog = hx.window.createWebViewDialog({
        modal: true,
        title: dialogTitle,
        dialogButtons: ["开始比较", "关闭"],
        size: {
            width: 730,
            height: height
        }
    }, {
        enableScripts: true
    });

    let webview = webviewDialog.webView;
    webview.html = generateLogHtml(hxdata);

    webview.onDidReceiveMessage((msg) => {
        let action = msg.command;
        let { info } = msg;
        switch (action) {
            case 'closed':
                webviewDialog.close();
                break;
            case 'branchDiff':
                diff_operations(webviewDialog, webview, projectPath, info);
                break;
            case 'twoBranchSpecificFileDiff':
                diff_operations(webviewDialog, webview, projectPath, info, isSpecificFile);
                break;
            default:
                break;
        };
    });

    let promi = webviewDialog.show();
    promi.then(function (data) {
        // 处理错误信息
    });
};


async function diff_operations(webviewDialog, webview, projectPath, info, isSpecificFile=false) {
    // 清除上次错误提示
    if (isDisplayError) {
        webviewDialog.displayError('');
    };

    let {branch1, branch2, param, stat, selectedFile} = info;

    if (branch1 == branch2) {
        webviewDialog.displayError('提示：对比操作，两个分支名称不能相同，且不能为空，请修改。');
        return;
    };
    if (branch1.length == 0|| branch2.length == 0 || !branch2 || !branch1) {
        webviewDialog.displayError('提示：对比操作，分支名称不能为空。');
        return;
    };
    if ((!param || param.length == 0 ) && !isSpecificFile) {
        webviewDialog.displayError('提示：请勾选要进行的操作。');
        return;
    };

    let all_branch = await gitRawGetBranch(projectPath, 'branch');
    let branch_list = all_branch.map(function(x) {
        if (x["current"]) {
            return x["name"].replace('* ','');
        } else {
            return x["name"];
        };
    });
    if (!branch_list.includes(branch1)) {
        webviewDialog.displayError(`本地分支 ${branch1} 不存在。`);
        return;
    };
    if (!branch_list.includes(branch2)) {
        webviewDialog.displayError(`本地分支 ${branch2} 不存在。`);
        return;
    };

    webviewDialog.setButtonStatus("开始比较", ["loading", "disable"]);

    // 组织git命令行参数
    let cmd = [];

    // 构建参数: 用于两个分支提交比较，显示两个分支指定文件的差异，用不到。
    if (!isSpecificFile) {
        cmd = param.split(" ");
        cmd.splice(1,0, `--pretty=format:"%H - %an %ad %s"`);
        cmd.splice(2,0, `--date=format:"%Y-%m-%d %H:%M:%S"`);

        // 用于显示具体的文件修改列表
        if (stat) {
            cmd.push('--stat');
        };
    };

    // 构建参数: 显示两个分支指定文件的差异
    if (isSpecificFile) {
        cmd = ['diff', branch1, branch2, selectedFile];
    };

    let msg = isSpecificFile? '显示两个分支指定文件的差异' : '两个分支对比提交';
    let diff_result = await gitRaw(projectPath, cmd, '分支对比', 'result');

    webviewDialog.setButtonStatus("开始比较", []);
    webview.postMessage({
        command: 'diffResult',
        status: diff_result
    });

    if (diff_result == 'fail' || diff_result == 'error') {
        isDisplayError = true;
        webviewDialog.displayError('Git: 操作失败, 请在底部控制台查看失败原因!');
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

/**
 * @description generationhtml
 */
function generateLogHtml(hxdata) {

    // selectedFile，isSpecificFile两个参数，用于：显示两个分支指定文件的差异
    let {current_branch, projectName, selectedFile, isSpecificFile} = hxdata;

    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="${bootstrapCssFile}">
            <link rel="stylesheet" href="${customCssFile}">
            <script src="${vueFile}"></script>
            <style type="text/css">
                .diff_param {
                    list-style: none;
                    padding-left: 0;
                }
                .diff_param li {
                    margin: 8px 10px 8px 0px;
                }
                .diff_param li input{
                    margin-left: 8px;
                }
                .diff_param li span{
                    color: rgb(65,168,99);
                    font-weight: 500;
                }
            </style>
        </head>
        <body>
            <div id="app" v-cloak>
                <form>
                    <div class="form-group row m-0 mt-3">
                        <label for="u-p" class="col-sm-2">项目名称</label>
                        <div class="col-sm-10">
                            <span>{{ projectName }}</span>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3">
                        <label for="u-p" class="col-sm-2 pt-2">要对比的分支名称</label>
                        <div class="col-sm-10">
                            <div class="row">
                                <div class="col">
                                    <input type="text" class="form-control outline-none" id="git-user" placeholder="分支名称" v-model="branch1">
                                </div>
                                <div class="col">
                                    <input type="text" class="form-control outline-none" placeholder="分支名称" v-model="branch2">
                                </div>
                            </div>
                            <p class="form-text text-muted mb-0 mt-2">比较操作，两个分支名称必须不相同。</p>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3" v-if="isSpecificFile">
                        <label for="u-p" class="col-sm-2 pt-2">文件路径</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control outline-none" v-model="selectedFile" placeholder="进行差异对比的文件路径"/>
                            <p class="form-text text-muted mb-0 mt-2">要比较的文件，路径必须为绝对路径、或项目下文件的相对路径。</p>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3" v-if="!isSpecificFile">
                        <label for="u-p" class="col-sm-2">stat参数</label>
                        <div class="col-sm-10">
                            <input type="checkbox" class="mr-2" v-model="stat" />
                            <label class="d-inline">是否显示修改的文件列表</label>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-2" v-if="diff_actions.length && branch1 != branch2">
                        <label for="u-p" class="col-sm-2 pt-2">对比操作</label>
                        <div class="col-sm-10 pl-2">
                            <ul class="diff_param">
                                <li :title="item.action" v-for="(item,idx) in diff_actions" :key="idx">
                                    <input type="radio" name="dp" class="mr-2" v-model="diffParam" :value="item.action" @click="setBranchDiffParam(item.action);"/>
                                    <label style="display:inline;word-wrap:break-word;" v-html="item.desc"></label>
                                </li>
                            </ul>
                        </div>
                    </div>
                </form>
            </div>
            <script>
                Vue.directive('focus', {
                  inserted: function (el) {
                    el.focus()
                  }
                });
                var app = new Vue({
                    el: '#app',
                    data: {
                        submitDisabled: false,
                        projectName: '',
                        project_branch: [],
                        branch1: '',
                        branch2: '',
                        diffParam: '',
                        checked: '',
                        stat: false,
                        // 以下两个参数，用于：显示两个分支指定文件的差异
                        selectedFile: '',
                        isSpecificFile: false
                    },
                    computed: {
                        diff_actions() {
                            if (this.isSpecificFile) {
                                return [];
                            };
                            let result = [];
                            let b1 = this.branch1;
                            let b2 = this.branch2;
                            if (this.branch1 && this.branch2 ) {
                                result.push({"desc": "<span>"+ b1 +" </span>分支有, <span>"+ b2 +" </span>分支没有的提交","action":"log "+ b1+ " ^" +b2 });
                                result.push({"desc": "<span>"+ b2 +" </span>分支有, <span>"+ b1 +" </span>分支没有的提交","action":"log "+ b2+ " ^" +b1 });
                                result.push({"desc": "<span>"+ b2 +" </span>分支比 <span>"+ b1 +" </span>分支多提交的内容","action":"log "+ b1+ ".." +b2 });
                                result.push({"desc": "<span>"+ b1 +" </span>分支比 <span>"+ b2 +" </span>分支多提交的内容","action":"log "+ b2+ ".." +b1 });
                                result.push({"desc": "<span> "+ b2 +" </span>和<span> "+ b1 +" </span>两个分支不一样的地方","action":"log "+ b2+ "..." +b1 });
                                result.push({"desc": "<span> "+ b2 +" </span>和<span> "+ b1 +" </span>两个分支, 显示出所有差异的文件(如需查看文件详情，请勿勾选stat)","action":"diff "+ b2+ " " +b1 });
                                return result;
                            } else {
                                return [];
                            }
                        },
                    },
                    watch: {
                        branch1: function (newv, oldv) {
                            this.checked = false;
                            this.diffParam = '';
                        },
                        branch2: function (newv, oldv) {
                            this.checked = false;
                            this.diffParam = '';
                        }
                    },
                    created() {
                        this.projectName = '${projectName}';
                        this.isSpecificFile = ${isSpecificFile};
                        this.selectedFile = '${selectedFile}';
                        if ('${current_branch}' && '${current_branch}' != 'false') {
                            this.project_branch = '${current_branch}';
                            this.branch1 = this.project_branch;
                            this.branch2 = this.project_branch;
                        }
                    },
                    mounted() {
                        this.$nextTick(() => {
                            window.addEventListener('hbuilderxReady', () => {
                                this.gitBranchDiff();
                                this.getBranchDiffResult();
                            })
                        })
                    },
                    methods: {
                        setBranchDiffParam(value) {
                            this.diffParam = value;
                        },
                        getBranchDiffResult() {
                            hbuilderx.onDidReceiveMessage((msg) => {
                                if (msg.command == 'diffResult') {
                                    let {status} = msg;
                                    if (['error', 'fail'].includes(status)){
                                        this.btnDisable = false;
                                    } else {
                                        hbuilderx.postMessage({
                                            command: 'closed'
                                        });
                                    }
                                };
                            });
                        },
                        gitBranchDiff() {
                            hbuilderx.onDidReceiveMessage((msg)=>{
                                if(msg.type == 'DialogButtonEvent'){
                                    let button = msg.button;
                                    if(button == '开始比较'){
                                        let param = {
                                            "param": this.diffParam,
                                            "branch1": this.branch1,
                                            "branch2": this.branch2,
                                            "stat": this.stat
                                        };
                                        if (this.isSpecificFile) {
                                            param = {
                                                "selectedFile": this.selectedFile,
                                                "branch1": this.branch1,
                                                "branch2": this.branch2
                                            };
                                        };

                                        let command = this.isSpecificFile ? 'twoBranchSpecificFileDiff' : 'branchDiff';

                                        hbuilderx.postMessage({
                                            command: command,
                                            info: param
                                        });
                                    } else if(button == '关闭'){
                                        hbuilderx.postMessage({
                                            command: 'closed'
                                        });
                                    };
                                };
                            });
                        }
                    }
                });
            </script>
            <script>
                window.oncontextmenu = function() {
                    event.preventDefault();
                    return false;
                };
            </script>
        </body>
    </html>

    `
};

module.exports = openBranchDiffView;
