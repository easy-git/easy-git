const hx = require('hbuilderx');

// hbuilderx 2.9.2-, use webview
const openLogWebView = require('./WebView.js');

// hbuilderx 2.9.2+, use customEditor
let {
    GitLogCustomEditorRenderHtml,
    GitLogCustomWebViewPanal
} = require('./CustomEditor.js');

const cmp_hx_version = require('../../common/cmp.js');

// get hbuilderx version
let hxVersion = hx.env.appVersion;
hxVersion = hxVersion.replace('-alpha', '').replace(/.\d{8}/, '');
let cmp = cmp_hx_version(hxVersion, '2.9.2');

// CustomEditor 首次启动缓慢，因此在状态栏增加提示
let isShowLogMessage = false;

/**
 * @description 打开日志视图
 * @param {Object} userConfig
 * @param {Object} gitData
 * @param {Object} webviewPanel. hbuilderx 2.9.2-, use webview; hbuilderx 2.9.2+, use customEditor
 */
async function openLogView(userConfig, gitData, webviewPanel) {
    if (cmp <= 0) {
        if (isShowLogMessage == false) {
            hx.window.setStatusBarMessage('EasyGit: 正在加载Git日志，首次加载较慢，请耐心等待......', 5000, 'info');
            isShowLogMessage = true;
            setTimeout(function() {
                GitLogCustomEditorRenderHtml(gitData, userConfig);
            }, 800);
        } else {
            setTimeout(function() {
                GitLogCustomEditorRenderHtml(gitData, userConfig);
            }, 300);
        };
    } else {
        openLogWebView(webviewPanel, userConfig, gitData);
        hx.window.showView({
            viewid: "EasyGitCommonView",
            containerid: "EasyGitCommonView"
        });
    };
};

module.exports = openLogView;
