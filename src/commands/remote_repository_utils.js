const { Gitee, Github, gitRepoCreate } = require('../common/oauth.js');

let giteeOAuth = new Gitee();
let githubOAuth = new Github();

async function readGitHostOAuthInfo(platform) {
    if (platform == 'gitee') {
        return await giteeOAuth.readLocalToken();
    };
    if (platform == 'github') {
        return await githubOAuth.readLocalToken();
    };
};

// 跳转去认证
function goGitHostAuthorize(host) {
    host = host.toLowerCase();
    if (host == 'gitee') {
        giteeOAuth.authorize(true);
        // this.listeningAuthorize(host);
    };
    if (host == 'github') {
        githubOAuth.authorize(true);
        // this.listeningAuthorize(host);
    };
};

module.exports = {
    readGitHostOAuthInfo,
    goGitHostAuthorize
}
