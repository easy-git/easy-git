const hx = require('hbuilderx');

// hbuilderx 3.1.2+, use webviewDialog
let openWebDialog = require('./view_webdialog.js');
let openFormDialog = require('./formdialog.js');

const {hxShowMessageBox} = require('../../common/utils.js');

function openCloneView(isSwitchSearchGithub=false) {
    try{
        // openFormDialog();
        openWebDialog('', isSwitchSearchGithub);
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
