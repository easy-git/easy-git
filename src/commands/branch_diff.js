const fs = require('fs');
const path = require('path');
const { debounce } = require('throttle-debounce');

const hx = require('hbuilderx');

let utils = require('../common/utils.js');
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
    let current_branch = await utils.gitCurrentBranchName(projectPath);
    let hxdata = Object.assign(ProjectInfo, {'current_branch': current_branch});

    // 创建webviewdialog
    let isDisplayError;
    let webviewDialog = hx.window.createWebViewDialog({
        modal: true,
        title: 'Git分支对比',
        dialogButtons: ["开始比较", "关闭"],
        size: {
            width: 700,
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
                branch_diff_operations(info);
                break;
            default:
                break;
        };
    });

    let promi = webviewDialog.show();
    promi.then(function (data) {
        // 处理错误信息
    });

    async function branch_diff_operations(info) {
        // 清除上次错误提示
        if (isDisplayError) {
            webviewDialog.displayError('');
        };

        let {branch1, branch2, param} = info;
        console.log(info);
        if (branch1 == branch2) {
            webviewDialog.displayError('提示：分支对比操作，两个分支名称不能相同，且不能为空，请修改。');
            return;
        };
        if (branch1.length == 0|| branch2.length == 0 || !branch2 || !branch1) {
            webviewDialog.displayError('提示：分支对比操作，分支名称不能为空。');
            return;
        };

        webviewDialog.setButtonStatus("开始获取数据", ["loading", "disable"]);
        let result = await utils.gitClone(info);

        webviewDialog.setButtonStatus("开始获取数据", []);
        webview.postMessage({
            command: 'diffResult',
            status: result
        });

        if (result == 'success') {

        } else {
            isDisplayError = true;
            webviewDialog.displayError('Git: 操作失败, 请在底部控制台查看失败原因!');
        };
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
                    margin-top: 16px;
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
                        <label for="u-p" class="col-sm-2">项目信息</label>
                        <div class="col-sm-10">
                            <span>{{ projectName }}</span>
                        </div>
                    </div>
                    <div class="form-group row m-0 mt-3">
                        <label for="u-p" class="col-sm-2 pt-2">要对比的两个分支</label>
                        <div class="col-sm-10">
                            <div class="row">
                                <div class="col">
                                    <input type="text" class="form-control outline-none" id="git-user" placeholder="分支名称" v-model="branch1">
                                </div>
                                <div class="col">
                                    <input type="text" class="form-control outline-none" placeholder="分支名称" v-model="branch2">
                                </div>
                            </div>
                            <div class="row" v-if="diff_actions.length">
                                <div class="col">
                                    <ul class="diff_param">
                                        <li :title="item.action" v-for="(item,idx) in diff_actions" :key="idx">
                                            <input type="radio" name="dp" @click="getBranchDiffParam(item);"/>
                                            <span>{{item.desc}}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
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
                        diffParam: ''
                    },
                    computed: {
                        diff_actions() {
                            let result = [];
                            let b1 = this.branch1;
                            let b2 = this.branch2;
                            if (this.branch1 && this.branch2 ) {
                                result.push({"desc": b1 +"分支有,"+ b2 +"分支没有","action":"log "+ b1+ "^" +b2 });
                                result.push({"desc": b2 +"分支有,"+ b1 +"分支没有","action":"log "+ b2+ "^" +b1 });
                                result.push({"desc": b2 +"分支比"+ b1 +"分支多提交的内容","action":"log "+ b1+ ".." +b2 });
                                result.push({"desc": b1 +"分支比"+ b2 +"分支多提交的内容","action":"log "+ b2+ ".." +b1 });
                                result.push({"desc": b2 +"和"+ b1 +"两个分支不一样的地方","action":"log "+ b2+ "..." +b1 });
                                console.log('---', result)
                                return result;
                            } else {
                                return [];
                            }
                        },
                    },
                    watch: {
                        branch1: function (newv, oldv) {
                            this.checked = false;
                        },
                        branch2: function (newv, oldv) {
                            this.checked = false;
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
                        getBranchDiffParam(el) {
                            this.diffParam = el.target.value;
                        },
                        getBranchDiffResult() {
                            hbuilderx.onDidReceiveMessage((msg) => {
                                if (msg.command == 'diffResult') {
                                    let {status} = msg;
                                    if (['error', 'fail'].includes(status)){
                                        this.btnDisable = false;
                                    };
                                    if (status == 'success') {
                                        hbuilderx.postMessage({
                                            command: 'closed'
                                        });
                                    };
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
                                            "branch2": this.branch2
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
                // window.oncontextmenu = function() {
                //     event.preventDefault();
                //     return false;
                // };
            </script>
        </body>
    </html>

    `
};

module.exports = openBranchDiffView;
