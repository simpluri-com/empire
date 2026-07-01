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
                packinglist: o + '/apps/triplist/triplist.html',
                gifoff: o + '/apps/gif-off/gif-off.html',
                empire: o + '/apps/empire/empire.html',
                tripifyApp: o + '/tripify/',
                tripmapApp: o + '/tripify/tripmap/',
                packinglistApp: o + '/tripify/triplist/',
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
                    packinglist: new URL('simpluri/apps/triplist/triplist.html', layout.base).href,
                    gifoff: new URL('simpluri/apps/gif-off/gif-off.html', layout.base).href,
                    empire: new URL('simpluri/apps/empire/empire.html', layout.base).href,
                    tripifyApp: new URL('tripify/index.html', layout.base).href,
                    tripmapApp: new URL('tripify/tripmap/index.html', layout.base).href,
                    packinglistApp: new URL('tripify/triplist/index.html', layout.base).href,
                    gifoffApp: new URL('gif-off/index.html', layout.base).href,
                    empireApp: new URL('empire/index.html', layout.base).href
                };
            }
            return {
                portal: new URL('index.html', layout.base).href,
                myTrips: new URL('my-trips.html', layout.base).href,
                tripmap: new URL('apps/tripmap/tripmap.html', layout.base).href,
                packinglist: new URL('apps/triplist/triplist.html', layout.base).href,
                gifoff: new URL('apps/gif-off/gif-off.html', layout.base).href,
                empire: new URL('apps/empire/empire.html', layout.base).href,
                tripifyApp: new URL('tripify/index.html', layout.base).href,
                tripmapApp: new URL('tripify/tripmap/index.html', layout.base).href,
                packinglistApp: new URL('tripify/triplist/index.html', layout.base).href,
                gifoffApp: new URL('gif-off/index.html', layout.base).href,
                empireApp: new URL('empire/index.html', layout.base).href
            };
        }
        return {
            portal: 'https://simpluri.com/',
            myTrips: 'https://simpluri.com/my-trips.html',
            tripmap: 'https://simpluri.com/apps/tripmap/tripmap.html',
            packinglist: 'https://simpluri.com/apps/triplist/triplist.html',
            gifoff: 'https://simpluri.com/apps/gif-off/gif-off.html',
            empire: 'https://simpluri.com/apps/empire/empire.html',
            tripifyApp: 'https://tripify.simpluri.com/',
            tripmapApp: 'https://tripify.simpluri.com/tripmap/',
            packinglistApp: 'https://tripify.simpluri.com/triplist/',
            gifoffApp: 'https://gif-off.simpluri.com/',
            empireApp: 'https://empire.simpluri.com/'
        };
    }

    var TRIPIFY_SUITE_NAV = ['tripify', 'tripmap', 'packinglist'];
    var FUN_GAMES_NAV = ['gifoff', 'empire'];
    var TRIPIFY_SUITE_APPS = TRIPIFY_SUITE_NAV.slice();

    function createMenuGroupHeader(text) {
        var h = document.createElement('div');
        h.className = 'px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 bg-slate-50/30';
        h.setAttribute('data-suite-menu-group-label', '');
        h.textContent = text;
        return h;
    }

    function findShareTripButton(dd) {
        var marked = dd.querySelector('[data-suite-menu-share="trip"]');
        if (marked) return marked;
        var buttons = dd.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) {
            var oc = buttons[i].getAttribute('onclick') || '';
            if (oc.indexOf('copyShareLink') !== -1) {
                buttons[i].setAttribute('data-suite-menu-share', 'trip');
                return buttons[i];
            }
        }
        return null;
    }

    function organizeSuiteMenuDropdown(dd) {
        if (dd.getAttribute('data-suite-menu-organized') === '1') return;
        var portal = dd.querySelector('[data-suite-nav="portal"]');
        if (!portal) return;

        dd.querySelectorAll('[data-i18n="menu_cloud"]').forEach(function (el) {
            if (!el.querySelector('[data-suite-nav]')) el.remove();
        });
        Array.from(dd.querySelectorAll('div')).forEach(function (el) {
            if (el.getAttribute('data-suite-menu-group-label')) return;
            if (el.querySelector('[data-suite-nav]')) return;
            var t = el.textContent.trim();
            if (t === 'Cloud' || t === 'CLOUD') el.remove();
        });

        var shareTrip = findShareTripButton(dd);
        var tripifyLinks = [];
        var funLinks = [];
        var footer = [];

        Array.from(dd.children).forEach(function (child) {
            if (child.getAttribute && child.getAttribute('data-suite-menu-group')) return;
            if (child === portal) return;
            if (child === shareTrip) return;
            var nav = child.getAttribute && child.getAttribute('data-suite-nav');
            if (nav && TRIPIFY_SUITE_NAV.indexOf(nav) !== -1) tripifyLinks.push(child);
            else if (nav && FUN_GAMES_NAV.indexOf(nav) !== -1) funLinks.push(child);
            else footer.push(child);
        });

        if (!tripifyLinks.length && !funLinks.length) return;

        var fragment = document.createDocumentFragment();
        fragment.appendChild(portal);

        if (tripifyLinks.length || shareTrip) {
            var tripifyGroup = document.createElement('div');
            tripifyGroup.setAttribute('data-suite-menu-group', 'tripify-suite');
            tripifyGroup.appendChild(createMenuGroupHeader('✈️ Tripify Suite'));
            tripifyLinks.forEach(function (el) { tripifyGroup.appendChild(el); });
            if (shareTrip) tripifyGroup.appendChild(shareTrip);
            fragment.appendChild(tripifyGroup);
        }

        if (funLinks.length) {
            var funGroup = document.createElement('div');
            funGroup.setAttribute('data-suite-menu-group', 'fun-games');
            funGroup.appendChild(createMenuGroupHeader('🕹️ Fun & Games'));
            funLinks.forEach(function (el) { funGroup.appendChild(el); });
            fragment.appendChild(funGroup);
        }

        if (footer.length) {
            var actionsGroup = document.createElement('div');
            actionsGroup.setAttribute('data-suite-menu-group', 'actions');
            actionsGroup.className = 'border-t border-slate-100';
            footer.forEach(function (el) { actionsGroup.appendChild(el); });
            fragment.appendChild(actionsGroup);
        }

        dd.textContent = '';
        dd.appendChild(fragment);
        dd.setAttribute('data-suite-menu-organized', '1');
    }

    function organizeSuiteMenus() {
        document.querySelectorAll('[data-suite-menu-dropdown]').forEach(organizeSuiteMenuDropdown);
    }

    function applyShareTripVisibility() {
        var show = TRIPIFY_SUITE_APPS.indexOf(detectCurrentSuiteApp()) !== -1;
        document.querySelectorAll('[data-suite-menu-share="trip"]').forEach(function (btn) {
            btn.classList.toggle('!hidden', !show);
            btn.classList.toggle('flex', show);
            if (!show) btn.setAttribute('aria-hidden', 'true');
            else btn.removeAttribute('aria-hidden');
        });
    }

    /** portal | tripify | tripmap | gifoff — hide matching [data-suite-nav] in menus */
    function detectCurrentSuiteApp() {
        var explicit = document.body && document.body.getAttribute('data-suite-current-app');
        if (explicit) return explicit;
        var p = decodeURIComponent(location.pathname).replace(/\\/g, '/');
        if (p.indexOf('/apps/tripmap/') !== -1) return 'tripmap';
        if (p.indexOf('/tripify/tripmap/') !== -1) return 'tripmap';
        if (location.hostname === 'tripify.simpluri.com' && (p.indexOf('/tripmap/') !== -1 || p === '/tripmap')) return 'tripmap';
        if (p.indexOf('/apps/triplist/') !== -1) return 'packinglist';
        if (p.indexOf('/tripify/triplist/') !== -1) return 'packinglist';
        if (location.hostname === 'tripify.simpluri.com' && (p.indexOf('/triplist/') !== -1 || p === '/triplist')) return 'packinglist';
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
        applyShareTripVisibility();
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
        organizeSuiteMenus: organizeSuiteMenus,
        detectCurrentSuiteApp: detectCurrentSuiteApp,
        closeAllSuiteMenus: closeAllSuiteMenus
    };

    function init() {
        organizeSuiteMenus();
        applyResolvedLinks();
        bindSuiteMenus();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
