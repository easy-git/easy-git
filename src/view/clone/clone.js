const hx = require('hbuilderx');

// hbuilderx 3.1.2+, use webviewDialog
let openWebDialog = require('./view_webdialog.js');
let cloneMainForVue = require('./view_for_vue.js');

const {hxShowMessageBox} = require('../../common/utils.js');

function openCloneView(context, isSwitchSearchGithub=false) {
    try{
        // openFormDialog();
        console.error("=======", context.extensionPath)
        cloneMainForVue();
        // openWebDialog('', isSwitchSearchGithub);
    }catch(e){
        console.error(e)
    };
};

module.exports = openCloneView;
