/*
 * Base entity: position, velocity, hitbox, sprite, shared spawn & terrain collision helpers.
 */
(function () {
    window.Mario = window.Mario || {};

    var nextId = 1;

    var Entity = Mario.Entity = function (options) {
        this.vel = [0, 0];
        this.acc = [0, 0];
        this.standing = true;
        this.pos = options.pos;
        this.sprite = options.sprite;
        this.hitbox = options.hitbox || [0, 0, 16, 16];
        this.left = false;
        this.dead = false;
        this.id = nextId++;
    };

    Entity.prototype.render = function (ctx, vX, vY) {
        if (this.dead || this.spawning > 1) return;
        this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
    };

    Entity.prototype.remove = function () {
        this.dead = true;
    };

    Entity.prototype.startSpawn = function () {
        Mario.Audio.play('itemAppear');
        level.items.push(this);
        this.spawning = 12;
        this.targetY = this.pos[1] - 16;
    };

    Entity.prototype.stepSpawn = function (moveX) {
        if (this.spawning > 1) {
            if (--this.spawning === 1) this.vel[1] = -0.5;
            return true;
        }
        if (this.spawning) {
            if (this.pos[1] <= this.targetY) {
                this.pos[1] = this.targetY;
                this.vel[1] = 0;
                this.waiting = moveX ? 5 : 0;
                this.spawning = 0;
                this.vel[0] = moveX || 0;
            }
        }
        return false;
    };

    Entity.prototype.collideTerrain = function (baseTilesH) {
        var h = (baseTilesH || 1) + (this.pos[1] % 16 !== 0 ? 1 : 0);
        var w = this.pos[0] % 16 === 0 ? 1 : 2;
        var baseX = Math.floor(this.pos[0] / 16);
        var baseY = Math.floor(this.pos[1] / 16);

        if (baseY + h > 15) {
            this.remove();
            return false;
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
        return true;
    };

    Entity.prototype.collideWall = function (wall) {
        var wallW = wall && wall.hitbox ? wall.hitbox[2] : 16;
        var wallX = wall ? wall.pos[0] + (wall.hitbox ? wall.hitbox[0] : 0) : 0;

        if (this.pos[0] > wallX) {
            this.pos[0] = wallX + wallW - this.hitbox[0];
            this.vel[0] = Math.max(0, this.vel[0]);
            this.acc[0] = Math.max(0, this.acc[0]);
        } else {
            this.pos[0] = wallX - this.hitbox[2] - this.hitbox[0];
            this.vel[0] = Math.min(0, this.vel[0]);
            this.acc[0] = Math.min(0, this.acc[0]);
        }
    };

    Entity.prototype.bump = function () {};
})();
