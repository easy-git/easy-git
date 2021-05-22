const path = require('path');
const fs = require('fs');
const hx = require('hbuilderx');
const chokidar = require('chokidar');
const process = require('process');
const {exec} = require('child_process');

const cmp_hx_version = require('../common/cmp.js');
const { hxShowMessageBox, createOutputChannel } = require('../common/utils.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'bootstrap.min.css');
const customCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'custom.css');

// get hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');
let cmp = cmp_hx_version(hxVersion, '3.1.2');

/**
 * @description 执行cmd命令
 */
function runCmd(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, function(error, stdout, stderr) {
            if (error) {
                createOutputChannel(`SSH生成密钥失败，详情：\n${error}`, 'error');
                reject(error)
            };
            resolve('success');
        });
    }).catch((error) => {
        throw new Error(error);
    });
};


/**
 * @description 读取xxx.pub文件内容到剪贴板
 * @param {Object} fpath
 */
function readSShKeyPubFile(fpath) {
    fs.readFile(fpath, 'utf8', (err, data) => {
        if (err) {
            hx.window.showInformationMessage(`读取 ${fpath} 文件内容失败。`, ['我知道了']);
            return;
        };
        hx.env.clipboard.writeText(data);
    });
};


/**
 * @description 执行ssh-kengen
 */
async function generating_ssh_keys(webviewDialog, data) {
    // 清除上次错误提示
    webviewDialog.displayError('');

    let {encryption_algorithm, keyfile, usage, passphrase} = data;

    let USERHOME = process.env.HOME;
    let ssh_fpath = path.join(USERHOME, '.ssh', keyfile);
    if (fs.existsSync(ssh_fpath) || fs.existsSync(`${ssh_fpath}.pub`)) {
        webviewDialog.displayError(`${USERHOME}目录下，已存在文件${keyfile}，请重新取个名字吧`);
        return;
    };

    if (passphrase == undefined) {
        passphrase = '';
    };

    let cmd = `ssh-keygen -t ${encryption_algorithm} -f ${ssh_fpath} -q -N '${passphrase}'`;
    console.log('----', cmd)
    let result = await runCmd(cmd).catch( error => { return 'fail' });
    if (fs.existsSync(ssh_fpath)) {
        webviewDialog.close();

        let pubfile = ssh_fpath + '.pub';
        let msg = `SSH密钥生成成功，请选择接下来的操作...\n\n 复制：复制${keyfile}.pub文件内容到剪贴板。\n\n打开：在编辑器中打开${keyfile}.pub文件`
        let btnText = await hxShowMessageBox('SSH', msg, ['复制', '打开', '关闭']).then( btn => {
            return btn;
        });

        if (btnText == '复制') {
            readSShKeyPubFile(pubfile);
        };
        if (btnText == '打开') {
            hx.workspace.openTextDocument(pubfile);
        };
    };
};


/**
 * @description 创建远程仓库
 * @param {Object} FromData 用于处理从初始化过来的数据
 */
