/**
 * @description 刷新ICON
 * @param {String} color
 */
function getRefreshIcon(color) {
    return `<svg t="1595498001511" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2883" width="20" height="20"><path d="M497.066667 832c-76.8 0-153.6-27.733333-213.333334-81.066667-64-57.6-100.266667-136.533333-104.533333-221.866666S204.8 362.666667 260.266667 298.666667c57.6-64 136.533333-100.266667 221.866666-104.533334 85.333333-4.266667 166.4 25.6 230.4 81.066667 29.866667 25.6 53.333333 57.6 70.4 91.733333 6.4 10.666667 2.133333 23.466667-8.533333 27.733334-10.666667 4.266667-23.466667 2.133333-27.733333-8.533334-14.933333-29.866667-36.266667-57.6-61.866667-78.933333-57.6-51.2-128-76.8-202.666667-72.533333-74.666667 4.266667-142.933333 36.266667-192 91.733333s-74.666667 125.866667-70.4 200.533333c4.266667 74.666667 36.266667 142.933333 91.733334 192 113.066667 102.4 290.133333 93.866667 392.533333-21.333333 17.066667-19.2 29.866667-38.4 42.666667-61.866667 4.266667-10.666667 17.066667-14.933333 27.733333-8.533333 10.666667 4.266667 14.933333 17.066667 8.533333 27.733333-12.8 25.6-29.866667 49.066667-49.066666 70.4-61.866667 70.4-149.333333 106.666667-236.8 106.666667z" fill="${color}" p-id="2884"></path><path d="M825.6 339.2l-8.533333 115.2c-2.133333 14.933333-17.066667 23.466667-32 17.066667L682.666667 416c-14.933333-8.533333-14.933333-29.866667 0-36.266667l110.933333-59.733333c14.933333-8.533333 34.133333 2.133333 32 19.2z" fill="${color}" p-id="2885"></path></svg>`
};

/**
 * @description 删除横线
 * @param {String} color
 */
function getDelIcon(color) {
    return `<svg t="1595603457366" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8849" width="14" height="17"><path d="M960 487v50H64v-50h896z" fill="${color}" p-id="8850"></path></svg>`
};

/**
 * @description 删除X
 */
function getXIcon(color) {
    return `<svg t="1595768521753" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5028" width="19" height="19"><path d="M512 557.223994l249.203712 249.203712c12.491499 12.491499 32.730449 12.489452 45.221948-0.002047s12.493545-32.730449 0.002047-45.221948L557.223994 512l249.203712-249.203712c12.491499-12.491499 12.489452-32.730449-0.002047-45.221948s-32.730449-12.493545-45.221948-0.002047L512 466.776006 262.796288 217.572294c-12.491499-12.491499-32.729425-12.490475-45.220924 0.001023-6.246261 6.246261-9.370415 14.429641-9.370415 22.610974s3.121084 16.365736 9.367345 22.610974L466.774983 512 217.572294 761.203712c-6.246261 6.246261-9.367345 14.428617-9.367345 22.610974s3.125177 16.365736 9.370415 22.610974c12.491499 12.491499 32.729425 12.493545 45.220924 0.002047L512 557.223994z" p-id="5029" fill="${color}"></path></svg>`
};

/**
 * @description 撤销
 * @param {String} color
 */
function getCheckoutIcon(color) {
    return `<svg t="1595489399588" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1142" width="16" height="16"><path d="M135.168 276.48h462.848c176.128 0 317.44 141.312 317.44 317.44s-141.312 317.44-317.44 317.44H389.12c-12.288 0-20.48 8.192-20.48 20.48s8.192 20.48 20.48 20.48h208.896c198.656 0 358.4-159.744 358.4-358.4s-159.744-358.4-358.4-358.4h-462.848l139.264-139.264c8.192-8.192 8.192-20.48 0-28.672-8.192-8.192-20.48-8.192-28.672 0l-174.08 174.08c-8.192 8.192-8.192 20.48 0 28.672l174.08 174.08c8.192 8.192 20.48 8.192 28.672 0 8.192-8.192 8.192-20.48 0-28.672l-139.264-139.264z" p-id="1143" fill="${color}"></path></svg>`
};

