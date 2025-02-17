<template>
    <q-scroll-view layout='vbox' id="scrollView">
        <q-view layout='hbox'>
            <q-label text="托管主机" id="labelView"></q-label>
            <q-radio-group layout="hbox" layout-spacing='5'>
                <q-radio id="elRadio" text=" Github&nbsp;&nbsp;" :checked="host == 'Github'" @clicked="el_set_host" data-value="Github" />
                <q-radio id="elRadio" text=" Gitee" :checked="host == 'Gitee'" @clicked="el_set_host" data-value="Gitee" />
            </q-radio-group>
            <q-view horizontal-size-policy="Expanding"></q-view>
        </q-view>

        <q-view layout='hbox' style="margin-top: 10px;">
            <q-label text="账号授权" id="labelView"></q-label>
            <!-- <q-label :text="JSON.stringify(oauth_info)" id="labelView"></q-label> -->
            <!-- <q-label text="OAuth"></q-label> -->
            <q-view layout='hbox' v-if="oauth_info.status == 'success-authorize'">
                <q-label :text="host+'已授权'"></q-label>
            </q-view>
            <q-view layout='hbox' v-else-if="['fail-authorize','permission-denied'].includes(oauth_info.status) ">
                <q-label :text="oauth_info.msg"></q-label>
                <q-button id="elStandButton" text="重新授权" @clicked="goAuthorize"></q-button>
                <q-button id="elStandButton" text="刷新" @clicked="readLocalOAuth"></q-button>
            </q-view>
            <q-view layout='hbox' v-else>
                <q-button id="elStandButton" :text="'去'+host+'授权'" @clicked="goAuthorize"></q-button>
                <q-button id="elStandButton" text="刷新" @clicked="readLocalOAuth"></q-button>
            </q-view>
            <q-view horizontal-size-policy="Expanding"></q-view>
        </q-view>

        <q-view layout='hbox' style="margin-top: 10px;">
            <q-label text="仓库类型" id="labelView"></q-label>
            <q-radio-group layout="hbox" layout-spacing='5'>
                <q-radio id="elRadio" text=" 公开(所有人可见)&nbsp;&nbsp;"
                    :checked="!isPrivate"
                    @clicked="el_set"
                    accessibleName="repos_public"
                    data-value="false" />
                <q-radio id="elRadio" text=" 私有(仅仓库成员可见)"
                    :checked="isPrivate"
                    @clicked="el_set"
                    accessibleName="repos_private"
                    data-value="true" />
            </q-radio-group>
            <q-view horizontal-size-policy="Expanding"></q-view>
        </q-view>

        <q-view layout='hbox' style="margin-top: 5px;">
            <q-label text="所属组织" id="labelView"></q-label>
            <q-input :text='repos_owner'
                id="elInput" accessibleName="repos_owner"
                @textChanged="el_set"
                placeholderText="归属组织，非必填；默认">
            </q-input>
        </q-view>

        <q-view layout='hbox' style="margin-top: 5px;">
            <q-label text="仓库名称" id="labelView"></q-label>
            <q-input :text='repos_name'
                id="elInput" accessibleName="repos_name"
                @textChanged="el_set"
                placeholderText="仓库名称必填，只允许包含字母、数字或者下划线(_)、中划线(-)、英文句号(.)，且长度为1~100个字符">
            </q-input>
        </q-view>

        <q-view layout='hbox' style="margin-top: 5px;">
            <q-label text="克隆操作" id="labelView"></q-label>
            <q-checkbox id="elCheckBox" text="远程仓库创建后，是否克隆到本地。勾选后，会打开克隆视图。"
                accessibleName="action_clone"
                @clicked="el_set"
                :checked='isClone' />
            <q-view horizontal-size-policy="Expanding"></q-view>
        </q-view>
        <q-view layout='hbox' style="margin-top: 5px;" v-if="isClone">
            <q-label text="" id="labelView"></q-label>
            <q-radio-group layout="hbox" layout-spacing='5'>
                <q-radio id="elRadio" text=" 使用HTTPS/HTTP克隆&nbsp;&nbsp;"
                    :checked="clone_protocol == 'http'" @clicked="el_set_clone_protocol" data-value="http" />
                <q-radio id="elRadio" text=" 使用SSH克隆"
                    :checked="clone_protocol == 'ssh'" @clicked="el_set_clone_protocol" data-value="ssh" />
            </q-radio-group>
            <q-view horizontal-size-policy="Expanding"></q-view>
        </q-view>

        <!-- vertical-size-policy 垂直填充 -->
        <q-view vertical-size-policy="Expanding"></q-view>
    </q-scroll-view>
</template>

<script>
    const hx = require('hbuilderx');
    const {
        readGitHostOAuthInfo,
        goGitHostAuthorize,
        refreshGitHostAuthorizeStatus
    } = require('./remote_repository_utils.js');

    export default {
        data() {
            return {
                host: "Github",
                repos_owner: "",
                repos_name: "",
                isPrivate: true,
                isClone: false,
                clone_protocol: 'http',
                giteeOAuthInfo: {},
                githubOAuthInfo: {},
                // oauth_info: {
                //     // "status": "success-authorize",
                //     "status": "permission-d3enied",
                //     "msg": "授权过期"
                // }
            }
        },

        computed: {
            oauth_info() {
                if (this.host == "Github") {
                    return this.githubOAuthInfo;
                };
                return this.giteeOAuthInfo;
            }
        },

        created() {
            this.readLocalOAuth('all');
        },

        methods: {
            async readLocalOAuth(platform) {
                if (platform == "all" || this.host.toLowerCase() == "gitee") {
                    this.giteeOAuthInfo = await readGitHostOAuthInfo('gitee');
                };
                if (platform == "all" || this.host.toLowerCase() == "github") {
                    this.githubOAuthInfo = await readGitHostOAuthInfo('github');
                };
                // console.error("[Github]", this.githubOAuthInfo);
                // console.error("[Gitee]", this.giteeOAuthInfo);
                await this.updateUi();
            },

            async el_set_host(e) {
                this.host = e.target['data-value'];
                await this.updateUi();
            },
            async el_set_clone_protocol(e) {
                this.clone_protocol = e.target['data-value'];
                await this.updateUi();
            },

            async el_set(e) {
                let accessibleName = e.target.accessibleName;
                if (accessibleName == "repos_owner") {
                    this.repos_owner = e.target.text;
                };
                if (accessibleName == "repos_name") {
                    this.repos_name = e.target.text;
                };
                if (accessibleName == "repos_public") {
                    this.isPrivate = false;
                };
                if (accessibleName == "repos_private") {
                    this.isPrivate = true;
                };
                if (accessibleName == "action_clone") {
                    this.isClone = e.target.checked;
                };
                this.updateUi();
            },

            async goAuthorize() {
                goGitHostAuthorize(this.host);
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
    }

    #labelView {
        min-width: 70px;
        text-align: center;
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

    #elCheckBox::indicator::unchecked {
    	image: url(:/hxui/resource/chbx.png);
    }

    #elCheckBox::indicator::checked {
        image: url(:/hxui/resource/chbx-checked.png);
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

    #elStandButton {
        border: 1px solid #00b142;
        background-color: #f9fffa;
        border-radius: 2px;
        color: #00b142;
        padding: 1px 8px;
        min-width: 55px;
        margin-right: 10px;
    }

    #elStandButton:pressed {
        background: #E1F0E1;
    }
</style>
