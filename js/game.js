/*
 * Game v3: fixed 60Hz main loop, screen states, camera, distance-attenuated screen shake,
 * ExplosionSystem integration, 22-hero Z-abilities, checkpoints, and 10-level campaign.
 */

var requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (cb) { window.setTimeout(cb, 1000 / 60); };
})();

var level = null;
var player = null;
var vX = 0;
var vY = 0;
var fireballs = [];
var bullets = [];
var cars = [];

var canvas = null;
var ctx = null;

var VW = 432;
var VH = 243;
var WORLD_H = 240;
var scale = 1;

var STEP = 1 / 60;
var accumulator = 0;
var lastTime = 0;
var rafId = null;

var game = {
    state: 'boot',
    score: 0,
    coins: 0,
    lives: 3,
    gameTime: 0,
    combo: 0,
    combatCombo: 0,
    combatComboTimer: 0,
    combatRank: 'D',
    hitstopTimer: 0,
    cinematicZoom: 1,
    cinematicTimer: 0,
    photoMode: false,
    challengeMode: 'campaign',
    vfxIntensity: 1.0,
    popups: [],
    shakeTime: 0,
    shakeDur: 0.1,
    shakeMag: 0,
    selectedHeroId: 'BATMAN',
    selectedLevelNum: 1,
    unlockedLevelNum: 1,
    checkpointPos: null,
    highScore: 0,
    clearTally: null,
    VW: VW,
    VH: VH
};

window.game = game;

function init() {
    canvas = document.getElementById('game');
    if (!canvas) return;
    ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;

    Mario.Font.init();
    Mario.Audio.init();
    Mario.Input.init();

    try {
        game.highScore = parseInt(window.localStorage.getItem('mario.highscore') || '0', 10) || 0;
        game.unlockedLevelNum = parseInt(window.localStorage.getItem('mario.unlockedLevel') || '1', 10) || 1;
        var savedHero = window.localStorage.getItem('mario.selectedHero');
        if (savedHero) game.selectedHeroId = savedHero;
        var savedZKey = window.localStorage.getItem('mario.abilityKey');
        if (savedZKey && Mario.Input.setAbilityKey) Mario.Input.setAbilityKey(savedZKey);
    } catch (e) {
        game.highScore = 0;
    }

    player = new Mario.Player([0, 0]);
    player.game = game;
    if (player.setHero) player.setHero(game.selectedHeroId);

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', function () {
        setTimeout(resize, 120);
    });

    game.state = 'title';
    bindUi();

    Mario.Input.update();
    lastTime = Mario.Util.now();
    rafId = requestAnimFrame(main);
}

function resize() {
    if (!canvas) return;
    var wrap = canvas.parentElement;
    var availW = wrap ? wrap.clientWidth : window.innerWidth;
    var availH = wrap ? wrap.clientHeight : window.innerHeight;
    var dpr = window.devicePixelRatio || 1;

    var rawW = availW * dpr;
    var rawH = availH * dpr;

    var s = Math.min(rawW / VW, rawH / VH);
    if (s >= 1) s = Math.floor(s);

    scale = s;

    canvas.width = Math.max(1, Math.round(VW * s));
    canvas.height = Math.max(1, Math.round(VH * s));
    canvas.style.width = (canvas.width / dpr) + 'px';
    canvas.style.height = (canvas.height / dpr) + 'px';

    ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(s, 0, 0, s, 0, 0);
}

function bindUi() {
    var muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
        muteBtn.addEventListener('click', function () {
            game.toggleMute();
            muteBtn.blur();
        });
    }
    var fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
        fsBtn.addEventListener('click', function () {
            toggleFullscreen();
            fsBtn.blur();
        });
    }
    var heroSel = document.getElementById('select-hero');
    if (heroSel && Mario.Action && Mario.Action.HEROES) {
        heroSel.innerHTML = '';
        Mario.Action.HEROES.forEach(function (h) {
            var opt = document.createElement('option');
            opt.value = h.id;
            opt.textContent = h.name + ' — Z: ' + h.zName;
            if (h.id === game.selectedHeroId) opt.selected = true;
            heroSel.appendChild(opt);
        });
        heroSel.addEventListener('change', function () {
            game.selectHero(heroSel.value);
            heroSel.blur();
        });
    }
    var lvlSel = document.getElementById('select-level');
    if (lvlSel && Mario.LEVELS) {
        lvlSel.innerHTML = '';
        Mario.LEVELS.forEach(function (l) {
            var opt = document.createElement('option');
            opt.value = String(l.num);
            opt.textContent = 'МИР ' + l.name + ' — ' + l.title;
            if (l.num === game.selectedLevelNum) opt.selected = true;
            lvlSel.appendChild(opt);
        });
        lvlSel.addEventListener('change', function () {
            var n = parseInt(lvlSel.value, 10) || 1;
            game.selectLevel(n);
            lvlSel.blur();
        });
    }
    var zKeySel = document.getElementById('select-zkey');
    if (zKeySel && Mario.Input) {
        zKeySel.value = Mario.Input.abilityKey || 'KeyZ';
        zKeySel.addEventListener('change', function () {
            Mario.Input.setAbilityKey(zKeySel.value);
            zKeySel.blur();
        });
    }
    var modeSel = document.getElementById('select-mode');
    if (modeSel) {
        modeSel.value = game.challengeMode || 'campaign';
        modeSel.addEventListener('change', function () {
            game.setChallengeMode(modeSel.value);
            modeSel.blur();
        });
    }
    var vfxSel = document.getElementById('select-vfx');
    if (vfxSel) {
        vfxSel.value = String(game.vfxIntensity || 1);
        vfxSel.addEventListener('change', function () {
            var val = parseFloat(vfxSel.value) || 1.0;
            game.vfxIntensity = val;
            if (Mario.ExplosionSystem) Mario.ExplosionSystem.vfxIntensity = val;
            vfxSel.blur();
        });
    }
    if (canvas) {
        canvas.addEventListener('pointerdown', function () {
            Mario.Audio.unlock();
        });
    }
}