/**
 * @description 文件图标
 * @param {String} color
 */
function getOpenFileIcon(color) {
    return `<svg t="1595489944394" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10525" width="20" height="20"><path d="M741.3 161.6h-42.4c-10.5 0-19.1 8.6-19.1 19.1s8.6 19.1 19.1 19.1h42.4c42 0 76.2 34.2 76.2 76.3v477.4c0 42.1-34.3 76.3-76.4 76.3H282.9c-42.1 0-76.3-34.2-76.3-76.3V276.1c0-42.1 34.2-76.3 76.3-76.3h44.9c10.5 0 19.1-8.6 19.1-19.1s-8.6-19.1-19.1-19.1h-44.9c-63.1 0-114.5 51.4-114.5 114.5v477.4c0 63.1 51.4 114.5 114.5 114.5h458.3c63.1 0 114.5-51.4 114.5-114.5V276.1c-0.1-63.1-51.4-114.5-114.4-114.5z" p-id="10526" fill="#8a8a8a"></path><path d="M680.6 505.3H343.4c-12.3 0-22.3 8.6-22.3 19.1s10 19.1 22.3 19.1h337.2c12.3 0 22.3-8.6 22.3-19.1 0-10.6-10-19.1-22.3-19.1zM439.3 213.3h144.6c19 0 34.4-12.8 34.4-28.6s-15.4-28.6-34.4-28.6H439.3c-19 0-34.4 12.8-34.4 28.6-0.1 15.7 15.3 28.6 34.4 28.6zM680.6 658H343.4c-12.3 0-22.3 8.5-22.3 19.1 0 10.5 10 19.1 22.3 19.1h337.2c12.3 0 22.3-8.6 22.3-19.1 0-10.6-10-19.1-22.3-19.1zM680.6 352.5H343.4c-12.3 0-22.3 8.6-22.3 19.1s10 19.1 22.3 19.1h337.2c12.3 0 22.3-8.6 22.3-19.1 0-10.5-10-19.1-22.3-19.1z" p-id="10527" fill="${color}"></path></svg>`
};

/**
 * @description 加号
 * @param {String} color
 */
function getAddIcon(color) {
    return `<svg t="1595603418843" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8575" width="17" height="17"><path d="M960 487v50H537v423h-50V537H64v-50h423V64h50v423h423z" fill="${color}" p-id="8576"></path></svg>`
};

/**
 * @description add all
 */
function getAddAllIcon(color) {
    return `<svg t="1595603418843" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8575" width="17" height="17"><path d="M960 487v50H537v423h-50V537H64v-50h423V64h50v423h423z" fill="${color}" p-id="8576"></path></svg>`
};

/**
 * @description 下箭头
 * @param {String} color
 */
function getDownArrowIcon(color) {
    return `<svg t="1595603113931" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3956" width="18" height="18"><path d="M193.8 548.1L487 841.3V87h50v754.3l293.2-293.2 35.4 35.4L512 937 158.4 583.4l35.4-35.3z" fill="${color}" p-id="3957"></path></svg>`
};


/**
 * @description back
 */
function getBackIcon(color) {
    return `<svg t="1596261404953" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8464" width="20" height="20"><path d="M938.666667 490.666667H179.626667l261.973333-262.4-29.866667-29.866667L97.706667 512l314.026666 313.6 29.866667-29.866667-261.973333-262.4H938.666667z" p-id="8465" fill="${color}"></path></svg>`
};


/**
 * @description 上箭头
 * @param {String} color
 */
function getUpArrowIcon(color) {
    return `<svg t="1595603491100" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9123" width="17" height="17"><path d="M830.2 475.9L537 182.7V937h-50V182.7L193.8 475.9l-35.4-35.4L512 87l353.6 353.6-35.4 35.3z" fill="${color}" p-id="9124"></path></svg>`
};

/**
 * @description push 图标
 * @param {String} color
 */
