/*
 * Goomba v4: supports Elite Modifiers (SHIELD, ARMOR, TELEPORT, REGEN),
 * Elemental Statuses (burn, shock, freeze, wet, gas, bleed), Damage Weaknesses,
 * Ragdoll Knockback, and Finishers.
 */
(function () {
    window.Mario = window.Mario || {};

    var Goomba = Mario.Goomba = function (pos, sprite, eliteMod) {
        this.dying = 0;
        this.flipped = false;
        this.eliteMod = eliteMod || null; /* 'SHIELD' | 'ARMOR' | 'TELEPORT' | 'REGEN' */
        this.maxHp = this.eliteMod ? 4 : 1;
        this.hp = this.maxHp;
        this.shieldHp = this.eliteMod === 'SHIELD' ? 2 : 0;
        this.weakness = this.eliteMod === 'ARMOR' ? 'explosive' : (this.eliteMod === 'SHIELD' ? 'electric' : 'kinetic');
        this.mass = this.eliteMod ? 1.5 : 1.0;
        this.stunTimer = 0;
        this.slowTimer = 0;
        this.panicTimer = 0;
        this.dotTimer = 0;
        this.freezeTimer = 0;
        this.wetTimer = 0;
        this.gasTimer = 0;
        this.tpCooldown = 0;

        Mario.Entity.call(this, {
            pos: pos,
            sprite: sprite,
            hitbox: [0, 0, 16, 16]
        });
        this.vel[0] = -0.5;
    };

    Mario.Util.inherits(Goomba, Mario.Entity);

    Goomba.prototype.update = function (dt, vX) {
        var viewW = (typeof VW !== 'undefined') ? VW : 432;
        if (this.pos[0] - vX > viewW + 48) {
            return;
        } else if (this.pos[0] - vX < -48) {
            this.remove();
            return;
        }

        if (this.dying) {
            if (--this.dying <= 0) this.remove();
            return;
        }

        if (this.flipped) {
            this.vel[1] += 0.22;
            this.pos[0] += this.vel[0];
            this.pos[1] += this.vel[1];
            if (this.pos[1] > 260) this.remove();
            return;
        }

        if (this.wetTimer > 0) this.wetTimer = Math.max(0, this.wetTimer - dt);
        if (this.gasTimer > 0) this.gasTimer = Math.max(0, this.gasTimer - dt);
        if (this.tpCooldown > 0) this.tpCooldown = Math.max(0, this.tpCooldown - dt);

        /* Элитный модификатор ЛЕЧЕНИЕ (REGEN), если враг не горит и не заморожен */
        if (this.eliteMod === 'REGEN' && this.dotTimer <= 0 && this.freezeTimer <= 0 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + dt * 0.45);
        }

        /* Горение / кровотечение */
        if (this.dotTimer > 0) {
            this.dotTimer -= dt;
            this.hp -= dt * 1.4;
            if (this.hp <= 0) {
                this.bump();
                return;
            }
        }

        /* Заморозка / Оглушение */
        if (this.freezeTimer > 0 || this.stunTimer > 0) {
            this.freezeTimer = Math.max(0, this.freezeTimer - dt);
            this.stunTimer = Math.max(0, this.stunTimer - dt);
            this.acc[1] = 0.2;
            this.vel[1] += this.acc[1];
            this.pos[1] += this.vel[1];
            return;
        }

        /* Элитный модификатор ТЕЛЕПОРТ */
        if (this.eliteMod === 'TELEPORT' && this.tpCooldown <= 0 && typeof player !== 'undefined' && player) {
            var distP = player.pos[0] - this.pos[0];
            if (Math.abs(distP) < 56 && Math.abs(distP) > 16) {
                this.tpCooldown = 3.5;
                this.pos[0] += (distP > 0 ? -36 : 36);
                if (window.game) window.game.popup('БЛИНК!', this.pos[0], this.pos[1] - 10, '#b458ff');
            }
        }

        if (this.panicTimer > 0) {
            this.panicTimer = Math.max(0, this.panicTimer - dt);
            if (Math.floor(this.panicTimer * 10) % 2 === 0) {
                this.vel[0] = (this.vel[0] >= 0 ? 1 : -1) * 1.1;
            }
        }

        var speedScale = this.slowTimer > 0 ? 0.35 : 1.0;
        if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);

        this.acc[1] = 0.2;
        this.vel[1] += this.acc[1];
        this.pos[0] += this.vel[0] * speedScale;
        this.pos[1] += this.vel[1];
        this.sprite.update(dt * speedScale);
    };

    Goomba.prototype.render = function (ctx, vX, vY) {
        Mario.Entity.prototype.render.call(this, ctx, vX, vY);
        var dx = Math.round(this.pos[0] - vX);
        var dy = Math.round(this.pos[1] - vY);
        if (this.shieldHp > 0) {
            ctx.fillStyle = 'rgba(80, 220, 255, 0.45)';
            ctx.fillRect(dx - 2, dy - 2, 20, 20);
        } else if (this.freezeTimer > 0) {
            ctx.fillStyle = 'rgba(120, 240, 255, 0.55)';
            ctx.fillRect(dx, dy, 16, 16);
        } else if (this.dotTimer > 0) {
            ctx.fillStyle = '#ff5820';
            ctx.fillRect(dx + 4, dy - 3, 8, 3);
        }
        if (this.eliteMod && !this.flipped && !this.dying) {
            ctx.fillStyle = this.eliteMod === 'ARMOR' ? '#ffd83d' : (this.eliteMod === 'REGEN' ? '#48ff78' : '#b458ff');
            ctx.fillRect(dx + 2, dy - 4, Math.max(2, Math.round(12 * (this.hp / this.maxHp))), 2);
        }
    };

    Goomba.prototype.collideWall = function () {
        this.vel[0] = -this.vel[0];
    };

    Goomba.prototype.checkCollisions = function () {
        if (this.flipped || this.dying || !this.collideTerrain(1)) return;

        var viewW = (typeof VW !== 'undefined') ? VW : 432;
        var enemies = level.enemies;
        for (var k = 0; k < enemies.length; k++) {
            var enemy = enemies[k];
            if (!enemy || enemy === this || enemy.dead || enemy.flipped) continue;
            if (enemy.pos[0] - vX > viewW + 32) continue;
            this.isCollideWith(enemy);
        }
        this.isCollideWith(player);
        Mario.Util.checkSupport(this);
    };

    Goomba.prototype.isCollideWith = function (ent) {
        if (ent instanceof Mario.Player && (this.dying || ent.invincibility)) return;
        if (this.flipped) return;

        var hb = this.hitbox, ehb = ent.hitbox;
        var ax = this.pos[0] + hb[0], ay = this.pos[1] + hb[1];
        var bx = ent.pos[0] + ehb[0], by = ent.pos[1] + ehb[1];

        if (!Mario.Util.overlap(ax, ay, hb[2], hb[3], bx, by, ehb[2], ehb[3])) return;

        if (ent instanceof Mario.Player) {
            if (ent.parryTimer > 0) {
                ent.onParrySuccess(this);
                return;
            }
            var feet = ent.pos[1] + ehb[1] + ehb[3];
            if (ent.starTime || this.stunTimer > 0 || this.freezeTimer > 0) {
                this.bump();
            } else if (ent.vel[1] > 0 && feet <= this.pos[1] + 10) {
                this.stomp();
            } else {
                ent.damage();
            }
        } else {
            this.collideWall();
        }
    };

    Goomba.prototype.stomp = function () {
        Mario.Audio.play('stomp');
        player.bounce = true;
        if (this.shieldHp > 0) {
            this.shieldHp = 0;
            if (this.game) this.game.popup('ЩИТ СБИТ!', this.pos[0], this.pos[1] - 10, '#68e8ff');
            return;
        }
        this.hp -= 2;
        if (this.hp > 0) {
            this.stunTimer = 1.0;
            return;
        }
        this.sprite.pos[0] = 32;
        this.sprite.frames = [0];
        this.sprite.speed = 0;
        this.vel[0] = 0;
        this.dying = 10;
        if (this.game) this.game.addStompScore(this.pos[0], this.pos[1]);
    };

    Goomba.prototype.applyImpulse = function (vx, vy, dmg, opts) {
        if (this.flipped || this.dying) return;
        this.hitByWeapon(dmg, { vx: vx, vy: vy, dmgType: opts && opts.dmgType, stun: opts && opts.stun });
    };

    Goomba.prototype.hitByWeapon = function (dmg, opts) {
        if (this.flipped || this.dying) return;
        opts = opts || {};
        if (opts.wet) this.wetTimer = 4.0;
        if (opts.gas) this.gasTimer = 4.0;
        if (opts.freeze) this.freezeTimer = Math.max(this.freezeTimer, opts.freeze);
        if (opts.stun) this.stunTimer = Math.max(this.stunTimer, opts.stun);
        if (opts.slow) this.slowTimer = Math.max(this.slowTimer, opts.slow);
        if (opts.panic) this.panicTimer = Math.max(this.panicTimer, opts.panic);
        if (opts.bleed || opts.burn) this.dotTimer = 2.0;

        var finalDmg = dmg || 1;
        if (opts.dmgType && opts.dmgType === this.weakness) finalDmg *= 1.75;
        if (this.eliteMod === 'ARMOR' && opts.dmgType !== 'explosive') finalDmg *= 0.6;

        if (this.shieldHp > 0) {
            this.shieldHp -= (opts.dmgType === 'electric' || opts.emp) ? 2 : 1;
            if (window.game) window.game.popup('ЩИТ!', this.pos[0], this.pos[1] - 10, '#68e8ff');
            if (this.shieldHp > 0) return;
        }

        this.hp -= finalDmg;
        if (window.game && window.game.registerCombatHit) {
            window.game.registerCombatHit(this, finalDmg, false, opts.dmgType === this.weakness);
        }
        if (this.hp <= 0) {
            this.bump(opts.vx || 0, opts.vy || -3.2);
        } else {
            this.pos[0] += (opts.vx || 0) * 1.5;
        }
    };

    Goomba.prototype.bump = function (vx, vy) {
        if (this.flipped) return;
        Mario.Audio.play('kick');
        this.sprite.flipV = true;
        this.flipped = true;
        this.pos[1] -= 2;
        this.vel[0] = typeof vx === 'number' ? vx : 0;
        this.vel[1] = typeof vy === 'number' ? vy : -3.0;
        if (this.game) {
            this.game.addScore(this.eliteMod ? 300 : 100);
        }
    };
})();