function syncUiSelectors() {
    var heroSel = document.getElementById('select-hero');
    if (heroSel && player && player.hero) {
        heroSel.value = player.hero.id;
    }
    var lvlSel = document.getElementById('select-level');
    if (lvlSel && level && level.name) {
        var parts = level.name.split('-');
        var num = parseInt(parts[1], 10);
        if (num >= 1 && num <= 10) {
            game.selectedLevelNum = num;
            lvlSel.value = String(num);
        }
    }
}

game.selectHero = function (idOrIdx) {
    if (!Mario.Action) return;
    var h = Mario.Action.getHero(idOrIdx);
    if (!h) return;
    game.selectedHeroId = h.id;
    try {
        window.localStorage.setItem('mario.selectedHero', h.id);
    } catch (e) {}
    if (player && player.setHero) {
        player.setHero(h.id);
        if (game.state === 'playing') {
            game.popup(h.name + ' · Z: ' + h.zName, player.pos[0], player.pos[1] - 18, h.color);
            game.shake(2.0, 0.14);
        }
    }
    syncUiSelectors();
};

game.nextHero = function (dir) {
    if (!Mario.Action) return;
    var cur = (player && player.hero) ? player.hero.index : 0;
    game.selectHero(cur + (dir || 1));
};

game.selectLevel = function (num) {
    if (!Mario.LEVELS) return;
    var entry = null;
    for (var i = 0; i < Mario.LEVELS.length; i++) {
        if (Mario.LEVELS[i].num === num) {
            entry = Mario.LEVELS[i];
            break;
        }
    }
    if (!entry) return;
    game.selectedLevelNum = entry.num;
    game.checkpointPos = null;
    if (game.state === 'title') {
        startNewGame(entry.loader);
    } else {
        loadLevel(entry.loader);
    }
};

game.shake = function (mag, dur) {
    game.shakeMag = Math.max(game.shakeMag, mag || 2.5);
    game.shakeDur = Math.max(0.05, dur || 0.2);
    game.shakeTime = Math.max(game.shakeTime, game.shakeDur);
};

/* Масштабируемая вибрация экрана по мощности и расстоянию до эпицентра */
game.shakeAt = function (worldX, worldY, power, dur) {
    var refX = (player && player.pos) ? player.pos[0] : (vX + VW * 0.5);
    var dist = Math.abs((worldX || 0) - refX);
    var atten = Math.max(0.15, 1 - dist / 420);
    game.shake((power || 3.0) * atten, dur || 0.22);
};

game.spawnExplosion = function (x, y, scaleMul) {
    if (Mario.ExplosionSystem) {
        Mario.ExplosionSystem.trigger({
            x: x,
            y: y,
            radius: Math.round(42 * (scaleMul || 1)),
            damage: 2.5 * (scaleMul || 1),
            impulse: 4.5,
            color: '#ffe040'
        });
    }
};

/* Боевая система v4: регистрация попаданий, комбо-ранги (D..SSS), криты, Hitstop и заряд Ульты */
game.registerCombatHit = function (target, dmg, isCrit, isWeak) {
    game.combatCombo = (game.combatCombo || 0) + 1;
    game.combatComboTimer = 4.2;
    var c = game.combatCombo;
    game.combatRank = c >= 30 ? 'SSS' : (c >= 22 ? 'SS' : (c >= 15 ? 'S' : (c >= 10 ? 'A' : (c >= 6 ? 'B' : (c >= 3 ? 'C' : 'D')))));
    var numDmg = (typeof target === 'number') ? (isCrit || 1) : (dmg || 1);
    if (player) {
        player.ultCharge = Math.min(player.maxUlt || 100, (player.ultCharge || 0) + Math.max(3, numDmg * 2.5));
    }
    if (isCrit === true || isWeak === true || numDmg >= 4) {
        game.hitstopTimer = Math.max(game.hitstopTimer || 0, isCrit === true ? 0.045 : 0.025);
    }
    var px = (target && target.pos) ? target.pos[0] : (typeof target === 'number' ? target : null);
    var py = (target && target.pos) ? target.pos[1] : (typeof dmg === 'number' && typeof target === 'number' ? dmg : null);
    if (px !== null && py !== null) {
        var num = Math.max(10, Math.round(numDmg * 25));
        var label = (isCrit === true ? 'КРИТ! ' : (isWeak === true ? 'УЯЗВ! ' : '')) + num;
        var col = isCrit === true ? '#ffe000' : (isWeak === true ? '#ff58e8' : '#ffffff');
        game.popup(label, px, py - 10, col);
    }
};

/* Режимы испытания: Кампания, Босс-Раш, Волны врагов, На время */
game.setChallengeMode = function (mode) {
    game.challengeMode = mode || 'campaign';
    if (game.state === 'playing' && level) {
        applyChallengeModeToLevel();
    }
};

function applyChallengeModeToLevel() {
    if (!level || !player) return;
    if (game.challengeMode === 'bossrush') {
        level.time = 300;
        var bx = Math.floor(player.pos[0] / 16) + 14;
        level.putBoss(bx, 11, 14, level.bossSpec || { name: 'БОСС-РАШ · ТИТАН', color: '#4c1e58', visor: '#ffe000', weakness: 'explosive' });
        game.popup('РЕЖИМ: БОСС-РАШ!', player.pos[0], player.pos[1] - 24, '#ffe000');
    } else if (game.challengeMode === 'waves') {
        var wx = Math.floor(player.pos[0] / 16) + 8;
        var mods = ['SHIELD', 'ARMOR', 'TELEPORT', 'REGEN'];
        for (var i = 0; i < 6; i++) {
            level.putGoomba(wx + i * 3, 10, mods[i % mods.length]);
        }
        level.putHelicopter(wx + 6, 3, 4);
        game.popup('РЕЖИМ: ВОЛНЫ ВРАГОВ!', player.pos[0], player.pos[1] - 24, '#ff5858');
    } else if (game.challengeMode === 'timeattack') {
        level.time = Math.min(level.time, 120);
        game.popup('РЕЖИМ: НА ВРЕМЯ (120С)!', player.pos[0], player.pos[1] - 24, '#48ff78');
    }
}

