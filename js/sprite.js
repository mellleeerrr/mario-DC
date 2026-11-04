/*
 * Sprite: a slice of a sprite sheet plus the animation state for it.
 *
 * The original looked the image up by URL string on every single draw call
 * (resources.get(this.img)) and drew with a 1/3 pixel inset, which - combined
 * with the browser's default bilinear filtering - made every scaled sprite
 * look blurry. Now the image element is cached, and the game renders with
 * image smoothing turned off so pixels stay crisp at any integer zoom.
 */
(function () {
    if (typeof Mario === 'undefined') {
        window.Mario = {};
    }

    var Sprite = Mario.Sprite = function (img, pos, size, speed, frames, once) {
        this.pos = pos;
        this.size = size;
        this.speed = speed || 0;
        this._index = 0;
        this.img = img;
        this.once = !!once;
        this.frames = frames || [0];
        this.image = null;       // resolved lazily, then cached
        this.flipH = false;
        this.flipV = false;
        this.visible = true;
        this.offsetX = 0;        // draw offset, used for the crouch pose
        this.offsetY = 0;
    };

    Sprite.prototype.setImage = function (url) {
        if (this.img !== url) {
            this.img = url;
            this.image = null;
        }
    };
    Sprite.prototype.update = function (dt, gameTime) {
        if (this.speed <= 0) return;
        if (gameTime && gameTime === this.lastUpdated) return;
        this._index += this.speed * dt;
        if (gameTime) this.lastUpdated = gameTime;
    };

    Sprite.prototype.setFrame = function (frame) {
        this._index = frame;
    };

    Sprite.prototype.reset = function () {
        this._index = 0;
        this.done = false;
    };

    Sprite.prototype.render = function (ctx, posx, posy, vX, vY) {
        if (!this.visible) return;

        var img = this.image;
        if (!img) {
            /* `img` may be a URL or a ready made canvas/image. */
            img = (typeof this.img === 'string') ? resources.get(this.img) : this.img;
            if (!img) return;
            this.image = img;
        }

        var frame = 0;
        if (this.speed > 0) {
            var max = this.frames.length;
            var idx = Math.floor(this._index);
            frame = this.frames[idx % max];
            if (this.once && idx >= max) {
                this.done = true;
                return;
            }
        }

        var w = this.size[0];
        var h = this.size[1];
        if (w <= 0 || h <= 0) return;

        var sx = this.pos[0] + frame * w;
        var sy = this.pos[1];
        var dx = Math.round(posx - vX + this.offsetX);
        var dy = Math.round(posy - vY + this.offsetY);

        if (this.flipH || this.flipV) {
            ctx.save();
            ctx.translate(dx + (this.flipH ? w : 0), dy + (this.flipV ? h : 0));
            ctx.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
            ctx.drawImage(img, sx, sy, w, h, 0, 0, w, h);
            ctx.restore();
        } else {
            ctx.drawImage(img, sx, sy, w, h, dx, dy, w, h);
        }
    };
})();