function getUpArrowIcon2(color) {
    return `<svg t="1595830909155" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="20254" width="18" height="18"><path d="M512.853333 955.733333H512c-121.890133 0-227.584-43.8784-314.146133-130.440533C111.872 739.2768 68.266667 633.890133 68.266667 512c0-121.856 43.588267-227.549867 129.536-314.112C284.450133 111.854933 390.144 68.266667 512 68.266667c121.890133 0 227.2768 43.605333 313.2928 129.5872C911.854933 284.416 955.733333 390.109867 955.733333 512c0 121.924267-43.895467 227.328-130.474666 313.326933C739.328 911.837867 634.197333 955.733333 512.853333 955.733333zM512 102.4c-112.520533 0-210.1248 40.2432-290.065067 119.620267C142.6432 301.8752 102.4 399.479467 102.4 512c0 112.503467 40.226133 209.783467 119.586133 289.160533C301.909333 881.083733 399.496533 921.6 512 921.6h0.853333c111.9232 0 208.913067-40.4992 288.290134-120.405333C881.1008 721.7664 921.6 624.4864 921.6 512c0-112.503467-40.516267-210.090667-120.439467-290.013867C721.783467 142.626133 624.503467 102.4 512 102.4z" p-id="20255" fill="${color}"></path><path d="M512.853333 715.946667a34.133333 34.133333 0 0 1-34.133333-34.133334V423.748267l-112.401067 112.384a34.133333 34.133333 0 1 1-48.264533-48.264534l170.666667-170.666666 0.034133-0.034134a34.013867 34.013867 0 0 1 28.535467-9.6768 33.962667 33.962667 0 0 1 19.8656 9.898667l170.478933 170.478933a34.133333 34.133333 0 1 1-48.264533 48.264534l-112.401067-112.384V681.813333c0.017067 18.858667-15.274667 34.133333-34.116267 34.133334z" p-id="20256" fill="${color}"></path></svg>`
};

/**
 * @param {String} color
 */
function getSyncIcon(color) {
    return `<svg t="1595603390653" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8301" width="18" height="18"><path d="M132.6 511.7L65 366.7l45.3-21.1 30.3 64.9C185.1 247.1 334.5 127 512 127c195.7 0 357.3 146 381.8 335h-50.5c-4.1-27.6-11.7-54.5-22.6-80.4-16.9-39.9-41-75.7-71.8-106.5-30.8-30.8-66.6-54.9-106.5-71.8C601.1 185.9 557.2 177 512 177s-89.1 8.9-130.4 26.3c-39.9 16.9-75.7 41-106.5 71.8-30.8 30.8-54.9 66.6-71.8 106.5-6.8 16.2-12.4 32.7-16.5 49.6l69.7-32.5 21.1 45.3-145 67.7z m758.8 0.6l-145 67.6 21.1 45.3 69.7-32.5c-4.2 16.9-9.7 33.5-16.5 49.6-16.9 39.9-41 75.7-71.8 106.5-30.8 30.8-66.6 54.9-106.5 71.8C601.1 838.1 557.2 847 512 847s-89.1-8.9-130.4-26.3c-39.9-16.9-75.7-41-106.5-71.8-30.8-30.8-54.9-66.6-71.8-106.5-10.9-25.9-18.5-52.8-22.6-80.4h-50.5C154.7 751 316.3 897 512 897c177.5 0 326.9-120.1 371.4-283.4l30.3 64.9 45.3-21.1-67.6-145.1z" fill="${color}" p-id="8302"></path></svg>`
};

/**
 * @description 对号
 * @param {String} color
 */
function getCheckMarkIcon(color) {
    return `<svg t="1595647372430" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9305" width="20" height="20"><path d="M890.3 218.6L374.1 734.7 133.7 494.3l-35.4 35.4 275.8 275.7 551.6-551.5z" fill="${color}" p-id="9306"></path></svg>`
};

/**
 * @description 分支信息
 * @param {String} color
 */
