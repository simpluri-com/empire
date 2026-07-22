/**
 * Resolves cross-site links and suite dropdown (kebab) toggles. No fixed top bar.
 */
(function (global) {
    function isLocalhost() {
        if (location.protocol === 'file:') return false;
        var h = location.hostname;
        return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';
    }

    /** file:// suite root: Cursor/repos/ layout or legacy website-simpluri/ */
    function fileSuiteLayout() {
        if (location.protocol !== 'file:') return null;
        var p = decodeURIComponent(location.pathname.replace(/\\/g, '/'));
        var repoNeedles = ['/repos/simpluri/', '/repos/tripify/', '/repos/gif-off/', '/repos/empire/', '/repos/formulator/'];
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
                tripnotes: o + '/apps/tripnotes/tripnotes.html',
                gifoff: o + '/apps/gif-off/gif-off.html',
                empire: o + '/apps/empire/empire.html',
                formulator: o + '/apps/formulator/formulator.html',
                tripifyApp: o + '/tripify/',
                tripmapApp: o + '/tripify/tripmap/',
                packinglistApp: o + '/tripify/triplist/',
                tripnotesApp: o + '/tripify/tripnotes/',
                gifoffApp: o + '/gif-off/',
                empireApp: o + '/empire/',
                formulatorApp: o + '/formulator/'
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
                    tripnotes: new URL('simpluri/apps/tripnotes/tripnotes.html', layout.base).href,
                    gifoff: new URL('simpluri/apps/gif-off/gif-off.html', layout.base).href,
                    empire: new URL('simpluri/apps/empire/empire.html', layout.base).href,
                    formulator: new URL('simpluri/apps/formulator/formulator.html', layout.base).href,
                    tripifyApp: new URL('tripify/index.html', layout.base).href,
                    tripmapApp: new URL('tripify/tripmap/index.html', layout.base).href,
                    packinglistApp: new URL('tripify/triplist/index.html', layout.base).href,
                    tripnotesApp: new URL('tripify/tripnotes/index.html', layout.base).href,
                    gifoffApp: new URL('gif-off/index.html', layout.base).href,
                    empireApp: new URL('empire/index.html', layout.base).href,
                    formulatorApp: new URL('formulator/index.html', layout.base).href
                };
            }
            return {
                portal: new URL('index.html', layout.base).href,
                myTrips: new URL('my-trips.html', layout.base).href,
                tripmap: new URL('apps/tripmap/tripmap.html', layout.base).href,
                packinglist: new URL('apps/triplist/triplist.html', layout.base).href,
                tripnotes: new URL('apps/tripnotes/tripnotes.html', layout.base).href,
                gifoff: new URL('apps/gif-off/gif-off.html', layout.base).href,
                empire: new URL('apps/empire/empire.html', layout.base).href,
                formulator: new URL('apps/formulator/formulator.html', layout.base).href,
                tripifyApp: new URL('tripify/index.html', layout.base).href,
                tripmapApp: new URL('tripify/tripmap/index.html', layout.base).href,
                packinglistApp: new URL('tripify/triplist/index.html', layout.base).href,
                tripnotesApp: new URL('tripify/tripnotes/index.html', layout.base).href,
                gifoffApp: new URL('gif-off/index.html', layout.base).href,
                empireApp: new URL('empire/index.html', layout.base).href,
                formulatorApp: new URL('formulator/index.html', layout.base).href
            };
        }
        return {
            portal: 'https://simpluri.com/',
            myTrips: 'https://simpluri.com/my-trips.html',
            tripmap: 'https://simpluri.com/apps/tripmap/tripmap.html',
            packinglist: 'https://simpluri.com/apps/triplist/triplist.html',
            tripnotes: 'https://simpluri.com/apps/tripnotes/tripnotes.html',
            gifoff: 'https://simpluri.com/apps/gif-off/gif-off.html',
            empire: 'https://simpluri.com/apps/empire/empire.html',
            formulator: 'https://simpluri.com/apps/formulator/formulator.html',
            tripifyApp: 'https://tripify.simpluri.com/',
            tripmapApp: 'https://tripify.simpluri.com/tripmap/',
            packinglistApp: 'https://tripify.simpluri.com/triplist/',
            tripnotesApp: 'https://tripify.simpluri.com/tripnotes/',
            gifoffApp: 'https://gif-off.simpluri.com/',
            empireApp: 'https://empire.simpluri.com/',
            formulatorApp: 'https://formulator.simpluri.com/'
        };
    }

    var TRIPIFY_SUITE_NAV = ['tripify', 'tripmap', 'packinglist', 'tripnotes'];
    var FUN_GAMES_NAV = ['gifoff', 'empire', 'formulator'];
    var TRIPIFY_SUITE_APPS = TRIPIFY_SUITE_NAV.slice();
    var SUITE_BACK_NAV_TOKEN = '__suite_back__';
    var SUITE_FORWARD_NAV_TOKEN = '__suite_forward__';
    var SUITE_HISTORY_KEY = 'tripify.suite_history';
    var SUITE_HISTORY_DELTA_KEY = 'tripify.suite_history_delta';
    var FORWARD_ARROW_SVG =
        '<svg class="w-5 h-5 tripify-forward-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>';

    function isTripifySuiteHost() {
        if (location.hostname === 'tripify.simpluri.com') return true;
        if (isLocalhost()) {
            var p = decodeURIComponent(location.pathname).replace(/\\/g, '/');
            return p.indexOf('/tripify/') === 0 || p === '/tripify' || p === '/tripify/';
        }
        return false;
    }

    function findHeaderBackLink() {
        var headers = document.querySelectorAll('header');
        for (var i = 0; i < headers.length; i++) {
            var links = headers[i].querySelectorAll('a[data-suite-href="portal"]');
            for (var j = 0; j < links.length; j++) {
                var link = links[j];
                if (link.closest('[data-suite-menu-dropdown]')) continue;
                if (link.getAttribute('data-suite-nav') === 'portal') continue;
                return link;
            }
        }
        return null;
    }

    function currentSuiteHistoryEntry() {
        var p = decodeURIComponent(location.pathname || '/').replace(/\\/g, '/');
        if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
        return p || '/';
    }

    function getSuiteHistory() {
        try {
            var raw = sessionStorage.getItem(SUITE_HISTORY_KEY);
            if (!raw) return { entries: [], index: -1 };
            var parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.entries)) return { entries: [], index: -1 };
            return {
                entries: parsed.entries,
                index: typeof parsed.index === 'number' ? parsed.index : -1
            };
        } catch (e) {
            return { entries: [], index: -1 };
        }
    }

    function setSuiteHistory(nav) {
        try {
            sessionStorage.setItem(SUITE_HISTORY_KEY, JSON.stringify({
                entries: nav.entries || [],
                index: typeof nav.index === 'number' ? nav.index : -1
            }));
        } catch (e) { /* private mode */ }
    }

    function getSuiteHistoryDelta() {
        try {
            var n = parseInt(sessionStorage.getItem(SUITE_HISTORY_DELTA_KEY) || '0', 10);
            return n === 1 || n === -1 ? n : 0;
        } catch (e) {
            return 0;
        }
    }

    function setSuiteHistoryDelta(delta) {
        try {
            if (delta === 1 || delta === -1) sessionStorage.setItem(SUITE_HISTORY_DELTA_KEY, String(delta));
            else sessionStorage.removeItem(SUITE_HISTORY_DELTA_KEY);
        } catch (e) { /* */ }
    }

    function getNavigationType() {
        try {
            var entries = performance.getEntriesByType('navigation');
            if (entries && entries[0] && entries[0].type) return entries[0].type;
        } catch (e) { /* */ }
        return 'navigate';
    }

    function canSuiteGoBack() {
        var nav = getSuiteHistory();
        return nav.index > 0;
    }

    function canSuiteGoForward() {
        var nav = getSuiteHistory();
        return nav.index >= 0 && nav.index < nav.entries.length - 1;
    }

    function updateSuiteHistoryButtons() {
        if (!isTripifySuiteHost()) return;
        var back = document.querySelector('[data-suite-header-back]');
        var forward = document.querySelector('[data-suite-header-forward]');
        var showBack = canSuiteGoBack();
        var showForward = canSuiteGoForward();
        if (back) {
            back.hidden = !showBack;
            back.setAttribute('aria-hidden', showBack ? 'false' : 'true');
            if (showBack) back.removeAttribute('tabindex');
            else back.setAttribute('tabindex', '-1');
        }
        if (forward) {
            forward.hidden = !showForward;
            forward.setAttribute('aria-hidden', showForward ? 'false' : 'true');
            if (showForward) forward.removeAttribute('tabindex');
            else forward.setAttribute('tabindex', '-1');
        }
    }

    function syncSuiteHistory(opts) {
        if (!isTripifySuiteHost()) return;
        opts = opts || {};
        var nav = getSuiteHistory();
        var entry = currentSuiteHistoryEntry();
        var delta = getSuiteHistoryDelta();
        var navType = opts.forceBackForward ? 'back_forward' : getNavigationType();

        if (delta === -1 || delta === 1) {
            var nextIndex = nav.index + delta;
            if (nextIndex >= 0 && nextIndex < nav.entries.length && nav.entries[nextIndex] === entry) {
                nav.index = nextIndex;
            } else {
                var found = -1;
                for (var i = 0; i < nav.entries.length; i++) {
                    if (nav.entries[i] === entry) found = i;
                }
                if (found >= 0) nav.index = found;
                else {
                    nav.entries = nav.entries.slice(0, Math.max(0, nav.index + 1));
                    nav.entries.push(entry);
                    nav.index = nav.entries.length - 1;
                }
            }
            setSuiteHistoryDelta(0);
        } else if (navType === 'back_forward') {
            if (nav.index > 0 && nav.entries[nav.index - 1] === entry) {
                nav.index -= 1;
            } else if (nav.index >= 0 && nav.index < nav.entries.length - 1 && nav.entries[nav.index + 1] === entry) {
                nav.index += 1;
            } else {
                var match = -1;
                for (var j = 0; j < nav.entries.length; j++) {
                    if (nav.entries[j] === entry) match = j;
                }
                if (match >= 0) nav.index = match;
                else {
                    nav.entries.push(entry);
                    nav.index = nav.entries.length - 1;
                }
            }
        } else if (navType === 'reload') {
            if (nav.index < 0 || nav.entries[nav.index] !== entry) {
                if (nav.entries.length === 0) {
                    nav.entries = [entry];
                    nav.index = 0;
                } else if (nav.entries[nav.index] !== entry) {
                    nav.entries[Math.max(0, nav.index)] = entry;
                    if (nav.index < 0) nav.index = 0;
                }
            }
        } else {
            if (nav.index >= 0 && nav.entries[nav.index] === entry) {
                /* already current */
            } else {
                nav.entries = nav.entries.slice(0, Math.max(0, nav.index + 1));
                nav.entries.push(entry);
                nav.index = nav.entries.length - 1;
            }
        }

        setSuiteHistory(nav);
        updateSuiteHistoryButtons();
    }

    function performSuiteBackNavigation() {
        if (!canSuiteGoBack()) return;
        setSuiteHistoryDelta(-1);
        window.history.back();
    }

    function performSuiteForwardNavigation() {
        if (!canSuiteGoForward()) return;
        setSuiteHistoryDelta(1);
        window.history.forward();
    }

    function ensureSuiteForwardButton(backLink) {
        var existing = backLink.parentNode
            ? backLink.parentNode.querySelector('[data-suite-header-forward]')
            : null;
        if (existing) return existing;
        var forward = document.createElement('a');
        forward.href = '#';
        forward.setAttribute('data-suite-header-forward', '1');
        forward.title = 'Forward';
        forward.setAttribute('aria-label', 'Forward');
        forward.className = backLink.className;
        forward.innerHTML = FORWARD_ARROW_SVG;
        forward.hidden = true;
        forward.setAttribute('aria-hidden', 'true');
        forward.setAttribute('tabindex', '-1');
        if (backLink.parentNode) {
            if (backLink.nextSibling) backLink.parentNode.insertBefore(forward, backLink.nextSibling);
            else backLink.parentNode.appendChild(forward);
        }
        return forward;
    }

    function configureTripifySuiteHistory() {
        if (!isTripifySuiteHost()) return;
        var back = findHeaderBackLink();
        if (!back) return;

        back.setAttribute('data-suite-header-back', '1');
        back.setAttribute('data-portal-back', '');
        back.title = 'Back';
        back.setAttribute('aria-label', 'Back');
        back.hidden = true;
        back.setAttribute('aria-hidden', 'true');
        back.setAttribute('tabindex', '-1');

        var forward = ensureSuiteForwardButton(back);

        if (back.getAttribute('data-suite-back-bound') !== '1') {
            back.setAttribute('data-suite-back-bound', '1');
            back.addEventListener('click', function (e) {
                if (e.defaultPrevented) return;
                e.preventDefault();
                if (!canSuiteGoBack()) return;
                performSuiteBackNavigation();
            });
        }

        if (forward.getAttribute('data-suite-forward-bound') !== '1') {
            forward.setAttribute('data-suite-forward-bound', '1');
            forward.addEventListener('click', function (e) {
                if (e.defaultPrevented) return;
                e.preventDefault();
                if (!canSuiteGoForward()) return;
                performSuiteForwardNavigation();
            });
        }

        syncSuiteHistory();

        if (!global.__simpluriSuiteHistoryBound) {
            global.__simpluriSuiteHistoryBound = true;
            window.addEventListener('pageshow', function (e) {
                syncSuiteHistory({ forceBackForward: !!e.persisted });
            });
            window.addEventListener('popstate', function () {
                syncSuiteHistory({ forceBackForward: true });
            });
        }
    }

    function isSuiteBackNavigationToken(href) {
        return href === SUITE_BACK_NAV_TOKEN;
    }

    function isSuiteForwardNavigationToken(href) {
        return href === SUITE_FORWARD_NAV_TOKEN;
    }

    function isSuiteHistoryNavigationToken(href) {
        return isSuiteBackNavigationToken(href) || isSuiteForwardNavigationToken(href);
    }

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
        if (p.indexOf('/apps/tripnotes/') !== -1) return 'tripnotes';
        if (p.indexOf('/tripify/tripnotes/') !== -1) return 'tripnotes';
        if (location.hostname === 'tripify.simpluri.com' && (p.indexOf('/tripnotes/') !== -1 || p === '/tripnotes')) return 'tripnotes';
        if (p.indexOf('/apps/gif-off/') !== -1) return 'gifoff';
        if (p.indexOf('/gif-off/') !== -1 || /\/gif-off(?:\/index\.html)?$/.test(p)) return 'gifoff';
        if (p.indexOf('/apps/empire/') !== -1) return 'empire';
        if (p.indexOf('/empire/') !== -1 || location.hostname === 'empire.simpluri.com') return 'empire';
        if (p.indexOf('/apps/formulator/') !== -1) return 'formulator';
        if (p.indexOf('/formulator/') !== -1 || location.hostname === 'formulator.simpluri.com') return 'formulator';
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
        // Re-attach active trip + share tokens. Bare suite URLs overwrite deep links
        // and cause "Trip not found" on mobile when only ?trip= survives without share.
        try {
            if (global.Tripify && typeof global.Tripify.getActiveTripId === 'function'
                && typeof global.Tripify.updateSuiteNavTripLinks === 'function') {
                var tripId = global.Tripify.getActiveTripId();
                if (tripId) global.Tripify.updateSuiteNavTripLinks(tripId);
            }
        } catch (e) { /* */ }
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
            if (e.target.closest('[data-suite-nav][href]')) {
                closeAllSuiteMenus();
                return;
            }
            if (!e.target.closest('[data-suite-menu-dropdown]')) {
                closeAllSuiteMenus();
            }
        });

        /* Mobile back / bfcache: restored pages keep open dropdown without a click to close */
        window.addEventListener('pageshow', function () {
            closeAllSuiteMenus();
        });
        window.addEventListener('popstate', function () {
            closeAllSuiteMenus();
        });
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') closeAllSuiteMenus();
        });
    }

    window.SimpluriMenu = {
        suiteUrls: suiteUrls,
        applyResolvedLinks: applyResolvedLinks,
        applySuiteNavVisibility: applySuiteNavVisibility,
        organizeSuiteMenus: organizeSuiteMenus,
        detectCurrentSuiteApp: detectCurrentSuiteApp,
        closeAllSuiteMenus: closeAllSuiteMenus,
        isTripifySuiteHost: isTripifySuiteHost,
        performSuiteBackNavigation: performSuiteBackNavigation,
        performSuiteForwardNavigation: performSuiteForwardNavigation,
        suiteBackNavigationToken: SUITE_BACK_NAV_TOKEN,
        suiteForwardNavigationToken: SUITE_FORWARD_NAV_TOKEN,
        isSuiteBackNavigationToken: isSuiteBackNavigationToken,
        isSuiteForwardNavigationToken: isSuiteForwardNavigationToken,
        isSuiteHistoryNavigationToken: isSuiteHistoryNavigationToken,
        updateSuiteHistoryButtons: updateSuiteHistoryButtons,
        canSuiteGoBack: canSuiteGoBack,
        canSuiteGoForward: canSuiteGoForward
    };

    function init() {
        closeAllSuiteMenus();
        organizeSuiteMenus();
        applyResolvedLinks();
        configureTripifySuiteHistory();
        bindSuiteMenus();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(typeof window !== 'undefined' ? window : this);
