/*
 * Coin lying in the level.
 */
(function () {
    window.Mario = window.Mario || {};

    var Coin = Mario.Coin = function (pos, sprite) {
        Mario.Entity.call(this, {
            pos: pos,
            sprite: sprite,
            hitbox: [0, 0, 16, 16]
        });
    };

    Mario.Util.inherits(Coin, Mario.Entity);

    Coin.prototype.update = function (dt) {
        this.sprite.update(dt);
    };

    Coin.prototype.checkCollisions = function () {
        if (Mario.Util.hits(player, this.pos[0], this.pos[1], 16, 16)) {
            this.collect();
        }
    };

    Coin.prototype.collect = function () {
        Mario.Audio.play('coin');
        player.coins += 1;
        player.addScore(200);
        if (player.game) player.game.onCoin(player.coins);
        this.remove();
    };
})();