async function sshKeygen() {
    try{
        if (cmp > 0) {
            hx.window.showInformationMessage("此功能仅支持HBuilderX 3.1.2+以上版本，请升级。", ["我知道了"]);
        };
    }catch(e){
        hx.window.showInformationMessage("警告：此功能仅支持HBuilderX 3.1.2+以上版本，请升级。", ["我知道了"]);
    };

    // 创建webviewdialog
    let webviewDialog = hx.window.createWebViewDialog({
        modal: true,
        title: "SSH 公钥生成工具",
        dialogButtons: ["创建", "关闭"],
        size: {
            width: 730,
            height: 430
        }
    }, {
        enableScripts: true
    });

    const webview = webviewDialog.webView;
    webview.onDidReceiveMessage((msg) => {
        let type = msg.type;
        let { data } = msg;
        switch (type) {
            case 'closed':
                webviewDialog.close();
                break;
            case 'ssh-keygen':
                generating_ssh_keys(webviewDialog, data);
                break;
            default:
                break;
        };
    });

    let promi = webviewDialog.show();
    promi.then(function (data) {});

    webview.html = `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="${bootstrapCssFile}">
            <link rel="stylesheet" href="${customCssFile}">
            <script src="${vueFile}"></script>
            <style type="text/css">
                .authbtn {
                    border: 1px solid #eee;
                    border-radius: 5px;
                    padding: 4px 7px;
                    background-color: #FFF;
                    color: rgb(65,168,99);
                }
                .refreshbtn {
                    border: none;
                    background-color: #FFF;
                    color: blue;
                    font-size: 12px;
                }
                button:active {
                    -webkit-transform: rotate(0.9);
                    transform: scale(0.9);
                }
                .forlist {
                    list-style: none;
                    padding-left: 10px;
                    position: absolute;
                    z-index: 1600;
                    border-radius: 3px;
                    box-shadow: 0 0 8px 0 rgba(55,49,29,.15);
                    background-color: #FFF;
                    width: 100%;
                }
                .forlist li {
                    height: 36px;
                    line-height: 36px;
                    width: 100%;
                }
            </style>
        </head>
        <body>
            <div id="app" v-cloak>
                <form class="mt-3">
                    <div id="ssh_encryption_algorithm" class="form-group row m-0">
                        <label for="u-p" class="col-sm-2 px-0">加密算法</label>
                        <div class="col-sm-10 d-inline">
                            <input name="encryption_algorithm" type="radio" class="mr-1" value="dsa" v-model="encryption_algorithm"/>dsa
                            <input name="encryption_algorithm" type="radio" class="mr-1 ml-3" value="ecdsa" v-model="encryption_algorithm"/>ecdsa
                            <input name="encryption_algorithm" type="radio" class="mr-1 ml-3" value="ed25519" v-model="encryption_algorithm"/>ed25519
                            <input name="encryption_algorithm" type="radio" class="mr-1 ml-3" value="rsa" v-model="encryption_algorithm"/>rsa
                        </div>
                    </div>
                    <div id="ssh_keyfile" class="form-group row m-0 mt-3">
                        <label for="ssh_dir" class="col-sm-2 px-0 pt-3">存储位置</label>
                        <div class="col-sm-10">
                            <div class="row m-0 p-0">
                                <div class="col-4 p-0">
                                    <input type="text" title="SSH目录，默认不支持修改" class="form-control outline-none pl-0" value="~/.ssh/" disabled/>
                                </div>
                                <div class="col-8">
                                    <input type="text" class="form-control outline-none" placeholder="" v-model.trim="ssh.keyfile">
                                </div>
                                <span class="form-text text-muted">您可以设置一个有意义的文件名，比如ed25519_github</span>
                            </div>
                        </div>
                    </div>
                    <div id="ssh_passwd" class="form-group row m-0 mt-3">
                        <label for="passphrase" class="col-sm-2 px-0 pt-3">SSH密钥密码</label>
                        <div class="col-sm-10">
                            <input id="passphrase" type="text" class="form-control outline-none mr-2" v-model="ssh.passphrase" placeholder="密码可选，设置后Git克隆操作，如是SSH，每次都需要输入密码"/>
                        </div>
                    </div>
                    <div id=""ssh_usage class="form-group row m-0 mt-4">
                        <label for="usage" class="col-sm-2 px-0">SSH密钥用途</label>
                        <div class="col-sm-10">
                            <input id="usage" type="checkbox" class="mr-2" v-model="ssh.usage" />
                            <label class="d-inline">用于Github等git托管服务器SSH认证</label>
                            <p class="form-text text-muted">勾选后，会将生成的信息添加到~/.ssh/config文件；如果您有多个git服务器账号，这将十分有用。</p>
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
                        encryption_algorithm: 'ed25519',
                        ssh: {
                            encryption_algorithm: 'ed25519',
                            keyfile: 'ed25519',
                            usage: '',
                            passphrase: ''
                        }
                    },
                     watch:{
                        encryption_algorithm(val, oldVal){
                            this.ssh.encryption_algorithm = this.encryption_algorithm;
                            this.ssh.keyfile = this.encryption_algorithm;
                        }
                     },
                    created() {
                    },
                    mounted() {
                        this.$nextTick(() => {
                            window.addEventListener('hbuilderxReady', () => {
                                this.sshKeygen();
                                this.sshResult();
                            })
                        })
                    },
                    methods: {
                        sshResult() {
                            hbuilderx.onDidReceiveMessage((msg) => {
                                if (msg.type == 'sshResult') {
                                    let {status} = msg;
                                    if (['error', 'fail'].includes(status)){
                                        this.btnDisable = false;
                                    } else {
                                        hbuilderx.postMessage({
                                            type: 'closed'
                                        });
                                    };
                                };
                                if (msg.type == 'closed') {
                                    hbuilderx.postMessage({
                                        type: 'closed'
                                    });
                                };
                            });
                        },
                        sshKeygen() {
                            hbuilderx.onDidReceiveMessage((msg)=>{
                                if(msg.type == 'DialogButtonEvent'){
                                    let button = msg.button;
                                    if(button == '创建'){
                                        hbuilderx.postMessage({
                                            type: 'ssh-keygen',
                                            data: this.ssh
                                        });
                                    } else if(button == '关闭'){
                                        hbuilderx.postMessage({
                                            type: 'closed'
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
    </html>`
};

module.exports = sshKeygen;
