/**
 * @节流防抖
 * @param {Object} fn
 * @param {Object} wait
 */
function debounce(func, wait){
    var timer;
    return function(...args){
        if(timer){
            clearTimeout(timer);
        };
        timer = setTimeout(function(){
            clearTimeout(timer);
            timer = null;
            func.apply(null, args);
        }, wait);
    };
};

module.exports = debounce;