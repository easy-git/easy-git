const hx = require('hbuilderx');

// hbuilderx 3.1.2-, use webview
const openWebView = require('./view_webview.js');

// hbuilderx 3.1.2+, use webviewDialog
let openWebDialog = require('./view_webdialog.js');

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
            openWebView(webviewPanel);
        }
    }catch(e){
        console.log(e)
        openWebView(webviewPanel);
    };
};

module.exports = openCloneView;
