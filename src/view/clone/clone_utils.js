const hx = require('hbuilderx');

const { axiosGet } = require('../../common/axios.js');
const { Gitee, Github, openOAuthBox } = require('../../common/oauth.js');

const path = require('path');
const os = require('os');

const appDataDir = hx.env.appData;
const osName = os.platform();

/**
 * @description 设置初始克隆目录
 */
function getDefaultClonePath() {
    try{
        let config = hx.workspace.getConfiguration();
        let LastCloneDir = config.get('EasyGit.LastCloneDir');
        if (LastCloneDir && LastCloneDir != '') {
            return LastCloneDir;
        };
        if (osName == 'darwin') {
            return path.join(process.env.HOME, 'Documents')
        } else {
            return path.join("C:", process.env.HOMEPATH, 'Desktop')
        };
    }catch(e){
        console.error("[getDefaultClonePath] error: ", e);
        return '';
    };
};


/**
 * @description 搜索Github。此方法被git clone视图调用
 * @param {Object} word 搜索关键字
 * @param {Object} webviewDialog
 * @param {Object} webview
 */
async function openGithubSearch(word, webviewDialog=undefined, webview=undefined) {
    let data = {"ssh":[],"https":[]};

    if (word.length < 2) {return};

    if (webviewDialog) {
        webviewDialog.displayError('');
    };

    hx.window.setStatusBarMessage(`easy-git: 正在github搜索 ${word} ...., 这取决于您的网络状况`, 500000, 'info');

    let url = `https://api.github.com/search/repositories?q=${word}`
    let headers = {"Accept": "application/vnd.github.v3+json"};
    let SearchResult = await axiosGet(url, headers).catch(error=> {
        return 'fail';
    });
    hx.window.clearStatusBarMessage();

    if (SearchResult == 'fail') {
        if (webviewDialog) {
            webviewDialog.displayError("Github搜索失败，请检查网络。");
        };
        return data;
    };

    let { items } = SearchResult;
    if ( items.length == 0) {
        if (webviewDialog) {
            webviewDialog.displayError("Github搜索，没有搜索到结果。");
        };
        return data;
    } else {
        hx.window.setStatusBarMessage(`easy-git: github搜索 ${word} 成功。`, 500000, 'success');
    }
    data.ssh = items.map( x => x["ssh_url"]);
    data.https = items.map( x => x["clone_url"]);

    if (webview) {
        webview.postMessage({command: 'githubSearchResult',data: data});
    };
    return data;
};

/**
 * @description github缓存数据
 */
class GithubCache {
    constructor() {
        this.cacheFile = path.join(appDataDir, 'easy-git', 'oauth', '.cache_github_repos');
    };

    async save(data) {
        try{
            let {ssh, https} = data;
            if (ssh.length) {
                fs.writeFile(this.cacheFile, JSON.stringify(data), function (err) {
                   if (err) throw err;
                });
            };
        }catch(e){};
    };

    async read() {
        try{
            let fileRawContent = fs.readFileSync(this.cacheFile, 'utf-8');
            let fileLastContent = JSON.parse(fileRawContent);
            let check = fileLastContent instanceof Object;
            if (!check) {return false;};
            let {ssh, https} = fileLastContent;
            if (ssh.length && https.length) {
                return fileLastContent;
            };
        }catch(e){
            return false;
        };
    };
};


/**
 * @description 获取已授权账号，用户仓库列表
 */
async function getOAuthUserAllGitRepos(webview, platform="all") {
    let allRepos = {"ssh":[],"https":[]};

    let ghCache = new GithubCache();
    try{
        // 读取本地的Github缓存数据
        let ghCacheData = await ghCache.read()
        allRepos.ssh = [ ...allRepos["ssh"], ...ghCacheData["ssh"] ];
        allRepos.https = [ ...allRepos["https"], ...ghCacheData["https"] ];
    }catch(e){};

    let ge = new Gitee();
    let giteeRepos = await ge.getUserRepos();
    console.error("giteeRepos result ->", platform, giteeRepos);

    // 先返回gitee
    if (platform == "all" || platform == 'gitee') {
        if (giteeRepos != 'fail-authorize') {
            let {ssh, https} = giteeRepos;
            allRepos.ssh = [ ...allRepos["ssh"], ...ssh ];
            allRepos.https = [ ...allRepos["https"], ...https ];

            if (webview) {
                webview.postMessage({command: 'authResult',data: true});
                webview.postMessage({command: 'repos',data: allRepos});
            };
        };
    };
    if (platform == "gitee") return allRepos;

    let gtb = new Github();
    let githubRepos = await gtb.getUserRepos();

    if (githubRepos == 'fail-authorize') {
        return allRepos;
    };
    if (githubRepos != 'fail-authorize') {
        ghCache.save(githubRepos);

        allRepos.ssh = [ ...allRepos["ssh"], ...githubRepos["ssh"] ];
        allRepos.https = [ ...allRepos["https"], ...githubRepos["https"] ];
    };
    if (allRepos && webview) {
        webview.postMessage({command: 'authResult',data: true});
        webview.postMessage({command: 'repos',data: allRepos});
    };
    return allRepos;
};


module.exports = {
    openGithubSearch,
    getDefaultClonePath,
    openOAuthBox,
    getOAuthUserAllGitRepos
}
