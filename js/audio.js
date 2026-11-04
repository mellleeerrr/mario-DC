/*
 * Audio manager: pooled HTML5 <audio> effects + Web Audio synthesizer.
 */
(function () {
    window.Mario = window.Mario || {};

    var FILES = {
        smallJump: 'sounds/jump-small.wav',
        bigJump: 'sounds/jump-super.wav',
        breakBlock: 'sounds/breakblock.wav',
        bump: 'sounds/bump.wav',
        coin: 'sounds/coin.wav',
        fireball: 'sounds/fireball.wav',
        flagpole: 'sounds/flagpole.wav',
        kick: 'sounds/kick.wav',
        pipe: 'sounds/pipe.wav',
        itemAppear: 'sounds/itemAppear.wav',
        powerup: 'sounds/powerup.wav',
        stomp: 'sounds/stomp.wav',
        death: 'sounds/mariodie.wav'
    };

    var MUSIC_FILES = {
        overworld: 'sounds/aboveground_bgm.ogg',
        underground: 'sounds/underground_bgm.ogg',
        clear: 'sounds/stage_clear.wav'
    };

    var POOL_SIZE = 4;

    var Audio = Mario.Audio = {
        muted: false,
        volume: 0.7,
        ready: false,
        _pools: {},
        _music: {},
        _currentMusic: null,
        _musicRate: 1,
        _unlocked: false,
        _ctx: null
    };

    function makeEl(src, loop) {
        var a = new window.Audio();
        a.preload = 'auto';
        a.src = src;
        a.loop = !!loop;
        a.volume = Audio.volume;
        return a;
    }

    Audio.init = function () {
        if (Audio.ready) return;
        Audio.ready = true;

        Object.keys(FILES).forEach(function (name) {
            var pool = [];
            for (var i = 0; i < POOL_SIZE; i++) {
                pool.push(makeEl(FILES[name], false));
            }
            Audio._pools[name] = pool;
        });

        Object.keys(MUSIC_FILES).forEach(function (name) {
            Audio._music[name] = makeEl(MUSIC_FILES[name], name !== 'clear');
        });
    };

    Audio.unlock = function () {
        if (Audio._unlocked) return;
        Audio._unlocked = true;
        try {
            var Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx && !Audio._ctx) Audio._ctx = new Ctx();
            if (Audio._ctx && Audio._ctx.state === 'suspended') Audio._ctx.resume();
        } catch (e) { /* ignore */ }

        if (Audio._currentMusic && !Audio.muted) {
            var el = Audio._music[Audio._currentMusic];
            if (el && el.paused) {
                el.volume = Math.min(1, Audio.volume * 0.65);
                var p = el.play();
                if (p && p.catch) p.catch(function () {});
            }
        }
    };

    function ctx() {
        if (!Audio._ctx) return null;
        if (Audio._ctx.state === 'suspended') {
            try { Audio._ctx.resume(); } catch (e) {}
        }
        return Audio._ctx;
    }

    function tone(freq, start, dur, type, gain) {
        var c = ctx();
        if (!c) return;
        var osc = c.createOscillator();
        var g = c.createGain();
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, c.currentTime + start);
        g.gain.setValueAtTime(0.0001, c.currentTime + start);
        g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), c.currentTime + start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(c.currentTime + start);
        osc.stop(c.currentTime + start + dur + 0.02);
    }

    function noise(start, dur, gain, filterFreq) {
        var c = ctx();
        if (!c) return;
        var len = Math.floor(c.sampleRate * dur);
        var buf = c.createBuffer(1, len, c.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        }
        var src = c.createBufferSource();
        src.buffer = buf;
        var filter = c.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = filterFreq || 1200;
        var g = c.createGain();
        g.gain.value = gain;
        src.connect(filter);
        filter.connect(g);
        g.connect(c.destination);
        src.start(c.currentTime + start);
    }

    var SYNTH = {
        oneUp: function (vol) {
            [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (n, i) {
                tone(n, i * 0.085, 0.12, 'square', 0.16 * vol);
            });
        },
        skid: function (vol) {
            noise(0, 0.18, 0.10 * vol, 2200);
        },
        pause: function (vol) {
            tone(660, 0, 0.07, 'square', 0.14 * vol);
            tone(440, 0.07, 0.09, 'square', 0.14 * vol);
        },
        warning: function (vol) {
            tone(880, 0, 0.10, 'square', 0.16 * vol);
            tone(880, 0.16, 0.10, 'square', 0.16 * vol);
        },
        gameOver: function (vol) {
            [392, 349, 311, 262, 196].forEach(function (n, i) {
                tone(n, i * 0.18, 0.28, 'triangle', 0.20 * vol);
            });
        },
        explosion: function (vol) {
            /* 3 слоя: резкий хлопок (crack) + низкий бум (sub-boom) + обломки (debris) */
            noise(0, 0.09, Math.min(0.45, 0.28 * vol), 2600);
            tone(110, 0, 0.28, 'sawtooth', Math.min(0.45, 0.30 * vol));
            tone(58, 0.03, 0.36, 'triangle', Math.min(0.50, 0.34 * vol));
            noise(0.06, 0.32, Math.min(0.35, 0.22 * vol), 650);
        },
        emp: function (vol) {
            tone(880, 0, 0.10, 'sine', 0.22 * vol);
            tone(440, 0.06, 0.18, 'sawtooth', 0.20 * vol);
            tone(220, 0.14, 0.24, 'triangle', 0.22 * vol);
        },
        thunder: function (vol) {
            noise(0, 0.14, 0.32 * vol, 3200);
            tone(180, 0.02, 0.25, 'sawtooth', 0.26 * vol);
            noise(0.10, 0.35, 0.24 * vol, 800);
        },
        laserZ: function (vol) {
            tone(960, 0, 0.12, 'sawtooth', 0.20 * vol);
            tone(640, 0.05, 0.20, 'square', 0.18 * vol);
        },
        timewarp: function (vol) {
            [660, 554, 440, 330].forEach(function (n, i) {
                tone(n, i * 0.06, 0.18, 'sine', 0.18 * vol);
            });
        },
        dashZ: function (vol) {
            noise(0, 0.15, 0.20 * vol, 1800);
            tone(520, 0, 0.12, 'triangle', 0.18 * vol);
        }
    };

    Audio.playExplosion = function (worldX, power) {
        if (Audio.muted || !Audio.ready) return;
        var refX = (typeof player !== 'undefined' && player) ? player.pos[0] : (typeof vX !== 'undefined' ? vX + 216 : 0);
        var dist = Math.abs((worldX || 0) - refX);
        var atten = Math.max(0.12, 1 - dist / 520);
        var pwr = Math.min(1.5, Math.max(0.5, power || 1));
        var finalVol = Math.min(1, atten * pwr);
        if (Audio._unlocked && SYNTH.explosion) {
            SYNTH.explosion(finalVol * Audio.volume);
        } else {
            Audio.play('breakBlock', { volume: finalVol });
        }
    };

    Audio.playAbility = function (kind) {
        if (Audio.muted || !Audio.ready) return;
        if (Audio._unlocked && SYNTH[kind]) {
            SYNTH[kind](Audio.volume);
        } else {
            Audio.play('powerup', { volume: 0.8 });
        }
    };

    Audio.play = function (name, opts) {
        if (Audio.muted || !Audio.ready) return;
        opts = opts || {};
        var vol = opts.volume === undefined ? 1 : opts.volume;

        if (SYNTH[name]) {
            if (Audio._unlocked) SYNTH[name](vol * Audio.volume);
            return;
        }

        var pool = Audio._pools[name];
        if (!pool) return;

        var el = pool[0];
        for (var i = 0; i < pool.length; i++) {
            if (pool[i].paused || pool[i].ended || pool[i].currentTime === 0) {
                el = pool[i];
                break;
            }
        }
        try {
            el.pause();
            el.currentTime = opts.offset || 0;
            el.volume = Math.min(1, vol * Audio.volume);
            el.playbackRate = opts.rate || 1;
            var p = el.play();
            if (p && p.catch) p.catch(function () {});
        } catch (e) {}
    };

    Audio.playMusic = function (name, opts) {
        if (!Audio.ready) return;
        opts = opts || {};
        if (Audio._currentMusic === name && !opts.restart) {
            var cur = Audio._music[name];
            if (cur && cur.paused && !Audio.muted) {
                cur.volume = Math.min(1, Audio.volume * 0.65);
                var cp = cur.play();
                if (cp && cp.catch) cp.catch(function () {});
            }
            return;
        }
        Audio.stopMusic();
        Audio._currentMusic = name;
        var el = Audio._music[name];
        if (!el || Audio.muted) return;
        try { el.currentTime = opts.time || 0; } catch (e) {}
        el.playbackRate = Audio._musicRate;
        el.volume = Math.min(1, Audio.volume * 0.65);
        try {
            var p = el.play();
            if (p && p.catch) p.catch(function () {});
        } catch (e) {}
    };

    Audio.stopMusic = function () {
        if (!Audio.ready) return;
        Object.keys(Audio._music).forEach(function (name) {
            var el = Audio._music[name];
            if (el && !el.paused) {
                try { el.pause(); el.currentTime = 0; } catch (e) {}
            }
        });
        Audio._currentMusic = null;
    };

    Audio.setMusicRate = function (rate) {
        if (Audio._musicRate === rate) return;
        Audio._musicRate = rate;
        if (!Audio.ready || !Audio._currentMusic) return;
        var el = Audio._music[Audio._currentMusic];
        if (el) el.playbackRate = rate;
    };

    Audio.pauseMusic = function () {
        if (!Audio.ready || !Audio._currentMusic) return;
        var el = Audio._music[Audio._currentMusic];
        if (el) { try { el.pause(); } catch (e) {} }
    };

    Audio.resumeMusic = function () {
        if (!Audio.ready || !Audio._currentMusic || Audio.muted) return;
        var el = Audio._music[Audio._currentMusic];
        if (el) {
            el.volume = Math.min(1, Audio.volume * 0.65);
            try {
                var p = el.play();
                if (p && p.catch) p.catch(function () {});
            } catch (e) {}
        }
    };

    Audio.toggleMute = function () {
        Audio.muted = !Audio.muted;
        if (Audio.muted) {
            Audio.pauseMusic();
        } else {
            Audio.resumeMusic();
        }
        return Audio.muted;
    };
})();