function getBranchIcon(color) {
    return `<svg t="1595670578576" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10284" width="20" height="20"><path d="M704 192c-77.2 0-140 62.8-140 140 0 66.8 47.4 123.8 111.8 137-2.4 38.2-20.6 58.6-54 84.4-40.8 31.4-93.4 40-130.6 46.8-81.4 14.8-125.8 54-145 80V341.6c30-5.6 57.4-21 78-43.8 23.2-25.8 36-59 36-93.8 0-77.2-62.8-140-140-140s-140 62.8-140 140c0 34 12.4 66.6 34.6 92.2 19.8 22.6 46.2 38.2 75.4 44.6v342.6c-29 6.4-55.6 22-75.4 44.6C192.4 753.4 180 786 180 820c0 77.2 62.8 140 140 140s140-62.8 140-140c0-46.8-23.2-89.8-61.4-115.8 17.2-19.4 49-39.2 102.2-48.8 43.2-7.8 105.2-19.2 154.8-57.6 47.2-36.4 73.4-73 76-128.6 64.6-13 112.2-70.2 112.2-137.2 0.2-77.2-62.6-140-139.8-140z m-468 12c0-46.4 37.6-84 84-84s84 37.6 84 84-37.6 84-84 84-84-37.6-84-84z m168 616c0 46.4-37.6 84-84 84s-84-37.6-84-84 37.6-84 84-84 84 37.6 84 84z m300-404c-46.4 0-84-37.6-84-84s37.6-84 84-84 84 37.6 84 84-37.6 84-84 84z" p-id="10285" fill="${color}"></path></svg>`
};


/**
 * @description HOME
 * @param {String} color
 */
function getHomeIcon(color) {
    return `<svg t="1595834158042" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2790" width="20" height="20"><path d="M981.138286 571.928381 511.902476 109.958095 42.666667 571.928381 0 529.92 511.902476 25.965714 1023.804952 529.92 981.138286 571.928381ZM166.692571 548.376381C179.858286 548.376381 190.512762 559.006476 190.512762 572.123429L190.512762 799.061333C190.512762 870.473143 251.14819 952.124952 325.948952 952.124952L698.051048 952.124952C772.85181 952.124952 833.487238 870.473143 833.487238 799.061333L833.487238 572.123429C833.487238 559.006476 844.141714 548.376381 857.307429 548.376381 870.448762 548.376381 881.127619 559.006476 881.127619 572.123429L881.127619 833.365333C881.127619 925.184 806.473143 999.619048 714.410667 999.619048L309.589333 999.619048C217.526857 999.619048 142.872381 925.184 142.872381 833.365333L142.872381 572.123429C142.872381 559.006476 153.551238 548.376381 166.692571 548.376381Z" p-id="2791" fill="${color}"></path></svg>`
};

/**
 * @description 合并
 * @param {String} color
 */
function getMergeIcon(color) {
    return `<svg t="1595946195099" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4721" width="17" height="17"><path d="M754.96 300.848l-56.576 56.56L804.976 464H535.568c-23.952-48-78.816-142.112-98.88-177.92C395.792 213.056 336.432 176 260.288 176H48v80h212.272c46.944 0 79.824 21.36 106.624 69.216 20.256 36.144 75.92 136.528 99.36 178.848a82249.408 82249.408 0 0 1-99.36 178.784C340.096 730.688 307.216 752 260.272 752H48v80h212.272c76.144 0 135.504-37.024 176.432-110.08C456.752 686.096 511.616 592 535.568 544h270.384l-107.568 107.568 56.576 56.56L958.608 504.48 754.96 300.848z" fill="${color}" p-id="4722"></path></svg>`
};

/**
 * @description tag
 */
function getTagIcon(color) {
    return `<svg mt="1" classes="flex-shrink-0" color="${color}" height="16"  width="16"  class="icon" viewBox="0 0 16 16" version="1.1" aria-hidden="true"><path fill-rule="evenodd" d="M2.5 7.775V2.75a.25.25 0 01.25-.25h5.025a.25.25 0 01.177.073l6.25 6.25a.25.25 0 010 .354l-5.025 5.025a.25.25 0 01-.354 0l-6.25-6.25a.25.25 0 01-.073-.177zm-1.5 0V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 010 2.474l-5.026 5.026a1.75 1.75 0 01-2.474 0l-6.25-6.25A1.75 1.75 0 011 7.775zM6 5a1 1 0 100 2 1 1 0 000-2z" fill="${color}"></path></svg>`
};

