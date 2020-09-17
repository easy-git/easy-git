const hx = require('hbuilderx');
const axios = require('axios');
const uuid = require('uuid');

// get plugin version
let packageFile = require('../../package.json');

// 全局记录是否已上传统计数据，每天仅上传一次
global.currentDate = undefined;
global.logFlags = false;
global.mainFlags = false;
global.initFlags = false;
global.cloneFlags = false;


/**
 * @description 生成用户UID
 */
function getUid() {
    try{
        let config = hx.workspace.getConfiguration();
        let uid = config.get('EasyGit.id');
        if (uid == undefined || !uid || uid == '') {
            uid = (uuid.v1()).replace(/-/g, '');
            config.update("EasyGit.id", uid).then(() => {});
        };
        return uid;
    }catch(e){
        return '';
    };
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
function count(viewname, context) {
    let view_flags = eval(viewname+ "Flags");
    let view_flags_date = getCurrentData();
    // only count once
    if (view_flags && currentDate == view_flags_date) {
        return;
    };

    const uid = getUid();
    const hxVersion = hx.env.appVersion;
    const pluginVersion = packageFile.version;

    let param = {
        'uid': uid,
        'viewname': viewname,
        'hxVersion': hxVersion,
        'pluginVersion': pluginVersion
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
                    if (viewname == 'log') { logFlags = true};
                    if (viewname == 'main') { mainFlags = true};
                    if (viewname == 'init') { initFlags = true};
                    if (viewname == 'clone') { cloneFlags = true};
                    resolve('Y');
                })
                .catch(function(error) {
                    reject('N');
                })
        } catch (e) {
            reject('Y');
        };
    });
};

module.exports = count;
