/* Props are scenery: they have a position and a sprite and nothing else. */
(function () {
    if (typeof Mario === 'undefined') {
        window.Mario = {};
    }

    var Prop = Mario.Prop = function (pos, sprite) {
        this.pos = pos;
        this.sprite = sprite;
    };

    Prop.prototype.render = function (ctx, vX, vY) {
        this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
    };
})();
