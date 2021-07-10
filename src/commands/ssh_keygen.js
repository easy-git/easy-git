const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');
const {exec} = require('child_process');

const hx = require('hbuilderx');
const chokidar = require('chokidar');

const count = require('../common/count.js');
const cmp_hx_version = require('../common/cmp.js');
const { hxShowMessageBox, createOutputView } = require('../common/utils.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'bootstrap.min.css');
const customCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'custom.css');

// get hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');
let cmp = cmp_hx_version(hxVersion, '3.1.2');

const osName = os.platform();

/**
 * @description 执行cmd命令
 */
function runCmd(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, function(error, stdout, stderr) {
            if (error) {
                createOutputView(`SSH相关命令执行失败，日志：\n${error}`, 'error');
                reject(error)
            };
            resolve('success');
        });
    }).catch((error) => {
        throw new Error(error);
    });
};

/**
 * @description 获取windows ssh相关命令安装目录
 */
function getWindowSSHCmdDir() {
    return new Promise((resolve, reject) => {
        exec('where git', function(error, stdout, stderr) {
            if (error) {
                createOutputView(`查找git、ssh相关命令路径失败。请确保电脑已安装git bash。`, 'error');
                reject(error)
            };
            let tmp = stdout.trim().replace('cmd\\git.exe', '');
            let bin_dir = path.join(tmp, 'usr', 'bin');
            if (fs.existsSync(bin_dir)) {
                resolve(bin_dir)
            };
            resolve('error');
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
    let success_msg = `新生成的SSH KEY信息, 向 ${ssh_config_file} 文件添加成功。\n`;
    let fail_msg = `新生成的SSH KEY信息，向 ${ssh_config_file}  文件添加失败，请手动编辑。\n`;

    return new Promise((resolve, reject) => {
        fs.appendFile(ssh_config_file, file_content , (error)  => {
            if (error) {
                createOutputView(fail_msg, 'fail');
                reject(error)
            };
            createOutputView(success_msg, 'info');
            resolve('success')
        });
    }).catch((error) => {
        throw new Error(error);
    });
};


/**
 * @description 执行ssh-kengen
 */
async function generating_ssh_keys(webviewDialog, data) {
    // 清除上次错误提示
    webviewDialog.displayError('');

    let {encryption_algorithm, keyfile, usage, passphrase, git_host} = data;

    let USERHOME = '';
    if (osName == 'darwin') {
        USERHOME = process.env.HOME;
    };
    if (osName == 'win32') {
        USERHOME = path.join(process.env.HOMEDRIVE, process.env.HOMEPATH);
    };

    let SSHDIR = path.join(USERHOME, '.ssh');
    let ssh_config_file = path.join(SSHDIR, 'config');

    let ssh_private_path = path.join(USERHOME, '.ssh', keyfile);
    let ssh_public_file = ssh_private_path + '.pub';

    if (fs.existsSync(ssh_private_path) || fs.existsSync(ssh_public_file)) {
        webviewDialog.displayError(`${USERHOME}目录下，已存在文件${keyfile}，请重新取个名字吧`);
        return;
    };

    if (usage) {
        if (git_host.length <= 4 || git_host == undefined) {
            webviewDialog.displayError(`无效的${git_host}, 请填写有效的Git主机信息。`);
            return;
        };
    };

    if (passphrase == undefined) {
        passphrase = '';
    };

    let sshkeygen_tool = 'ssh-keygen';
    let sshadd_tool = 'ssh-add';

    if (osName == 'win32') {
        let win_ssh_keygen = await getWindowSSHCmdDir().catch( error => { return 'error'});
        if (win_ssh_keygen != 'error') {
            sshkeygen_tool = path.join(win_ssh_keygen, 'ssh-keygen.exe');
            sshadd_tool = path.join(win_ssh_keygen, 'ssh-add.exe');
        };
    };

    // 双引号的作用，是为了解决windows上路径带有空格的问题
    let cmd = `"${sshkeygen_tool}" -t ${encryption_algorithm} -f "${ssh_private_path}" -q -N "${passphrase}"`;
    let result = await runCmd(cmd).catch( error => { return 'fail' });

    if (!fs.existsSync(ssh_private_path)) {
        return;
    };
    createOutputView(`SSH KEY生成成功。文件所在目录：${SSHDIR}\n`, 'success', SSHDIR);

    // 关闭webviewdialog
    webviewDialog.close();

    // .ssh/config
    if (usage) {
        const file_content = `\n\n#-------- easy-git ---------\nHost ${git_host}\n\tHostName ${git_host}\n\tPreferredAuthentications publickey\n\tIdentityFile ${ssh_private_path}`
        await edit_ssh_config_file(ssh_config_file, file_content).catch( error => {return error });
    };

    // ssh-add
    if (osName == 'darwin') {
        if (passphrase.length == 0) {
            let add_cmd = `"${sshadd_tool}" "${ssh_private_path}"`;
            let add_result = await runCmd(add_cmd).catch( error => { return 'fail' });
            if (add_result != 'fail') {
                createOutputView('已自动将SSH KEY添加到ssh-agent的高速缓存中。此后, 当使用SSH公钥跟服务器通信时, 不再提示相关信息。\n', 'info');
            };
        } else {
            createOutputView('强烈建议您将SSH KEY添加到ssh-agent的高速缓存中。添加后, 当使用SSH公钥跟服务器通信时, 不再提示相关信息。', 'warning');
            createOutputView(`请打开操作系统终端，运行如下命令：ssh-add ${ssh_private_path} \n`, 'info');
        };
    };

    if (usage) {
        createOutputView(`注意事项：SSH KEY创建成功成功后，同时也需要添加到Git托管服务器。设置教程：https://easy-git.github.io/auth/ssh-generate#Git服务器设置SSH公钥`, 'warning');
    };


    hx.window.showInformationMessage(`SSH密钥生成成功。`, ['复制公钥内容', '关闭']).then( btn => {
        if (btn == '复制公钥内容') {
            readSShKeyPubFile(ssh_public_file);
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
        title: "SSH key生成工具",
        dialogButtons: ["创建", "关闭"],
        size: {
            width: 740,
            height: 490
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

    try{
        count('ssh-keygen').catch( error=> {});
    }catch(e){};

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
                        <label for="passphrase" class="col-sm-2 px-0 pt-3">SSH Key密码</label>
                        <div class="col-sm-10">
                            <input id="passphrase" type="text" class="form-control outline-none mr-2" v-model="ssh.passphrase" placeholder="密码可选，设置后Git克隆操作，如是SSH，每次都需要输入密码"/>
                        </div>
                    </div>
                    <div id="ssh_usage" class="form-group row m-0 mt-4">
                        <label for="usage" class="col-sm-2 px-0">SSH Key用途</label>
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
