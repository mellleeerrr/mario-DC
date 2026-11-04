/*
 * Player (Mario): physics, variable jump, crouching, power states, AK-47 & Camry XSE 3.5 integration.
 */
(function () {
    window.Mario = window.Mario || {};

    var WALK_MAX = 1.5625;
    var RUN_MAX = 2.5625;
    var WALK_ACC = 0.055;
    var RUN_ACC = 0.09;
    var FRICTION = 0.045;
    var SKID_DECEL = 0.13;

    var GRAVITY = 0.25;
    var JUMP_VELOCITY = 6.0;
    var JUMP_CUT = 0.45;
    var BOUNCE_VELOCITY = 4.0;

    var Player = Mario.Player = function (pos) {
        this.power = 0;
        this.coins = 0;
        this.score = 0;
        this.lives = 3;
        this.powering = [];
        this.bounce = false;
        this.jumping = 0;
        this.canJump = true;
        this.invincibility = 0;
        this.starTime = 0;
        this.crouching = false;
        this.fireballs = 0;
        this.runheld = false;
        this.noInput = false;
        this.targetPos = [];
        this.skidding = false;
        this.facingLeft = false;
        this.shooting = 0;
        this.rifleTime = 0;
        this.rifleCooldown = 0;
        this.car = null;
        this.inCar = false;
        this.aircraft = null;
        this.inAircraft = false;
        this.heroIndex = 0;
        this.hero = (Mario.Action && Mario.Action.HEROES) ? Mario.Action.HEROES[0] : null;
        this.heroStates = {};
        this.animTick = 0;
        this.animState = 'idle';
        this.hp = 100;
        this.maxHp = 100;
        this.armor = 25;
        this.maxArmor = 100;
        this.energy = 100;
        this.maxEnergy = 100;
        this.zCooldown = 0;
        this.zMaxCooldown = 6;
        this.xCooldown = 0;
        this.xMaxCooldown = 3.5;
        this.teamUpCooldown = 0;
        this.teamUpMaxCooldown = 9;
        this.reloadCooldown = 0;
        this.ultCharge = 0;
        this.parryTimer = 0;
        this.masteryRank = 1;
        this.abilityAnimTimer = 0;
        this.hitAnimTimer = 0;

        this.maxSpeed = WALK_MAX;
        this.moveAcc = WALK_ACC;

        Mario.Entity.call(this, {
            pos: pos,
            sprite: new Mario.Sprite('sprites/player.png', [80, 32], [16, 16], 0),
            hitbox: [0, 0, 16, 16]
        });
    };

    Mario.Util.inherits(Player, Mario.Entity);

    Player.prototype.syncHeroState = function () {
        if (!this.hero) return;
        this.heroStates[this.hero.id] = {
            zCd: this.zCooldown,
            zMaxCd: this.zMaxCooldown,
            xCd: this.xCooldown,
            energy: this.energy,
            rank: this.masteryRank || 1
        };
    };

    Player.prototype.setHero = function (idOrIdx) {
        if (!Mario.Action) return;
        if (this.hero) {
            this.syncHeroState();
        }
        var h = Mario.Action.getHero(idOrIdx);
        if (!h) return;
        this.hero = h;
        this.heroIndex = h.index || 0;
        var st = this.heroStates[h.id];
        if (st) {
            this.zCooldown = st.zCd || 0;
            this.zMaxCooldown = st.zMaxCd || h.zCooldown || 6;
            this.xCooldown = st.xCd || 0;
            this.energy = st.energy !== undefined ? st.energy : 100;
            this.masteryRank = st.rank || 1;
        } else {
            this.zCooldown = 0;
            this.zMaxCooldown = h.zCooldown || 6;
            this.xCooldown = 0;
            this.energy = this.maxEnergy || 100;
            this.masteryRank = 1;
            this.syncHeroState();
        }
        var sm = h.speedMul || 1;
        this.maxSpeed = (this.runheld ? RUN_MAX : WALK_MAX) * sm;
        this.moveAcc = (this.runheld ? RUN_ACC : WALK_ACC) * sm;
    };

    /* Тикает кулдауны и регенерацию энергии КАЖДЫЙ кадр для активного героя и всех героев в запасе */
    Player.prototype.tickCooldowns = function (dt) {
        if (this.zCooldown > 0) this.zCooldown = Math.max(0, this.zCooldown - dt);
        if (this.xCooldown > 0) this.xCooldown = Math.max(0, this.xCooldown - dt);
        if (this.teamUpCooldown > 0) this.teamUpCooldown = Math.max(0, this.teamUpCooldown - dt);
        if (this.reloadCooldown > 0) this.reloadCooldown = Math.max(0, this.reloadCooldown - dt);
        if (this.parryTimer > 0) this.parryTimer = Math.max(0, this.parryTimer - dt);
        if (this.abilityAnimTimer > 0) this.abilityAnimTimer = Math.max(0, this.abilityAnimTimer - dt);
        if (this.hitAnimTimer > 0) this.hitAnimTimer = Math.max(0, this.hitAnimTimer - dt);

        var weather = (typeof level !== 'undefined' && level && level.weather) ? level.weather : 'clear';
        var regenRate = (weather === 'clear') ? 11.5 : 9.5;
        if (this.energy < this.maxEnergy) {
            this.energy = Math.min(this.maxEnergy, this.energy + dt * regenRate);
        }
        this.syncHeroState();

        for (var hid in this.heroStates) {
            if (!this.hero || hid === this.hero.id) continue;
            var s = this.heroStates[hid];
            if (s.zCd > 0) s.zCd = Math.max(0, s.zCd - dt);
            if (s.xCd > 0) s.xCd = Math.max(0, s.xCd - dt);
            if (s.energy < 100) s.energy = Math.min(100, s.energy + dt * 10);
        }
    };

    /* Активная перезарядка оружия и ускорение кулдаунов по клавише R в бою */
    Player.prototype.reload = function () {
        this.rifleCooldown = 0;
        if (this.reloadCooldown > 0) {
            if (this.game) this.game.popup('ОРУЖИЕ ГОТОВО!', this.pos[0], this.pos[1] - 14, '#8ef7ff');
            return false;
        }
        this.reloadCooldown = 2.0;
        this.zCooldown = Math.max(0, this.zCooldown - 1.5);
        this.xCooldown = Math.max(0, this.xCooldown - 1.5);
        this.energy = Math.min(this.maxEnergy, this.energy + 25);
        this.syncHeroState();
        Mario.Audio.play('powerup');
        if (this.game) {
            this.game.popup('ПЕРЕЗАРЯДКА! -1.5С КД +25 EN', this.pos[0] - 12, this.pos[1] - 18, '#48ff78');
        }
        return true;
    };

    Player.prototype.useAbility = function () {
        if (!Mario.AbilityManager) return false;
        return Mario.AbilityManager.activate(this);
    };

    Player.prototype.useTacticalX = function () {
        if (!Mario.AbilityManager) return false;
        return Mario.AbilityManager.activateTacticalX(this);
    };

    Player.prototype.useUltimateC = function () {
        if (!Mario.AbilityManager) return false;
        return Mario.AbilityManager.activateUltimateC(this);
    };

    Player.prototype.useTeamUp = function () {
        if (!Mario.AbilityManager) return false;
        return Mario.AbilityManager.activateTeamUp(this);
    };

    Player.prototype.onParrySuccess = function (attacker) {
        this.parryTimer = 0;
        this.invincibility = Math.max(this.invincibility, 45);
        this.xCooldown = 0;
        this.ultCharge = Math.min(100, (this.ultCharge || 0) + 25);
        this.energy = Math.min(this.maxEnergy, this.energy + 20);
        this.syncHeroState();
        Mario.Audio.playAbility('emp');
        if (this.game) {
            this.game.hitstopTimer = 0.06;
            this.game.shake(3.0, 0.18);
            this.game.popup('ПАРИРОВАНИЕ! +25% УЛЬТА', this.pos[0] - 12, this.pos[1] - 20, '#68e8ff');
        }
        if (attacker && attacker.hitByWeapon) {
            attacker.hitByWeapon(4.0, { stun: 2.8, crit: true, vx: (this.left ? -3.5 : 3.5), vy: -3.0 });
        }
    };

    Player.prototype.render = function (ctx, vX, vY) {
        var hero = this.hero;
        var isCustomHero = hero && hero.id !== 'MARIO' && Mario.Action;

        if (!this.inCar && !this.inAircraft) {
            if (this.parryTimer > 0) {
                var pxShield = Math.round(this.pos[0] - vX - 4);
                var pyShield = Math.round(this.pos[1] - vY - 4);
                ctx.fillStyle = 'rgba(104, 232, 255, 0.38)';
                ctx.fillRect(pxShield, pyShield, 24, this.hitbox[3] + 8);
            }
            if (isCustomHero) {
                var sheet = Mario.Action.getHeroCanvas(hero);
                var frame = 0;
                if (this.abilityAnimTimer > 0 || this.animState === 'ability') {
                    frame = 2;
                } else if (!this.standing || (Math.abs(this.vel[0]) > 0.1 && Math.floor(this.animTick * 10) % 2 === 1)) {
                    frame = 1;
                }
                var sx = frame * 24;
                var feetY = Math.round(this.pos[1] - vY + this.hitbox[3]);
                var drawH = this.crouching ? 22 : 32;
                var dx = Math.round(this.pos[0] - vX - 4);
                var dy = feetY - drawH;

                ctx.save();
                if (this.left) {
                    ctx.translate(dx + 24, dy);
                    ctx.scale(-1, 1);
                    ctx.drawImage(sheet, sx, 0, 24, 32, 0, 0, 24, drawH);
                } else {
                    ctx.drawImage(sheet, sx, 0, 24, 32, dx, dy, 24, drawH);
                }
                ctx.restore();
            } else {
                Mario.Entity.prototype.render.call(this, ctx, vX, vY);
            }
        }

        if (this.rifleTime > 0 && !this.inAircraft) {
            var rx = Math.round(this.pos[0] - vX);
            var ry = Math.round(this.pos[1] - vY + (this.inCar ? 18 : (this.power > 0 && !this.crouching ? 10 : 2)));
            var showGun = !isCustomHero || hero.id === 'TERMINATOR' || hero.id === 'DEADPOOL' || hero.id === 'HARLEY';
            var isUp = this.aimUpTime > 0;
            if (showGun) {
                var img = Mario.Extras.rifleCanvas();
                ctx.save();
                if (this.left) {
                    ctx.translate(rx + 12, ry + 6);
                    ctx.scale(-1, 1);
                    if (isUp) ctx.rotate(-Math.PI / 3); /* 120° влево (60° вверх-влево) */
                    ctx.drawImage(img, -10, -6);
                } else {
                    ctx.translate(rx + 4, ry + 6);
                    if (isUp) ctx.rotate(-Math.PI / 3); /* 60° вправо (60° вверх-вправо) */
                    ctx.drawImage(img, -10, -6);
                }
                ctx.restore();
            }
            if (this.rifleTime > 9) {
                var fx = isUp ? (this.left ? rx - 6 : rx + 14) : (this.left ? rx - 10 : rx + 20);
                var fy = isUp ? (ry - 10) : (ry + 2);
                ctx.fillStyle = (hero && hero.color) ? hero.color : '#fff8c4';
                ctx.fillRect(fx, fy, 6, 5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(fx + (this.left ? 2 : 1), fy + 1, 3, 3);
            }
        }
    };

    Player.prototype.run = function () {
        var sm = (this.hero && this.hero.speedMul) ? this.hero.speedMul : 1;
        this.maxSpeed = RUN_MAX * sm;
        this.moveAcc = RUN_ACC * sm;
        if (this.power === 2 && !this.runheld) {
            this.shoot();
        }
        this.runheld = true;
    };

    Player.prototype.noRun = function () {
        var sm = (this.hero && this.hero.speedMul) ? this.hero.speedMul : 1;
        this.maxSpeed = WALK_MAX * sm;
        this.moveAcc = WALK_ACC * sm;
        this.runheld = false;
    };

    Player.prototype.shoot = function () {
        if (this.fireballs >= 2) return;
        this.fireballs += 1;
        var fb = new Mario.Fireball([this.pos[0] + 8, this.pos[1] + (this.power > 0 ? 8 : 0)]);
        var aimUp = !!(Mario.Input && Mario.Input.isDown('UP'));
        fb.spawn(this.left, aimUp);
        this.shooting = 2;
    };

    Player.prototype.shoot47 = function (aimUpOverride) {
        if (this.ultCharge >= 100 && !this.inCar && !this.inAircraft) {
            if (this.useUltimateC()) return;
        }
        if (this.rifleCooldown > 0) return;
        var hero = this.hero;
        var aimUp = (aimUpOverride !== undefined)
            ? !!aimUpOverride
            : (!this.inAircraft && !!(Mario.Input && Mario.Input.isDown('UP')));
        this.rifleCooldown = (hero && hero.fireRate) ? hero.fireRate : 7;
        this.rifleTime = 14;
        this.aimUpTime = aimUp ? 14 : 0;
        var by = this.pos[1] + (this.inCar ? 18 : ((this.power > 0 || (hero && hero.id !== 'MARIO')) && !this.crouching ? 6 : 4));
        if (aimUp) by -= 6;
        var bx = this.pos[0] + (this.left ? -8 : 14);
        if (hero && hero.id !== 'MARIO' && Mario.HeroProjectile) {
            var hpProj = new Mario.HeroProjectile([bx, by], this.left, hero, aimUp);
            if (this.inAircraft) {
                hpProj.damage *= 1.8;
                hpProj.explosiveRadius = 28;
            }
            bullets.push(hpProj);
        } else {
            bullets.push(new Mario.Bullet([bx, by], this.left, aimUp));
        }
        if (this.game && this.game.shake) {
            this.game.shake(hero ? (hero.shake * 0.45) : 0.8, 0.08);
        }
        Mario.Audio.play('fireball');
    };

    Player.prototype.enterAircraft = function (ac) {
        if (!ac || this.inAircraft || this.piping || this.dying) return;
        if (this.inCar) this.exitCar();
        this.inAircraft = true;
        this.aircraft = ac;
        ac.pilot = this;
        ac.stunTimer = 0;
        ac.hp = Math.max(ac.hp, ac.maxHp || 4);
        this.vel = [0, 0];
        this.acc = [0, 0];
        this.jumping = 0;
        Mario.Audio.play('powerup');
        if (this.game) {
            var label = (ac instanceof Mario.Jet) ? 'ИСТРЕБИТЕЛЬ ЗАХВАЧЕН! (WASD/C/X)' : 'ВЕРТОЛЁТ ЗАХВАЧЕН! (WASD/C/X)';
            this.game.popup(label, ac.pos[0] - 8, ac.pos[1] - 12, '#48ff78');
        }
    };

    Player.prototype.exitAircraft = function () {
        if (!this.inAircraft) return;
        var ac = this.aircraft;
        this.inAircraft = false;
        this.aircraft = null;
        if (ac) {
            ac.pilot = null;
            this.pos[0] = Math.round(ac.pos[0] + 12);
            this.pos[1] = Math.min(184, Math.round(ac.pos[1] + 16));
        }
        this.vel = [0, -3.5];
        this.acc = [0, 0];
        this.invincibility = Math.max(this.invincibility, 45);
    };

    Player.prototype.enterCar = function (car) {
        if (!car || this.inCar || this.piping || this.dying) return;
        if (this.inAircraft) this.exitAircraft();
        this.inCar = true;
        this.car = car;
        car.driver = this;
        car.left = this.left;
        car.sprite.flipH = this.left;
        if (this.noInput) {
            this.noInput = false;
            this.flagging = false;
        }
        if (this.crouching && this.power > 0) {
            this.crouching = false;
            this.pos[1] -= 16;
            this.hitbox = [0, 0, 16, 32];
            this.sprite.offsetY = 0;
        }
        this.vel = [0, 0];
        this.acc = [0, 0];
        this.jumping = 0;
        this.standing = car.standing;
        var carBottom = car.pos[1] + car.hitbox[1] + car.hitbox[3];
        this.pos[0] = car.pos[0] + car.hitbox[0] + car.hitbox[2] / 2 - 8;
        this.pos[1] = carBottom - this.hitbox[3];
        if (this.game) this.game.popup('CAMRY XSE 3.5!', car.pos[0] + 10, car.pos[1] - 10, '#ffe000');
    };

    Player.prototype.exitCar = function () {
        if (!this.inCar) return;
        var car = this.car;
        this.inCar = false;
        this.car = null;
        if (this.power > 0 && !this.crouching) {
            this.hitbox = [0, 0, 16, 32];
            this.sprite.size = [16, 32];
        } else {
            this.hitbox = [0, 0, 16, 16];
            this.sprite.size = [16, 16];
        }
        if (car) {
            car.driver = null;
            car.stop();
            var carBottom = car.pos[1] + car.hitbox[1] + car.hitbox[3];
            this.pos[0] = Math.round(car.pos[0] + car.hitbox[0] + car.hitbox[2] / 2 - 8);
            this.pos[1] = Math.round(carBottom - this.hitbox[3]);
            this.standing = car.standing;
        }
        this.vel = [0, 0];
        this.acc = [0, 0];
        this.jumping = 0;
        if (this.noInput) {
            this.noInput = false;
            this.flagging = false;
        }
    };

    Player.prototype.moveRight = function () {
        if (this.crouching && this.standing) {
            this.noWalk();
            return;
        }
        this.acc[0] = this.moveAcc;
        this.left = false;
        this.facingLeft = false;
    };

    Player.prototype.moveLeft = function () {
        if (this.crouching && this.standing) {
            this.noWalk();
            return;
        }
        this.acc[0] = -this.moveAcc;
        this.left = true;
        this.facingLeft = true;
    };

    Player.prototype.noWalk = function () {
        this.acc[0] = 0;
    };

    Player.prototype.crouch = function () {
        if (this.power === 0) {
            this.crouching = false;
            return;
        }
        if (!this.standing || this.crouching) return;
        this.crouching = true;
        this.pos[1] += 16;
        this.hitbox = [0, 0, 16, 16];
        this.sprite.offsetY = -16;
    };

    Player.prototype.noCrouch = function () {
        if (!this.crouching) return;
        var baseX = Math.floor(this.pos[0] / 16);
        var baseY = Math.floor((this.pos[1] - 16) / 16);
        for (var i = 0; i < 2; i++) {
            for (var j = -1; j <= 1; j++) {
                if (this.blockedAt(baseX + j, baseY + i)) return;
            }
        }
        this.crouching = false;
        this.pos[1] -= 16;
        this.hitbox = [0, 0, 16, 32];
        this.sprite.offsetY = 0;
    };

    Player.prototype.blockedAt = function (tileX, tileY) {
        if (tileY < 0 || tileY > 14 || tileX < 0) return false;
        return !!(level.statics[tileY][tileX] || level.blocks[tileY][tileX]);
    };

    Player.prototype.jump = function () {
        if (this.jumping > 0 || !this.standing || !this.canJump || this.crouching) return;

        var jm = (this.hero && this.hero.jumpMul) ? (0.9 + this.hero.jumpMul * 0.1) : 1;
        this.jumping = 1;
        this.canJump = false;
        this.standing = false;
        this.vel[1] = -JUMP_VELOCITY * jm;
        this.skidding = false;

        Mario.Audio.play(this.power === 0 ? 'smallJump' : 'bigJump');
    };

    Player.prototype.noJump = function () {
        this.canJump = true;
        if (this.jumping && this.vel[1] < 0) {
            this.vel[1] *= JUMP_CUT;
        }
        this.jumping = 0;
    };

    Player.prototype.setAnimation = function () {
        if (this.dying) return;

        var row = this.power === 0 ? 32 : (this.power === 2 ? 96 : 0);

        if (this.starTime) {
            var index = this.starTime > 60
                ? Math.floor(this.starTime / 2) % 3
                : Math.floor(this.starTime / 8) % 3;
            this.sprite.pos[1] = level.invincibility[index] + (this.power === 0 ? 32 : 0);
            this.starTime -= 1;
            if (this.starTime === 0) this.sprite.pos[1] = row;
        } else {
            this.sprite.pos[1] = row;
        }

        if (this.crouching) {
            this.sprite.pos[0] = 176;
            this.sprite.speed = 0;
            this.sprite.frames = [0];
            this.sprite.flipH = this.left;
            this.sprite.flipV = false;
            return;
        }

        if (this.jumping) {
            this.sprite.pos[0] = 160;
            this.sprite.speed = 0;
            this.sprite.frames = [0];
        } else if (this.standing) {
            if (this.skidding) {
                this.sprite.pos[0] = 144;
                this.sprite.speed = 0;
                this.sprite.frames = [0];
            } else if (Math.abs(this.vel[0]) > 0.05) {
                if (this.vel[0] * this.acc[0] >= 0 || this.acc[0] === 0) {
                    this.sprite.pos[0] = 96;
                    this.sprite.frames = [0, 1, 2];
                    this.sprite.speed = Math.abs(this.vel[0]) < 0.25 ? 5 : Math.abs(this.vel[0]) * 8;
                } else {
                    this.sprite.pos[0] = 144;
                    this.sprite.speed = 0;
                    this.sprite.frames = [0];
                }
            } else {
                this.sprite.pos[0] = 80;
                this.sprite.speed = 0;
                this.sprite.frames = [0];
            }
            if (this.shooting) {
                this.sprite.pos[0] += 160;
                this.shooting -= 1;
            }
        }

        if (this.flagging) {
            this.sprite.pos[0] = 192;
            this.sprite.frames = this.vel[1] === 0 ? [0] : [0, 1];
            this.sprite.speed = 10;
        }

        this.sprite.flipH = this.left;
        this.sprite.flipV = false;
    };

    Player.prototype.update = function (dt, vX) {
        this.animTick += dt;
        if (this.rifleTime > 0) this.rifleTime -= 1;
        if (this.aimUpTime > 0) this.aimUpTime -= 1;
        if (this.rifleCooldown > 0) this.rifleCooldown -= 1;
        if (this.inCar || this.inAircraft) return;

        if (this.powering.length !== 0) {
            var next = this.powering.shift();
            if (next === 5) return;
            this.sprite.pos = this.powerSprites[next];
            this.sprite.size = this.powerSizes[next];
            this.pos[1] += this.shift[next];
            if (this.powering.length === 0 && this.touchedItem) {
                this.touchedItem.remove();
                this.touchedItem = null;
            }
            return;
        }

        if (this.invincibility > 0) {
            this.invincibility = Math.max(0, this.invincibility - dt * 60);
        }

        if (this.waiting > 0) {
            this.waiting -= dt;
            if (this.waiting > 0) {
                this.setAnimation();
                this.sprite.update(dt);
                return;
            }
            this.waiting = 0;
        }

        if (this.bounce) {
            this.bounce = false;
            this.standing = false;
            this.vel[1] = -BOUNCE_VELOCITY;
        }

        if (this.pos[0] <= vX) {
            this.pos[0] = vX;
            this.vel[0] = Math.max(this.vel[0], 0);
        }

        if (this.standing && this.acc[0] !== 0 && this.vel[0] !== 0 &&
            (this.acc[0] > 0) !== (this.vel[0] > 0) && Math.abs(this.vel[0]) > 0.6) {
            if (!this.skidding) {
                this.skidding = true;
                Mario.Audio.play('skid', { volume: 0.5 });
            }
            this.vel[0] -= SKID_DECEL * (this.vel[0] > 0 ? 1 : -1);
            this.acc[0] = 0;
        } else {
            this.skidding = false;
        }

        if (Math.abs(this.vel[0]) > this.maxSpeed) {
            var over = Math.abs(this.vel[0]) - this.maxSpeed;
            this.vel[0] -= Math.sign(this.vel[0]) * Math.min(over, 0.08);
            this.acc[0] = 0;
        }

        if (this.dying) {
            if (this.pos[1] < this.targetPos[1]) {
                this.vel[1] = 1;
            }
            this.dying -= dt;
            if (this.dying <= 0) {
                this.game.onPlayerDeath();
            }
        } else {
            this.acc[1] = GRAVITY;
            if (this.pos[1] > 240) {
                this.die();
            }
        }

        if (this.piping) {
            this.acc = [0, 0];
            if (Math.round(this.pos[0]) === this.targetPos[0] && Math.round(this.pos[1]) === this.targetPos[1]) {
                this.piping = false;
                if (this.pipeLoc) this.pipeLoc.call(this);
            }
        }

        if (this.flagging) {
            this.acc = [0, 0];
        }

        if (this.exiting) {
            this.left = false;
            this.flagging = false;
            this.vel[0] = 1.5;
            if (this.pos[0] >= this.targetPos[0]) {
                this.sprite.size = [0, 0];
                this.vel = [0, 0];
                this.exiting = false;
                if (this.exitCallback) this.exitCallback();
            }
        }

        if (this.acc[0] === 0 && this.standing && Math.abs(this.vel[0]) > 0) {
            if (Math.abs(this.vel[0]) < FRICTION) this.vel[0] = 0;
            else this.vel[0] -= Math.sign(this.vel[0]) * FRICTION;
        }

        this.vel[0] += this.acc[0];
        this.vel[1] += this.acc[1];
        if (!this.dying && !this.piping && !this.standing && this.vel[1] > 1.25 &&
            this.hero && this.hero.glide && Mario.Input && Mario.Input.isDown('JUMP')) {
            this.vel[1] = 1.25;
        }
        this.pos[0] += this.vel[0];
        this.pos[1] += this.vel[1];

        if (this.jumping && this.vel[1] >= 0) {
            this.jumping = 0;
        }

        this.setAnimation();
        this.sprite.update(dt);
    };

    Player.prototype.checkCollisions = function () {
        if (this.piping || this.dying || this.exiting || this.flagging) return;

        var h = (this.power > 0 && !this.crouching ? 2 : 1) + (this.pos[1] % 16 !== 0 ? 1 : 0);
        var w = this.pos[0] % 16 !== 0 ? 2 : 1;

        var baseX = Math.floor(this.pos[0] / 16);
        var baseY = Math.floor(this.pos[1] / 16);

        for (var i = 0; i < h; i++) {
            var ty = baseY + i;
            if (ty < 0 || ty > 14) continue;
            for (var j = 0; j < w; j++) {
                var tx = baseX + j;
                if (tx < 0) continue;
                if (level.statics[ty][tx]) level.statics[ty][tx].isCollideWith(this);
                if (level.blocks[ty][tx]) level.blocks[ty][tx].isCollideWith(this);
            }
        }

        Mario.Util.checkSupport(this);
    };

    Player.prototype.powerUp = function (item) {
        if (item && item.oneUp) {
            this.oneUp(item);
            return;
        }
        Mario.Audio.play('powerup');
        this.touchedItem = item || null;
        this.powering = [0, 5, 2, 5, 1, 5, 2, 5, 1, 5, 2, 5, 3, 5, 1, 5, 2, 5, 3, 5, 1, 5, 4];
        this.addScore(1000);
        if (this.game) this.game.popup('1000', this.pos[0], this.pos[1] - 16, '#ffffff');

        if (this.power === 0) {
            this.powerSprites = [[80, 32], [80, 32], [320, 0], [80, 0], [128, 0]];
            this.powerSizes = [[16, 16], [16, 16], [16, 32], [16, 32], [16, 32]];
            this.shift = [0, 16, -16, 0, -16];
            this.power = 1;
            this.hitbox = [0, 0, 16, 32];
            this.sprite.size = [16, 16];
        } else if (this.power === 1) {
            var curx = this.sprite.pos[0];
            this.powerSprites = [
                [curx, 96],
                [curx, level.invincibility[0]],
                [curx, level.invincibility[1]],
                [curx, level.invincibility[2]],
                [curx, 96]
            ];
            this.powerSizes = [[16, 32], [16, 32], [16, 32], [16, 32], [16, 32]];
            this.shift = [0, 0, 0, 0, 0];
            this.power = 2;
        } else {
            this.powering = [];
            if (item) item.remove();
            this.touchedItem = null;
        }
    };

    Player.prototype.oneUp = function (item) {
        Mario.Audio.play('oneUp');
        this.addScore(1000);
        if (item) item.remove();
        if (this.game) this.game.addLife();
    };

    Player.prototype.addScore = function (n) {
        if (this.game && this.game.addScore) {
            this.game.addScore(n);
        } else {
            this.score += n;
        }
    };

    Player.prototype.takeExplosionDamage = function (amount) {
        if (this.starTime > 0 || this.invincibility > 0 || this.dying) return;
        var dmg = Math.max(5, amount || 20);
        if (this.armor > 0) {
            var absorbed = Math.min(this.armor, dmg);
            this.armor -= absorbed;
            dmg -= absorbed;
        }
        if (dmg > 0) {
            this.hp = Math.max(0, this.hp - dmg);
        }
        this.hitAnimTimer = 0.28;
        this.invincibility = 45;
        Mario.Audio.play('bump');
        if (this.hp <= 0) {
            this.die();
        }
    };

    Player.prototype.damage = function () {
        if (this.starTime > 0 || this.invincibility > 0) return;
        if (this.parryTimer > 0) {
            this.onParrySuccess(null);
            return;
        }
        if (this.inAircraft) {
            this.exitAircraft();
        }
        if (this.inCar) {
            this.exitCar();
        }
        if (this.power > 0) {
            Mario.Audio.play('pipe');
            this.powering = [0, 5, 1, 5, 2, 5, 1, 5, 2, 5, 1, 5, 2, 5, 1, 5, 2, 5, 1, 5, 2, 5, 3];
            this.shift = [0, 16, -16, 16];
            this.sprite.pos = [160, 0];
            this.powerSprites = [[160, 0], [240, 32], [240, 0], [160, 32]];
            this.powerSizes = [[16, 32], [16, 16], [16, 32], [16, 16]];
            this.invincibility = 120;
            this.hitAnimTimer = 0.35;
            this.power = 0;
            this.crouching = false;
            this.sprite.offsetY = 0;
            this.hitbox = [0, 0, 16, 16];
            this.sprite.size = [16, 16];
            return;
        }
        /* Броня и полоска HP поглощают удар до потери жизни */
        var hitDmg = 35;
        if (this.armor > 0) {
            var abs = Math.min(this.armor, hitDmg);
            this.armor -= abs;
            hitDmg -= abs;
        }
        this.hp -= hitDmg;
        if (this.hp > 0) {
            Mario.Audio.play('pipe');
            this.invincibility = 90;
            this.hitAnimTimer = 0.35;
            if (this.game) this.game.shake(2.5, 0.16);
        } else {
            this.hp = 0;
            this.die();
        }
    };

    Player.prototype.die = function () {
        if (this.dying) return;
        if (this.inAircraft) {
            this.exitAircraft();
        }
        if (this.inCar) {
            var c = this.car;
            this.inCar = false;
            this.car = null;
            if (c) {
                c.driver = null;
                c.dead = true;
            }
        }
        Mario.Audio.stopMusic();
        Mario.Audio.play('death');
        this.noWalk();
        this.noRun();
        this.jumping = 0;

        this.acc = [0, 0];
        this.sprite.pos = [176, 32];
        this.sprite.speed = 0;
        this.sprite.frames = [0];
        this.sprite.offsetY = 0;
        this.power = 0;
        this.crouching = false;
        this.hitbox = [0, 0, 16, 16];
        this.sprite.size = [16, 16];
        this.waiting = 0.5;
        this.dying = 2;
        this.starTime = 0;

        if (this.pos[1] < 240) {
            this.targetPos = [this.pos[0], this.pos[1] - 128];
            this.vel = [0, -5];
        } else {
            this.vel = [0, 0];
            this.targetPos = [this.pos[0], this.pos[1] - 16];
        }
    };

    Player.prototype.star = function (item) {
        if (item) item.remove();
        Mario.Audio.play('powerup');
        this.starTime = 660;
        this.invincibility = 0;
        this.addScore(1000);
        if (this.game) this.game.onStar();
    };

    Player.prototype.pipe = function (direction, destination) {
        Mario.Audio.play('pipe');
        this.piping = true;
        this.pipeLoc = destination;
        var p = [Math.round(this.pos[0]), Math.round(this.pos[1])];
        this.pos = [p[0], p[1]];
        switch (direction) {
            case 'LEFT':
                this.vel = [-1, 0];
                this.targetPos = [p[0] - 16, p[1]];
                break;
            case 'RIGHT':
                this.vel = [1, 0];
                this.targetPos = [p[0] + 16, p[1]];
                break;
            case 'DOWN':
                this.vel = [0, 1];
                this.targetPos = [p[0], p[1] + this.hitbox[3]];
                break;
            case 'UP':
                this.vel = [0, -1];
                this.targetPos = [p[0], p[1] - this.hitbox[3]];
                break;
        }
    };

    Player.prototype.flag = function () {
        if (this.inAircraft) this.exitAircraft();
        if (this.inCar) this.exitCar();
        this.noInput = true;
        this.flagging = true;
        this.vel = [0, 2];
        this.acc = [0, 0];
    };

    Player.prototype.exit = function () {
        this.pos[0] += 16;
        this.targetPos[0] = level.exit * 16;
        this.left = true;
        this.setAnimation();
        this.waiting = 1;
        this.exiting = true;
        this.exitCallback = function () {
            if (game.startLevelClear) game.startLevelClear();
        };
    };
})();