function toggleFullscreen() {
    var el = document.documentElement;
    if (!document.fullscreenElement) {
        if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    } else if (document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
    }
}

function main(now) {
    rafId = requestAnimFrame(main);

    var dt = (now - lastTime) / 1000;
    lastTime = now;
    if (!(dt > 0)) dt = 0;
    if (dt > 0.25) dt = 0.25;

    accumulator += dt;
    var steps = 0;
    while (accumulator >= STEP && steps < 5) {
        update(STEP);
        accumulator -= STEP;
        steps++;
    }
    if (steps >= 5) accumulator = 0;

    render();
}

function update(dt) {
    game.gameTime += dt;
    if (game.shakeTime > 0) {
        game.shakeTime = Math.max(0, game.shakeTime - dt);
        if (game.shakeTime === 0) game.shakeMag = 0;
    }

    Mario.Input.update();

    if (Mario.Input.wasPressed('MUTE')) game.toggleMute();
    if (Mario.Input.wasPressed('FULLSCREEN')) toggleFullscreen();
    if (Mario.Input.wasPressed('PREV_HERO')) game.nextHero(-1);
    if (Mario.Input.wasPressed('NEXT_HERO')) game.nextHero(1);

    switch (game.state) {
        case 'title': updateTitle(); break;
        case 'playing': updatePlaying(dt); break;
        case 'paused': updatePaused(); break;
        case 'levelclear': updateLevelClear(dt); break;
        case 'gameover':
        case 'victory':
            if (Mario.Input.wasPressed('START') || Mario.Input.wasPressed('JUMP')) {
                game.state = 'title';
            }
            break;
    }

    Mario.Input.endFrame();
}

function updateTitle() {
    if (Mario.Input.wasPressed('LEFT')) game.nextHero(-1);
    if (Mario.Input.wasPressed('RIGHT')) game.nextHero(1);
    if (Mario.Input.wasPressed('START') || Mario.Input.wasPressed('JUMP')) {
        Mario.Audio.unlock();
        startNewGame();
    }
}

function updatePaused() {
    if (Mario.Input.wasPressed('PAUSE') || Mario.Input.wasPressed('START')) {
        resumeGame();
    } else if (Mario.Input.wasPressed('RESTART') || Mario.Input.wasPressed('RELOAD')) {
        restartLevel();
    }
}

function updateLevelClear(dt) {
    var t = game.clearTally;
    if (!t) return;

    if (!t.done) {
        t.timer -= dt;
        if (t.timer <= 0) {
            t.timer = 0.02;
            if (t.time > 0) {
                t.time -= 1;
                t.points += 50;
                game.addScore(50);
            }
            if (t.time <= 0) {
                t.done = true;
                Mario.Audio.play('oneUp');
            }
        }
        return;
    }

    if (Mario.Input.wasPressed('START') || Mario.Input.wasPressed('JUMP')) {
        game.clearTally = null;
        game.checkpointPos = null;
        var next = level && level.next;
        if (next) {
            loadLevel(next);
        } else {
            game.state = 'victory';
            Mario.Audio.playMusic('clear', { restart: true });
        }
    }
}

function updatePlaying(dt) {
    if (Mario.Input.wasPressed('PAUSE')) {
        pauseGame();
        return;
    }
    if (Mario.Input.wasPressed('PHOTOMODE')) {
        game.photoMode = !game.photoMode;
        return;
    }
    if (game.photoMode) {
        return;
    }
    if (Mario.Input.wasPressed('RESTART')) {
        game.checkpointPos = null;
        restartLevel();
        return;
    }

    if (game.cinematicTimer > 0) {
        game.cinematicTimer = Math.max(0, game.cinematicTimer - dt);
        if (game.cinematicTimer === 0) game.cinematicZoom = 1;
    }
    if (game.combatComboTimer > 0) {
        game.combatComboTimer = Math.max(0, game.combatComboTimer - dt);
        if (game.combatComboTimer === 0) {
            game.combatCombo = 0;
            game.combatRank = 'D';
        }
    }

    /* Кратковременный Hitstop при критических и тяжёлых ударах */
    if (game.hitstopTimer > 0) {
        game.hitstopTimer = Math.max(0, game.hitstopTimer - dt);
        return;
    }

    /* Непрерывное тиканье перезарядки способностей и регенерации энергии для всех 22 героев */
    if (player && player.tickCooldowns) {
        player.tickCooldowns(dt);
    }

    if (Mario.Input.wasPressed('RELOAD') && player && !player.piping && !player.dying) {
        player.reload();
    }

    if (Mario.Input.wasPressed('CAR') && !player.piping && !player.dying) {
        if (player.inAircraft) {
            player.exitAircraft();
        } else if (player.inCar) {
            player.exitCar();
        } else {
            game.toggleCar();
        }
    }

    handleInput();

    if (player.inAircraft && player.aircraft) {
        if (player.rifleTime > 0) player.rifleTime -= 1;
        if (player.rifleCooldown > 0) player.rifleCooldown -= 1;
        updateAircraft(dt);
    } else if (player.inCar && player.car) {
        if (player.rifleTime > 0) player.rifleTime -= 1;
        if (player.rifleCooldown > 0) player.rifleCooldown -= 1;
        updateCar(dt);
    } else {
        player.update(dt, vX);
    }

    for (var y = 0; y < 15; y++) {
        var row = level.blocks[y];
        for (var x = 0; x < row.length; x++) {
            var block = row[x];
            if (block) block.update(dt, game.gameTime);
        }
    }

    var items = level.items;
    for (var i = 0; i < items.length; i++) {
        if (items[i] && items[i].update) items[i].update(dt);
    }

    var enemies = level.enemies;
    for (var e = 0; e < enemies.length; e++) {
        if (enemies[e]) enemies[e].update(dt, vX);
    }

    for (var f = 0; f < fireballs.length; f++) {
        if (fireballs[f]) fireballs[f].update(dt);
    }

    for (var b = 0; b < bullets.length; b++) {
        if (bullets[b]) bullets[b].update(dt);
    }

    for (var cc = 0; cc < cars.length; cc++) {
        if (cars[cc] && cars[cc] !== player.car) cars[cc].update(dt);
    }

    for (var p = 0; p < level.pipes.length; p++) {
        level.pipes[p].update(dt);
    }

    if (Mario.ExplosionSystem) {
        Mario.ExplosionSystem.update(dt, vX);
    }

    checkCollisions();
    updateCamera();

    if (!player.dying && !player.piping && !player.flagging && !player.exiting) {
        level.time -= dt * 2.5;
        if (level.time <= 0) {
            level.time = 0;
            player.die();
        } else if (level.time <= 100) {
            if (!level.warned) {
                level.warned = true;
                Mario.Audio.play('warning');
            }
            Mario.Audio.setMusicRate(1.35);
        } else {
            Mario.Audio.setMusicRate(1);
        }
    }

    level.compact();
    Mario.Util.compact(fireballs);
    Mario.Util.compact(bullets);
    Mario.Util.compact(cars);
    updatePopups(dt);
}

