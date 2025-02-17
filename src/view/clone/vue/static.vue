<template>
    <q-scroll-view layout='vbox' id="scrollView">
        <!-- <q-view layout='hbox'>
            <q-label text="克隆协议" id="labelView"></q-label>
            <q-radio-group layout="hbox" layout-spacing='5'>
                <q-radio id="elRadio" text=" HTTPS/HTTP  " :checked="cloneInfo.protocol == 'http'" @clicked="set_clone_protocol" data-value="http" />
                <q-radio id="elRadio" text=" SSH" :checked="cloneInfo.protocol == 'ssh'" @clicked="set_clone_protocol" data-value="ssh" />
            </q-radio-group>
            <q-view horizontal-size-policy="Expanding"></q-view>
        </q-view> -->
        <q-view layout='hbox'>
            <q-label text="操作" id="labelView"></q-label>
            <q-radio-group layout="hbox" layout-spacing='5'>
                <q-radio id="elRadio" text=" 输入仓库地址&nbsp;&nbsp;" :checked="action == 'userInput'" @clicked="setAction" data-value="userInput" />
                <q-radio id="elRadio" text=" 在Github搜索" :checked="action == 'search_github'" @clicked="setAction" data-value="search_github" />
            </q-radio-group>
            <q-view horizontal-size-policy="Expanding"></q-view>
        </q-view>

        <q-view layout="vbox" style="margin-top: 6px;" v-if="action != 'userInput'">
            <q-view layout="hbox">
                <q-label text="搜索Github" id="labelView"></q-label>
                <q-input :text='github_search_text'
                    id="elInput" accessibleName="github_search_text"
                    @textChanged="el_set"
                    placeholderText="输入关键字, 在Github搜索, Github是否搜索成功，取决于您网络，目前仅返回前10条结果...">
                </q-input>
                <q-button id="elStandButton" text="开始搜索" @clicked='open_github_search()'></q-button>
            </q-view>
            <q-view layout="hbox" v-if="github_search_err_msg">
                <q-label text="" id="labelView"></q-label>
                <q-label text="提示: 请先输入搜索关键字" id="msg_error"></q-label>
                <q-view horizontal-size-policy='Expanding'></q-view>
            </q-view>
            <q-list-view id="GithubListView"
                currentIndex="-1" @currentRowChanged="currentRowChanged"
                v-if="githubRepoList.length != 0">
                <q-list-item layout='hbox' v-for="item in githubRepoList">
                    <q-label :text="item"
                        :style="{color: item == selectedGithubRepoName ? '#4EAB57': ''}" :data-value="item">
                    </q-label>
                    <q-view horizontal-size-policy='Expanding'></q-view>
                </q-list-item>
            </q-list-view>
        </q-view>

        <q-view layout="hbox" style="margin-top: 6px;">
            <q-label text="Git仓库" id="labelView"></q-label>
            <!-- <q-input :text='cloneInfo.repo'
                id="elInput" accessibleName="git_repo"
                @textChanged="el_set"
                placeholderText="输入Git存储库URL （以git@或http开头）">
            </q-input> -->
            <q-combox
                :items='cacheRepoList'
                :currentIndex='cacheRepoIndex'
                :currentText='cacheRepoName'
                :stretch-factor='1'
                accessibleName="git_repo_combox"
                placeholderText="输入Git存储库URL （以git@或http开头）"
                @currentTextChanged="el_set"
                style="font-size: 12px;"></q-combox>
            <q-view horizontal-size-policy="ShrinkFlag"></q-view>
        </q-view>

        <q-view layout='hbox'>
            <q-label text="Git分支" id="labelView"></q-label>
            <q-input :text='cloneInfo.branch'
                id="elInput" accessibleName="git_branch"
                @textChanged="el_set" placeholderText="选填, 如不填写, 则默认拉取main分支">
            </q-input>
        </q-view>

        <q-view layout='hbox'>
            <q-label text="账户密码" id="labelView"></q-label>
            <q-input :text='cloneInfo.username'
                id="elInput" accessibleName="git_account_username"
                @textChanged="el_set" placeholderText="选填, Git账户用户名或email">
            </q-input>
            <q-input :text='cloneInfo.password'
                id="elInput" accessibleName="git_account_password"
                @textChanged="el_set" placeholderText="选填, Git账户密码">
            </q-input>
        </q-view>

        <q-view layout='hbox'>
            <q-label text="本地路径" id="labelView"></q-label>
            <q-input :text='cloneInfo.local_destination_path'
                id="elInput" accessibleName="git_local_destination_path"
                @textChanged="el_set" placeholderText="本地路径">
            </q-input>
            <q-button id="elStandButton" text="浏览..." @clicked='select_local_path()'></q-button>
        </q-view>
        <q-view layout='hbox' style="margin-top: 6px;">
            <q-view layout="vbox" layout-spacing="0">
                <q-view layout="hbox">
                    <q-label id="Tips" text="1. 基于 SSH 协议的 Git clone，需要先配置好账户/仓库的SSH公钥"></q-label>
                    <q-button id="TipsBtn" text="一键生成配置SSH KEY" @clicked="set_ssh_key"></q-button>
                    <q-view horizontal-size-policy='Expanding'></q-view>
                </q-view>
                <q-view layout='hbox'>
                    <q-label id="Tips" text="2. 如果使用HTTP/HTTPS协议, Git Clone 可能需要账号密码, 如本地已缓存Git凭据, 则不需要填写. "></q-label>
                    <q-button id="TipsBtn" text="详情" @clicked="open_url('https://easy-git.github.io/auth/http')"></q-button>
                    <q-view horizontal-size-policy='Expanding'></q-view>
                </q-view>
                <q-view layout='hbox'>
                    <q-label id="Tips" text="3. EasyGit支持Github、Gitee OAuth授权。"></q-label>
                    <q-button id="TipsBtn" text="查看详情" @clicked="open_url('https://easy-git.github.io/oauth')"></q-button>
                    <q-button id="TipsBtn" text="点击进行授权" @clicked="goAuthorize"></q-button>
                    <q-view horizontal-size-policy='Expanding'></q-view>
                </q-view>
                <q-view layout='hbox'>
                    <q-label id="Tips" text="4. 授权后此窗口会自动加载您账户下所有的仓库，克隆更方便; 还支持使用远程Git服务器某些功能，比如创建远程仓库。"></q-label>
                    <q-view horizontal-size-policy='Expanding'></q-view>
                </q-view>
            </q-view>
        </q-view>

        <!-- vertical-size-policy 垂直填充 -->
        <q-view vertical-size-policy="Expanding"></q-view>

    </q-scroll-view>
