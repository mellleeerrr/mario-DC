/*
 * Block: brick / question block.
 */
(function () {
    window.Mario = window.Mario || {};

    var Block = Mario.Block = function (options) {
        this.item = options.item;
        this.usedSprite = options.usedSprite;
        this.bounceSprite = options.bounceSprite;
        this.breakable = options.breakable;
        this.material = options.material || (options.breakable ? 'brick' : 'metal');
        this.maxHp = options.hp || (this.material === 'concrete' ? 2 : (this.material === 'metal' ? 4 : 1));
        this.hp = this.maxHp;

        Mario.Entity.call(this, {
            pos: options.pos,
            sprite: options.sprite,
            hitbox: [0, 0, 16, 16]
        });

        this.standing = true;
    };

    Mario.Util.inherits(Block, Mario.Floor);

    Block.prototype.damageBlock = function (dmg) {
        if (!this.breakable) {
            this.bonk(0);
            return;
        }
        this.hp -= (dmg || 1);
        if (this.hp <= 0) {
            this.break();
        } else {
            this.bonk(0);
        }
    };

    Block.prototype.break = function () {
        Mario.Audio.play('breakBlock');
        (new Mario.Rubble()).spawn(this.pos);
        var x = Math.floor(this.pos[0] / 16), y = Math.floor(this.pos[1] / 16);
        if (level.blocks[y]) level.blocks[y][x] = null;
        this.dead = true;
        if (player && player.addScore) player.addScore(50);
        if (window.game && window.game.shake) window.game.shake(2.2, 0.14);
    };

    Block.prototype.bonk = function (power) {
        Mario.Audio.play('bump');
        if (power > 0 && this.breakable) {
            this.hp -= power;
            if (this.hp <= 0) {
                this.break();
                return;
            }
        }
        if (!this.standing) return;

        this.standing = false;
        var hadItem = !!this.item;
        if (this.item) {
            this.item.spawn();
            this.item = null;
        }
        this.opos = [this.pos[0], this.pos[1]];
        if (this.bounceSprite && !hadItem) {
            this.osprite = this.sprite;
            this.sprite = this.bounceSprite;
        } else {
            this.osprite = null;
            this.sprite = this.usedSprite;
        }
        this.vel[1] = -2;
    };

    Block.prototype.render = function (ctx, vX, vY) {
        Mario.Entity.prototype.render.call(this, ctx, vX, vY);
        if (this.breakable && this.hp < this.maxHp && !this.dead) {
            var rx = Math.round(this.pos[0] - vX);
            var ry = Math.round(this.pos[1] - vY);
            ctx.fillStyle = '#141821';
            ctx.fillRect(rx + 4, ry + 3, 2, 6);
            ctx.fillRect(rx + 6, ry + 8, 5, 2);
            ctx.fillRect(rx + 10, ry + 10, 2, 4);
        }
    };

    Block.prototype.update = function (dt, gameTime) {
        if (!this.standing) {
            if (this.pos[1] < this.opos[1] - 8) {
                this.vel[1] = 2;
            }
            if (this.pos[1] > this.opos[1]) {
                this.vel[1] = 0;
                this.pos = [this.opos[0], this.opos[1]];
                if (this.osprite) {
                    this.sprite = this.osprite;
                }
                this.standing = true;
            }
        } else if (this.sprite === this.usedSprite) {
            var x = Math.floor(this.pos[0] / 16), y = Math.floor(this.pos[1] / 16);
            level.statics[y][x] = new Mario.Floor(this.pos, this.usedSprite);
            if (level.blocks[y]) level.blocks[y][x] = null;
            this.dead = true;
            level.markTerrainDirty(x);
            return;
        }

        this.pos[1] += this.vel[1];
        this.sprite.update(dt, gameTime);
    };
})();