function handleInput() {
    if (player.piping || player.dying) return;

    if (Mario.Input.wasPressed('ABILITY')) {
        player.useAbility();
    }
    if (Mario.Input.wasPressed('TACTICAL')) {
        if (player.inAircraft && player.aircraft) {
            /* Сброс дружественной авиабомбы с захваченного вертолёта или истребителя */
            if (Mario.Bomb && level && level.items) {
                var b = new Mario.Bomb([player.aircraft.pos[0] + 12, player.aircraft.pos[1] + 18], player.left ? -1.5 : 1.5);
                b.friendly = true;
                level.items.push(b);
                Mario.Audio.play('kick');
            }
        } else if (player.useTacticalX) {
            player.useTacticalX();
        }
    }
    if (Mario.Input.wasPressed('TEAMUP') && player.useTeamUp) {
        player.useTeamUp();
    }

    if (player.inAircraft) {
        if (Mario.Input.isDown('AK47')) {
            if (player.ultCharge >= 100 && Mario.Input.wasPressed('AK47')) {
                player.useUltimateC();
            } else {
                player.shoot47();
            }
        }
        return;
    }

    if (player.inCar) {
        if (Mario.Input.isDown('AK47')) {
            if (player.ultCharge >= 100 && Mario.Input.wasPressed('AK47')) {
                player.useUltimateC();
            } else {
                player.shoot47();
            }
        }
        return;
    }

    if (player.noInput) return;

    if (Mario.Input.isDown('RUN')) player.run();
    else player.noRun();

    if (Mario.Input.wasPressed('JUMP')) player.jump();
    if (Mario.Input.wasReleased('JUMP')) player.noJump();

    if (Mario.Input.isDown('AK47')) {
        if (player.ultCharge >= 100 && Mario.Input.wasPressed('AK47') && player.useUltimateC) {
            player.useUltimateC();
        } else {
            player.shoot47();
        }
    }

    if (Mario.Input.isDown('DOWN')) player.crouch();
    else player.noCrouch();

    if (Mario.Input.isDown('LEFT')) player.moveLeft();
    else if (Mario.Input.isDown('RIGHT')) player.moveRight();
    else player.noWalk();
}

function updateAircraft(dt) {
    var ac = player.aircraft;
    if (!ac || ac.dead || ac.crashing) {
        player.exitAircraft();
        return;
    }
    var spd = Mario.Input.isDown('RUN') ? 3.2 : 2.3;
    if (Mario.Input.isDown('LEFT')) {
        ac.pos[0] = Math.max(vX + 4, ac.pos[0] - spd);
        ac.dir = -1;
        ac.left = true;
        ac.sprite.flipH = false;
        player.left = true;
    } else if (Mario.Input.isDown('RIGHT')) {
        ac.pos[0] = Math.min((level.width || 4000) - 44, ac.pos[0] + spd);
        ac.dir = 1;
        ac.left = false;
        ac.sprite.flipH = true;
        player.left = false;
    }
    if (Mario.Input.isDown('UP') || Mario.Input.isDown('JUMP')) {
        ac.pos[1] = Math.max(18, ac.pos[1] - 1.8);
    } else if (Mario.Input.isDown('DOWN')) {
        ac.pos[1] = Math.min(168, ac.pos[1] + 1.8);
    }
}

function updateCar(dt) {
    var car = player.car;
    if (!car || car.dead) {
        player.inCar = false;
        player.car = null;
        return;
    }

    var boost = Mario.Input.isDown('RUN');
    if (player.noInput || player.piping) {
        car.stop();
    } else {
        if (Mario.Input.wasPressed('JUMP')) {
            car.jump();
        }
        if (Mario.Input.isDown('LEFT')) {
            car.drive(-1, boost);
            player.left = true;
        } else if (Mario.Input.isDown('RIGHT')) {
            car.drive(1, boost);
            player.left = false;
        } else {
            car.stop();
        }
    }

    car.update(dt);
    if (car.dead || !player.inCar) return;
    car.checkCollisions();

    var carBottom = car.pos[1] + car.hitbox[1] + car.hitbox[3];
    player.pos[0] = car.pos[0] + car.hitbox[0] + car.hitbox[2] / 2 - 8;
    player.pos[1] = carBottom - player.hitbox[3];
    player.standing = car.standing;
}

