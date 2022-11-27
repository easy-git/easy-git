const hx = require('hbuilderx');
const axios = require('axios');
const uuid = require('uuid');
const os = require('os');

// get plugin version
let packageFile = require('../../package.json');

// 主题
let hxTheme = "Default"
let config = hx.workspace.getConfiguration();
let colorScheme = config.get('editor.colorScheme');
hxTheme = colorScheme ? colorScheme : "Default";

let currentDate = undefined;
let logFlags = 0;
let mainFlags = 0;
let initFlags = 0;
let diffFlags = 0;
let cloneFlags = 0;
let CommandPanelFlags = 0;

let hxVersion = hx.env.appVersion;
let pluginVersion = packageFile.version;
let osName = os.platform() + ' ' + os.release();

let ReferenceCounting = {};
let isStopCount = true;

/**
 * @description 生成用户UID
 */
function getEasyGitConfig() {
    let data = {
        'uid': undefined,
        'isShareUsageData': undefined
    };
    return new Promise((resolve, reject) => {
        let config = hx.workspace.getConfiguration();
        uid = config.get('EasyGit.id');
        isShareUsageData = config.get('EasyGit.isShareUsageData');
        if (uid == undefined || uid == '') {
            uid = (uuid.v1()).replace(/-/g, '');
            config.update("EasyGit.id", uid).then(() => {});
        };
        if (isShareUsageData == undefined || isShareUsageData != false) {
            isShareUsageData = true;
        };
        data.uid = uid;
        data.isShareUsageData = isShareUsageData;
        resolve(data);
    });
};

/**
 * @description 获取当天日期
 */
function getCurrentData() {
	let day2 = new Date();
	day2.setTime(day2.getTime());
	return day2.getFullYear() + "/" + (day2.getMonth() +1) + "/" + day2.getDate();
};

/**
 * @description count
 * @param {Object} viewname
 */
async function count(viewname) {
    // 2022-11-27日，停止git功能数据上报
    if (isStopCount) return;

    if (["log", "main", "diff", "CommandPanel", "clone", "init"].includes(viewname)) {
        let view_flags = eval(viewname+ "Flags");
        let view_flags_date = getCurrentData();

        if (view_flags >= 3  && currentDate == view_flags_date) {
           return;
        };
    };

    try{
        let t = ReferenceCounting[viewname];
        if (t == undefined) {
            ReferenceCounting[viewname] = 1;
        };
        if (Number.isFinite(t)) {
            if (t >= 3) return;
            ReferenceCounting[viewname] = t + 1;
        };
    }catch(e){};

    let uid;
    let isShareUsageData = true;
    if (uid == undefined || uid == '') {
        let configInfo = await getEasyGitConfig()
        uid = configInfo.uid;
        isShareUsageData = configInfo.isShareUsageData;
    };

    if (isShareUsageData == false) {
        osName = 'unKnow';
    };

    let param = {
        'uid': uid,
        'viewname': viewname,
        'hxVersion': hxVersion,
        'hxTheme': hxTheme,
        'pluginVersion': pluginVersion,
        'osName': osName,
    };

    return new Promise((resolve, reject) => {
        try {
            const instance = axios.create({
                timeout: 3000,
            });
            let url = "http://0c1fa337-7340-4755-9bec-f766d7d31833.bspapp.com/http/count";
            instance.get(url, {params: param})
                .then(function(response) {
                    currentDate = getCurrentData();
                    if (viewname == 'log') { logFlags++ };
                    if (viewname == 'main') { mainFlags++ };
                    if (viewname == 'diff') { diffFlags++ };
                    if (viewname == 'clone') { cloneFlags++ };
                    if (viewname == 'init') { initFlags++ };
                    if (viewname == 'CommandPanel') { CommandPanelFlags++ };
                    resolve(response);
                })
                .catch(function(error) {
                    reject(error);
                })
        } catch (e) {
            reject('Y');
        };
    });
};

module.exports = count;
