/*
 * Input handling v4: keyboard, gamepad, on-screen touch controls, and key rebinding.
 *  - Z: Unique Hero Ability (ABILITY)
 *  - X: Tactical Move / Parry / Dodge / Finisher (TACTICAL)
 *  - C: Primary Weapon & Ultimate when 100% charged (AK47)
 *  - T: Team-Up Partner Combo (TEAMUP)
 *  - V: Hijack Helicopter/Jet or Summon Camry XSE 3.5 (CAR)
 *  - R: Tactical Reload & Cooldown Surge in combat / Restart in Pause (RELOAD)
 *  - Q/E: Switch Hero in combat preserving cooldowns & energy
 *  - O: Photo Mode toggle (PHOTOMODE)
 */
(function () {
    window.Mario = window.Mario || {};

    var KEYMAP = {
        ArrowLeft: 'LEFT', KeyA: 'LEFT',
        ArrowRight: 'RIGHT', KeyD: 'RIGHT',
        ArrowUp: 'UP', KeyW: 'UP',
        ArrowDown: 'DOWN', KeyS: 'DOWN',
        Space: 'JUMP', KeyJ: 'JUMP',
        ShiftLeft: 'RUN', ShiftRight: 'RUN', KeyK: 'RUN',
        KeyZ: 'ABILITY',
        KeyX: 'TACTICAL',
        KeyC: 'AK47',
        KeyT: 'TEAMUP',
        KeyV: 'CAR',
        KeyR: 'RELOAD',
        KeyO: 'PHOTOMODE',
        KeyQ: 'PREV_HERO', BracketLeft: 'PREV_HERO',
        KeyE: 'NEXT_HERO', BracketRight: 'NEXT_HERO',
        Enter: 'START', NumpadEnter: 'START',
        KeyP: 'PAUSE', Escape: 'PAUSE',
        KeyM: 'MUTE',
        KeyF: 'FULLSCREEN'
    };

    var SWALLOW = {
        ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1,
        Space: 1, Enter: 1, KeyX: 1, KeyZ: 1, KeyJ: 1, KeyK: 1, KeyC: 1, KeyV: 1,
        KeyT: 1, KeyR: 1, KeyO: 1,
        KeyQ: 1, KeyE: 1, BracketLeft: 1, BracketRight: 1,
        KeyP: 1, KeyM: 1
    };

    var GAMEPAD_MAP = {
        0: 'JUMP', 1: 'TACTICAL', 2: 'ABILITY', 3: 'AK47',
        4: 'PREV_HERO', 5: 'NEXT_HERO', 6: 'TEAMUP', 7: 'CAR',
        8: 'PAUSE', 9: 'START',
        12: 'UP', 13: 'DOWN', 14: 'LEFT', 15: 'RIGHT'
    };

    var Input = Mario.Input = {
        down: {},
        pressed: {},
        released: {},
        _gamepadPrev: {},
        lastDevice: 'keyboard',
        usingTouch: false,
        abilityKey: 'KeyZ'
    };

    Input.setAbilityKey = function (code) {
        if (!code) return;
        if (Input.abilityKey && KEYMAP[Input.abilityKey] === 'ABILITY') {
            delete KEYMAP[Input.abilityKey];
        }
        Input.abilityKey = code;
        KEYMAP[code] = 'ABILITY';
        SWALLOW[code] = 1;
        try {
            window.localStorage.setItem('mario.abilityKey', code);
        } catch (e) {}
    };

    function set(action, state) {
        if (!action) return;
        if (state && !Input.down[action]) {
            Input.pressed[action] = true;
        } else if (!state && Input.down[action]) {
            Input.released[action] = true;
        }
        Input.down[action] = state;
    }

    Input.isDown = function (action) { return !!Input.down[action]; };
    Input.wasPressed = function (action) { return !!Input.pressed[action]; };
    Input.wasReleased = function (action) { return !!Input.released[action]; };

    Input.reset = function () {
        Input.down = {};
        Input.pressed = {};
        Input.released = {};
        var held = document.querySelectorAll('.tbtn.held');
        for (var i = 0; i < held.length; i++) held[i].classList.remove('held');
    };

    Input.endFrame = function () {
        Input.pressed = {};
        Input.released = {};
    };

    Input.init = function () {
        window.addEventListener('keydown', function (e) {
            if (Mario.Audio) Mario.Audio.unlock();
            var action = KEYMAP[e.code];
            if (action) {
                if (SWALLOW[e.code]) e.preventDefault();
                Input.lastDevice = 'keyboard';
                set(action, true);
            } else if (e.key === ' ' || e.key.indexOf('Arrow') === 0) {
                e.preventDefault();
            }
        }, false);

        window.addEventListener('keyup', function (e) {
            var action = KEYMAP[e.code];
            if (action) set(action, false);
        }, false);

        window.addEventListener('blur', Input.reset);
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) Input.reset();
        });

        var pads = document.querySelectorAll('[data-action]');
        Array.prototype.forEach.call(pads, function (el) {
            var action = el.getAttribute('data-action');
            function press(e) {
                e.preventDefault();
                if (Mario.Audio) Mario.Audio.unlock();
                Input.usingTouch = true;
                Input.lastDevice = 'touch';
                el.classList.add('held');
                set(action, true);
            }
            function release(e) {
                e.preventDefault();
                el.classList.remove('held');
                set(action, false);
            }
            el.addEventListener('touchstart', press, { passive: false });
            el.addEventListener('touchend', release, { passive: false });
            el.addEventListener('touchcancel', release, { passive: false });
            el.addEventListener('mousedown', press);
            el.addEventListener('mouseup', release);
            el.addEventListener('mouseleave', release);
        });
    };

    Input.update = function () {
        if (!navigator.getGamepads) return;
        var pads = navigator.getGamepads();
        for (var p = 0; p < pads.length; p++) {
            var pad = pads[p];
            if (!pad || !pad.connected) continue;

            var state = {};
            for (var i = 0; i < pad.buttons.length; i++) {
                if (pad.buttons[i] && pad.buttons[i].pressed && GAMEPAD_MAP[i]) {
                    state[GAMEPAD_MAP[i]] = true;
                }
            }
            var ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
            if (ax < -0.4) state.LEFT = true;
            if (ax > 0.4) state.RIGHT = true;
            if (ay < -0.4) state.UP = true;
            if (ay > 0.4) state.DOWN = true;

            var allKeys = Object.keys(state).concat(Object.keys(Input._gamepadPrev));
            for (var k = 0; k < allKeys.length; k++) {
                var act = allKeys[k];
                var now = !!state[act];
                var was = !!Input._gamepadPrev[act];
                if (now !== was) {
                    if (now) Input.lastDevice = 'gamepad';
                    set(act, now);
                    Input._gamepadPrev[act] = now;
                }
            }
        }
    };
})();