function checkCollisions() {
    if (player.powering.length !== 0 || player.dying) return;

    player.checkCollisions();

    var items = level.items;
    for (var i = 0; i < items.length; i++) {
        if (items[i] && items[i].checkCollisions) items[i].checkCollisions();
    }

    var enemies = level.enemies;
    for (var e = 0; e < enemies.length; e++) {
        if (enemies[e] && enemies[e].checkCollisions) enemies[e].checkCollisions();
    }

    for (var f = 0; f < fireballs.length; f++) {
        if (fireballs[f]) fireballs[f].checkCollisions();
    }

    for (var b = 0; b < bullets.length; b++) {
        if (bullets[b]) bullets[b].checkCollisions();
    }

    for (var cc = 0; cc < cars.length; cc++) {
        if (cars[cc]) cars[cc].checkCollisions();
    }

    for (var p = 0; p < level.pipes.length; p++) {
        level.pipes[p].checkCollisions();
    }
}

function updateCamera() {
    if (player.exiting) {
        if (player.pos[0] > vX + 96) vX = player.pos[0] - 96;
        return;
    }

    var levelWidth = level.width || 0;

    if (!level.scrolling) {
        vX = levelWidth < VW ? (levelWidth - VW) / 2 : 0;
        return;
    }

    var right = vX + VW - 128;
    if (player.pos[0] > right) {
        vX = player.pos[0] - (VW - 128);
    }
    var left = vX + 48;
    if (player.pos[0] < left) {
        vX = Math.max(0, player.pos[0] - 48);
    }

    var maxX = Math.max(0, levelWidth - VW);
    vX = Mario.Util.clamp(vX, 0, maxX);
}

function startNewGame(customLoader) {
    game.score = 0;
    game.coins = 0;
    game.lives = 3;
    game.combo = 0;
    game.popups = [];
    game.checkpointPos = null;
    if (Mario.ExplosionSystem) Mario.ExplosionSystem.reset();
    if (player) player.power = 0;
    var loader = customLoader || Mario.oneone;
    if (!customLoader && Mario.LEVELS && game.selectedLevelNum > 1) {
        for (var i = 0; i < Mario.LEVELS.length; i++) {
            if (Mario.LEVELS[i].num === game.selectedLevelNum) {
                loader = Mario.LEVELS[i].loader;
                break;
            }
        }
    }
    loadLevel(loader);
}

function resetPlayerState(prevPower, prevCoins) {
    player = player || new Mario.Player(level.playerPos);
    player.game = game;
    var spawnPos = game.checkpointPos || level.playerPos;
    player.pos = [spawnPos[0], spawnPos[1]];
    player.vel = [0, 0];
    player.acc = [0, 0];
    player.dead = false;
    player.dying = 0;
    player.waiting = 0;
    player.targetPos = [];
    player.noInput = false;
    player.piping = false;
    player.flagging = false;
    player.exiting = false;
    player.crouching = false;
    player.invincibility = 0;
    player.starTime = 0;
    player.powering = [];
    player.shooting = 0;
    player.bounce = false;
    player.jumping = 0;
    player.canJump = true;
    player.left = false;
    player.standing = true;
    player.fireballs = 0;
    player.inCar = false;
    player.car = null;
    player.inAircraft = false;
    player.aircraft = null;
    player.hp = player.maxHp || 100;
    player.armor = 25;
    player.energy = player.maxEnergy || 100;
    player.zCooldown = 0;
    player.xCooldown = 0;
    player.parryTimer = 0;
    player.heroStates = {};
    player.abilityAnimTimer = 0;
    player.hitAnimTimer = 0;
    player.sprite.pos = [80, 32];
    player.sprite.size = [16, 16];
    player.sprite.speed = 0;
    player.sprite.frames = [0];
    player.sprite.flipH = false;
    player.sprite.offsetY = 0;
    player.hitbox = [0, 0, 16, 16];
    player.power = prevPower;
    if (prevPower > 0) {
        player.hitbox = [0, 0, 16, 32];
        player.sprite.size = [16, 32];
        player.pos[1] -= 16;
    }
    if (player.setHero) {
        player.setHero(game.selectedHeroId);
    }
    game.coins = prevCoins;
    player.coins = prevCoins;
    player.score = game.score;
}

function loadLevel(loader) {
    var prevPower = player ? player.power : 0;
    var prevCoins = game.coins;

    loader();
    resetPlayerState(prevPower, prevCoins);

    fireballs = [];
    bullets = [];
    cars = [];
    if (Mario.ExplosionSystem) Mario.ExplosionSystem.reset();
    game.level = level;
    level.time = level.timeLimit;
    level.buildTerrain();

    vX = 0;
    vY = WORLD_H - VH;
    if (!level.scrolling && level.width < VW) {
        vX = (level.width - VW) / 2;
    }
    updateCamera();

    Mario.Audio.setMusicRate(1);
    Mario.Audio.playMusic(level.music, { restart: true });
    Mario.Input.reset();

    game.state = 'playing';
    game.combo = 0;
    game.combatCombo = 0;
    game.combatRank = 'D';
    if (game.challengeMode && game.challengeMode !== 'campaign') {
        applyChallengeModeToLevel();
    }
    syncUiSelectors();
}

/* Seamless warp between main level and bonus pipe room. */
game.warpLevel = function (loader, exitPos, exitDir) {
    var prevPower = player ? player.power : 0;
    var prevCoins = game.coins;
    var savedTime = level ? level.time : 400;

    loader();
    resetPlayerState(prevPower, prevCoins);

    fireballs = [];
    bullets = [];
    cars = [];
    if (Mario.ExplosionSystem) Mario.ExplosionSystem.reset();
    game.level = level;
    level.time = savedTime;
    level.buildTerrain();

    vY = WORLD_H - VH;
    if (exitPos) {
        player.pos = [exitPos[0], exitPos[1]];
    }
    updateCamera();

    Mario.Audio.playMusic(level.music, { restart: true });
    if (exitDir) {
        player.pipe(exitDir, function () {});
    }
};

function restartLevel() {
    if (game.state === 'gameover' || game.state === 'title') return;
    game.state = 'playing';
    loadLevel(level.loader);
}

function pauseGame() {
    if (game.state !== 'playing') return;
    game.state = 'paused';
    Mario.Audio.pauseMusic();
    Mario.Audio.play('pause');
}