/**
 * @description menu
 */
function getMenuIcon(color) {
    return `<svg t="1596172744424" class="icon" height="20"  width="28" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="20880"><path d="M533.333333 469.333333c35.413333 0 64 28.586667 64 64s-28.586667 64-64 64-64-28.586667-64-64 28.586667-64 64-64z m-213.333333 0c35.2 0 64 28.586667 64 64S355.413333 597.333333 320 597.333333 256 568.746667 256 533.333333 284.586667 469.333333 320 469.333333z m426.666667 0c35.413333 0 64 28.586667 64 64s-28.586667 64-64 64-64-28.586667-64-64 28.586667-64 64-64z" fill="${color}" p-id="20881"></path></svg>`
};

/**
 * @description edit
 */
function getEditIcon(color) {
    return `<svg t="1596177747613" class="icon" height="20"  width="20"  viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7151"><path d="M888.64 960H135.36C96 960 64 928 64 888.704V135.296C64 96 96 64 135.36 64h377.472c13.952 0 24.576 10.688 24.576 24.576a24.192 24.192 0 0 1-24.576 24.64H135.36a23.168 23.168 0 0 0-22.144 22.08v753.408c0 11.456 10.688 22.08 22.144 22.08h753.28c11.52 0 22.144-10.624 22.144-22.08V510.72c0-13.952 10.624-24.576 24.576-24.576s24.64 10.624 24.64 24.576v377.92C960 928 928 960 888.64 960z" p-id="7152"></path><path d="M535.232 512a22.336 22.336 0 0 1-16.256-6.976 22.464 22.464 0 0 1 0-32.576l401.472-401.472a22.464 22.464 0 0 1 32.576 0 22.464 22.464 0 0 1 0 32.576L551.552 504.96A22.336 22.336 0 0 1 535.232 512z" fill="${color}" p-id="7153"></path></svg>`
};

/**
 * @description git history log
 */
function getHistoryIcon(color) {
    return `<svg t="1596764598389" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6850" width="17" height="17"><path d="M532.48 256v256c0 7.168-3.072 13.312-8.192 16.384l-131.072 92.16c-4.096 3.072-8.192 4.096-12.288 4.096-6.144 0-12.288-3.072-16.384-8.192-6.144-9.216-4.096-22.528 5.12-28.672L491.52 501.76V256c0-11.264 9.216-20.48 20.48-20.48s20.48 9.216 20.48 20.48z m269.312-102.4H952.32c11.264 0 20.48-9.216 20.48-20.48s-9.216-20.48-20.48-20.48H747.52c-11.264 0-20.48 9.216-20.48 20.48v204.8c0 11.264 9.216 20.48 20.48 20.48s20.48-9.216 20.48-20.48V179.2C871.424 258.048 931.84 380.928 931.84 512c0 231.424-188.416 419.84-419.84 419.84S92.16 743.424 92.16 512 280.576 92.16 512 92.16c11.264 0 20.48-9.216 20.48-20.48s-9.216-20.48-20.48-20.48C258.048 51.2 51.2 258.048 51.2 512s206.848 460.8 460.8 460.8 460.8-206.848 460.8-460.8c0-139.264-63.488-271.36-171.008-358.4z" p-id="6851" fill="${color}"></path></svg>`
};


/**
 * @description help
 */
