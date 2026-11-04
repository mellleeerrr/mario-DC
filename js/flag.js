/* The flag at the end of the level. */
(function () {
    if (typeof Mario === 'undefined') {
        window.Mario = {};
    }

    var Flag = Mario.Flag = function (pos) {
        // Flags always have the same height and Y position.
        this.pos = [pos, 49];
        this.hitbox = [0, 0, 0, 0];
        this.vel = [0, 0];
        this.acc = [0, 0];
        this.dead = false;
    };

    Flag.prototype.collideWall = function () { };

    Flag.prototype.update = function (dt) {
        if (!this.done && this.pos[1] >= 170) {
            this.vel = [0, 0];
            this.pos[1] = 170;
            /* Если Марио застрял в машине рядом со стержнем (вышел из неё
               во время спуска), флаг всё равно должен дойти до конца. */
            if (player.inCar) {
                player.exitCar();
            }
            player.exit();
            this.done = true;
        }
        this.pos[1] += this.vel[1];
    };

    Flag.prototype.checkCollisions = function () {
        this.isPlayerCollided();
    };

    Flag.prototype.isPlayerCollided = function () {
        if (this.hit) return;
        if (player.pos[0] + 8 >= this.pos[0]) {
            Mario.Audio.stopMusic();
            Mario.Audio.play('flagpole');
            this.hit = true;
            player.flag();
            this.vel = [0, 2];

            /* The higher up the pole you grab it, the bigger the bonus. */
            var bonus = 100;
            var y = player.pos[1];
            if (y < 80) bonus = 5000;
            else if (y < 110) bonus = 2000;
            else if (y < 140) bonus = 800;
            else if (y < 170) bonus = 400;
            if (game.addScore) {
                game.addScore(bonus);
                game.popup(String(bonus), player.pos[0], player.pos[1] - 16, '#ffffff');
            }
        }
    };

    Flag.prototype.render = function (ctx, vX, vY) {
        level.flagpoleSprites[2].render(ctx, this.pos[0] - 8, this.pos[1], vX, vY);
    };
})();