function resumeGame() {
    if (game.state !== 'paused') return;
    game.state = 'playing';
    Mario.Audio.play('pause');
    Mario.Audio.resumeMusic();
}

game.addScore = function (n) {
    game.score += n;
    if (game.score > game.highScore) {
        game.highScore = game.score;
        try {
            window.localStorage.setItem('mario.highscore', String(game.highScore));
        } catch (e) {}
    }
};

game.addLife = function () {
    game.lives++;
    game.popup('1UP', player.pos[0], player.pos[1] - 16, '#8ef7ff');
};

game.onCoin = function (count) {
    game.coins = count;
    if (count > 0 && count % 100 === 0) {
        Mario.Audio.play('oneUp');
        game.addLife();
    }
};

game.startLevelClear = function () {
    game.state = 'levelclear';
    game.clearTally = {
        time: Math.max(0, Math.ceil(level.time)),
        points: 0,
        timer: 0,
        done: false
    };
    if (level && level.name) {
        var num = parseInt(level.name.split('-')[1], 10) || 1;
        if (num + 1 > game.unlockedLevelNum) {
            game.unlockedLevelNum = Math.min(10, num + 1);
            try {
                window.localStorage.setItem('mario.unlockedLevel', String(game.unlockedLevelNum));
            } catch (e) {}
        }
    }
    Mario.Audio.stopMusic();
    Mario.Audio.playMusic('clear', { restart: true });
};

game.addStompScore = function (x, y) {
    game.combo++;
    var table = [100, 200, 400, 500, 800, 1000, 2000, 4000, 5000, 8000];
    var idx = Math.min(game.combo, table.length) - 1;
    var points = table[idx];
    game.addScore(points);
    var px = x !== undefined ? x : player.pos[0];
    var py = y !== undefined ? y : player.pos[1];
    game.popup(String(points), px, py - 12, '#ffffff');
    if (game.combo >= 8) {
        Mario.Audio.play('oneUp');
        game.addLife();
    }
};

game.onStar = function () {
    game.popup('STAR!', player.pos[0], player.pos[1] - 16, '#ffe000');
};

game.toggleCar = function () {
    if (!player || player.inCar || player.inAircraft || player.piping || player.dying) return;

    /* 1. Перехват низколетящего или оглушённого вертолёта / истребителя на клавишу V */
    if (level && level.enemies && player.enterAircraft) {
        for (var e = 0; e < level.enemies.length; e++) {
            var en = level.enemies[e];
            if (!en || en.dead || en.crashing || en.pilot) continue;
            var isAircraft = (Mario.Helicopter && en instanceof Mario.Helicopter) || (Mario.Jet && en instanceof Mario.Jet);
            if (isAircraft && Math.abs((en.pos[0] + 18) - (player.pos[0] + 8)) < 68 &&
                (Math.abs(en.pos[1] - player.pos[1]) < 64 || en.stunTimer > 0)) {
                player.enterAircraft(en);
                return;
            }
        }
    }

    /* 2. Посадка в существующую машину рядом */
    for (var i = 0; i < cars.length; i++) {
        var c = cars[i];
        if (c && !c.dead && Math.abs((c.pos[0] + 30) - (player.pos[0] + 8)) < 56 &&
            Math.abs(c.pos[1] - player.pos[1]) < 48) {
            player.enterCar(c);
            return;
        }
    }

    /* 3. Вызов новой Toyota Camry XSE 3.5 */
    var feetY = player.pos[1] + player.hitbox[1] + player.hitbox[3];
    var spawnX = Math.max(vX, player.pos[0] - 22);
    var spawnY = feetY - 24;
    var car = new Mario.Car([spawnX, spawnY]);
    car.unstuckHorizontal();
    cars.push(car);
    player.enterCar(car);
    game.shake(2.2, 0.15);
};

game.onPlayerDeath = function () {
    game.lives--;
    if (game.lives > 0) {
        if (player) player.power = 0;
        game.state = 'playing';
        loadLevel(level.loader);
    } else {
        game.checkpointPos = null;
        game.state = 'gameover';
        Mario.Audio.play('gameOver');
        Mario.Audio.stopMusic();
    }
};

game.toggleMute = function () {
    var muted = Mario.Audio.toggleMute();
    var btn = document.getElementById('btn-mute');
    if (btn) {
        btn.textContent = muted ? 'ЗВУК: ВЫКЛ' : 'ЗВУК: ВКЛ';
        btn.classList.toggle('off', muted);
    }
    return muted;
};

game.popup = function (text, x, y, color) {
    game.popups.push({ text: text, x: x, y: y, t: 0, color: color || '#ffffff' });
};

function updatePopups(dt) {
    for (var i = game.popups.length - 1; i >= 0; i--) {
        var p = game.popups[i];
        p.t += dt;
        p.y -= dt * 22;
        if (p.t > 1.0) game.popups.splice(i, 1);
    }
}

