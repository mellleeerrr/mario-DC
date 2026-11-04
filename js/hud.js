/*
 * HUD v3: Pixel-perfect status bar displaying Hero, Score, Coins, Lives,
 * HP & Armor bar, Energy Z bar, and Z-Ability Icon with Cooldown Fill.
 */
(function () {
    window.Mario = window.Mario || {};

    var HEAD = [
        '..rrrr..',
        '.rrrrrr.',
        'rrrrrrrr',
        '..ssss..',
        '.sbbss..',
        '..ssss..',
        '..bb....',
        '........'
    ];
    var HEAD_COLORS = { r: '#d82800', s: '#fcbcb0', b: '#6b3000' };
    var headCanvas = null;

    function getHeadCanvas() {
        if (headCanvas) return headCanvas;
        headCanvas = document.createElement('canvas');
        headCanvas.width = 8;
        headCanvas.height = 8;
        var g = headCanvas.getContext('2d');
        for (var yy = 0; yy < 8; yy++) {
            for (var xx = 0; xx < 8; xx++) {
                var ch = HEAD[yy].charAt(xx);
                if (ch !== '.') {
                    g.fillStyle = HEAD_COLORS[ch];
                    g.fillRect(xx, yy, 1, 1);
                }
            }
        }
        return headCanvas;
    }

    function pad(n, len) {
        var s = String(n);
        while (s.length < len) s = '0' + s;
        return s;
    }

    Mario.HUD = {
        draw: function (ctx, g) {
            if (g.photoMode) {
                Mario.Font.draw(ctx, 'ФОТО-РЕЖИМ [O - ВЫХОД]', 8, VH - 14, { color: '#ffe040' });
                return;
            }
            ctx.fillStyle = 'rgba(0,0,0,0.48)';
            ctx.fillRect(0, 0, g.VW, 24);

            var p = (typeof player !== 'undefined' && player) ? player : null;
            var hero = (p && p.hero) ? p.hero : null;
            var heroName = hero ? hero.name : 'МАРИО';
            var heroCol = hero ? hero.color : '#ffffff';

            /* 1. Имя героя + ранг мастерства и Очки */
            var rankTag = (p && p.masteryRank > 1) ? (' Р' + p.masteryRank) : '';
            Mario.Font.draw(ctx, (heroName.slice(0, 10) + rankTag).slice(0, 13), 6, 3, { color: heroCol });
            Mario.Font.draw(ctx, pad(g.score, 6), 6, 13, { color: '#ffffff' });

            /* 2. Монеты и Жизни */
            Mario.Font.draw(ctx, '@', 112, 3, { color: '#ffd83d' });
            Mario.Font.draw(ctx, '×' + pad(g.coins, 2), 120, 3, { color: '#ffffff' });

            ctx.drawImage(getHeadCanvas(), 112, 13);
            Mario.Font.draw(ctx, '×' + g.lives, 120, 13, { color: '#ffffff' });

            /* 3. Полоски Здоровья (HP), Брони и Энергии Z */
            if (p) {
                var hpRatio = Math.max(0, Math.min(1, p.hp / (p.maxHp || 100)));
                var armRatio = Math.max(0, Math.min(1, p.armor / (p.maxArmor || 100)));
                var enRatio = Math.max(0, Math.min(1, p.energy / (p.maxEnergy || 100)));

                Mario.Font.draw(ctx, 'HP', 154, 3, { color: '#48ff78' });
                ctx.fillStyle = '#1a2232';
                ctx.fillRect(172, 4, 44, 5);
                ctx.fillStyle = hpRatio > 0.35 ? '#38e868' : '#ff4040';
                ctx.fillRect(172, 4, Math.round(44 * hpRatio), 5);
                if (armRatio > 0) {
                    ctx.fillStyle = '#5ca8ff';
                    ctx.fillRect(172, 3, Math.round(44 * armRatio), 2);
                }

                Mario.Font.draw(ctx, 'EN', 154, 13, { color: '#8ef7ff' });
                ctx.fillStyle = '#1a2232';
                ctx.fillRect(172, 14, 44, 5);
                ctx.fillStyle = '#38d8ff';
                ctx.fillRect(172, 14, Math.round(44 * enRatio), 5);

                /* 4. Иконки способностей [Z], [X], [C-УЛЬТА], [R] */
                var ix = 222, iy = 3, iw = 18, ih = 18;
                var cd = p.zCooldown || 0;
                var maxCd = p.zMaxCooldown || (hero ? hero.zCooldown : 6) || 6;
                var readyRatio = cd <= 0 ? 1 : Math.max(0, 1 - cd / maxCd);
                var hasEnergy = p.energy >= ((hero && hero.zCost) || 25);
                var isReady = cd <= 0 && hasEnergy;

                ctx.fillStyle = '#121824';
                ctx.fillRect(ix, iy, iw, ih);
                var fillH = Math.round(ih * readyRatio);
                ctx.fillStyle = isReady ? heroCol : 'rgba(120, 140, 175, 0.55)';
                ctx.fillRect(ix, iy + (ih - fillH), iw, fillH);
                ctx.fillStyle = isReady ? '#ffffff' : '#687898';
                ctx.fillRect(ix, iy, iw, 1);
                ctx.fillRect(ix, iy + ih - 1, iw, 1);
                ctx.fillRect(ix, iy, 1, ih);
                ctx.fillRect(ix + iw - 1, iy, 1, ih);

                Mario.Font.draw(ctx, 'Z', ix + 5, iy + 5, {
                    color: isReady ? '#10141c' : '#ffffff',
                    shadow: false
                });

                var zStatus = cd > 0 ? ('Z:' + Math.ceil(cd) + 'С') : (hasEnergy ? 'Z:ОК' : 'Z:ЭН');
                var xCd = p.xCooldown || 0;
                var xStatus = xCd > 0 ? ('X:' + Math.ceil(xCd) + 'С') : 'X:ОК';
                Mario.Font.draw(ctx, zStatus + ' ' + xStatus, 244, 3, {
                    color: isReady ? '#48ff78' : '#ffd860'
                });

                var ultPct = Math.floor(p.ultCharge || 0);
                var ultCol = ultPct >= 100 ? '#ffe000' : '#8ef7ff';
                var ultText = ultPct >= 100 ? 'C:УЛЬТА!' : ('УЛЬТА ' + ultPct + '%');
                Mario.Font.draw(ctx, ultText, 244, 13, { color: ultCol });
            }

            /* 5. Мир и Время */
            Mario.Font.draw(ctx, 'МИР', 344, 3, { color: '#8ef7ff' });
            Mario.Font.draw(ctx, g.level ? g.level.name : '1-1', 344, 13, { color: '#ffffff' });

            Mario.Font.draw(ctx, 'ВРЕМЯ', 384, 3, { color: '#ffffff' });
            var t = g.level ? Math.max(0, Math.ceil(g.level.time)) : 0;
            Mario.Font.draw(ctx, pad(t, 3), 392, 13, {
                color: t <= 100 ? '#ff6060' : '#ffffff'
            });

            /* 6. Нижний бейдж активной способности / оружия / техники / перезарядки R */
            if (p) {
                var badge = p.inAircraft
                    ? 'ПИЛОТ АВИАЦИИ · C-ОГОНЬ · X-БОМБА · V-ВЫЙТИ'
                    : (p.inCar
                        ? 'TOYOTA CAMRY XSE 3.5 · V-ВЫЙТИ · C-ОГОНЬ'
                        : ('[Z] ' + (hero ? hero.zName.slice(0, 12) : 'СУПЕР') + ' · [X] ПАРИР · [T] ДУЭТ · [R] ЗАРЯД'));
                ctx.fillStyle = 'rgba(0,0,0,0.45)';
                var bw = Math.min(g.VW - 16, badge.length * 8 + 8);
                ctx.fillRect(6, 25, bw, 9);
                Mario.Font.draw(ctx, badge.slice(0, 51), 9, 26, {
                    color: (p.inCar || p.inAircraft) ? '#ffe000' : (hero ? hero.color : '#ffe000')
                });
            }

            /* 7. Счётчик комбо и Боевой Ранг (D -> C -> B -> A -> S -> SS -> SSS) */
            if (g.combatCombo > 1 && g.combatComboTimer > 0) {
                var rCol = g.combatCombo >= 25 ? '#ffe000' : (g.combatCombo >= 12 ? '#ff58e8' : '#48ff78');
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(g.VW - 126, 25, 120, 18);
                Mario.Font.draw(ctx, 'КОМБО ×' + g.combatCombo, g.VW - 122, 26, { color: '#ffffff' });
                Mario.Font.draw(ctx, 'РАНГ: ' + (g.combatRank || 'D'), g.VW - 122, 34, { color: rCol });
            }

            /* 8. Полоса здоровья Босса мира внизу экрана при бое с Боссом */
            if (g.level && g.level.enemies) {
                for (var i = 0; i < g.level.enemies.length; i++) {
                    var en = g.level.enemies[i];
                    if (en && !en.dead && en.maxHp >= 8 && en.name && Math.abs(en.pos[0] - (p ? p.pos[0] : 0)) < 260) {
                        var bx = 76, by = g.VH - 18, bwBar = g.VW - 152;
                        ctx.fillStyle = 'rgba(0,0,0,0.72)';
                        ctx.fillRect(bx - 4, by - 9, bwBar + 8, 16);
                        Mario.Font.drawCentered(ctx, en.name + ' (УЯЗВ: ' + (en.weakness || 'ВЗРЫВ').toUpperCase() + ')', g.VW / 2, by - 8, {
                            color: '#ffe040'
                        });
                        ctx.fillStyle = '#241428';
                        ctx.fillRect(bx, by + 1, bwBar, 4);
                        ctx.fillStyle = '#ff2848';
                        ctx.fillRect(bx, by + 1, Math.round(bwBar * Math.max(0, en.hp / en.maxHp)), 4);
                        break;
                    }
                }
            }
        }
    };
})();
