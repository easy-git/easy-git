const fs = require('fs');
const path = require('path');
const { debounce } = require('throttle-debounce');

const hx = require('hbuilderx');

let {
    gitRawGetBranch,
    gitCurrentBranchName,
    FileWriteAndOpen,
    gitRaw
} = require('../common/utils.js');
const cmp_hx_version = require('../common/cmp.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'bootstrap.min.css');

// get hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');
let cmp = cmp_hx_version(hxVersion, '3.1.2');

/**
 *@description 打开分支比较视图
 */
var isDisplayError;
async function openBranchDiffView(ProjectInfo) {
    try{
        if (cmp > 0) {
            hx.window.showInformationMessage("此功能仅支持HBuilderX 3.1.2+以上版本，请升级。", ["我知道了"]);
        };
    }catch(e){
        hx.window.showInformationMessage("警告：此功能仅支持HBuilderX 3.1.2+以上版本，请升级。", ["我知道了"]);
    };

    // 获取项目信息
    let { projectName, projectPath } = ProjectInfo;

    // 获取项目本地分支
    let current_branch = await gitCurrentBranchName(projectPath);
    let hxdata = Object.assign(ProjectInfo, {'current_branch': current_branch});

    // 创建webviewdialog
    let webviewDialog = hx.window.createWebViewDialog({
        modal: true,
        title: 'Git分支对比',
        dialogButtons: ["开始比较", "关闭"],
        size: {
            width: 730,
            height: 450
        }
    }, {
        enableScripts: true
    });

    let webview = webviewDialog.webView;
    webview.html = generateLogHtml(hxdata);

    webview.onDidReceiveMessage((msg) => {
        let action = msg.command;
        switch (action) {
            case 'closed':
                webviewDialog.close();
                break;
            case 'branchDiff':
                let {info} = msg;
                branch_diff_operations(webviewDialog, webview, projectPath, info);
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


async function branch_diff_operations(webviewDialog, webview, projectPath, info) {
    // 清除上次错误提示
    if (isDisplayError) {
        webviewDialog.displayError('');
    };

    let {branch1, branch2, param, stat} = info;
    if (branch1 == branch2) {
        webviewDialog.displayError('提示：分支对比操作，两个分支名称不能相同，且不能为空，请修改。');
        return;
    };
    if (branch1.length == 0|| branch2.length == 0 || !branch2 || !branch1) {
        webviewDialog.displayError('提示：分支对比操作，分支名称不能为空。');
        return;
    };
    if (!param || param.length == 0) {
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

    let cmd = param.split(" ");
    cmd.splice(1,0, `--pretty=format:"%H - %an %ad %s"`);
    cmd.splice(2,0, `--date=format:"%Y-%m-%d %H:%M:%S"`);

    // 用于显示具体的文件修改列表
    if (stat) {
        cmd.push('--stat');
    };

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
        const fname = `git-branch-diff`;
        FileWriteAndOpen(fname, diff_result);
    };
};

/**
 * @description generationhtml
 * @todo 目前通过js打开资源管理器，无法打开的目录。因此 本地存储路径输入框，不支持手动选择
 * @todo 克隆进度条
 */
function generateLogHtml(hxdata) {
    let {current_branch, projectName} = hxdata;

    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="${bootstrapCssFile}">
            <script src="${vueFile}"></script>
            <style type="text/css">
                body {
                    font-size: 14px;
                }
                body::-webkit-scrollbar {
                    display: none;
                }
                * {
                    outline: none;
                    moz-user-select: -moz-none;
                    -moz-user-select: none;
                    -o-user-select:none;
                    -khtml-user-select:none;
                    -webkit-user-select:none;
                    -ms-user-select:none;
                    user-select:none;
                }
                [v-cloak] {
                    display: none;
                }
                .outline-none {
                    box-shadow: none !important;
                }
                .form-control {
                    color: #000000 !important;
                    font-size: 0.93rem !important;
                    border-left: none !important;
                    border-right: none !important;
                    border-top: none !important;
                    border-radius: 0 !important;
                }
                .form-control:focus {
                    border: 1px solid rgb(65,168,99) !important;
                    border-left: none !important;
                    border-right: none !important;
                    border-top: none !important;
                    border-radius: 0 !important;
                }
                .form-group .form-control::-webkit-input-placeholder, .form-control::-webkit-input-placeholder {
                    font-size: 0.9rem !important;
                    font-weight: 200 !important;
                }
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

                @media only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx) {
                    .has_sel {
                        display: ineline;
                        width: 16px;
                        height: 16px;
                        border: 1px solid #B06A50;
                        border-radius: 1px;
                        position: relative;
                    }

                    .has_sel:before {
                        content: "";
                        width: 2px;
                        height: 6px;
                        background-color: #B06A50;
                        border-radius: 1px;
                        position: absolute;
                        left: 4px;
                        bottom: 3px;
                        transform: rotate(-45deg);
                        -ms-transform: rotate(-45deg);
                        /* IE 9 */
                        -moz-transform: rotate(-45deg);
                        /* Firefox */
                        -webkit-transform: rotate(-45deg);
                        /* Safari 和 Chrome */
                        -o-transform: rotate(-45deg);
                        /* opear */
                    }

                    .has_sel:after {
                        content: "";
                        width: 2px;
                        height: 10px;
                        background-color: #B06A50;
                        border-radius: 1px;
                        position: absolute;
                        left: 8px;
                        bottom: 3px;
                        transform: rotate(37deg);
                        -ms-transform: rotate(37deg);
                        /* IE 9 */
                        -moz-transform: rotate(37deg);
                        /* Firefox */
                        -webkit-transform: rotate(37deg);
                        /* Safari 和 Chrome */
                        -o-transform: rotate(37deg);
                        /* opear */
                    }
                }
            </style>
        </head>
        <body>
            <div id="app" v-cloak>
                <form>
                    <div class="form-group row m-0 mt-3">
                        <label for="u-p" class="col-sm-2">项目信息</label>
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
                            <p class="form-text text-muted mb-0 mt-2">分支比较，请输入两个不一样的分支名称。</p>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3">
                        <label for="u-p" class="col-sm-2">stat参数</label>
                        <div class="col-sm-10">
                            <input type="checkbox" :class="{ has_sel: stat }" class="mr-2" v-model="stat" />
                            <label class="d-inline">是否显示修改的文件列表</label>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-2" v-if="diff_actions.length && branch1 != branch2">
                        <label for="u-p" class="col-sm-2 pt-2">对比操作</label>
                        <div class="col-sm-10 pl-2">
                            <ul class="diff_param">
                                <li :title="item.action" v-for="(item,idx) in diff_actions" :key="idx">
                                    <input type="radio" name="dp" class="mr-2" :class="{ has_sel: diffParam == item.action }" v-model="diffParam" :value="item.action" @click="setBranchDiffParam(item.action);"/>
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
                        stat: false
                    },
                    computed: {
                        diff_actions() {
                            let result = [];
                            let b1 = this.branch1;
                            let b2 = this.branch2;
                            if (this.branch1 && this.branch2 ) {
                                result.push({"desc": "<span>"+ b1 +" </span>分支有, <span>"+ b2 +" </span>分支没有","action":"log "+ b1+ " ^" +b2 });
                                result.push({"desc": "<span>"+ b2 +" </span>分支有, <span>"+ b1 +" </span>分支没有","action":"log "+ b2+ " ^" +b1 });
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
                                        hbuilderx.postMessage({
                                            command: 'branchDiff',
                                            info: param
                                        });
                                    } else if(button == '关闭'){
                                        hbuilderx.postMessage({
                                            command: 'closed'
                                        });
                                    }
                                }
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