function getHelpIcon(color) {
    return `<svg t="1596858906759" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6053" width="19" height="19"><path d="M512 85.504c-235.552 0-426.496 190.944-426.496 426.496s190.944 426.496 426.496 426.496 426.496-190.944 426.496-426.496c0-235.552-190.944-426.496-426.496-426.496zM512 904.384c-216.352 0-392.384-176-392.384-392.384s176-392.384 392.384-392.384 392.384 176 392.384 392.384c0 216.352-176 392.384-392.384 392.384z" p-id="6054" fill="${color}"></path><path d="M510.56 288.416c-86.592 0-134.944 53.504-135.552 138.304l37.632 0c-1.184-61.504 31.04-106.624 96.16-106.624 46.56 0 85.376 32.832 85.376 80.608 0 31.04-16.736 56.128-38.816 77.024-45.376 42.112-58.08 61.92-60.384 119.616l38.112 0c2.24-52.32 1.088-51.264 46.752-96.928 30.464-28.672 51.936-57.344 51.936-101.536 0-69.248-54.944-110.464-121.184-110.464z" p-id="6055" fill="${color}"></path><path d="M512 665.568c-18.816 0-34.112 15.264-34.112 34.112 0 18.848 15.296 34.112 34.112 34.112s34.112-15.264 34.112-34.112c0-18.816-15.264-34.112-34.112-34.112z" p-id="6056" fill="${color}"></path></svg>`
};


/**
 * @description search
 */
function getSearchIcon(color) {
    return `<svg t="1596935230119" class="icon" viewBox="0 0 1029 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2295" width="15" height="15"><path d="M439.778338 844.735516C197.319899 844.735516 0 656.443325 0 424.302267S197.319899 3.869018 439.778338 3.869018s439.778338 188.292191 439.778337 420.433249c0 119.939547-54.166247 234.720403-147.02267 314.680101-10.31738 9.027708-27.083123 7.738035-36.110831-2.579345-9.027708-10.31738-7.738035-27.083123 2.579345-36.110832 82.539043-69.642317 128.967254-170.236776 128.967254-274.700251 0-203.768262-174.105793-368.846348-388.191435-368.846348S51.586902 220.534005 51.586902 424.302267s174.105793 368.846348 388.191436 368.846348c29.662469 0 59.324937-2.579345 87.697733-9.027708 14.186398-2.579345 27.083123 5.15869 30.952141 19.345088 2.579345 14.186398-5.15869 27.083123-19.345089 30.952141-33.531486 6.448363-67.062972 10.31738-99.304785 10.31738z" fill="${color}" p-id="2296"></path><path d="M1004.654912 1022.710327c-6.448363 0-12.896725-2.579345-18.055416-7.738035L696.423174 737.692695c-10.31738-10.31738-10.31738-25.793451-1.289673-36.110831s25.793451-10.31738 36.110831-1.289673l290.176323 277.279597c10.31738 10.31738 10.31738 25.793451 1.289672 36.110832-3.869018 6.448363-10.31738 9.027708-18.055415 9.027707z" fill="${color}" p-id="2297"></path></svg>`
};

/**
 * @description 没有结果
 */
