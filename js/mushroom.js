/*
 * Mushroom (Super Mushroom / 1-UP Mushroom).
 */
(function () {
    window.Mario = window.Mario || {};

    var Mushroom = Mario.Mushroom = function (pos, oneUp) {
        this.spawning = 0;
        this.waiting = 0;
        this.oneUp = !!oneUp;

        Mario.Entity.call(this, {
            pos: pos,
            sprite: oneUp ? level.oneUpShroomSprite : level.superShroomSprite,
            hitbox: [0, 0, 16, 16]
        });
    };

    Mario.Util.inherits(Mushroom, Mario.Entity);

    Mushroom.prototype.spawn = function () {
        if (!this.oneUp && player.power > 0) {
            var ff = new Mario.Fireflower(this.pos);
            ff.spawn();
            return;
        }
        this.startSpawn();
    };

    Mushroom.prototype.update = function (dt) {
        if (this.stepSpawn(1)) return;
        if (!this.spawning) this.acc[1] = 0.2;

        if (this.waiting) {
            this.waiting -= 1;
        } else {
            this.vel[1] += this.acc[1];
            this.pos[0] += this.vel[0];
            this.pos[1] += this.vel[1];
            this.sprite.update(dt);
        }
    };

    Mushroom.prototype.collideWall = function () {
        this.vel[0] = -this.vel[0];
    };

    Mushroom.prototype.checkCollisions = function () {
        if (this.spawning || !this.collideTerrain(1)) return;
        if (Mario.Util.hits(player, this.pos[0], this.pos[1], 16, 16)) {
            player.powerUp(this);
        }
    };

    Mushroom.prototype.bump = function () {
        this.vel[1] = -2;
    };
})();
