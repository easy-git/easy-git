/**
 * time: 2022-6-3
 * author: xiaohutu
 * 本文件用于源码视图、日志视图主题，使之匹配HBuilderX主题
 */

const hx = require('hbuilderx');

/**
 * @description 判断是否是object
 * @param {Object} object
 */
function isObj(object){
    return object && typeof (object) == 'object' && Object.prototype.toString.call(object).toLowerCase() == "[object object]";
};

/**
 * @description 获取跟主题相匹配的颜色
 *   - fontFamily              字体
 *   - fontSize                字号
 *   - fontColor               字体颜色
 *   - lefeSideVeiwBackground  左侧视图背景色
 *   - leftSideViewLiBackground 左侧视图文件选中颜色
 *   - toolBarBgColor          工具栏颜色
 *   - background              编辑器背景色
 *   - liHoverBackground       li类元素，悬停背景色
 *   - inputColor              输入框颜色
 *   - inputBgColor            输入框背景色
 *   - inputLineColor          输入框线条颜色
 *   - inputPlaceholderColor   输入框placeholder颜色
 *   - lineColor               其它线条颜色
 *   - menuBackground          菜单背景色
 *   - menuCutLineColor        菜单分割线
 *   - scrollbarColor          滚动条颜色
 *   - cursorColor             光标颜色
 *   - remarkTextColor         备注颜色，主要用于左侧视图文件目录名颜色
 *   - lineForBorderTopColor   日志视图，commit详情 border-top
 * @param {String} area - HBuilderX区域，当area=undefinded，返回编辑器区域的背景色；当area=siderBar时，返回项目管理器背景色
 * @return {Object}
 */
