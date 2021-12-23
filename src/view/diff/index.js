const hx = require('hbuilderx');

// hbuilderx 2.9.2+, use customEditor
let {
    GitDiffCustomEditorRenderHtml,
    GitDiffCustomWebViewPanal }
= require('./CustomEditor.js');

// CustomEditor 首次启动缓慢，因此在状态栏增加提示
let isShowDiffMessage = false;


/**
 * @description git diff file
 * @param {Object} ProjectData
 * @param {Object} userConfig
 */
async function openDiffFileView(ProjectData, userConfig) {
    if (isShowDiffMessage == false) {
        hx.window.setStatusBarMessage('EasyGit: 正在加载Diff自定义编辑器，首次加载较慢，请耐心等待......', 5000, 'info');
        isShowDiffMessage = true;
        setTimeout(function() {
            GitDiffCustomEditorRenderHtml(ProjectData, userConfig);
        }, 1000);
    } else {
        setTimeout(function() {
            GitDiffCustomEditorRenderHtml(ProjectData, userConfig);
        }, 300);
    };
};

module.exports = openDiffFileView;