function getNoIcon(color) {
    return `<svg t="1597797700520" class="icon" viewBox="0 0 1575 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="26729" width="128" height="128"><path d="M1260.307692 834.166154h-134.695384l9.452307-15.753846c6.301538-11.027692 9.452308-23.630769 9.452308-37.021539V168.566154c0-19.692308-7.876923-37.809231-21.267692-51.987692-13.390769-13.390769-32.295385-21.267692-51.987693-21.267693H567.138462c-19.692308 0-37.809231 7.876923-51.987693 21.267693-14.178462 14.178462-21.267692 32.295385-21.267692 51.987692v32.295384h-73.255385c-19.692308 0-37.809231 7.876923-51.987692 21.267693C354.461538 236.307692 346.584615 254.424615 346.584615 274.116923v612.036923c0 12.603077 3.150769 25.206154 9.452308 37.021539l9.452308 15.753846H252.061538c-5.513846 0-10.24 4.726154-10.24 10.24 0 2.363077 0.787692 5.513846 3.15077 7.089231 1.575385 1.575385 4.726154 3.150769 7.08923 3.150769h533.267693l54.350769 54.350769c5.513846 5.513846 14.178462 9.452308 22.055385 9.452308 7.876923 0 16.541538-3.150769 22.055384-9.452308 10.24-10.24 11.815385-25.993846 4.726154-38.596923l-9.452308-16.541539H1008.246154c5.513846 0 10.24-4.726154 10.24-10.24 0-5.513846-4.726154-10.24-10.24-10.24h-29.932308l9.452308-15.753846c6.301538-11.027692 9.452308-23.630769 9.452308-37.021538v-32.295385H1260.307692c5.513846 0 10.24-4.726154 10.24-10.24 0-4.726154-4.726154-8.664615-10.24-8.664615z m-283.56923 51.987692c0 29.144615-23.630769 52.775385-52.775385 52.775385h-70.892308l-73.255384-74.043077c-7.876923-7.876923-19.692308-11.027692-29.932308-7.876923l-6.301539 1.575384-30.72-30.72 5.513847-7.08923c42.535385-57.501538 33.870769-138.633846-19.692308-185.895385s-135.483077-44.110769-185.895385 7.089231c-50.412308 50.412308-52.775385 132.332308-6.301538 186.683077 46.473846 53.563077 127.606154 63.015385 184.32 20.48l7.089231-5.513846 30.72 30.72-1.575385 6.301538c-3.150769 11.027692 0 22.843077 7.876923 30.72l29.144615 29.144615H419.84c-29.144615 0-52.775385-23.630769-52.775385-52.775384v-614.4c0-28.356923 22.843077-51.987692 51.2-51.987693h507.273847c28.356923 0 51.2 23.630769 51.2 51.987693v612.824615z m-285.932308-65.378461c-22.843077 22.843077-51.987692 33.870769-81.92 33.870769-29.932308 0-59.076923-11.027692-81.92-33.870769a115.003077 115.003077 0 0 1-33.870769-81.92c0-30.72 11.815385-60.652308 33.870769-81.92 22.055385-22.055385 51.2-33.870769 81.92-33.87077 30.72 0 59.864615 11.815385 81.92 33.87077 22.055385 22.055385 33.870769 51.2 33.870769 81.92 0 30.72-11.815385 59.864615-33.870769 81.92z m433.230769-40.172308c0 29.144615-23.630769 52.775385-52.775385 52.775385h-74.043076v-559.261539c0-19.692308-7.876923-37.809231-21.267693-51.987692-13.390769-13.390769-32.295385-21.267692-51.987692-21.267693h-409.6v-31.507692c0-29.144615 23.630769-52.775385 52.775385-52.775384h504.123076c29.144615 0 52.775385 23.630769 52.775385 52.775384v611.249231zM167.778462 939.716923h-126.03077c-5.513846 0-10.24 4.726154-10.24 10.24 0 3.150769 0.787692 5.513846 3.15077 7.089231 1.575385 1.575385 4.726154 3.150769 7.08923 3.150769h126.03077c5.513846 0 10.24-4.726154 10.24-10.24 0-5.513846-3.938462-10.24-10.24-10.24z" fill="#99A9BF" p-id="26730"></path><path d="M482.855385 326.892308h230.793846c5.513846 0 10.24-4.726154 10.24-10.24 0-5.513846-4.726154-10.24-10.24-10.24H482.855385c-5.513846 0-10.24 4.726154-10.24 10.24 0 2.363077 0.787692 5.513846 3.150769 7.08923 1.575385 2.363077 4.726154 3.150769 7.089231 3.15077zM819.2 411.963077H482.855385c-5.513846 0-10.24 4.726154-10.24 10.24 0 3.150769 0.787692 5.513846 3.150769 7.089231 1.575385 1.575385 4.726154 3.150769 7.089231 3.150769H819.2c5.513846 0 10.24-4.726154 10.24-10.24 0-5.513846-4.726154-10.24-10.24-10.24zM630.153846 517.513846H482.855385c-5.513846 0-10.24 4.726154-10.24 10.24 0 3.150769 0.787692 5.513846 3.150769 7.089231 1.575385 1.575385 4.726154 3.150769 7.089231 3.150769H630.153846c5.513846 0 10.24-4.726154 10.24-10.24s-4.726154-10.24-10.24-10.24zM157.538462 707.347692h21.267692c5.513846 0 10.24 4.726154 10.24 10.24 0 5.513846-4.726154 10.24-10.24 10.24H157.538462v21.267693c0 5.513846-4.726154 10.24-10.24 10.24-3.150769 0-5.513846-0.787692-7.089231-3.15077-2.363077-1.575385-3.150769-4.726154-3.150769-7.08923v-21.267693h-21.267693c-5.513846 0-10.24-4.726154-10.24-10.24 0-5.513846 4.726154-10.24 10.24-10.24h21.267693v-21.267692c0-5.513846 4.726154-10.24 10.24-10.24 5.513846 0 10.24 4.726154 10.24 10.24v21.267692zM1543.876923 622.276923v-21.267692c0-3.150769-0.787692-5.513846-3.150769-7.089231-2.363077-1.575385-4.726154-3.150769-7.089231-3.150769-5.513846 0-10.24 4.726154-10.24 10.24V622.276923h-21.267692c-3.150769 0-5.513846 0.787692-7.089231 3.150769-1.575385 2.363077-3.150769 4.726154-3.150769 7.089231 0 5.513846 4.726154 10.24 10.24 10.24h21.267692v21.267692c0 5.513846 4.726154 10.24 10.24 10.24 5.513846 0 10.24-4.726154 10.24-10.24v-21.267692h21.267692c5.513846 0 10.24-4.726154 10.24-10.24 0-5.513846-4.726154-10.24-10.24-10.24H1543.876923zM267.815385 47.261538h31.507692c8.664615 0 15.753846 7.089231 15.753846 15.753847s-7.089231 15.753846-15.753846 15.753846h-31.507692v31.507692c0 8.664615-7.089231 15.753846-15.753847 15.753846-3.938462 0-7.876923-1.575385-11.027692-4.726154-3.150769-2.363077-4.726154-6.301538-4.726154-11.027692v-31.507692h-31.507692c-3.938462 0-7.876923-1.575385-11.027692-4.726154-3.150769-2.363077-4.726154-6.301538-4.726154-11.027692 0-8.664615 7.089231-15.753846 15.753846-15.753847h31.507692V15.753846c0-8.664615 7.089231-15.753846 15.753846-15.753846s15.753846 7.089231 15.753847 15.753846v31.507692z" fill="#99A9BF" p-id="26731"></path></svg>`
};