</template>

<script>
    const hx = require('hbuilderx');
    const {
        openGithubSearch,
        getDefaultClonePath,
        openOAuthBox,
        getOAuthUserAllGitRepos
    } = require('../clone_utils.js');

    export default {
        data() {
            return {
                action: 'userInput',
                github_search_text: "",
                githubRepoList: [],
                githubRepoIndex: 0,
                selectedGithubRepoName: "",
                github_search_err_msg: false,
                cacheRepoList: [],
                cacheRepoIndex: -1,
                cacheRepoName: "",
                cloneInfo: {
                    protocol: 'ssh',
                    username: '',
                    password: '',
                    repo: '',
                    branch: '',
                    local_destination_path: ''
                }
            }
        },

        created() {
            this.cloneInfo.local_destination_path = getDefaultClonePath();
            this.getOAuthCacheRepoList();
        },

        methods: {
            async getOAuthCacheRepoList() {
                let giteeResult = await getOAuthUserAllGitRepos(undefined, 'gitee');
                // console.error("[getOAuthCacheRepoList] ...... ", giteeResult);
                this.cacheRepoList = giteeResult['https'];
                await this.updateUi();

                let githubResult = await getOAuthUserAllGitRepos(undefined, 'github');
                // console.error("[githubResult] ...... ", githubResult);
                this.cacheRepoList = [...this.cacheRepoList, ...githubResult['https']];
                await this.updateUi();
            },

            async setAction(e) {
                let v = e.target['data-value'];
                this.action = v;
                await this.updateUi();
            },

            async set_clone_protocol(e) {
                this.cloneInfo.protocol = e.target['data-value'];
                // await this.updateUi();
            },

            async el_set(e) {
                let accessibleName = e.target.accessibleName;
                if (accessibleName == "git_repo") {
                    this.cloneInfo.repo = e.target.text;
                };
                if (accessibleName == "git_repo_combox") {
                    this.cloneInfo.repo = e.target.currentText;
                };
                if (accessibleName == "git_branch") {
                    this.cloneInfo.branch = e.target.text;
                };
                if (accessibleName == "github_search_text") {
                    this.github_search_text = e.target.text;
                };
                if (accessibleName == "git_local_destination_path") {
                    this.cloneInfo.local_destination_path = e.target.text;
                };
                if (accessibleName == "git_account_username") {
                    this.cloneInfo.username = e.target.text;
                };
                if (accessibleName == "git_account_password") {
                    this.cloneInfo.password = e.target.text;
                }
            },

            // 开始搜索Github
            async open_github_search() {
                const word = this.github_search_text;
                if (/^\s+$/.test(word) || word.length == 0) {
                    this.github_search_err_msg = true;
                    await this.updateUi();
                    return;
                };
                if (this.github_search_err_msg) {
                    this.github_search_err_msg = false;
                };
                const result = await openGithubSearch(word);
                this.githubRepoList = result.https;
                await this.updateUi();
            },

            // 从github搜索结果中选择
            async currentRowChanged(e) {
                const idx = e.target.currentRow;
                this.selectedGithubRepoName = this.githubRepoList[idx];
                this.cloneInfo.repo = this.selectedGithubRepoName;
                await this.updateUi()
            },

            // 选择本地路径
            async select_local_path() {
                let [file] = await hx.window.showOpenDialog({
                    folder: true
                });
                if (!file) return;
                this.cloneInfo.local_destination_path = file;
                await this.updateUi();
            },

            // 设置ssh key
            async set_ssh_key() {
                hx.commands.executeCommand('EasyGit.sshKeygen');
            },

            // github、gitee授权
            async goAuthorize() {
                openOAuthBox();
            },

            // 打开链接
            async open_url(url) {
                hx.env.openExternal(url);
            }
        },
    }
