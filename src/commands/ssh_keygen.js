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
                createOutputChannel(`SSH相关命令执行失败，日志：\n${error}`, 'error');
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
 * @description 编辑.ssh/config文件
 * @param {String} file
 */
function edit_ssh_config_file(ssh_config_file, file_content) {
    let success_msg = `新生产的SSH密钥信息到 ${ssh_config_file} 文件成功`;
    let fail_msg = `新生产的SSH密钥信息到 ${ssh_config_file}  文件失败，请手动编辑。`;

    if (fs.existsSync(ssh_config_file)) {
        fs.appendFile(ssh_config_file, file_content , (error)  => {
            if (error) {
                return createOutputChannel(fail_msg, 'fail');
            };
            createOutputChannel(success_msg, 'success');
        });
    } else {
        fs.writeFile(ssh_config_file, file_content, function (err) {
            if (err) {
               return createOutputChannel(fail_msg, 'fail');
            };
            createOutputChannel(success_msg, 'success');
        });
    };
};


/**
 * @description 执行ssh-kengen
 */
async function generating_ssh_keys(webviewDialog, data) {
    // 清除上次错误提示
    webviewDialog.displayError('');

    let {encryption_algorithm, keyfile, usage, passphrase, git_host} = data;

    let USERHOME = process.env.HOME;
    let SSHDIR = path.join(USERHOME, '.ssh');
    let ssh_config_file = path.join(SSHDIR, 'config');
    let ssh_fpath = path.join(USERHOME, '.ssh', keyfile);
    let ssh_pubfile = ssh_fpath + '.pub';

    if (fs.existsSync(ssh_fpath) || fs.existsSync(ssh_pubfile)) {
        webviewDialog.displayError(`${USERHOME}目录下，已存在文件${keyfile}，请重新取个名字吧`);
        return;
    };

    if (passphrase == undefined) {
        passphrase = '';
    };

    let cmd = `ssh-keygen -t ${encryption_algorithm} -f ${ssh_fpath} -q -N '${passphrase}'`;
    let result = await runCmd(cmd).catch( error => { return 'fail' });

    if (!fs.existsSync(ssh_fpath)) {
        return;
    };
    createOutputChannel(`SSH KEY生成成功。文件所在目录：${SSHDIR}\n`, 'success');

    // 关闭webviewdialog
    webviewDialog.close();

    // ssh-add
    let add_cmd = `ssh-add ${ssh_fpath}`;
    if (passphrase.length) {
        createOutputChannel('鉴于您给SSH密钥设置了密码，强烈建议您将SSH密钥添加到ssh-agent的高速缓存中。添加后, 当使用SSH公钥跟服务器通信时, 不再提示相关信息。', 'warning');
        createOutputChannel(`请打开终端，手动在终端如下命令：ssh-add ${ssh_fpath} \n`, 'info');
    } else {
        let add_result = await runCmd(add_cmd).catch( error => { return 'fail' });
        if (add_result != 'fail') {
            createOutputChannel('已自动将SSH密钥添加到ssh-agent的高速缓存中。此后, 当使用SSH公钥跟服务器通信时, 不再提示相关信息。\n', 'success');
        };
    };

    // .ssh/config
    let file_content = `Host ${git_host}\n\tHostName ${git_host}\n\tPreferredAuthentications publickey\n\tIdentityFile ${ssh_fpath}`
    edit_ssh_config_file(ssh_config_file, file_content);

    hx.window.showInformationMessage(`SSH密钥生成成功。`, ['复制公钥内容', '关闭']).then( btn => {
        if (btn == '复制公钥内容') {
            readSShKeyPubFile(ssh_pubfile);
        };
    });
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
                            <input name="encryption_algorithm" type="radio" class="mr-1" value="ed25519" v-model="encryption_algorithm"/>ed25519
                            <input name="encryption_algorithm" type="radio" class="mr-1 ml-3" value="dsa" v-model="encryption_algorithm"/>dsa
                            <input name="encryption_algorithm" type="radio" class="mr-1 ml-3" value="ecdsa" v-model="encryption_algorithm"/>ecdsa
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
                    <div id="ssh_usage" class="form-group row m-0 mt-4">
                        <label for="usage" class="col-sm-2 px-0">SSH密钥用途</label>
                        <div class="col-sm-10">
                            <input id="usage" type="checkbox" class="mr-2" v-model="ssh.usage" />
                            <label class="d-inline">用于Github等git托管服务器SSH认证</label>
                            <p class="form-text text-muted mb-0">勾选会将生成的KEY添加到~/.ssh/config；如您用到多个Git服务器，这将十分有用。</p>
                        </div>
                    </div>
                    <div id="git_hosts" class="form-group row m-0 mt-3" v-if="ssh.usage">
                        <label for="passphrase" class="col-sm-2 px-0 pt-3">Git服务器主机</label>
                        <div class="col-sm-10">
                            <input id="host" type="text" class="form-control outline-none mr-2" v-model="ssh.git_host" placeholder="Git托管服务器域名或ip，如github.com"/>
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
                            usage: false,
                            passphrase: '',
                            git_host: ''
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
