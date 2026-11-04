/* Small shared helpers used across the engine. */
(function () {
    if (typeof Mario === 'undefined') {
        window.Mario = {};
    }

    var Util = Mario.Util = {};

    /* Classic prototypal inheritance. */
    Util.inherits = function (subclass, superclass) {
        function Surrogate() {}
        Surrogate.prototype = superclass.prototype;
        subclass.prototype = new Surrogate();
        subclass.prototype.constructor = subclass;
    };

    Util.clamp = function (v, lo, hi) {
        return v < lo ? lo : (v > hi ? hi : v);
    };

    /* Monotonic clock; avoids the 1s resolution jitter of Date.now(). */
    Util.now = function () {
        return (typeof performance !== 'undefined' && performance.now)
            ? performance.now()
            : Date.now();
    };

    /*
     * Axis aligned overlap test on raw numbers.
     * Deliberately allocation free: this runs for every entity pair, every frame.
     */
    Util.overlap = function (ax, ay, aw, ah, bx, by, bw, bh) {
        return !(ax > bx + bw || ax + aw < bx || ay > by + bh || ay + ah < by);
    };

    /* Does the entity (with an offset hitbox) overlap the given rectangle? */
    Util.hits = function (ent, rx, ry, rw, rh) {
        var hb = ent.hitbox;
        return Util.overlap(
            ent.pos[0] + hb[0], ent.pos[1] + hb[1], hb[2], hb[3],
            rx, ry, rw, rh
        );
    };

    /* Remove dead entries in place - keeps array length tight without `delete`. */
    Util.compact = function (arr) {
        var write = 0;
        for (var i = 0; i < arr.length; i++) {
            var e = arr[i];
            if (e && !e.dead) arr[write++] = e;
        }
        arr.length = write;
        return arr;
    };

    /*
     * "Support" check.
     *
     * The regular tile scan only looks at the tiles an entity's box actually
     * overlaps. An entity that is standing exactly on top of a tile does not
     * overlap it at all, so the tile was never visited and the entity could
     * not stand on it (this is why Mario fell through the warp pipe).
     * This helper looks at the row the feet are in and lets the tile confirm
     * that the entity is resting on it.
     */
    Util.checkSupport = function (ent) {
        var ehb = ent.hitbox;
        var feet = ent.pos[1] + ehb[1] + ehb[3];
        if (feet % 16 !== 0) return;

        var row = feet / 16;
        if (row < 0 || row > 14) return;

        var w = (ent.pos[0] % 16 === 0) ? 1 : 2;
        var baseX = Math.floor(ent.pos[0] / 16);
        for (var j = 0; j < w; j++) {
            var tx = baseX + j;
            if (tx < 0) continue;
            var t = level.statics[row][tx];
            if (t && t.isSupport) t.isSupport(ent);
            var b = level.blocks[row][tx];
            if (b && b.isSupport) b.isSupport(ent);
        }
    };
})();
