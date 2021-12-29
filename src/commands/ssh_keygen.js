const fs = require('fs');
const os = require('os');
const path = require('path');
const process = require('process');
const {exec} = require('child_process');

const hx = require('hbuilderx');
const chokidar = require('chokidar');

const count = require('../common/count.js');
const { hxShowMessageBox, createOutputView } = require('../common/utils.js');

const vueFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'vue.min.js');
const bootstrapCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'bootstrap.min.css');
const customCssFile = path.join(path.resolve(__dirname, '..'), 'view', 'static', 'custom.css');

const osName = os.platform();

let USERHOME = osName == 'darwin'
    ? process.env.HOME
    : USERHOME = path.join(process.env.HOMEDRIVE, process.env.HOMEPATH);

let SSHDIR = path.join(USERHOME, '.ssh');
let ssh_config_file = path.join(SSHDIR, 'config');


/**
 * @description 公共方法
 */
class common {
    constructor(arg) {
    }

    // 执行cmd命令
    runCmd(cmd) {
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

    // 获取windows ssh相关命令安装目录
    getWindowSSHCmdDir() {
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
    readSShKeyPubFile(fpath) {
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
    edit_ssh_config_file(ssh_config_file, file_content) {
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
};

/**
 * @description 执行ssh-kengen
 */
async function generating_ssh_keys(data) {
    let {encryption_algorithm, keyfile, passphrase, git_host} = data;
    let ssh_private_path = path.join(USERHOME, '.ssh', keyfile);
    let ssh_public_file = ssh_private_path + '.pub';

    let sshkeygen_tool = 'ssh-keygen';
    let sshadd_tool = 'ssh-add';

    let com = new common();
    if (osName == 'win32') {
        let win_ssh_keygen = await com.getWindowSSHCmdDir().catch( error => { return 'error'});
        if (win_ssh_keygen != 'error') {
            sshkeygen_tool = path.join(win_ssh_keygen, 'ssh-keygen.exe');
            sshadd_tool = path.join(win_ssh_keygen, 'ssh-add.exe');
        };
    };

    // 双引号的作用，是为了解决windows上路径带有空格的问题
    let cmd = `"${sshkeygen_tool}" -t ${encryption_algorithm} -f "${ssh_private_path}" -q -N "${passphrase}"`;
    let result = await com.runCmd(cmd).catch( error => { return 'fail' });

    if (!fs.existsSync(ssh_private_path)) {
        return;
    };
    createOutputView(`SSH KEY生成成功。文件所在目录：${SSHDIR}\n`, 'success', SSHDIR);

    // .ssh/config
    if (git_host) {
        const file_content = `\n\n#-------- easy-git ---------\nHost ${git_host}\n\tHostName ${git_host}\n\tPreferredAuthentications publickey\n\tIdentityFile ${ssh_private_path}`
        await com.edit_ssh_config_file(ssh_config_file, file_content).catch( error => {return error });
    } else {
        createOutputView(`如果您是用于git托管，强烈建议将生成的KEY添加到 ${ssh_config_file}；如您用到多个Git服务器，这将十分有用。可以解决后续Git SSH访问遇到的大部分问题。\n`, 'warning', ssh_config_file);
    };

    // ssh-add
    if (osName == 'darwin') {
        if (passphrase.length == 0) {
            let add_cmd = `"${sshadd_tool}" "${ssh_private_path}"`;
            await com.runCmd(add_cmd).catch( error => { return 'fail' });
        } else {
            createOutputView('强烈建议您将SSH KEY添加到ssh-agent的高速缓存中。添加后, 当使用SSH公钥跟服务器通信时, 不再提示相关信息。', 'warning');
            createOutputView(`请打开操作系统终端，运行如下命令：ssh-add ${ssh_private_path} \n`, 'warning');
        };
    };

    if (git_host) {
        let msg_w = '注意事项：SSH KEY创建成功成功后，同时也需要添加到Git托管服务器。设置教程：https://easy-git.github.io/auth/ssh-generate#Git服务器设置SSH公钥';
        createOutputView(msg_w, 'warning');
    };

    hx.window.showInformationMessage(`SSH密钥生成成功。`, ['复制公钥内容', '关闭']).then( btn => {
        if (btn == '复制公钥内容') {
            com.readSShKeyPubFile(ssh_public_file);
        };
    });
};

/**
 * @description 创建SSH证书
 */
class sshKeygen {
    constructor(arg) {}

    /**
     * @description 校验输入
     * @param {Object} formData
     * @param {Object} that
     */
    async goValidate(formData, that) {
        let {keyfile, git_host} = formData;
    	if (keyfile.replace(/(^\s*)|(\s*$)/g, "") == '') {
    		that.showError(`证书文件名不能为空！`);
    		return false;
    	};
    	let ssh_file_path = path.join(USERHOME, ".ssh", keyfile);
        if (fs.existsSync(ssh_file_path)) {
            that.showError(`证书文件 ${keyfile} 已存在，请重新取一个文件名。`);
            return false;
        };
        if (git_host !== '') {
            let tmp = git_host.replace(/\s+/g,"");
            if (tmp.length < 4) {
                that.showError(`Git服务器长度不能小于4，且不能包含空格。`);
                return false;
            };
            if (!tmp.includes('.')) {
                that.showError(`Git服务器信息无效，请输入正确的信息。`);
                return false;
            };
        };
        return true;
    };

    /**
     * @description 绘制视图
     * @param {Object} change
     * @param {Object} formData
     */
    getFormItems(change, formData) {
        let default_encryption = "ed25519";
        if (change && typeof change == 'string') {
            default_encryption = change;
        };
        let formItems = [{
                type: "radioGroup",name: "encryption_algorithm",label: "SSH加密算法", "value": default_encryption,
                items: [
                    {"label": "ed25519", "id": "ed25519"},
                    {"label": "ed25519-sk", "id": "ed25519-sk"},
                    {"label": "dsa", "id": "dsa"},
                    {"label": "ecdsa", "id": "ecdsa"},
                    {"label": "ecdsa-sk", "id": "ecdsa-sk"},
                    {"label": "rsa", "id": "rsa"}
                ]
            },
            {type: "input",name: "keyfile",label: "证书文件名",placeholder: '请设置一个有意义的文件名，比如ed25519_github',value: default_encryption},
            {type: "input",name: "passphrase",label: "SSH KEY密码",placeholder: "可选，填写后每次操作都需要输入密码"},
            {type: "input",name: "git_host",label: "Git服务器",placeholder: "可选，Git托管服务器域名或ip，比如github.com"},
            {type: "label",name: "text",text: "<span style='color: #a0a0a0; font-size: 11px;'>备注：如果您是用于Github等Git托管服务器SSH认证，建议填写。<br/>填写后，会将生成的KEY信息添加到~.ssh/config。如果您用到多个Git托管服务，这将十分有用。</span>"}
        ];
        return {
    		title: "SSH KEY一键生成工具",
    		width: 340,
    		height: 380,
    		footer: '<a href="https://easy-git.github.io/auth/ssh-generate">SSH相关教程</a>',
            formItems: formItems,
        };
    };

    async main() {
        let that = this;
        let setInfo = await hx.window.showFormDialog({
            submitButtonText: "确定(&S)",
            cancelButtonText: "取消(&C)",
            validate: function(formData) {
                let checkResult = that.goValidate(formData, this);
                return checkResult;
            },
            onChanged: function (field, value, formData) {
              if (field == "encryption_algorithm") {
                this.updateForm(that.getFormItems(value, formData));
              }
            },
            ...that.getFormItems()
        }).then((res) => {
            return res;
        }).catch(error => {
            console.log(error);
        });

        if (setInfo == undefined) return;
        generating_ssh_keys(setInfo)
    };

}



module.exports = sshKeygen;
