/*
 * Fire flower: turns Big Mario into Fire Mario.
 */
(function () {
    window.Mario = window.Mario || {};

    var Fireflower = Mario.Fireflower = function (pos) {
        this.spawning = 0;
        this.waiting = 0;

        Mario.Entity.call(this, {
            pos: pos,
            sprite: level.fireFlowerSprite,
            hitbox: [0, 0, 16, 16]
        });
    };

    Mario.Util.inherits(Fireflower, Mario.Entity);

    Fireflower.prototype.spawn = function () {
        this.startSpawn();
    };

    Fireflower.prototype.update = function (dt) {
        if (this.stepSpawn(0)) return;
        this.pos[1] += this.vel[1];
        this.sprite.update(dt);
    };

    Fireflower.prototype.checkCollisions = function () {
        if (this.spawning) return;
        if (Mario.Util.hits(player, this.pos[0], this.pos[1], 16, 16)) {
            player.powerUp(this);
        }
    };
})();
