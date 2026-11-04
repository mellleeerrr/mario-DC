/* Simple resource loader with progress + error reporting. */
(function () {
    var resourceCache = {};
    var readyCallbacks = [];
    var progressCallbacks = [];
    var pending = 0;

    function _load(url) {
        if (resourceCache[url]) return resourceCache[url];

        var img = new Image();
        pending++;
        img.onload = function () {
            resourceCache[url] = img;
            pending--;
            notifyProgress();
            if (isReady()) {
                readyCallbacks.forEach(function (func) { func(); });
            }
        };
        img.onerror = function () {
            pending--;
            resourceCache[url] = null;
            notifyProgress();
            console.warn('Failed to load resource: ' + url);
        };
        resourceCache[url] = false;
        img.src = url;
        return img;
    }

    function notifyProgress() {
        var total = Object.keys(resourceCache).length;
        if (!total) return;
        var loaded = 0;
        for (var k in resourceCache) {
            if (resourceCache.hasOwnProperty(k) && resourceCache[k]) loaded++;
        }
        progressCallbacks.forEach(function (func) { func(loaded / total); });
    }

    function load(urlOrArr) {
        if (urlOrArr instanceof Array) {
            urlOrArr.forEach(function (url) { _load(url); });
        } else {
            _load(urlOrArr);
        }
    }

    function get(url) {
        return resourceCache[url];
    }

    function isReady() {
        for (var k in resourceCache) {
            if (resourceCache.hasOwnProperty(k) && !resourceCache[k]) return false;
        }
        return true;
    }

    function onReady(func) {
        if (isReady() && Object.keys(resourceCache).length) {
            func();
        } else {
            readyCallbacks.push(func);
        }
    }

    function onProgress(func) {
        progressCallbacks.push(func);
    }

    window.resources = {
        load: load,
        get: get,
        onReady: onReady,
        onProgress: onProgress,
        isReady: isReady
    };
})();
