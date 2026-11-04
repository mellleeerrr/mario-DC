/*
 * Бонусы: автомат АК-47 и Toyota Camry XSE 3.5.
 * Программная генерация пиксель-арт спрайтов на offscreen Canvas.
 */
(function () {
    window.Mario = window.Mario || {};

    var Extras = Mario.Extras = {};

    function makeCanvas(w, h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        return { canvas: c, g: g };
    }

    var rifleCanvas = null;
    function buildRifle() {
        if (rifleCanvas) return rifleCanvas;
        var o = makeCanvas(26, 13);
        var g = o.g;
        function px(x, y, w, h, col) {
            g.fillStyle = col;
            g.fillRect(x, y, w, h);
        }

        var metal = '#3b3b42', metalLight = '#5d5d68', metalDark = '#22222a';
        var wood = '#8a5326', woodLight = '#a8682f', woodDark = '#5d3418';

        px(8, 3, 18, 2, metal);
        px(8, 3, 18, 1, metalLight);
        px(24, 1, 2, 4, metalDark);
        px(21, 1, 2, 3, metalDark);
        px(7, 5, 13, 2, metalDark);
        px(19, 5, 5, 2, metal);

        px(5, 4, 6, 4, metal);
        px(5, 4, 6, 1, metalLight);
        px(9, 7, 3, 2, metalDark);

        px(8, 8, 3, 4, metalDark);
        px(9, 10, 3, 3, metalDark);
        px(10, 11, 2, 2, '#141419');

        px(3, 7, 3, 5, wood);
        px(3, 7, 1, 5, woodLight);
        px(4, 11, 3, 2, woodDark);

        px(0, 6, 4, 3, wood);
        px(0, 6, 4, 1, woodLight);
        px(0, 8, 4, 1, woodDark);

        rifleCanvas = o.canvas;
        return rifleCanvas;
    }

    var carCanvas = null;
    function buildCar() {
        if (carCanvas) return carCanvas;
        var o = makeCanvas(60, 26);
        var g = o.g;
        function px(x, y, w, h, col) {
            g.fillStyle = col;
            g.fillRect(x, y, w, h);
        }

        var body = '#2f4f86', bodyLight = '#4a76bd', bodyDark = '#1e3358';
        var glass = '#9fd8ef', glassDark = '#5fa8c9', chrome = '#c8cdd6';
        var tyre = '#15171c', hub = '#8b93a1';

        px(3, 23, 54, 2, 'rgba(0,0,0,0.18)');

        [14, 46].forEach(function (cx) {
            px(cx - 5, 17, 10, 7, tyre);
            px(cx - 4, 18, 8, 5, tyre);
            px(cx - 2, 19, 4, 3, hub);
            px(cx - 1, 20, 2, 1, '#c9cfd8');
        });

        px(4, 9, 52, 9, body);
        px(4, 17, 52, 2, bodyDark);
        px(6, 8, 48, 1, bodyLight);

        px(18, 3, 26, 6, body);
        px(20, 4, 22, 4, glass);
        px(20, 4, 22, 1, glassDark);
        px(31, 4, 1, 4, bodyDark);
        px(18, 2, 26, 1, bodyLight);

        px(44, 7, 12, 2, body);
        px(44, 7, 12, 1, bodyLight);
        px(4, 7, 14, 2, body);
        px(4, 7, 14, 1, bodyLight);

        px(3, 5, 11, 2, bodyDark);
        px(3, 4, 11, 1, chrome);
        px(4, 6, 1, 2, bodyDark);
        px(12, 6, 1, 2, bodyDark);

        px(55, 11, 3, 3, '#ffe066');
        px(55, 11, 3, 1, '#fff6c2');
        px(2, 11, 3, 3, '#ff5a5a');
        px(2, 11, 3, 1, '#ff9a9a');

        px(6, 15, 48, 1, chrome);
        px(30, 16, 4, 2, chrome);
        px(44, 10, 10, 1, chrome);
        px(12, 14, 2, 2, bodyLight);
        px(47, 14, 2, 2, bodyLight);
        px(16, 12, 2, 2, bodyDark);
        px(40, 12, 2, 2, bodyDark);

        carCanvas = o.canvas;
        return carCanvas;
    }

    var bulletCanvas = null;
    function buildBullet() {
        if (bulletCanvas) return bulletCanvas;
        var o = makeCanvas(8, 4);
        o.g.fillStyle = '#ffe066';
        o.g.fillRect(0, 1, 6, 2);
        o.g.fillStyle = '#fff8c4';
        o.g.fillRect(4, 1, 2, 2);
        bulletCanvas = o.canvas;
        return bulletCanvas;
    }

    Extras.rifleCanvas = buildRifle;
    Extras.carCanvas = buildCar;

    /* Пуля АК-47 (поддерживает зенитную стрельбу ВВЕРХ+C под углом 60° вправо и 120° влево) */
    var Bullet = Mario.Bullet = function (pos, left, aimUp) {
        Mario.Entity.call(this, {
            pos: pos,
            sprite: new Mario.Sprite(buildBullet(), [0, 0], [8, 4], 0, [0]),
            hitbox: [0, 0, 8, 6]
        });
        this.left = !!left;
        this.aimUp = !!aimUp;
        var spd = this.aimUp ? 10.5 : 9.5;
        if (this.aimUp) {
            /* 60° вправо (cos 60° = 0.5, sin 60° = 0.8660254)
               120° влево (cos 120° = -0.5, sin 120° = 0.8660254) */
            this.vel = [(this.left ? -0.5 : 0.5) * spd, -0.8660254 * spd];
        } else {
            this.vel = [this.left ? -spd : spd, 0];
        }
        this.standing = false;
        this.sprite.flipH = this.left;
    };

    Mario.Util.inherits(Bullet, Mario.Entity);

    Bullet.prototype.update = function () {
        /* Мягкое зенитное доведение по курсу 60°/120° на вертолёты и истребители в верхней полусфере */
        if (this.aimUp && typeof level !== 'undefined' && level && level.enemies) {
            for (var i = 0; i < level.enemies.length; i++) {
                var e = level.enemies[i];
                if (!e || e.dead || e.pilot) continue;
                var isAir = (Mario.Helicopter && e instanceof Mario.Helicopter) || (Mario.Jet && e instanceof Mario.Jet);
                if (!isAir) continue;
                var ex = e.pos[0] + 22, ey = e.pos[1] + 10;
                var dx = ex - this.pos[0], dy = ey - this.pos[1];
                if (dy < 16 && ((this.left && dx < 28) || (!this.left && dx > -28)) && Math.hypot(dx, dy) < 110) {
                    var ang = Math.atan2(dy, dx);
                    var spd = 10.5;
                    this.vel[0] = this.vel[0] * 0.78 + Math.cos(ang) * spd * 0.22;
                    this.vel[1] = this.vel[1] * 0.78 + Math.sin(ang) * spd * 0.22;
                    break;
                }
            }
        }
        this.pos[0] += this.vel[0];
        this.pos[1] += this.vel[1];
        var viewW = (typeof VW !== 'undefined') ? VW : 432;
        if (this.pos[0] < vX - 24 || this.pos[0] > vX + viewW + 36 || this.pos[1] < -32 || this.pos[1] > 240) {
            this.remove();
        }
    };

    Bullet.prototype.render = function (ctx, vX, vY) {
        if (this.dead) return;
        if (this.aimUp) {
            var x = Math.round(this.pos[0] - vX);
            var y = Math.round(this.pos[1] - vY);
            ctx.save();
            ctx.translate(x + 4, y + 2);
            ctx.rotate(Math.atan2(this.vel[1], this.vel[0]));
            ctx.fillStyle = '#ffe066';
            ctx.fillRect(-5, -1, 10, 3);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(2, -1, 3, 2);
            ctx.restore();
            return;
        }
        Mario.Entity.prototype.render.call(this, ctx, vX, vY);
    };

    Bullet.prototype.checkCollisions = function () {
        if (this.dead) return;

        var tx = Math.floor((this.pos[0] + 3) / 16);
        var ty = Math.floor((this.pos[1] + 1) / 16);
        if (ty >= 0 && ty <= 14 && tx >= 0) {
            var bl = level.blocks[ty][tx];
            if (bl) {
                bl.bonk(1);
                if (!this.aimUp) {
                    this.remove();
                    return;
                }
            } else if (level.statics[ty][tx] && !this.aimUp) {
                this.remove();
                return;
            }
        }

        var items = level.items || [];
        for (var h = 0; h < items.length; h++) {
            var it = items[h];
            if (it && !it.dead && Mario.Hazard && it instanceof Mario.Hazard) {
                if (Mario.Util.hits(it, this.pos[0], this.pos[1], 8, 6)) {
                    it.detonate(0);
                    this.remove();
                    return;
                }
            }
        }

        var viewW = (typeof VW !== 'undefined') ? VW : 432;
        var enemies = level.enemies;
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (!e || e.dead || e.flipped || e.pilot) continue;
            if (e.pos[0] - vX > viewW + 48) continue;
            if (Mario.Util.hits(e, this.pos[0] - 2, this.pos[1] - 2, 12, 10)) {
                if (e.hitByWeapon) {
                    e.hitByWeapon(this.aimUp ? 1.8 : 1.2, { dmgType: 'kinetic' });
                } else {
                    e.bump();
                    if (game.addScore) {
                        game.addScore(400);
                        game.popup('500', e.pos[0], e.pos[1] - 8, '#ffe066');
                    }
                }
                this.remove();
                return;
            }
        }
    };

    /* Toyota Camry XSE 3.5 */
    var Car = Mario.Car = function (pos) {
        Mario.Entity.call(this, {
            pos: pos,
            sprite: new Mario.Sprite(buildCar(), [0, 0], [60, 26], 0, [0]),
            hitbox: [4, 6, 52, 18]
        });
        this.standing = true;
        this.driver = null;
        this.wheelSpin = 0;
        this.boost = false;
        this.hp = 12;
        this.maxHp = 12;
    };

    Mario.Util.inherits(Car, Mario.Entity);

    Car.MAX_SPEED = 4.2;
    Car.BOOST_SPEED = 5.4;
    Car.ACC = 0.24;
    Car.FRICTION = 0.16;
    Car.GRAVITY = 0.28;
    Car.JUMP_VEL = 5.6;

    Car.prototype.hitByWeapon = function (dmg) {
        if (this.dead) return;
        this.hp -= (dmg || 1);
        if (this.hp <= 0) {
            this.explode();
        }
    };

    Car.prototype.explode = function () {
        if (this.dead) return;
        if (this.driver && this.driver.exitCar) {
            this.driver.exitCar();
            this.driver.vel[1] = -4.2;
        }
        this.dead = true;
        if (Mario.ExplosionSystem) {
            Mario.ExplosionSystem.trigger({
                x: this.pos[0] + 30,
                y: this.pos[1] + 14,
                radius: 64,
                damage: 4.5,
                impulse: 6.5,
                color: '#ff6820',
                type: 'vehicle',
                secondary: true
            });
        }
    };

    Car.prototype.render = function (ctx, vX, vY) {
        if (this.dead) return;
        /* Если Марио внутри, рисуем его голову/кепку в салоне за стеклом. */
        if (this.driver) {
            var dx = Math.round(this.pos[0] - vX + (this.left ? 20 : 24));
            var dy = Math.round(this.pos[1] - vY + 3);
            ctx.fillStyle = (this.driver.hero && this.driver.hero.color) ? this.driver.hero.color : '#d82800';
            ctx.fillRect(dx, dy, 6, 2);
            ctx.fillStyle = '#fcbcb0';
            ctx.fillRect(dx + 1, dy + 2, 4, 3);
        }
        this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
    };

    Car.prototype.drive = function (dir, boost) {
        this.boost = !!boost;
        this.acc[0] = dir * (this.boost ? Car.ACC * 1.35 : Car.ACC);
        this.left = dir < 0;
        this.sprite.flipH = this.left;
    };

    Car.prototype.stop = function () {
        this.acc[0] = 0;
        this.boost = false;
    };

    Car.prototype.jump = function () {
        if (!this.standing) return;
        this.standing = false;
        this.vel[1] = -Car.JUMP_VEL;
        Mario.Audio.play('bigJump');
    };

    Car.prototype.solidTile = function (x, y) {
        if (x < 0 || y < 0 || y > 14) return false;
        return !!(level.statics[y][x] || level.blocks[y][x]);
    };

    /* Выталкивает машину из стен/труб при спавне рядом с препятствием. */
    Car.prototype.unstuckHorizontal = function () {
        if (typeof vX === 'number' && this.pos[0] < vX) {
            this.pos[0] = vX;
        }
        var hb = this.hitbox;
        var r0 = Math.floor((this.pos[1] + hb[1]) / 16);
        var r1 = Math.floor((this.pos[1] + hb[1] + hb[3] - 1) / 16);
        for (var step = 0; step < 4; step++) {
            var c0 = Math.floor((this.pos[0] + hb[0]) / 16);
            var c1 = Math.floor((this.pos[0] + hb[0] + hb[2] - 1) / 16);
            var hitLeft = false, hitRight = false;
            var mid = (c0 + c1) / 2;
            for (var r = r0; r <= r1; r++) {
                for (var c = c0; c <= c1; c++) {
                    if (this.solidTile(c, r)) {
                        if (c <= mid) hitLeft = true;
                        else hitRight = true;
                    }
                }
            }
            if (hitLeft && !hitRight) {
                this.pos[0] = (c0 + 1) * 16 - hb[0];
            } else if (hitRight && !hitLeft) {
                this.pos[0] = c1 * 16 - hb[0] - hb[2];
            } else {
                break;
            }
        }
    };

    Car.prototype.update = function () {
        var maxSpd = this.boost ? Car.BOOST_SPEED : Car.MAX_SPEED;
        this.vel[0] += this.acc[0];
        if (Math.abs(this.vel[0]) > maxSpd) {
            this.vel[0] = Math.sign(this.vel[0]) * maxSpd;
        }
        if (this.acc[0] === 0 && Math.abs(this.vel[0]) > 0) {
            var f = Math.min(Car.FRICTION, Math.abs(this.vel[0]));
            this.vel[0] -= Math.sign(this.vel[0]) * f;
        }

        /* Горизонтальное движение с пошаговым разрешением коллизий. */
        var newX = this.pos[0] + this.vel[0];
        if (typeof vX === 'number' && this.driver && newX < vX) {
            newX = vX;
            this.vel[0] = Math.max(0, this.vel[0]);
        }
        if (!this.blocked(newX, this.pos[1])) {
            this.pos[0] = newX;
        } else {
            /* Прижать вплотную к тайлу стены. */
            if (this.vel[0] > 0) {
                var rightEdge = newX + this.hitbox[0] + this.hitbox[2];
                var wallCol = Math.floor((rightEdge - 0.01) / 16);
                this.pos[0] = wallCol * 16 - this.hitbox[0] - this.hitbox[2];
            } else if (this.vel[0] < 0) {
                var leftEdge = newX + this.hitbox[0];
                var leftCol = Math.floor(leftEdge / 16);
                this.pos[0] = (leftCol + 1) * 16 - this.hitbox[0];
            }
            this.vel[0] = 0;
        }

        /* Вертикальная физика: сохраняем предыдущее положение низа колёс,
           чтобы никогда не проскочить сквозь пол при любой дробной скорости. */
        var prevBottom = this.pos[1] + this.hitbox[1] + this.hitbox[3];
        var prevTop = this.pos[1] + this.hitbox[1];

        this.vel[1] = Math.min(6, this.vel[1] + Car.GRAVITY);
        this.pos[1] += this.vel[1];

        if (this.vel[1] >= 0) {
            this.resolveVerticalDown(prevBottom);
        } else {
            this.resolveVerticalUp(prevTop);
        }

        /* Горизонтальные трубы */
        var pipes = level.pipes;
        for (var p = 0; p < pipes.length; p++) {
            var pipe = pipes[p];
            if (!pipe.solid) continue;
            var phb = pipe.hitbox;
            if (Mario.Util.overlap(
                this.pos[0] + this.hitbox[0], this.pos[1] + this.hitbox[1], this.hitbox[2], this.hitbox[3],
                pipe.pos[0] + phb[0], pipe.pos[1] + phb[1], phb[2], phb[3])) {
                pipe.isCollideWith(this);
            }
        }

        /* Падение в пропасть */
        if (this.pos[1] > 240) {
            if (this.driver && this.driver.die) {
                this.driver.die();
            } else {
                this.dead = true;
            }
        }

        this.wheelSpin += this.vel[0];
    };

    Car.prototype.resolveVerticalDown = function (prevBottom) {
        var hb = this.hitbox;
        var bottom = this.pos[1] + hb[1] + hb[3];
        var c0 = Math.floor((this.pos[0] + hb[0] + 1) / 16);
        var c1 = Math.floor((this.pos[0] + hb[0] + hb[2] - 2) / 16);
        var rStart = Math.max(0, Math.floor((prevBottom - 4) / 16));
        var rEnd = Math.min(14, Math.floor(bottom / 16));

        var bestTileTop = null;
        for (var r = rStart; r <= rEnd; r++) {
            var tileTop = r * 16;
            /* Тайл считается опорой, если колёса были на нём или выше него (с допуском 8px)
               и теперь дошли до его верхней грани или пересекли её. */
            if (tileTop < prevBottom - 8 || tileTop > bottom) continue;
            /* Игнорируем внутренние тайлы стены, если прямо над ними тоже есть тайл. */
            for (var c = c0; c <= c1; c++) {
                if (!this.solidTile(c, r)) continue;
                if (r > 0 && this.solidTile(c, r - 1)) continue;
                if (bestTileTop === null || tileTop < bestTileTop) {
                    bestTileTop = tileTop;
                }
            }
        }

        if (bestTileTop !== null) {
            this.pos[1] = bestTileTop - hb[1] - hb[3];
            this.vel[1] = 0;
            this.standing = true;
            if (this.driver && this.driver.game) {
                this.driver.game.combo = 0;
            }
        } else {
            this.standing = false;
        }
    };

    Car.prototype.resolveVerticalUp = function (prevTop) {
        var hb = this.hitbox;
        var top = this.pos[1] + hb[1];
        var c0 = Math.floor((this.pos[0] + hb[0] + 2) / 16);
        var c1 = Math.floor((this.pos[0] + hb[0] + hb[2] - 3) / 16);
        var rStart = Math.max(0, Math.floor(top / 16));
        var rEnd = Math.min(14, Math.floor(prevTop / 16));

        for (var r = rEnd; r >= rStart; r--) {
            var tileBottom = (r + 1) * 16;
            if (tileBottom < top) continue;
            var hit = false;
            for (var c = c0; c <= c1; c++) {
                if (c >= 0 && level.blocks[r] && level.blocks[r][c]) {
                    level.blocks[r][c].bonk(1);
                    hit = true;
                } else if (this.solidTile(c, r)) {
                    hit = true;
                }
            }
            if (hit) {
                this.pos[1] = tileBottom - hb[1];
                this.vel[1] = 0;
                return;
            }
        }
    };

    Car.prototype.blocked = function (x, y) {
        if (this.vel[0] === 0) return false;
        var hb = this.hitbox;
        var front = this.vel[0] > 0 ? x + hb[0] + hb[2] - 0.01 : x + hb[0];
        var c = Math.floor(front / 16);
        /* Проверяем строки корпуса выше нижней кромки колёс на 2px, чтобы
           не цепляться за ровный пол. */
        var r0 = Math.floor((y + hb[1] + 2) / 16);
        var r1 = Math.floor((y + hb[1] + hb[3] - 3) / 16);
        var blocked = false;
        for (var r = r0; r <= r1; r++) {
            if (c >= 0 && r >= 0 && r <= 14 && level.blocks[r] && level.blocks[r][c]) {
                level.blocks[r][c].bonk(1);
                if (level.blocks[r][c]) blocked = true;
            } else if (this.solidTile(c, r)) {
                blocked = true;
            }
        }
        return blocked;
    };

    Car.prototype.checkCollisions = function () {
        if (this.dead) return;
        var viewW = (typeof VW !== 'undefined') ? VW : 432;
        var hb = this.hitbox;
        var cx = this.pos[0] + hb[0], cy = this.pos[1] + hb[1];

        /* Сбиваем врагов бампером */
        var enemies = level.enemies;
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (!e || e.dead || e.flipped) continue;
            if (e.pos[0] - vX > viewW + 32) continue;
            if (Mario.Util.hits(e, cx, cy, hb[2], hb[3])) {
                e.bump();
            }
        }

        /* Если Марио за рулём, корпус машины также подбирает монеты, бонусы и касается флага. */
        if (this.driver) {
            var items = level.items;
            for (var j = 0; j < items.length; j++) {
                var item = items[j];
                if (!item || item.dead || item.spawning) continue;
                if (item instanceof Mario.Flag) {
                    if (!item.hit && cx + hb[2] >= item.pos[0]) {
                        item.isPlayerCollided();
                    }
                } else if (item.hitbox && Mario.Util.hits(item, cx, cy, hb[2], hb[3])) {
                    if (item.collect) item.collect();
                    else if (item instanceof Mario.Star) this.driver.star(item);
                    else if (item instanceof Mario.Mushroom || item instanceof Mario.Fireflower) {
                        this.driver.powerUp(item);
                    }
                }
            }
        }
    };

    Car.prototype.collideWall = function (wall) {
        var wallW = wall && wall.hitbox ? wall.hitbox[2] : 16;
        var wallX = wall ? wall.pos[0] + (wall.hitbox ? wall.hitbox[0] : 0) : 0;
        if (this.pos[0] + this.hitbox[2] / 2 > wallX + wallW / 2) {
            this.pos[0] = wallX + wallW - this.hitbox[0];
        } else {
            this.pos[0] = wallX - this.hitbox[2] - this.hitbox[0];
        }
        this.vel[0] = 0;
    };
})();
