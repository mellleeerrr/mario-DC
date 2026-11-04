/* Debris from a broken brick: four little chunks that fly and fall. */
(function () {
    if (typeof Mario === 'undefined') {
        window.Mario = {};
    }

    var Rubble = Mario.Rubble = function () {
        this.sprites = [];
        this.poss = [];
        this.vels = [];
    };

    Rubble.prototype.spawn = function (pos) {
        level.items.push(this);
        for (var i = 0; i < 4; i++) {
            this.sprites[i] = level.rubbleSprite();
        }
        this.poss[0] = [pos[0], pos[1]];
        this.poss[1] = [pos[0] + 8, pos[1]];
        this.poss[2] = [pos[0], pos[1] + 8];
        this.poss[3] = [pos[0] + 8, pos[1] + 8];
        this.vels[0] = [-1.25, -5];
        this.vels[1] = [1.25, -5];
        this.vels[2] = [-1.25, -3];
        this.vels[3] = [1.25, -3];
        this.alive = 4;
    };

    Rubble.prototype.update = function (dt) {
        for (var i = 0; i < 4; i++) {
            if (!this.sprites[i]) continue;
            this.vels[i][1] += 0.3;
            this.poss[i][0] += this.vels[i][0];
            this.poss[i][1] += this.vels[i][1];
            this.sprites[i].update(dt);
            if (this.poss[i][1] > 256) {
                this.sprites[i] = null;
                this.alive--;
            }
        }
        if (this.alive <= 0) {
            this.dead = true;
        }
    };

    Rubble.prototype.checkCollisions = function () { };

    Rubble.prototype.render = function (ctx, vX, vY) {
        for (var i = 0; i < 4; i++) {
            if (!this.sprites[i]) continue;
            this.sprites[i].render(ctx, this.poss[i][0], this.poss[i][1], vX, vY);
        }
    };
})();