</script>

<style>
    * {
        background: transparent;
        padding: 0;
        border: none;
    }

    #scrollView {
        width: 100%;
        /* justify-content: start; */
    }

    #labelView {
        min-width: 70px;
        text-align: center;
    }

    #elInput {
        border: none;
        height: 30px;
        border-bottom: 1px solid #d6d6d6;
        outline: none;
        /* color: #000; */
        font-size: 12px;
        margin-right: 10px;
    }

    #elInput:focus {
        background: transparent;
        border-color: #43c45b;
    }

    #elRadio::indicator::unchecked {
        image: url(:/hxui/resource/rdbt.png);
    }

    #elRadio::indicator::unchecked:hover {
        image: url(:/hxui/resource/rdbt-hover.png);
    }

    #elRadio::indicator::checked {
        image: url(:/hxui/resource/rdbt-checked.png);
    }

    #elStandButton {
        border: 1px solid #00b142;
        background-color: #f9fffa;
        border-radius: 2px;
        color: #00b142;
        padding: 3px 8px;
        width: 55px;
        margin-right: 10px;
    }

    #elStandButton:pressed {
        background: #E1F0E1;
        border-color: #00b142;
    }

    #Tips {
       font-size: 12px;
       color: #606266;
    }

    #TipsBtn {
        font-size: 12px;
        color: #58ba72;
        text-decoration: underline;
        margin-top: -3px;
    }

    QComboBox {
        height: 30px;
        background: #FFFEFA;
        border: none;
        border-bottom: 1px solid #d6d6d6;
        outline: none;
    }

    QComboBox:hover,
    QComboBox:focus {
        border-bottom: 1px solid #43C45B;
    }

    QComboBox::down-arrow {
        image: url(:/login/icons/down-arrow-fill.png);
    }

    QComboBox::drop-down {
        subcontrol-position: top right;
        width: 32px;
        border: none;
    }

    QComboBox QAbstractItemView {
        background: #FFFEFA;
        color: #405E42;
        selection-color: #405E42;
    }

    QComboBox QAbstractItemView::item {
        min-height: 26px;
        background: #FFFEFA;
        border-left: 1px solid #e5e5e5;
        border-right: 1px solid #e5e5e5;
        border-bottom: 1px solid #e5e5e5;
    }

    QComboBox QAbstractItemView::item:hover,
    QComboBox QAbstractItemView::item:selected {
        background: #FAFFFA;
    }

    #msg_error {
        color: darkred;
        font-size: 12px;
    }

    #GithubListView {
        background: #FFFEFA;
        border: 1px solid #e5e5e5;
        border-radius: 3px;
        margin: 10px 10px 0px 80px;
        min-height: 130px;
    }

    #GithubListView::item {
        padding: 5px;
    }

    #GithubListView::item:selected, #list::item:hover {
      background-color: transparent;
    }
</style>