function render() {
    var sx = 0, sy = 0;
    if (game.shakeTime > 0 && game.shakeMag > 0) {
        var decay = game.shakeTime / (game.shakeDur || 0.1);
        var amp = game.shakeMag * decay;
        sx = (Math.sin(game.gameTime * 95) * amp);
        sy = (Math.cos(game.gameTime * 115) * amp);
    }
    var zoom = (game.cinematicTimer > 0 && game.cinematicZoom > 1) ? game.cinematicZoom : 1;
    var effScale = scale * zoom;
    var zx = zoom > 1 ? -(VW * (zoom - 1) * 0.5) * scale : 0;
    var zy = zoom > 1 ? -(VH * (zoom - 1) * 0.5) * scale : 0;
    ctx.setTransform(effScale, 0, 0, effScale, Math.round(sx * scale + zx), Math.round(sy * scale + zy));
    ctx.imageSmoothingEnabled = false;

    if (game.state === 'title') {
        renderTitle();
        return;
    }
    if (!level) return;

    ctx.fillStyle = level.background;
    ctx.fillRect(-8, -8, VW + 16, VH + 16);

    level.renderTerrain(ctx, vX, vY);

    for (var y = 0; y < 15; y++) {
        var row = level.blocks[y];
        for (var x = 0; x < row.length; x++) {
            var block = row[x];
            if (block && !block.dead) block.render(ctx, vX, vY);
        }
    }

    var items = level.items;
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!item || item.dead) continue;
        if (item.pos && (item.pos[0] < vX - 48 || item.pos[0] > vX + VW + 48)) continue;
        item.render(ctx, vX, vY);
    }

    var enemies = level.enemies;
    for (var e = 0; e < enemies.length; e++) {
        var enemy = enemies[e];
        if (!enemy || enemy.dead) continue;
        if (enemy.pos[0] < vX - 72 || enemy.pos[0] > vX + VW + 72) continue;
        enemy.render(ctx, vX, vY);
    }

    for (var f = 0; f < fireballs.length; f++) {
        if (fireballs[f]) fireballs[f].render(ctx, vX, vY);
    }

    for (var b = 0; b < bullets.length; b++) {
        if (bullets[b]) bullets[b].render(ctx, vX, vY);
    }

    for (var cc = 0; cc < cars.length; cc++) {
        if (cars[cc]) cars[cc].render(ctx, vX, vY);
    }

    if (player && !player.dead) {
        if (player.invincibility <= 0 || Math.floor(player.invincibility) % 2 === 0) {
            player.render(ctx, vX, vY);
        }
    }

    for (var p = 0; p < level.pipes.length; p++) {
        var pipe = level.pipes[p];
        if (pipe.pos[0] < vX - 64 || pipe.pos[0] > vX + VW + 64) continue;
        pipe.render(ctx, vX, vY);
    }

    if (Mario.ExplosionSystem) {
        Mario.ExplosionSystem.render(ctx, vX, vY);
    }

    /* Погодные эффекты мира (шторм с дождём и молниями, ночь) */
    if (level.weather === 'storm') {
        ctx.fillStyle = 'rgba(130, 190, 255, 0.35)';
        var dropCount = Math.round(28 * (game.vfxIntensity || 1));
        for (var dr = 0; dr < dropCount; dr++) {
            var rx = ((dr * 37 + Math.floor(game.gameTime * 260)) % VW);
            var ry = ((dr * 53 + Math.floor(game.gameTime * 420)) % VH);
            ctx.fillRect(rx, ry, 1, 6);
        }
        if (Math.floor(game.gameTime * 11) % 47 === 0) {
            ctx.fillStyle = 'rgba(220, 240, 255, 0.22)';
            ctx.fillRect(0, 0, VW, VH);
        }
    } else if (level.weather === 'night') {
        ctx.fillStyle = 'rgba(6, 10, 28, 0.22)';
        ctx.fillRect(0, 0, VW, VH);
    }

    for (var k = 0; k < game.popups.length; k++) {
        var pop = game.popups[k];
        Mario.Font.draw(ctx, pop.text, pop.x - vX, pop.y - vY, {
            color: pop.color,
            scale: 1
        });
    }

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    Mario.HUD.draw(ctx, game);

    if (game.state === 'paused') renderPause();
    if (game.state === 'gameover') renderGameOver();
    if (game.state === 'levelclear') renderLevelClear();
    if (game.state === 'victory') renderVictory();
}

function dim(alpha) {
    ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
    ctx.fillRect(0, 0, VW, VH);
}

function renderPause() {
    dim(0.58);
    Mario.Font.drawCentered(ctx, 'ПАУЗА', VW / 2, VH / 2 - 42, { scale: 2, color: '#ffffff' });
    Mario.Font.drawCentered(ctx, 'ENTER - ПРОДОЛЖИТЬ   O - ФОТО-РЕЖИМ', VW / 2, VH / 2 - 14, { scale: 1, color: '#8ef7ff' });
    Mario.Font.drawCentered(ctx, 'Z - СУПЕР   X - ПАРИР/ДОБИВАНИЕ   C - ОРУЖИЕ/УЛЬТА', VW / 2, VH / 2, { scale: 1, color: '#ffe000' });
    Mario.Font.drawCentered(ctx, 'T - COMBO НАПАРНИКА   R - ПЕРЕЗАРЯДКА   V - ТЕХНИКА', VW / 2, VH / 2 + 14, { scale: 1, color: '#48ff78' });
    Mario.Font.drawCentered(ctx, 'Q / E - СМЕНА ГЕРОЯ (СОХРАНЕНИЕ КУЛДАУНОВ)', VW / 2, VH / 2 + 28, { scale: 1, color: '#ffffff' });
}

function renderGameOver() {
    dim(0.7);
    Mario.Font.drawCentered(ctx, 'ИГРА ОКОНЧЕНА', VW / 2, VH / 2 - 30, { scale: 2, color: '#ff6060' });
    Mario.Font.drawCentered(ctx, 'ОЧКИ: ' + game.score, VW / 2, VH / 2, { scale: 1, color: '#ffffff' });
    Mario.Font.drawCentered(ctx, 'ENTER - В МЕНЮ', VW / 2, VH / 2 + 20, { scale: 1, color: '#8ef7ff' });
}

function renderLevelClear() {
    var t = game.clearTally;
    if (!t) return;
    dim(0.6);
    Mario.Font.drawCentered(ctx, 'УРОВЕНЬ ' + (level ? level.name : '') + ' ПРОЙДЕН!', VW / 2, VH / 2 - 40, { scale: 2, color: '#ffe000' });
    Mario.Font.drawCentered(ctx, 'ВРЕМЯ: ' + t.time + '  X 50 = ' + t.points, VW / 2, VH / 2 - 8, { scale: 1, color: '#ffffff' });
    Mario.Font.drawCentered(ctx, 'ОЧКИ: ' + game.score, VW / 2, VH / 2 + 6, { scale: 1, color: '#ffffff' });
    if (t.done) {
        Mario.Font.drawCentered(ctx, 'ENTER - СЛЕДУЮЩИЙ УРОВЕНЬ', VW / 2, VH / 2 + 26, { scale: 1, color: '#8ef7ff' });
    }
}

