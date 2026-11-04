/*
 * Star: temporary invincibility.
 */
(function () {
    window.Mario = window.Mario || {};

    var Star = Mario.Star = function (pos) {
        this.spawning = 0;
        this.waiting = 0;

        Mario.Entity.call(this, {
            pos: pos,
            sprite: level.starSprite,
            hitbox: [0, 0, 16, 16]
        });
    };

    Mario.Util.inherits(Star, Mario.Entity);

    Star.prototype.spawn = function () {
        this.startSpawn();
    };

    Star.prototype.update = function (dt) {
        if (this.stepSpawn(1)) return;
        if (!this.spawning) this.acc[1] = 0.2;

        if (this.standing) {
            this.standing = false;
            this.vel[1] = -3;
        }

        if (this.waiting) {
            this.waiting -= 1;
        } else {
            this.vel[1] += this.acc[1];
            this.pos[0] += this.vel[0];
            this.pos[1] += this.vel[1];
            this.sprite.update(dt);
        }
    };

    Star.prototype.collideWall = function () {
        this.vel[0] = -this.vel[0];
    };

    Star.prototype.checkCollisions = function () {
        if (this.spawning || !this.collideTerrain(1)) return;
        if (Mario.Util.hits(player, this.pos[0], this.pos[1], 16, 16)) {
            player.star(this);
        }
    };

    Star.prototype.bump = function () {
        this.vel[1] = -2;
    };
})();