/**
 * @description upload
 */
function getUploadIcon(color) {
    return `<svg t="1598278287586" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1860" width="24" height="24"><path d="M525.333 516.672a21.312 21.312 0 0 0-26.666 0L392 602.005a21.333 21.333 0 0 0 26.667 33.323l72-57.6v296.939a21.333 21.333 0 0 0 42.666 0V577.728l72 57.6A21.333 21.333 0 1 0 632 602.005z" fill="${color}" p-id="1861"></path><path d="M810.667 384c-1.131 0-2.219 0-3.328 0.043a298.475 298.475 0 0 0-565.398-84.907A213.333 213.333 0 0 0 256 725.333h21.333a21.333 21.333 0 0 0 0-42.666H256a170.667 170.667 0 0 1 0-341.334 21.333 21.333 0 0 0 19.69-13.12 255.808 255.808 0 0 1 491.393 80.832 21.376 21.376 0 0 0 24.576 19.627 123.904 123.904 0 0 1 19.008-2.005 128 128 0 0 1 0 256h-64a21.333 21.333 0 0 0 0 42.666h64a170.667 170.667 0 0 0 0-341.333z" fill="${color}" p-id="1862"></path></svg>`
}

module.exports = {
    getRefreshIcon,
    getMenuIcon,
    getEditIcon,
    getCheckoutIcon,
    getOpenFileIcon,
    getAddIcon,
    getAddAllIcon,
    getDelIcon,
    getXIcon,
    getCheckMarkIcon,
    getDownArrowIcon,
    getUpArrowIcon,
    getBackIcon,
    getUpArrowIcon2,
    getBranchIcon,
    getSyncIcon,
    getMergeIcon,
    getTagIcon,
    getHistoryIcon,
    getHelpIcon,
    getSearchIcon,
    getNoIcon,
    getUploadIcon
}