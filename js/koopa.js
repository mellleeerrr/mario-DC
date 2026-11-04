/*
 * Koopa / Paratroopa.
 */
(function () {
    window.Mario = window.Mario || {};

    var Koopa = Mario.Koopa = function (pos, sprite, para) {
        this.dying = 0;
        this.shell = 0;
        this.flipped = false;
        this.para = !!para;
        this.mass = 1.4;
        this.stunTimer = 0;
        this.slowTimer = 0;
        this.panicTimer = 0;

        Mario.Entity.call(this, {
            pos: pos,
            sprite: sprite,
            hitbox: [2, 8, 12, 24]
        });
        this.vel[0] = -0.5;
    };

    Mario.Util.inherits(Koopa, Mario.Entity);

    Koopa.prototype.update = function (dt, vX) {
        if (this.turn) {
            this.vel[0] = -this.vel[0];
            if (this.shell) Mario.Audio.play('bump');
            this.turn = false;
        }

        if (this.vel[0] !== 0) {
            this.left = (this.vel[0] < 0);
        }
        /* В sprites/enemy.png черепаха нарисована лицом влево:
           при движении влево (left = true) flipH = false,
           при движении вправо (left = false) flipH = true. */
        this.sprite.flipH = !this.left;

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

        if (this.stunTimer > 0) {
            this.stunTimer = Math.max(0, this.stunTimer - dt);
            this.acc[1] = 0.2;
            this.vel[1] += this.acc[1];
            this.pos[1] += this.vel[1];
            return;
        }

        if (this.panicTimer > 0) {
            this.panicTimer = Math.max(0, this.panicTimer - dt);
        }

        var speedScale = this.slowTimer > 0 ? 0.35 : 1.0;
        if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);

        if (this.shell) {
            if (this.vel[0] === 0) {
                this.shell -= 1;
                if (this.shell < 120) this.sprite.speed = 5;
                if (this.shell === 0) {
                    this.sprite = level.koopaSprite();
                    this.hitbox = [2, 8, 12, 24];
                    this.sprite.size = [16, 32];
                    this.vel[0] = this.left ? -0.5 : 0.5;
                    this.sprite.flipH = !this.left;
                    this.pos[1] -= 16;
                }
            } else {
                this.shellTimer = (this.shellTimer || 0) + 1;
                if (this.shellTimer % 6 === 0) {
                    this.shell = 360;
                    this.sprite.speed = 0;
                    this.sprite.setFrame(0);
                }
            }
        }

        if (this.para && !this.shell) {
            this.vel[1] = 0;
            this.pos[1] += Math.sin((this.game ? this.game.gameTime : 0) * 3) * 0.15;
        } else {
            this.acc[1] = 0.2;
            this.vel[1] += this.acc[1];
        }

        this.pos[0] += this.vel[0] * speedScale;
        this.pos[1] += this.vel[1];
        this.sprite.update(dt * speedScale);
    };

    Koopa.prototype.collideWall = function () {
        this.turn = true;
    };

    Koopa.prototype.checkCollisions = function () {
        if (this.flipped || this.dying || !this.collideTerrain(this.shell ? 1 : 2)) return;

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

    Koopa.prototype.isCollideWith = function (ent) {
        if (ent instanceof Mario.Player && (this.dying || ent.invincibility)) return;
        if (this.flipped) return;

        var hb = this.hitbox, ehb = ent.hitbox;
        var ax = this.pos[0] + hb[0], ay = this.pos[1] + hb[1];
        var bx = ent.pos[0] + ehb[0], by = ent.pos[1] + ehb[1];

        if (!Mario.Util.overlap(ax, ay, hb[2], hb[3], bx, by, ehb[2], ehb[3])) return;

        if (ent instanceof Mario.Player) {
            if (ent.parryTimer > 0 && ent.onParrySuccess) {
                ent.onParrySuccess(this);
                return;
            }
            if (this.shell) {
                if (this.vel[0] === 0) {
                    Mario.Audio.play('kick');
                    this.vel[0] = ent.left ? -4 : 4;
                    this.shellTimer = 0;
                    this.shell = 360;
                    ent.bounce = true;
                } else if (ent.starTime || this.stunTimer > 0) {
                    this.bump();
                } else {
                    ent.damage();
                }
            } else {
                var feet = ent.pos[1] + ehb[1] + ehb[3];
                if (ent.starTime && ent.vel[1] > 0 && feet <= this.pos[1] + 14) {
                    this.stomp();
                } else if (ent.starTime || this.stunTimer > 0) {
                    this.bump();
                } else if (ent.vel[1] > 0 && feet <= this.pos[1] + 12) {
                    this.stomp();
                } else {
                    ent.damage();
                }
            }
        } else if (this.shell && this.vel[0] !== 0 && (ent instanceof Mario.Goomba || (ent instanceof Mario.Koopa && !ent.shell))) {
            ent.bump();
        } else {
            this.collideWall();
        }
    };

    Koopa.prototype.stomp = function () {
        if (!this.shell) {
            player.bounce = true;
            if (this.para) {
                this.para = false;
                this.sprite.pos[0] -= 32;
                this.sprite.size = [16, 32];
            } else {
                Mario.Audio.play('stomp');
                this.shell = 360;
                this.shellTimer = 0;
                this.sprite.pos[0] += 64;
                this.sprite.pos[1] += 16;
                this.sprite.size = [16, 16];
                this.sprite.speed = 0;
                this.sprite.frames = [0];
                this.hitbox = [2, 0, 12, 16];
                this.vel = [0, 0];
                this.pos[1] += 16;
            }
            if (this.game) this.game.addStompScore(this.pos[0], this.pos[1]);
        } else {
            this.vel[0] = 0;
            this.shellTimer = 0;
            player.bounce = true;
        }
    };

    Koopa.prototype.applyImpulse = function (vx, vy, dmg) {
        if (this.flipped || this.dying) return;
        if (window.game && window.game.registerCombatHit) {
            window.game.registerCombatHit(this, dmg || 1, false, false);
        }
        if (dmg >= 1.5 || Math.abs(vx) + Math.abs(vy) > 2.2) {
            this.bump(vx, vy);
        } else {
            this.pos[0] += vx * 1.5;
            this.vel[1] = Math.min(this.vel[1], vy);
            this.stunTimer = Math.max(this.stunTimer, 1.2);
        }
    };

    Koopa.prototype.hitByWeapon = function (dmg, opts) {
        opts = opts || {};
        if (opts.stun) this.stunTimer = Math.max(this.stunTimer, opts.stun);
        if (opts.slow) this.slowTimer = Math.max(this.slowTimer, opts.slow);
        if (opts.panic) this.panicTimer = Math.max(this.panicTimer, opts.panic);
        if (window.game && window.game.registerCombatHit) {
            window.game.registerCombatHit(this, dmg || 1, false, false);
        }
        if (dmg >= 1) {
            this.bump(opts.vx || 0, opts.vy || -3.2);
        }
    };

    Koopa.prototype.bump = function (vx, vy) {
        if (this.flipped) return;
        Mario.Audio.play('kick');
        this.flipped = true;
        this.sprite.flipV = true;
        this.sprite.pos = [160, 0];
        this.sprite.size = [16, 16];
        this.hitbox = [2, 0, 12, 16];
        this.sprite.speed = 0;
        this.vel[0] = typeof vx === 'number' ? vx : 0;
        this.vel[1] = typeof vy === 'number' ? vy : -3.0;
        if (this.game) {
            this.game.addScore(200);
            this.game.popup('200', this.pos[0], this.pos[1] - 8, '#ffffff');
        }
    };
})();