function renderVictory() {
    dim(0.75);
    Mario.Font.drawCentered(ctx, 'ПОБЕДА!', VW / 2, VH / 2 - 44, { scale: 3, color: '#ffe000', shadowColor: '#a02000' });
    Mario.Font.drawCentered(ctx, 'ВСЕ 10 УРОВНЕЙ ПРОЙДЕНЫ!', VW / 2, VH / 2, { scale: 1, color: '#ffffff' });
    Mario.Font.drawCentered(ctx, 'ОЧКИ: ' + game.score, VW / 2, VH / 2 + 16, { scale: 1, color: '#ffffff' });
    Mario.Font.drawCentered(ctx, 'ENTER - В МЕНЮ', VW / 2, VH / 2 + 34, { scale: 1, color: '#8ef7ff' });
}

var titleSprites = null;

function getTitleSprites() {
    if (titleSprites) return titleSprites;
    titleSprites = {
        cloud: new Mario.Sprite('sprites/tiles.png', [0, 320], [48, 32], 0),
        ground: new Mario.Sprite('sprites/tiles.png', [0, 0], [16, 16], 0),
        hill: new Mario.Sprite('sprites/tiles.png', [128, 128], [16, 16], 0),
        hill2: new Mario.Sprite('sprites/tiles.png', [144, 128], [16, 16], 0),
        hill3: new Mario.Sprite('sprites/tiles.png', [128, 144], [16, 16], 0),
        hill4: new Mario.Sprite('sprites/tiles.png', [144, 144], [16, 16], 0),
        goomba: new Mario.Sprite('sprites/enemy.png', [0, 16], [16, 16], 3, [0, 1]),
        coin: new Mario.Sprite('sprites/items.png', [0, 112], [16, 16], 20, [0, 1, 2, 3])
    };
    return titleSprites;
}

function renderTitle() {
    var s = getTitleSprites();
    ctx.fillStyle = '#14244a';
    ctx.fillRect(0, 0, VW, VH);

    var groundY = VH - 32;

    [[6, 30], [58, 46], [VW - 74, 32], [VW - 40, 50], [150, 96]].forEach(function (c) {
        s.cloud.render(ctx, c[0], c[1], 0, 0);
    });

    [20, 110, 210, 300, 380].forEach(function (x) {
        var y = groundY - 16;
        s.hill.render(ctx, x, y, 0, 0);
        s.hill2.render(ctx, x + 16, y, 0, 0);
        s.hill3.render(ctx, x + 16, y - 16, 0, 0);
        s.hill4.render(ctx, x + 32, y, 0, 0);
    });

    for (var g = 0; g < VW / 16 + 1; g++) {
        s.ground.render(ctx, g * 16, groundY, 0, 0);
        s.ground.render(ctx, g * 16, groundY + 16, 0, 0);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.fillRect(20, 10, VW - 40, 62);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(20, 10, VW - 40, 1);
    Mario.Font.drawCentered(ctx, 'СУПЕР МАРИО: ЭКШЕН V4', VW / 2, 16, {
        scale: 2, color: '#ffe000', shadowColor: '#a02000'
    });
    Mario.Font.drawCentered(ctx, 'MARVEL · DC ЛИГА СПРАВЕДЛИВОСТИ · ТЕРМИНАТОР', VW / 2, 38, {
        scale: 1, color: '#8ef7ff'
    });
    Mario.Font.drawCentered(ctx, 'Z/X/C-УЛЬТА · TEAM-UP (T) · ПЕРЕЗАРЯДКА (R) · 10 БОССОВ', VW / 2, 52, {
        scale: 1, color: '#ffffff'
    });

    var hero = (player && player.hero) ? player.hero : (Mario.Action ? Mario.Action.HEROES[0] : null);
    if (hero && Mario.Action) {
        var hSheet = Mario.Action.getHeroCanvas(hero);
        ctx.drawImage(hSheet, 0, 0, 24, 32, VW / 2 - 12, groundY - 32, 24, 32);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.fillRect(20, 80, VW - 40, 96);

    if (hero) {
        Mario.Font.drawCentered(ctx, '< Q / E > ГЕРОЙ: ' + hero.name, VW / 2, 86, {
            scale: 1, color: hero.color
        });
        Mario.Font.drawCentered(ctx, 'Z: ' + hero.zName + ' · X: ПАРИРОВАНИЕ · T: TEAM-UP', VW / 2, 98, {
            scale: 1, color: '#48ff78'
        });
    }

    if (Math.floor(game.gameTime * 2) % 2 === 0) {
        Mario.Font.drawCentered(ctx, 'НАЖМИТЕ ПРОБЕЛ ИЛИ ENTER ДЛЯ СТАРТА', VW / 2, 114, {
            scale: 1, color: '#ffe000'
        });
    }
    Mario.Font.drawCentered(ctx, 'Z - СУПЕР   X - ТАКТИКА   C - ОРУЖИЕ/УЛЬТА   R - ЗАРЯД', VW / 2, 130, {
        scale: 1, color: '#8ef7ff'
    });
    Mario.Font.drawCentered(ctx, 'T - НАПАРНИК   V - CAMRY 3.5 / ЗАХВАТ АВИАЦИИ', VW / 2, 142, {
        scale: 1, color: '#8ef7ff'
    });
    Mario.Font.drawCentered(ctx, 'РЕКОРД: ' + game.highScore + '   ОТКРЫТО МИРОВ: ' + game.unlockedLevelNum + '/10', VW / 2, 158, {
        scale: 1, color: '#ffffff'
    });
}

resources.onProgress(function (p) {
    var bar = document.getElementById('loading-bar');
    if (bar) bar.style.width = Math.round(p * 100) + '%';
});

resources.onReady(function () {
    var loader = document.getElementById('loading');
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
    init();
});

resources.load([
    'sprites/player.png',
    'sprites/enemy.png',
    'sprites/tiles.png',
    'sprites/items.png'
]);
