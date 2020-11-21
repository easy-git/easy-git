const hx = require('hbuilderx');

const cmp_hx_version = require('../../common/cmp.js');

// hbuilderx 2.9.2+, use customEditor
let {
    GitDiffCustomEditorRenderHtml,
    GitDiffCustomWebViewPanal }
= require('./CustomEditor.js');

// get hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');
let cmp = cmp_hx_version(hxVersion, '2.9.2');

// CustomEditor 首次启动缓慢，因此在状态栏增加提示
let isShowDiffMessage = false;


/**
 * @description git diff file
 * @param {Object} ProjectData
 * @param {Object} userConfig
 */
async function openDiffFileView(ProjectData, userConfig) {
    if (cmp <= 0) {
        if (isShowDiffMessage == false) {
            hx.window.setStatusBarMessage('EasyGit: 正在加载Diff自定义编辑器，首次加载较慢，请耐心等待......', 5000, 'info');
            isShowDiffMessage = true;
            setTimeout(function() {
                GitDiffCustomEditorRenderHtml(ProjectData, userConfig);
            }, 1500);
        } else {
            setTimeout(function() {
                GitDiffCustomEditorRenderHtml(ProjectData, userConfig);
            }, 300);
        };
    } else {
        hx.window.showErrorMessage('Git: 此功能适用于HBuilderX 2.9.2+版本。', ['升级HBuilderX', '关闭']).then( (res) => {
            if (res == '升级HBuilderX') {
                hx.commands.executeCommand('update.checkForUpdate');
            };
        });
    };
};

module.exports = openDiffFileView;
