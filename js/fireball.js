/*
 * Fireball: projectile thrown by Fire Mario.
 */
(function () {
    window.Mario = window.Mario || {};

    var Fireball = Mario.Fireball = function (pos) {
        this.hit = 0;
        this.standing = false;

        Mario.Entity.call(this, {
            pos: pos,
            sprite: new Mario.Sprite('sprites/items.png', [96, 144], [8, 8], 5, [0, 1, 2, 3]),
            hitbox: [0, 0, 8, 8]
        });
    };

    Mario.Util.inherits(Fireball, Mario.Entity);

    Fireball.prototype.spawn = function (left, aimUp) {
        Mario.Audio.play('fireball');
        fireballs.push(this);
        this.aimUp = !!aimUp;
        if (this.aimUp) {
            /* 60° вправо (cos=0.5, -sin=-0.866) и 120° влево (cos=-0.5, -sin=-0.866) */
            var spd = 7.5;
            this.vel[0] = (left ? -0.5 : 0.5) * spd;
            this.vel[1] = -0.8660254 * spd;
        } else {
            this.vel[0] = left ? -5 : 5;
            this.vel[1] = 0;
        }
        this.standing = false;
    };

    Fireball.prototype.remove = function () {
        if (this.dead) return;
        this.dead = true;
        player.fireballs = Math.max(0, player.fireballs - 1);
    };

    Fireball.prototype.update = function (dt) {
        if (this.hit === 1) {
            this.sprite.pos = [96, 160];
            this.sprite.size = [16, 16];
            this.sprite.frames = [0, 1, 2];
            this.sprite.speed = 8;
            this.hit += 1;
            return;
        } else if (this.hit === 5) {
            this.remove();
            return;
        } else if (this.hit) {
            this.hit += 1;
            return;
        }

        if (this.standing) {
            this.standing = false;
            this.vel[1] = -4;
        }

        this.acc[1] = 0.5;
        this.vel[1] += this.acc[1];
        this.pos[0] += this.vel[0];
        this.pos[1] += this.vel[1];

        var viewW = (typeof VW !== 'undefined') ? VW : 432;
        if (this.pos[0] < vX || this.pos[0] > vX + viewW) {
            this.hit = 1;
        }
        this.sprite.update(dt);
    };

    Fireball.prototype.collideWall = function () {
        if (!this.hit) this.hit = 1;
    };

    Fireball.prototype.checkCollisions = function () {
        if (this.hit) return;
        var h = this.pos[1] % 16 < 8 ? 1 : 2;
        var w = this.pos[0] % 16 < 8 ? 1 : 2;

        var baseX = Math.floor(this.pos[0] / 16);
        var baseY = Math.floor(this.pos[1] / 16);

        if (baseY + h > 15) {
            this.remove();
            return;
        }

        for (var i = 0; i < h; i++) {
            var ty = baseY + i;
            if (ty < 0 || ty > 14) continue;
            for (var j = 0; j < w; j++) {
                var tx = baseX + j;
                if (tx < 0) continue;
                var st = level.statics[ty][tx];
                if (st) st.isCollideWith(this);
                var bl = level.blocks[ty][tx];
                if (bl) bl.isCollideWith(this);
            }
        }

        var viewW = (typeof VW !== 'undefined') ? VW : 432;
        var enemies = level.enemies;
        for (var k = 0; k < enemies.length; k++) {
            var enemy = enemies[k];
            if (!enemy || enemy.flipped || enemy.dead || enemy.pilot) continue;
            if (enemy.pos[0] - vX > viewW + 32) continue;
            if (Mario.Util.hits(enemy, this.pos[0], this.pos[1], 8, 8)) {
                this.hit = 1;
                if (enemy.hitByWeapon) {
                    enemy.hitByWeapon(2.0, { burn: true, dmgType: 'explosive' });
                } else {
                    enemy.bump();
                }
                break;
            }
        }
    };
})();