function getThemeColor(area) {
    let fontColor;
    let background;
    let lefeSideVeiwBackground;
    let liHoverBackground;
    let inputColor;
    let inputBgColor;
    let inputLineColor;
    let cursorColor;
    let lineColor;
    let menuBackground;
    let menuCutLineColor;
    let scrollbarColor;
    let remarkTextColor;
    let lineForBorderTopColor;

    let config = hx.workspace.getConfiguration();
    let colorScheme = config.get('editor.colorScheme');
    let colorCustomizations = config.get('workbench.colorCustomizations');
    let explorerIconTheme = config.get('explorer.iconTheme');

    if (colorScheme == undefined) {
        colorScheme = 'Default';
    };
    if (explorerIconTheme == '' || !explorerIconTheme) {
        explorerIconTheme = "vs-seti"
    };

    if (!["hx-file-icons", "vs-seti", "hx-file-icons-colorful"].includes(explorerIconTheme)) {
        explorerIconTheme = "vs-seti"
    };

    // 用于确定图标颜色 light | dark
    let explorerIconScheme = 'light';
    if (colorScheme == 'Monokai' || colorScheme == 'Atom One Dark') {
        explorerIconScheme = "dark";
    };

    // 获取HBuilderX编辑器字体大小
    let fontSize = config.get('editor.fontSize');
    if (fontSize == '' || fontSize == undefined) {
        fontSize = 14;
    };

    // 获取HBuilderX编辑器字体
    let fontFamily = config.get("editor.fontFamily");
    if (fontFamily) {
        fontFamily = "Monaco"
    };

    let customColors = {};
    try{
        customColors = colorCustomizations[`[${colorScheme}]`];
        if (!isObj(customColors)) {
            customColors = {};
        };
    } catch (e) {};

    switch (colorScheme){
        case 'Monokai':
            fontColor = 'rgb(227,227,227)';
            remarkTextColor = 'rgb(154,154,154)';
            lefeSideVeiwBackground = 'rgb(39,40,34)';
            leftSideViewLiBackground = 'rgb(57,60,49)';
            toolBarBgColor = 'rgb(65,65,65)';
            background = 'rgb(39,40,34)';
            menuBackground = 'rgb(58,58,58)';
            menuCutLineColor = 'rgb(119,119,119)';
            liHoverBackground = 'rgb(78,80,73)';
            inputColor = 'rgb(255,254,250)';
            inputPlaceholderColor = 'rgb(62,64,59)';
            inputBgColor = '#2E2E2E';
            inputLineColor = '#CECECE';
            cursorColor = 'rgb(255,255,255)';
            lineColor = 'rgb(23,23,23)';
            lineForBorderTopColor = 'rgb(23,23,23)';
            scrollbarColor = '#6F6F6F';
            break;
        case 'Atom One Dark':
            fontColor = 'rgb(171,178,191)';
            remarkTextColor = 'rgb(154,154,154)';
            lefeSideVeiwBackground = 'rgb(33,37,43)';
            leftSideViewLiBackground = 'rgb(38,40,48)';
            toolBarBgColor = 'rgb(34,37,47)';
            background = 'rgb(40,44,53)';
            menuBackground = 'rgb(53,59,69)';
            menuCutLineColor = 'rgb(119,119,119)';
            liHoverBackground = 'rgb(44,47,55)';
            inputColor = 'rgb(255,254,250)';
            inputBgColor = '#282c35';
            inputPlaceholderColor = 'rgb(133,136,140)';
            inputLineColor = 'rgb(65, 111, 204)';
            cursorColor = 'rgb(255,255,255)';
            lineColor = '#282c35';
            lineForBorderTopColor = 'rgb(24,26,31)';
            scrollbarColor = '#6F6F6F';
            break;
        default:
            fontColor = 'rgb(51, 51, 51)';
            remarkTextColor = 'rgb(104,104,104)';
            lefeSideVeiwBackground = 'rgb(255,250,232)';
            leftSideViewLiBackground = 'rgb(255,254,249)';
            toolBarBgColor = 'rgb(255,254,249)';
            background = 'rgb(255,250,232)';
            menuBackground = 'rgb(255,254,250)';
            menuCutLineColor = 'rgb(207,207,207)';
            liHoverBackground = 'rgb(224,237,211)';
            inputColor = 'rgb(255,252,243)';
            inputBgColor = 'rgb(248, 243, 226)';
            inputLineColor = 'rgb(65,168,99)';
            inputPlaceholderColor = 'rgb(135,135,133)';
            cursorColor = 'rgb(0,0,0)';
            lineColor = 'rgb(225,212,178)';
            lineForBorderTopColor = 'rgb(225,212,178)';
            scrollbarColor = 'rgb(207,181,106)';
            break;
    };

    // siderBar: 代表左侧视图
    let viewBackgroundOptionName = area == 'siderBar' ? 'sideBar.background' : 'editor.background';
    let viewFontOptionName = area == 'siderBar' ? 'list.foreground' : undefined;
    let viewLiHoverBgOptionName = area == 'siderBar' ? 'list.hoverBackground' : 'list.hoverBackground';

    if (customColors != undefined && JSON.stringify(customColors) != '{}') {
        if (customColors[viewBackgroundOptionName] && viewBackgroundOptionName in customColors) {
            background = customColors[viewBackgroundOptionName];
            lefeSideVeiwBackground = customColors[viewBackgroundOptionName];
            menuBackground = customColors[viewBackgroundOptionName];
        };
        if (customColors[viewFontOptionName] && viewFontOptionName in customColors) {
            fontColor = customColors[viewFontOptionName];
        };
        if (customColors[viewLiHoverBgOptionName] && viewLiHoverBgOptionName in customColors) {
            liHoverBackground = customColors[viewLiHoverBgOptionName];

            // 左侧视图，输入框背景色，跟li元素悬停背景色保持一致
            inputBgColor = customColors[viewLiHoverBgOptionName];

            lineColor = customColors[viewLiHoverBgOptionName]
        };
    };

    // 十六进制颜色正则
    let HexReg = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    // easygit主题自定义：左侧视图颜色
    if (area == 'siderBar') {
        let customThemeConfigForSider= config.get('EasyGit.theme.siderBar');
        if (isObj(customThemeConfigForSider) && JSON.stringify(customThemeConfigForSider) != '{}') {
            let sTmp = Object.assign(customThemeConfigForSider);
            if (HexReg.test(sTmp["background"])) { lefeSideVeiwBackground = sTmp["background"]; };
            if (HexReg.test(sTmp["fontColor"])) { fontColor = sTmp["fontColor"]; };
            if (HexReg.test(sTmp["lineColor"])) { lineColor = sTmp["lineColor"]; };
            if (HexReg.test(sTmp["inputColor"])) { inputColor = sTmp["inputColor"]; };
            if (HexReg.test(sTmp["inputBgColor"])) { inputBgColor = sTmp["inputBgColor"]; };
            if (HexReg.test(sTmp["inputLineColor"])) { inputLineColor = sTmp["inputLineColor"]; };
            if (HexReg.test(sTmp["scrollbarColor"])) { scrollbarColor = sTmp["scrollbarColor"]; };
            if (HexReg.test(sTmp["remarkTextColor"])) { remarkTextColor = sTmp["remarkTextColor"]; };
            if (HexReg.test(sTmp["menuBackground"])) { menuBackground = sTmp["menuBackground"]; };
            if (HexReg.test(sTmp["liHoverBackground"])) { liHoverBackground = sTmp["liHoverBackground"]; };
            if (HexReg.test(sTmp["cursorColor"])) { cursorColor = sTmp["cursorColor"]; };
        };
    } else {
        // easygit主题自定义：编辑器颜色
        let customThemeConfigForEditor= config.get('EasyGit.theme.editor');
        if (isObj(customThemeConfigForEditor) && JSON.stringify(customThemeConfigForEditor) != '{}') {
            let eTmp = Object.assign(customThemeConfigForEditor);
            if (HexReg.test(eTmp["background"])) { background = eTmp["background"]; };
            if (HexReg.test(eTmp["fontColor"])) { fontColor = eTmp["fontColor"]; };
            if (HexReg.test(eTmp["lineColor"])) { lineColor = eTmp["lineColor"]; };
            if (HexReg.test(eTmp["inputColor"])) { inputColor = eTmp["inputColor"]; };
            if (HexReg.test(eTmp["inputBgColor"])) { inputBgColor = eTmp["inputBgColor"]; };
            if (HexReg.test(eTmp["inputLineColor"])) { inputLineColor = eTmp["inputLineColor"]; };
            if (HexReg.test(eTmp["scrollbarColor"])) { scrollbarColor = eTmp["scrollbarColor"]; };
            if (HexReg.test(eTmp["remarkTextColor"])) { remarkTextColor = eTmp["remarkTextColor"]; };
            if (HexReg.test(eTmp["menuBackground"])) { menuBackground = eTmp["menuBackground"]; };
            if (HexReg.test(eTmp["menuCutLineColor"])) { menuCutLineColor = eTmp["menuCutLineColor"]; };
            if (HexReg.test(eTmp["liHoverBackground"])) { liHoverBackground = eTmp["liHoverBackground"]; };
            if (HexReg.test(eTmp["cursorColor"])) { cursorColor = eTmp["cursorColor"]; };
            if (HexReg.test(eTmp["lineForBorderTopColor"])) { lineForBorderTopColor = eTmp["lineForBorderTopColor"]; };
        };
    };

    // 文件对比相关颜色
    let d2h_ins_bg, d2h_ins_border;
    let d2h_del_bg, d2h_del_border;
    let d2h_code_side_line_del_bg, d2h_code_side_line_ins_bg;
    let d2h_emptyplaceholder_bg, d2h_emptyplaceholder_border;
    let d2h_linenum_color;
    let diff_scrollbar_color;
    if (colorScheme == 'Monokai' || colorScheme == 'Atom One Dark') {
        d2h_ins_bg = '#004D40';
        d2h_del_bg = '#400C12';
        d2h_code_side_line_del_bg = '#423133';
        d2h_code_side_line_ins_bg = '#00695C';
        d2h_emptyplaceholder_bg = '#303131';
        d2h_linenum_color = fontColor;
        diff_scrollbar_color = '#6F6F6F';
    } else {
        d2h_ins_bg = '#DDFFDD';
        d2h_ins_border = '#b4e2b4'
        d2h_del_bg = '#fee8e9';
        d2h_del_border = '#e9aeae';
        d2h_code_side_line_del_bg = '#ffb6ba';
        d2h_code_side_line_ins_bg = '#97f295';
        d2h_emptyplaceholder_bg = '#f1f1f1';
        d2h_emptyplaceholder_border = '#e1e1e1';
        d2h_linenum_color = fontColor;
        diff_scrollbar_color = '#CFB56A';
    };

    return {
        fontSize,
        fontFamily,
        explorerIconScheme,
        explorerIconTheme,
        lefeSideVeiwBackground,
        leftSideViewLiBackground,
        toolBarBgColor,
        background,
        menuBackground,
        menuCutLineColor,
        liHoverBackground,
        inputColor,
        inputLineColor,
        inputBgColor,
        inputPlaceholderColor,
        cursorColor,
        fontColor,
        remarkTextColor,
        lineColor,
        lineForBorderTopColor,
        scrollbarColor,
        d2h_ins_bg,
        d2h_ins_border,
        d2h_del_bg,
        d2h_del_border,
        d2h_code_side_line_del_bg,
        d2h_code_side_line_ins_bg,
        d2h_emptyplaceholder_bg,
        d2h_emptyplaceholder_border,
        d2h_linenum_color,
        diff_scrollbar_color
    };
};

module.exports = getThemeColor;
