/*
 * Floor / static tile. Handles landing on top, hitting from below and walking into the side.
 */
(function () {
    window.Mario = window.Mario || {};

    var Floor = Mario.Floor = function (pos, sprite) {
        Mario.Entity.call(this, {
            pos: pos,
            sprite: sprite,
            hitbox: [0, 0, 16, 16]
        });
    };

    Mario.Util.inherits(Floor, Mario.Entity);

    Floor.prototype.isCollideWith = function (ent) {
        var hb = this.hitbox, ehb = ent.hitbox;
        var ax = this.pos[0] + hb[0], ay = this.pos[1] + hb[1];
        var bx = ent.pos[0] + ehb[0], by = ent.pos[1] + ehb[1];

        if (!Mario.Util.overlap(ax, ay, hb[2], hb[3], bx, by, ehb[2], ehb[3])) return;

        if (Math.abs(by + ehb[3] - ay) <= ent.vel[1]) {
            if (!this.standing) {
                ent.bump();
                return;
            }
            var rowAbove = this.pos[1] / 16 - 1;
            if (rowAbove >= 0 && level.statics[rowAbove] && level.statics[rowAbove][this.pos[0] / 16]) {
                return;
            }
            ent.vel[1] = 0;
            ent.pos[1] = ay - ehb[3] - ehb[1];
            ent.standing = true;
            if (ent instanceof Mario.Player) {
                ent.jumping = 0;
                if (ent.game) ent.game.combo = 0;
            }
            return;
        }

        var center = bx + ehb[2] / 2;

        if (ent.vel[1] < 0 &&
            Math.abs(by - ay - hb[3]) < Math.abs(ent.vel[1]) + 2 &&
            center + 2 >= ax && center - 2 <= ax + hb[2]) {
            ent.vel[1] = 0;
            ent.pos[1] = ay + hb[3] - ehb[1];
            if (ent instanceof Mario.Player) {
                this.bonk(ent.power);
                ent.jumping = 0;
            }
            return;
        }

        ent.collideWall(this);
    };

    Floor.prototype.isSupport = function (ent) {
        var hb = this.hitbox, ehb = ent.hitbox;
        var tileTop = this.pos[1] + hb[1];
        var feet = ent.pos[1] + ehb[1] + ehb[3];

        if (feet !== tileTop || ent.vel[1] < 0) return;
        if (ent.pos[0] + ehb[0] + ehb[2] <= this.pos[0] + hb[0]) return;
        if (ent.pos[0] + ehb[0] >= this.pos[0] + hb[0] + hb[2]) return;

        if (!this.standing) {
            ent.bump();
            return;
        }
        var rowAbove = this.pos[1] / 16 - 1;
        if (rowAbove >= 0 && level.statics[rowAbove] && level.statics[rowAbove][this.pos[0] / 16]) {
            return;
        }

        ent.vel[1] = 0;
        ent.pos[1] = tileTop - ehb[3] - ehb[1];
        ent.standing = true;
        if (ent instanceof Mario.Player) {
            ent.jumping = 0;
            if (ent.game) ent.game.combo = 0;
        }
    };

    Floor.prototype.bonk = function () {};
})();
