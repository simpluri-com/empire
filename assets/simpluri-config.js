/**
 * Simpluri suite remote config (B + A).
 * B: canonical JSON at https://simpluri.com/assets/suite-config.json
 * A: bundled suite-config.json beside this script if fetch fails
 */
(function (global) {
    'use strict';

    var CANONICAL_URL = 'https://simpluri.com/assets/suite-config.json';
    var CACHE_KEY = 'simpluri.suiteConfig.v1';
    var CACHE_TTL_MS = 5 * 60 * 1000;

    var CODE_DEFAULTS = {
        version: 1,
        tripmap: {
            weather: {
                enabledOnProd: true,
                enabledOnLocalhost: false,
                allowLocalOverride: true
            }
        },
        tripify: {
            revision: {
                enabled: true,
                idleFocusMs: 600000,
                autoRefreshOnLoad: true
            }
        }
    };

    var merged = null;
    var initPromise = null;
    var loadMeta = { source: 'code', canonicalUrl: CANONICAL_URL };

    function isPlainObject(v) {
        return v !== null && typeof v === 'object' && !Array.isArray(v);
    }

    function deepMerge(base, patch) {
        if (!isPlainObject(patch)) return base;
        var out = Object.assign({}, base);
        Object.keys(patch).forEach(function (key) {
            var pv = patch[key];
            var bv = out[key];
            if (isPlainObject(pv) && isPlainObject(bv)) {
                out[key] = deepMerge(bv, pv);
            } else {
                out[key] = pv;
            }
        });
        return out;
    }

    function getAtPath(obj, path) {
        if (!path) return obj;
        var parts = String(path).split('.');
        var cur = obj;
        for (var i = 0; i < parts.length; i++) {
            if (cur == null || typeof cur !== 'object') return undefined;
            cur = cur[parts[i]];
        }
        return cur;
    }

    function isLocalDevHost() {
        if (location.protocol === 'file:') return true;
        var h = location.hostname;
        return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';
    }

    function resolveCanonicalUrl() {
        if (global.SIMPLURI_CONFIG_URL) return global.SIMPLURI_CONFIG_URL;
        if (isLocalDevHost()) {
            var host = (location.hostname || '').toLowerCase();
            if (host === 'simpluri.com' || host === 'www.simpluri.com') {
                return location.origin + '/assets/suite-config.json';
            }
        }
        if (location.hostname === 'simpluri.com' || location.hostname === 'www.simpluri.com') {
            return location.origin + '/assets/suite-config.json';
        }
        return CANONICAL_URL;
    }

    function resolveBundledUrl() {
        if (global.SIMPLURI_CONFIG_FALLBACK_URL) return global.SIMPLURI_CONFIG_FALLBACK_URL;
        var scripts = document.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; i--) {
            var src = scripts[i].src;
            if (src && /simpluri-config\.js(?:\?|$)/.test(src)) {
                return src.replace(/simpluri-config\.js(?:\?.*)?$/, 'suite-config.json');
            }
        }
        return '/assets/suite-config.json';
    }

    function readCache() {
        try {
            var raw = sessionStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!parsed || !parsed.fetchedAt || !parsed.data) return null;
            if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
            return parsed;
        } catch (e) {
            return null;
        }
    }

    function writeCache(data, source) {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                fetchedAt: Date.now(),
                source: source,
                data: data
            }));
        } catch (e) { /* */ }
    }

    async function fetchJson(url) {
        var res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
    }

    async function loadRemote() {
        var canonical = resolveCanonicalUrl();
        loadMeta.canonicalUrl = canonical;
        try {
            var data = await fetchJson(canonical);
            writeCache(data, 'canonical');
            return { data: data, source: 'canonical' };
        } catch (e) {
            var cached = readCache();
            if (cached && cached.data) {
                return { data: cached.data, source: 'cache-' + (cached.source || 'unknown') };
            }
            return null;
        }
    }

    async function loadBundled() {
        var url = resolveBundledUrl();
        try {
            var data = await fetchJson(url);
            return { data: data, source: 'bundled' };
        } catch (e) {
            return null;
        }
    }

    async function init(opts) {
        opts = opts || {};
        if (initPromise && !opts.force) return initPromise;

        initPromise = (async function () {
            var remote = await loadRemote();
            if (!remote) remote = await loadBundled();
            var patch = remote && remote.data ? remote.data : {};
            merged = deepMerge(CODE_DEFAULTS, patch);
            loadMeta.source = remote ? remote.source : 'code';
            loadMeta.version = merged.version;
            return merged;
        })();

        return initPromise;
    }

    function get(path, fallback) {
        if (!merged) merged = deepMerge(CODE_DEFAULTS, {});
        var v = getAtPath(merged, path);
        return v === undefined ? fallback : v;
    }

    function getMerged() {
        return merged || deepMerge(CODE_DEFAULTS, {});
    }

    function getLoadMeta() {
        return Object.assign({}, loadMeta);
    }

    global.SimpluriConfig = {
        CODE_DEFAULTS: CODE_DEFAULTS,
        CANONICAL_URL: CANONICAL_URL,
        init: init,
        get: get,
        getMerged: getMerged,
        getLoadMeta: getLoadMeta
    };
})(typeof window !== 'undefined' ? window : globalThis);
