const hx = require('hbuilderx');

const {axiosGet} = require('../../../common/axios.js');
const { openOAuthBox } = require('../../../common/oauth.js');

const path = require('path');
const os = require('os');

function getDefaultClonePath() {
    try {
        if (os.platform() === 'darwin') {
            return path.join(os.homedir(), 'Documents');
        };
        if (os.platform() === 'win32') {
            return path.join(os.homedir(), 'Desktop');
        };
    } catch (error) {};
    return '';
};

/**
 * @description 从Github开始搜索
 */
async function openGithubSearch(word="") {
    let data = {"ssh":[],"https":[]};

    if (word.length < 2) {return};

    hx.window.setStatusBarMessage(`easy-git: 正在github搜索 ${word} ...., 这取决于您的网络状况`, 500000, 'info');

    let url = `https://api.github.com/search/repositories?q=${word}`
    let headers = {"Accept": "application/vnd.github.v3+json"};
    let SearchResult = await axiosGet(url, headers).catch(error=> {
        return 'fail';
    });
    hx.window.clearStatusBarMessage();

    if (SearchResult == 'fail') {
        // webviewDialog.displayError("Github搜索失败，请检查网络。")
        return data;
    } else {
        let { items } = SearchResult;
        if ( items.length == 0) {
            return data;
        } else {
            hx.window.setStatusBarMessage(`easy-git: github搜索 ${word} 成功。`, 500000, 'success');
        };
        data.ssh = items.map( x => x["ssh_url"]);
        data.https = items.map( x => x["clone_url"]);
        return data;
    };
};

module.exports = {
    openGithubSearch,
    getDefaultClonePath,
    openOAuthBox
}
