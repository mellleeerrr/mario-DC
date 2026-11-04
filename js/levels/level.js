/*
 * Level: world tile tables, shared sprite presets, and pre-rendered 256x240 terrain chunks.
 */
(function () {
    window.Mario = window.Mario || {};

    var TILE = 16;
    var CHUNK_TILES = 16;
    var CHUNK_W = CHUNK_TILES * TILE;
    var VIEW_H = 240;

    function defaultSprites(underground) {
        return {
            floorSprite: new Mario.Sprite('sprites/tiles.png', [0, underground ? 32 : 0], [16, 16], 0),
            cloudSprite: new Mario.Sprite('sprites/tiles.png', [0, 320], [48, 32], 0),
            wallSprite: new Mario.Sprite('sprites/tiles.png', [underground ? 32 : 0, underground ? 32 : 16], [16, 16], 0),
            brickSprite: new Mario.Sprite('sprites/tiles.png', [16, 0], [16, 16], 0),
            brickBounceSprite: new Mario.Sprite('sprites/tiles.png', [32, 0], [16, 16], 0),
            rubbleSprite: function () {
                return new Mario.Sprite('sprites/items.png', [64, 0], [8, 8], 3, [0, 1]);
            },
            ublockSprite: new Mario.Sprite('sprites/tiles.png', [48, 0], [16, 16], 0),
            superShroomSprite: new Mario.Sprite('sprites/items.png', [0, 0], [16, 16], 0),
            oneUpShroomSprite: new Mario.Sprite('sprites/items.png', [16, 0], [16, 16], 0),
            fireFlowerSprite: new Mario.Sprite('sprites/items.png', [0, 32], [16, 16], 20, [0, 1, 2, 3]),
            starSprite: new Mario.Sprite('sprites/items.png', [0, 48], [16, 16], 20, [0, 1, 2, 3]),
            coinSprite: function () {
                return new Mario.Sprite('sprites/items.png', [0, underground ? 96 : 112], [16, 16], 6, [0, 0, 0, 0, 1, 2, 1]);
            },
            bcoinSprite: function () {
                return new Mario.Sprite('sprites/items.png', [0, 112], [16, 16], 20, [0, 1, 2, 3]);
            },
            pipeLEndSprite: new Mario.Sprite('sprites/tiles.png', [0, 128], [16, 16], 0),
            pipeREndSprite: new Mario.Sprite('sprites/tiles.png', [16, 128], [16, 16], 0),
            pipeLMidSprite: new Mario.Sprite('sprites/tiles.png', [0, 144], [16, 16], 0),
            pipeRMidSprite: new Mario.Sprite('sprites/tiles.png', [16, 144], [16, 16], 0),
            pipeUpMid: new Mario.Sprite('sprites/tiles.png', [0, 144], [32, 16], 0),
            pipeSideMid: new Mario.Sprite('sprites/tiles.png', [48, 128], [16, 32], 0),
            pipeLeft: new Mario.Sprite('sprites/tiles.png', [32, 128], [16, 32], 0),
            pipeTop: new Mario.Sprite('sprites/tiles.png', [0, 128], [32, 16], 0),
            qblockSprite: new Mario.Sprite('sprites/tiles.png', [384, 0], [16, 16], 8, [0, 0, 0, 0, 1, 2, 1]),
            cloudSprites: [
                new Mario.Sprite('sprites/tiles.png', [0, 320], [16, 32], 0),
                new Mario.Sprite('sprites/tiles.png', [16, 320], [16, 32], 0),
                new Mario.Sprite('sprites/tiles.png', [32, 320], [16, 32], 0)
            ],
            hillSprites: [
                new Mario.Sprite('sprites/tiles.png', [128, 128], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [144, 128], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [160, 128], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [128, 144], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [144, 144], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [160, 144], [16, 16], 0)
            ],
            bushSprite: new Mario.Sprite('sprites/tiles.png', [176, 144], [48, 16], 0),
            bushSprites: [
                new Mario.Sprite('sprites/tiles.png', [176, 144], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [192, 144], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [208, 144], [16, 16], 0)
            ],
            goombaSprite: function () {
                return new Mario.Sprite('sprites/enemy.png', [0, 16], [16, 16], 3, [0, 1]);
            },
            koopaSprite: function () {
                return new Mario.Sprite('sprites/enemy.png', [96, 0], [16, 32], 2, [0, 1]);
            },
            flagPoleSprites: [
                new Mario.Sprite('sprites/tiles.png', [256, 128], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [256, 144], [16, 16], 0),
                new Mario.Sprite('sprites/items.png', [128, 32], [16, 16], 0)
            ],
            LPipeSprites: [
                new Mario.Sprite('sprites/tiles.png', [32, 128], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [32, 144], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [48, 128], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [48, 144], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [64, 128], [16, 16], 0),
                new Mario.Sprite('sprites/tiles.png', [64, 144], [16, 16], 0)
            ]
        };
    }

    var Level = Mario.Level = function (options) {
        var defs = defaultSprites(!!options.underground);
        for (var k in defs) {
            this[k] = options[k] !== undefined ? options[k] : defs[k];
        }

        this.name = options.name || '1-1';
        this.playerPos = options.playerPos;
        this.scrolling = options.scrolling !== false;
        this.loader = options.loader;
        this.background = options.background || (options.underground ? '#000000' : '#5c94fc');
        this.exit = options.exit || 0;
        this.timeLimit = options.timeLimit || 400;
        this.next = options.next || null;
        this.music = options.music || (options.underground ? 'underground' : 'overworld');
        this.underground = !!options.underground;
        this.weather = options.weather || 'clear';
        this.bossSpec = options.bossSpec || null;
        this.flagpoleSprites = options.flagPoleSprites || defs.flagPoleSprites;
        this.invincibility = options.invincibility || [144, 192, 240];

        this.statics = [];
        this.scenery = [];
        this.blocks = [];
        this.enemies = [];
        this.items = [];
        this.pipes = [];

        for (var i = 0; i < 15; i++) {
            this.statics[i] = [];
            this.scenery[i] = [];
            this.blocks[i] = [];
        }

        this.widthTiles = options.width || 0;
        this.width = this.widthTiles * TILE;
        this.chunks = [];
        this.time = this.timeLimit;
        this.warned = false;
        this.game = (typeof game !== 'undefined' && game) ? game : null;
    };

    Level.defaultSprites = defaultSprites;

    Level.prototype.putFloor = function (start, end) {
        for (var i = start; i < end; i++) {
            this.statics[13][i] = new Mario.Floor([16 * i, 208], this.floorSprite);
            this.statics[14][i] = new Mario.Floor([16 * i, 224], this.floorSprite);
        }
    };

    Level.prototype.putGoomba = function (x, y, modifier) {
        var g = new Mario.Goomba([16 * x, 16 * y], this.goombaSprite(), modifier || null);
        g.game = this.game;
        this.enemies.push(g);
    };

    Level.prototype.putKoopa = function (x, y, para) {
        var k = new Mario.Koopa([16 * x, 16 * y], this.koopaSprite(), !!para);
        k.game = this.game;
        this.enemies.push(k);
    };

    Level.prototype.putHelicopter = function (x, y, hp) {
        if (!Mario.Helicopter) return;
        var h = new Mario.Helicopter([16 * x, 16 * y], hp || 3);
        h.game = this.game;
        this.enemies.push(h);
    };

    Level.prototype.putJet = function (x, y, hp) {
        if (!Mario.Jet) return;
        var j = new Mario.Jet([16 * x, 16 * y], hp || 2);
        j.game = this.game;
        this.enemies.push(j);
    };

    Level.prototype.putBoss = function (x, y, hp, bossSpec) {
        if (!Mario.Boss) return;
        var b = new Mario.Boss([16 * x, 16 * y - 4], hp || 12, bossSpec || this.bossSpec);
        b.game = this.game;
        this.enemies.push(b);
    };

    Level.prototype.putWorldEvent = function (x, y, kind) {
        if (!Mario.WorldEvent) return;
        this.items.push(new Mario.WorldEvent([16 * x, 16 * y - 8], kind || 'bomb'));
    };

    Level.prototype.putHazard = function (x, y, kind) {
        if (!Mario.Hazard) return;
        this.items.push(new Mario.Hazard([16 * x, 16 * y], kind || 'barrel'));
    };

    Level.prototype.putPickup = function (x, y, kind) {
        if (!Mario.Pickup) return;
        this.items.push(new Mario.Pickup([16 * x, 16 * y], kind || 'energy'));
    };

    Level.prototype.putCheckpoint = function (x, y) {
        if (!Mario.Checkpoint) return;
        this.items.push(new Mario.Checkpoint([16 * x, 16 * y]));
    };

    Level.prototype.putWall = function (x, y, height) {
        for (var i = y - height; i < y; i++) {
            this.statics[i][x] = new Mario.Floor([16 * x, 16 * i], this.wallSprite);
        }
    };

    Level.prototype.putPipe = function (x, y, height) {
        for (var i = y - height; i < y; i++) {
            if (i === y - height) {
                this.statics[i][x] = new Mario.Floor([16 * x, 16 * i], this.pipeLEndSprite);
                this.statics[i][x + 1] = new Mario.Floor([16 * x + 16, 16 * i], this.pipeREndSprite);
            } else {
                this.statics[i][x] = new Mario.Floor([16 * x, 16 * i], this.pipeLMidSprite);
                this.statics[i][x + 1] = new Mario.Floor([16 * x + 16, 16 * i], this.pipeRMidSprite);
            }
        }
    };

    Level.prototype.putLeftPipe = function (x, y) {
        for (var i = 0; i < 3; i++) {
            this.statics[y][x + i] = new Mario.Floor([16 * (x + i), 16 * y], this.LPipeSprites[i * 2]);
            this.statics[y + 1][x + i] = new Mario.Floor([16 * (x + i), 16 * (y + 1)], this.LPipeSprites[i * 2 + 1]);
        }
    };

    Level.prototype.putCoin = function (x, y) {
        this.items.push(new Mario.Coin([x * 16, y * 16], this.coinSprite()));
    };

    Level.prototype.putCloud = function (x, y) {
        this.scenery[y][x] = new Mario.Prop([x * 16, y * 16], this.cloudSprite);
    };

    Level.prototype.putQBlock = function (x, y, item) {
        if (item) item.pos = [x * 16, y * 16];
        this.blocks[y][x] = new Mario.Block({
            pos: [x * 16, y * 16],
            item: item,
            sprite: this.qblockSprite,
            usedSprite: this.ublockSprite
        });
    };

    Level.prototype.putBrick = function (x, y, item) {
        if (item) item.pos = [x * 16, y * 16];
        this.blocks[y][x] = new Mario.Block({
            pos: [x * 16, y * 16],
            item: item,
            sprite: this.brickSprite,
            bounceSprite: this.brickBounceSprite,
            usedSprite: this.ublockSprite,
            breakable: !item
        });
    };

    Level.prototype.putBigHill = function (x, y) {
        var px = x * 16, py = y * 16;
        this.scenery[y][x] = new Mario.Prop([px, py], this.hillSprites[0]);
        this.scenery[y][x + 1] = new Mario.Prop([px + 16, py], this.hillSprites[3]);
        this.scenery[y - 1][x + 1] = new Mario.Prop([px + 16, py - 16], this.hillSprites[0]);
        this.scenery[y][x + 2] = new Mario.Prop([px + 32, py], this.hillSprites[4]);
        this.scenery[y - 1][x + 2] = new Mario.Prop([px + 32, py - 16], this.hillSprites[3]);
        this.scenery[y - 2][x + 2] = new Mario.Prop([px + 32, py - 32], this.hillSprites[1]);
        this.scenery[y][x + 3] = new Mario.Prop([px + 48, py], this.hillSprites[5]);
        this.scenery[y - 1][x + 3] = new Mario.Prop([px + 48, py - 16], this.hillSprites[2]);
        this.scenery[y][x + 4] = new Mario.Prop([px + 64, py], this.hillSprites[2]);
    };

    Level.prototype.putSmallHill = function (x, y) {
        var px = x * 16, py = y * 16;
        this.scenery[y][x] = new Mario.Prop([px, py], this.hillSprites[0]);
        this.scenery[y][x + 1] = new Mario.Prop([px + 16, py], this.hillSprites[3]);
        this.scenery[y - 1][x + 1] = new Mario.Prop([px + 16, py - 16], this.hillSprites[1]);
        this.scenery[y][x + 2] = new Mario.Prop([px + 32, py], this.hillSprites[2]);
    };

    Level.prototype.putBush = function (x, y) {
        this.scenery[y][x] = new Mario.Prop([x * 16, y * 16], this.bushSprite);
    };

    Level.prototype.putTwoBush = function (x, y) {
        var px = x * 16, py = y * 16;
        this.scenery[y][x] = new Mario.Prop([px, py], this.bushSprites[0]);
        this.scenery[y][x + 1] = new Mario.Prop([px + 16, py], this.bushSprites[1]);
        this.scenery[y][x + 2] = new Mario.Prop([px + 32, py], this.bushSprites[1]);
        this.scenery[y][x + 3] = new Mario.Prop([px + 48, py], this.bushSprites[2]);
    };

    Level.prototype.putThreeBush = function (x, y) {
        var px = x * 16, py = y * 16;
        this.scenery[y][x] = new Mario.Prop([px, py], this.bushSprites[0]);
        this.scenery[y][x + 1] = new Mario.Prop([px + 16, py], this.bushSprites[1]);
        this.scenery[y][x + 2] = new Mario.Prop([px + 32, py], this.bushSprites[1]);
        this.scenery[y][x + 3] = new Mario.Prop([px + 48, py], this.bushSprites[1]);
        this.scenery[y][x + 4] = new Mario.Prop([px + 64, py], this.bushSprites[2]);
    };

    Level.prototype.putTwoCloud = function (x, y) {
        var px = x * 16, py = y * 16;
        this.scenery[y][x] = new Mario.Prop([px, py], this.cloudSprites[0]);
        this.scenery[y][x + 1] = new Mario.Prop([px + 16, py], this.cloudSprites[1]);
        this.scenery[y][x + 2] = new Mario.Prop([px + 32, py], this.cloudSprites[1]);
        this.scenery[y][x + 3] = new Mario.Prop([px + 48, py], this.cloudSprites[2]);
    };

    Level.prototype.putThreeCloud = function (x, y) {
        var px = x * 16, py = y * 16;
        this.scenery[y][x] = new Mario.Prop([px, py], this.cloudSprites[0]);
        this.scenery[y][x + 1] = new Mario.Prop([px + 16, py], this.cloudSprites[1]);
        this.scenery[y][x + 2] = new Mario.Prop([px + 32, py], this.cloudSprites[1]);
        this.scenery[y][x + 3] = new Mario.Prop([px + 48, py], this.cloudSprites[1]);
        this.scenery[y][x + 4] = new Mario.Prop([px + 64, py], this.cloudSprites[2]);
    };

    Level.prototype.putRealPipe = function (x, y, length, direction, destination) {
        var px = x * 16, py = y * 16;
        var pipe = new Mario.Pipe({
            pos: [px, py],
            length: length,
            direction: direction,
            destination: destination
        });
        this.pipes.push(pipe);

        if (direction === 'DOWN' || direction === 'UP') {
            for (var i = 0; i < length; i++) {
                var ty = y + i;
                if (ty < 0 || ty > 14) continue;
                this.statics[ty][x] = new Mario.Floor([16 * x, 16 * ty], this.pipeLEndSprite);
                this.statics[ty][x + 1] = new Mario.Floor([16 * x + 16, 16 * ty], this.pipeREndSprite);
            }
        }
        return pipe;
    };

    Level.prototype.putFlagpole = function (x) {
        this.statics[12][x] = new Mario.Floor([16 * x, 192], this.wallSprite);
        for (var i = 3; i < 12; i++) {
            this.scenery[i][x] = new Mario.Prop([16 * x, 16 * i], this.flagpoleSprites[1]);
        }
        this.scenery[2][x] = new Mario.Prop([16 * x, 32], this.flagpoleSprites[0]);
        this.items.push(new Mario.Flag(16 * x));
    };

    Level.prototype.computeWidth = function () {
        if (this.widthTiles) return;
        var max = 0, i;
        for (var y = 0; y < 15; y++) {
            for (i = 0; i < this.statics[y].length; i++) {
                if (this.statics[y][i] && i > max) max = i;
            }
            for (i = 0; i < this.scenery[y].length; i++) {
                if (this.scenery[y][i] && i > max) max = i;
            }
            for (i = 0; i < this.blocks[y].length; i++) {
                if (this.blocks[y][i] && i > max) max = i;
            }
        }
        for (i = 0; i < this.enemies.length; i++) {
            var t = Math.floor(this.enemies[i].pos[0] / 16);
            if (t > max) max = t;
        }
        this.widthTiles = max + 2;
        this.width = this.widthTiles * TILE;
    };

    Level.prototype.buildTerrain = function () {
        this.computeWidth();
        var count = Math.max(1, Math.ceil(this.widthTiles / CHUNK_TILES));
        this.chunks = [];
        for (var i = 0; i < count; i++) {
            var c = document.createElement('canvas');
            c.width = CHUNK_W;
            c.height = VIEW_H;
            this.chunks.push(c);
            this.renderChunk(i);
        }
    };

    Level.prototype.renderChunk = function (index) {
        var canvas = this.chunks[index];
        if (!canvas) return;
        var g = canvas.getContext('2d');
        g.imageSmoothingEnabled = false;
        var startTile = index * CHUNK_TILES;
        var offset = startTile * TILE;

        g.clearRect(0, 0, CHUNK_W, VIEW_H);
        g.fillStyle = this.background;
        g.fillRect(0, 0, CHUNK_W, VIEW_H);

        /* Scenery can span multiple tiles horizontally (up to 5 tiles = 80px),
           so start scanning 4 tiles earlier to capture wide hills/clouds/bushes
           crossing a chunk boundary. */
        var scanStart = Math.max(0, startTile - 4);
        for (var y = 0; y < 15; y++) {
            for (var sx = scanStart; sx < startTile + CHUNK_TILES; sx++) {
                var sc = this.scenery[y][sx];
                if (sc) sc.render(g, offset, 0);
            }
            for (var x = startTile; x < startTile + CHUNK_TILES; x++) {
                var st = this.statics[y][x];
                if (st) st.render(g, offset, 0);
            }
        }
    };

    Level.prototype.markTerrainDirty = function (tileX) {
        var idx = Math.floor(tileX / CHUNK_TILES);
        if (idx < 0 || idx >= this.chunks.length) return;
        this.renderChunk(idx);
        if (tileX % CHUNK_TILES === CHUNK_TILES - 1 && idx + 1 < this.chunks.length) {
            this.renderChunk(idx + 1);
        }
    };

    Level.prototype.renderTerrain = function (ctx, vX, vY) {
        if (!this.chunks.length) return;
        var viewW = (typeof VW !== 'undefined') ? VW : 432;
        var first = Math.max(0, Math.floor(vX / CHUNK_W));
        var last = Math.min(this.chunks.length - 1, Math.floor((vX + viewW - 1) / CHUNK_W));
        var yOff = (typeof vY === 'number') ? -vY : 0;
        for (var i = first; i <= last; i++) {
            ctx.drawImage(this.chunks[i], Math.round(i * CHUNK_W - vX), yOff);
        }
    };

    Level.prototype.compact = function () {
        Mario.Util.compact(this.items);
        Mario.Util.compact(this.enemies);
    };

    Level.prototype.reset = function () {
        this.time = this.timeLimit;
    };
})();
