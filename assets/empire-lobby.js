/**
 * Empire online lobby — Supabase RPC client.
 * Requires window.EMPIRE_SUPABASE_URL, window.EMPIRE_SUPABASE_ANON_KEY, and supabase-js on the page.
 */
(function (global) {
    'use strict';

    var client = null;

    function getUrl() {
        return String(global.EMPIRE_SUPABASE_URL || '').trim();
    }

    function getAnonKey() {
        return String(global.EMPIRE_SUPABASE_ANON_KEY || '').trim();
    }

    function getClient() {
        if (!global.supabase) {
            throw new Error('SUPABASE_JS_MISSING');
        }
        if (!client) {
            var url = getUrl();
            var key = getAnonKey();
            if (!url || !key) {
                throw new Error('SUPABASE_NOT_CONFIGURED');
            }
            client = global.supabase.createClient(url, key);
        }
        return client;
    }

    function empireAppBasePath() {
        var pathname = global.location.pathname || '/';
        var idx = pathname.indexOf('/empire');
        if (idx >= 0) {
            return pathname.substring(0, idx + 7);
        }
        return '';
    }

    function buildJoinUrl(code) {
        var base = global.location.origin + empireAppBasePath();
        return base + '/join/?r=' + encodeURIComponent(String(code || '').trim().toUpperCase());
    }

    function parseRpcResult(data, error) {
        if (error) {
            throw new Error(error.message || 'SUPABASE_RPC_ERROR');
        }
        if (!data || data.ok === false) {
            var err = (data && data.error) ? data.error : 'UNKNOWN_ERROR';
            throw new Error(err);
        }
        return data;
    }

    function createRoom() {
        return getClient().rpc('create_empire_room').then(function (res) {
            return parseRpcResult(res.data, res.error);
        });
    }

    function submitEntry(code, playerName, celebrity) {
        return getClient().rpc('submit_empire_entry', {
            p_code: String(code || '').trim(),
            p_player_name: String(playerName || '').trim(),
            p_celebrity: String(celebrity || '').trim()
        }).then(function (res) {
            return parseRpcResult(res.data, res.error);
        });
    }

    function fetchLobby(dealerToken) {
        return getClient().rpc('fetch_empire_lobby', {
            p_dealer_token: String(dealerToken || '').trim()
        }).then(function (res) {
            return parseRpcResult(res.data, res.error);
        });
    }

    function startGame(dealerToken) {
        return getClient().rpc('start_empire_game', {
            p_dealer_token: String(dealerToken || '').trim()
        }).then(function (res) {
            return parseRpcResult(res.data, res.error);
        });
    }

    global.EmpireLobby = {
        isConfigured: function () {
            return !!(getUrl() && getAnonKey() && global.supabase);
        },
        getClient: getClient,
        buildJoinUrl: buildJoinUrl,
        createRoom: createRoom,
        submitEntry: submitEntry,
        fetchLobby: fetchLobby,
        startGame: startGame,
        errorMessageKey: function (code) {
            var map = {
                SUPABASE_NOT_CONFIGURED: 'alert_supabase_missing_desc',
                SUPABASE_JS_MISSING: 'alert_supabase_missing_desc',
                ROOM_NOT_FOUND: 'join_error_room_not_found',
                ROOM_CLOSED: 'join_error_room_closed',
                ROOM_ALREADY_STARTED: 'lobby_error_already_started',
                ROOM_FULL: 'join_error_room_full',
                NAME_TAKEN: 'join_error_name_taken',
                INVALID_NAME: 'join_error_invalid_name',
                INVALID_CELEBRITY: 'join_error_invalid_celebrity',
                MIN_PLAYERS: 'alert_min_players_msg'
            };
            return map[code] || 'lobby_error_generic';
        }
    };
})(typeof window !== 'undefined' ? window : this);
