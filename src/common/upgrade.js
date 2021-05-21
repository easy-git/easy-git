const hx = require('hbuilderx');

const os = require('os');
const osName = os.platform();

var isPopUpWindow = false;


function isJSON(str) {
    if (typeof str == 'string') {
        try {
            var obj = JSON.parse(str);
            if (typeof obj == 'object' && obj) {
                return true;
            } else {
                return false;
            };
        } catch (e) {
            return false;
        };
    };
};


/**
 * @description show box
 * @更新弹窗，点击【以后再说】，则本周内不再自动弹窗提示
 */
function showUpgradeBox(localVersion, marketPluginVersion) {
    if (marketPluginVersion == '' || marketPluginVersion == undefined ) {
        return;
    };
    let lastChar = marketPluginVersion.charAt(marketPluginVersion.length - 1);
    let versiondescription = lastChar == 0 ? `【easy-git】发布重大更新 ${marketPluginVersion} 版本！` : `【easry-git】发布 ${marketPluginVersion} 新版本！`;
    let msg = versiondescription
        + `当前 ${localVersion} 版本。`
        + `<a href="https://ext.dcloud.net.cn/plugin?name=easy-git">更新日志</a>`
        + '<br/><br/>注意：更新后，重启HBuilderX才能生效。';
    let btn = ['去插件市场更新', '以后再说'];

    hx.window.showInformationMessage(msg, btn).then(result => {
        if (result === '去插件市场更新') {
            const url = 'https://ext.dcloud.net.cn/plugin?name=easy-git';
            hx.env.openExternal(url);
        } else if (result === '直接升级') {
            installPlugin(marketPluginVersion);
        } else {
            let timestamp = Math.round(new Date() / 1000) + 604800;
            let config = hx.workspace.getConfiguration();
            config.update('EasyGit.updatePrompt', false).then( () => {
                config.update('EasyGit.updatePromptTime', `${timestamp}`);
            });
        };
    });
    isPopUpWindow = true;
};


/**
 * @description 安装插件
 * @param {version} String 插件版本
 */
function installPlugin(version) {
    return new Promise((resolve, reject) => {
        let info = {
            "id": "easy-git",
            "name": "easy-git",
            "version": version,
            "category_name": "HBuilderX",
            "category_code": "extension-for-hbuilderx",
            "category_id": 11,
            "platforms": []
        };
        let url = 'hbuilderx://ext/download?plugin=' + encodeURIComponent(JSON.stringify(info));
        hx.env.openExternal(url);
    });
};

/**
 * @description
 */
function noUpgrade(version) {
    let msg = `EasyGit: 当前版本为 ${version}，是最新版本，没有可用的更新。`;
    let btns = ['关闭']

    let config = hx.workspace.getConfiguration();
    let updatePrompt = config.get('EasyGit.updatePrompt');
    let updatePromptTime = config.get('EasyGit.updatePromptTime');
    if (updatePromptTime != undefined || updatePrompt != undefined) {
        btns = ['有更新时提醒我', '关闭'];
    };

    hx.window.showInformationMessage(msg, btns).then(result => {
        if (result === '有更新时提醒我') {
            config.update('EasyGit.updatePrompt', true).then( () => {
                config.update('EasyGit.updatePromptTime', '1577808001');
            });
        };
    });
};


/**
 * @description check plugin update
 * @param {String} mode (manual|auto) 手动检查、自动检查
 */
async function checkUpdate(mode) {
    if (isPopUpWindow && mode == 'auto') {
        return;
    };

    // get week
    let currentTimestamp = Math.round(new Date() / 1000);
    let config = await hx.workspace.getConfiguration();
    let updatePrompt = config.get('EasyGit.updatePrompt');
    let updatePromptTime = config.get('EasyGit.updatePromptTime');
    if (updatePromptTime && mode == 'auto') {
        try{
            if (updatePromptTime > currentTimestamp) {
                return;
            }
        }catch(e){};
    };

    let http = require('http');
    const versionUrl = 'http://update.dcloud.net.cn/hbuilderx/alpha/win32/plugins/index.json';
    http.get(versionUrl, (res) => {
        let data = "";
        res.on("data", (chunk) => {
            data += chunk;
        });
        res.on("end", () => {
            try{
                const { version } = require('../../package.json');
                if (isJSON(data)) {
                    let allPlugins = JSON.parse(data);
                    let {plugins} = allPlugins;
                    for (let s of plugins) {
                        if (s.name == 'easy-git') {
                            if (s.version != version) {
                                let marketPluginVersion = s.version;
                                showUpgradeBox(version,marketPluginVersion);
                            } else {
                                if (mode != 'auto') {
                                    noUpgrade(version);
                                };
                            };
                        };
                    };
                };
            }catch(e){};
        });
        res.on("error", (e) => {
            console.error('获取更新文件错误!', e);
            isPopUpWindow = true;
        });
    });
};

module.exports = {checkUpdate};
