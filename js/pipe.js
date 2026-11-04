/*
 * Pipes (vertical & horizontal warp/solid pipes).
 */
(function () {
    window.Mario = window.Mario || {};

    var Pipe = Mario.Pipe = function (options) {
        this.pos = options.pos;
        this.direction = options.direction;
        this.destination = options.destination;
        this.length = options.length;

        if (this.direction === 'UP' || this.direction === 'DOWN') {
            this.hitbox = [0, 0, 32, this.length * 16];
            this.midsection = level.pipeUpMid;
            this.endsection = level.pipeTop;
            this.solid = false;
        } else {
            this.hitbox = [0, 0, 16 * this.length, 32];
            this.midsection = level.pipeSideMid;
            this.endsection = level.pipeLeft;
            this.solid = true;
        }
    };

    Pipe.prototype.checkPipe = function () {
        if (!this.destination || !Mario.Input.isDown(this.direction)) return;
        if (player.piping || player.dying) return;

        var h = player.hitbox[3];
        var x = Math.round(player.pos[0]);
        var y = Math.round(player.pos[1] + player.hitbox[1]);

        switch (this.direction) {
            case 'RIGHT':
                if (Math.abs(x - (this.pos[0] - 16)) <= 2 && y >= this.pos[1] && y + h <= this.pos[1] + 32) {
                    if (player.inCar) player.exitCar();
                    player.pipe(this.direction, this.destination);
                }
                break;
            case 'LEFT':
                if (Math.abs(x - (this.pos[0] + 16 * this.length)) <= 2 && y >= this.pos[1] && y + h <= this.pos[1] + 32) {
                    if (player.inCar) player.exitCar();
                    player.pipe(this.direction, this.destination);
                }
                break;
            case 'UP':
                if (Math.abs(y - (this.pos[1] + 16 * this.length)) <= 2 && x >= this.pos[0] && x + 16 <= this.pos[0] + 32) {
                    if (player.inCar) player.exitCar();
                    player.pipe(this.direction, this.destination);
                }
                break;
            case 'DOWN':
                if (Math.abs((y + h) - this.pos[1]) <= 2 && x >= this.pos[0] - 4 && x + 16 <= this.pos[0] + 36) {
                    if (player.inCar) player.exitCar();
                    player.pipe(this.direction, this.destination);
                }
                break;
        }
    };

    Pipe.prototype.checkCollisions = function () {
        if (!this.solid) return;
        if (!player.piping && !player.dying) {
            this.isCollideWith(player);
        }
    };

    Pipe.prototype.isCollideWith = function (ent) {
        if (!ent || ent.pos === undefined || ent.dead) return;

        var hb = this.hitbox, ehb = ent.hitbox;
        var ax = this.pos[0] + hb[0], ay = this.pos[1] + hb[1];
        var bx = ent.pos[0] + ehb[0], by = ent.pos[1] + ehb[1];

        if (!Mario.Util.overlap(ax, ay, hb[2], hb[3], bx, by, ehb[2], ehb[3])) return;

        var center = bx + ehb[2] / 2;

        if (Math.abs(by + ehb[3] - ay) <= ent.vel[1]) {
            ent.vel[1] = 0;
            ent.pos[1] = ay - ehb[3] - ehb[1];
            ent.standing = true;
            if (ent instanceof Mario.Player) {
                ent.jumping = 0;
                if (ent.game) ent.game.combo = 0;
            }
        } else if (Math.abs(by - ay - hb[3]) > ent.vel[1] &&
            center + 2 >= ax && center - 2 <= ax + hb[2]) {
            ent.vel[1] = 0;
            ent.pos[1] = ay + hb[3] - ehb[1];
            if (ent instanceof Mario.Player) ent.jumping = 0;
        } else {
            ent.collideWall(this);
        }
    };

    Pipe.prototype.update = function () {
        if (this.destination) this.checkPipe();
    };

    Pipe.prototype.render = function (ctx, vX, vY) {
        switch (this.direction) {
            case 'DOWN':
                this.endsection.render(ctx, this.pos[0], this.pos[1], vX, vY);
                for (var i = 1; i < this.length; i++) {
                    this.midsection.render(ctx, this.pos[0], this.pos[1] + i * 16, vX, vY);
                }
                break;
            case 'UP':
                this.endsection.render(ctx, this.pos[0], this.pos[1] + 16 * (this.length - 1), vX, vY);
                for (var j = 0; j < this.length - 1; j++) {
                    this.midsection.render(ctx, this.pos[0], this.pos[1] + j * 16, vX, vY);
                }
                break;
            case 'RIGHT':
                this.endsection.render(ctx, this.pos[0], this.pos[1], vX, vY);
                for (var k = 1; k < this.length; k++) {
                    this.midsection.render(ctx, this.pos[0] + 16 * k, this.pos[1], vX, vY);
                }
                break;
            case 'LEFT':
                this.endsection.render(ctx, this.pos[0] + 16 * (this.length - 1), this.pos[1], vX, vY);
                for (var m = 0; m < this.length - 1; m++) {
                    this.midsection.render(ctx, this.pos[0] + 16 * m, this.pos[1], vX, vY);
                }
                break;
        }
    };
})();
