const hx = require('hbuilderx');

// hbuilderx 3.1.2+, use webviewDialog
let openWebDialog = require('./view_webdialog.js');

const {hxShowMessageBox} = require('../../common/utils.js');
const cmp_hx_version = require('../../common/cmp.js');

// get hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');
let cmp = cmp_hx_version(hxVersion, '3.1.2');

function openCloneView(webviewPanel=undefined) {
    try{
        if (cmp <= 0) {
            openWebDialog();
        } else {
            hxShowMessageBox(
                "EasyGit",
                "Git克隆操作，在HBuilderX 3.1.2+版本，优化界面UI以及相关功能。\n\n建议升级HBuilderX到3.1.2+版本。",
                 ["我知道了"]
            );
        }
    }catch(e){
        hxShowMessageBox(
            "EasyGit",
            "Git克隆操作界面，打开异常，请联系开发者。或升级HBuilderX到最新版本。",
             ["寻求帮助","我知道了"]
        ).then( btn => {
            if (btn == '寻求帮助') {
                hx.env.openExternal('https://ext.dcloud.net.cn/plugin?id=2475');
            }
        })
    };
};

module.exports = openCloneView;
