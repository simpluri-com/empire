/**
 * Resolves cross-site links and suite dropdown (kebab) toggles. No fixed top bar.
 */
(function () {
    function isLocalhost() {
        if (location.protocol === 'file:') return false;
        var h = location.hostname;
        return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';
    }

    /** file:// suite root: Cursor/repos/ layout or legacy website-simpluri/ */
    function fileSuiteLayout() {
        if (location.protocol !== 'file:') return null;
        var p = decodeURIComponent(location.pathname.replace(/\\/g, '/'));
        var repoNeedles = ['/repos/simpluri/', '/repos/tripify/', '/repos/gif-off/', '/repos/empire/'];
        for (var r = 0; r < repoNeedles.length; r++) {
            var idx = p.indexOf(repoNeedles[r]);
            if (idx !== -1) {
                return {
                    base: 'file://' + p.slice(0, idx + '/repos'.length) + '/',
                    layout: 'repos'
                };
            }
        }
        var legacy = '/website-simpluri/';
        var i = p.indexOf(legacy);
        if (i !== -1) {
            return {
                base: 'file://' + p.slice(0, i + '/website-simpluri'.length) + '/',
                layout: 'legacy'
            };
        }
        return null;
    }

    function suiteUrls() {
        if (isLocalhost()) {
            var o = location.origin;
            return {
                portal: o + '/',
                myTrips: o + '/my-trips.html',
                tripmap: o + '/apps/tripmap/tripmap.html',
                gifoff: o + '/apps/gif-off/gif-off.html',
                empire: o + '/apps/empire/empire.html',
                tripifyApp: o + '/tripify/',
                tripmapApp: o + '/tripify/tripmap/',
                gifoffApp: o + '/gif-off/',
                empireApp: o + '/empire/'
            };
        }
        var layout = fileSuiteLayout();
        if (layout) {
            if (layout.layout === 'repos') {
                return {
                    portal: new URL('simpluri/index.html', layout.base).href,
                    myTrips: new URL('simpluri/my-trips.html', layout.base).href,
                    tripmap: new URL('simpluri/apps/tripmap/tripmap.html', layout.base).href,
                    gifoff: new URL('simpluri/apps/gif-off/gif-off.html', layout.base).href,
                    empire: new URL('simpluri/apps/empire/empire.html', layout.base).href,
                    tripifyApp: new URL('tripify/index.html', layout.base).href,
                    tripmapApp: new URL('tripify/tripmap/index.html', layout.base).href,
                    gifoffApp: new URL('gif-off/index.html', layout.base).href,
                    empireApp: new URL('empire/index.html', layout.base).href
                };
            }
            return {
                portal: new URL('index.html', layout.base).href,
                myTrips: new URL('my-trips.html', layout.base).href,
                tripmap: new URL('apps/tripmap/tripmap.html', layout.base).href,
                gifoff: new URL('apps/gif-off/gif-off.html', layout.base).href,
                empire: new URL('apps/empire/empire.html', layout.base).href,
                tripifyApp: new URL('tripify/index.html', layout.base).href,
                tripmapApp: new URL('tripify/tripmap/index.html', layout.base).href,
                gifoffApp: new URL('gif-off/index.html', layout.base).href,
                empireApp: new URL('empire/index.html', layout.base).href
            };
        }
        return {
            portal: 'https://simpluri.com/',
            myTrips: 'https://simpluri.com/my-trips.html',
            tripmap: 'https://simpluri.com/apps/tripmap/tripmap.html',
            gifoff: 'https://simpluri.com/apps/gif-off/gif-off.html',
            empire: 'https://simpluri.com/apps/empire/empire.html',
            tripifyApp: 'https://tripify.simpluri.com/',
            tripmapApp: 'https://tripify.simpluri.com/tripmap/',
            gifoffApp: 'https://gif-off.simpluri.com/',
            empireApp: 'https://empire.simpluri.com/'
        };
    }

    /** portal | tripify | tripmap | gifoff — hide matching [data-suite-nav] in menus */
    function detectCurrentSuiteApp() {
        var explicit = document.body && document.body.getAttribute('data-suite-current-app');
        if (explicit) return explicit;
        var p = decodeURIComponent(location.pathname).replace(/\\/g, '/');
        if (p.indexOf('/apps/tripmap/') !== -1) return 'tripmap';
        if (p.indexOf('/tripify/tripmap/') !== -1) return 'tripmap';
        if (location.hostname === 'tripify.simpluri.com' && (p.indexOf('/tripmap/') !== -1 || p === '/tripmap')) return 'tripmap';
        if (p.indexOf('/apps/gif-off/') !== -1) return 'gifoff';
        if (p.indexOf('/gif-off/') !== -1 || /\/gif-off(?:\/index\.html)?$/.test(p)) return 'gifoff';
        if (p.indexOf('/apps/empire/') !== -1) return 'empire';
        if (p.indexOf('/empire/') !== -1 || location.hostname === 'empire.simpluri.com') return 'empire';
        if (p.indexOf('/tripify/') !== -1) return 'tripify';
        if (location.hostname === 'tripify.simpluri.com') return 'tripify';
        return 'portal';
    }

    function applySuiteNavVisibility() {
        var current = detectCurrentSuiteApp();
        document.querySelectorAll('[data-suite-nav]').forEach(function (el) {
            var nav = el.getAttribute('data-suite-nav');
            var hide = nav === current;
            /* Menu links use Tailwind `flex`; plain `hidden` loses to `flex` in the cascade */
            el.classList.toggle('!hidden', hide);
            el.classList.toggle('flex', !hide);
            if (hide) el.setAttribute('aria-hidden', 'true');
            else el.removeAttribute('aria-hidden');
        });
    }

    function applyResolvedLinks() {
        var u = suiteUrls();
        document.querySelectorAll('[data-suite-href]').forEach(function (el) {
            var key = el.getAttribute('data-suite-href');
            if (key && u[key]) el.setAttribute('href', u[key]);
        });
        applySuiteNavVisibility();
    }

    function closeAllSuiteMenus() {
        document.querySelectorAll('[data-suite-menu-dropdown]').forEach(function (dd) {
            dd.classList.add('hidden');
        });
        document.querySelectorAll('[data-suite-menu-btn]').forEach(function (btn) {
            btn.setAttribute('aria-expanded', 'false');
        });
    }

    function bindSuiteMenus() {
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-suite-menu-btn]');
            if (btn) {
                e.stopPropagation();
                var id = btn.getAttribute('aria-controls');
                var dd = id ? document.getElementById(id) : btn.parentElement.querySelector('[data-suite-menu-dropdown]');
                if (!dd) return;
                var open = dd.classList.contains('hidden');
                closeAllSuiteMenus();
                if (open) {
                    applySuiteNavVisibility();
                    dd.classList.remove('hidden');
                    btn.setAttribute('aria-expanded', 'true');
                }
                return;
            }
            if (!e.target.closest('[data-suite-menu-dropdown]')) {
                closeAllSuiteMenus();
            }
        });
    }

    window.SimpluriMenu = {
        suiteUrls: suiteUrls,
        applyResolvedLinks: applyResolvedLinks,
        applySuiteNavVisibility: applySuiteNavVisibility,
        detectCurrentSuiteApp: detectCurrentSuiteApp,
        closeAllSuiteMenus: closeAllSuiteMenus
    };

    function init() {
        applyResolvedLinks();
        bindSuiteMenus();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
