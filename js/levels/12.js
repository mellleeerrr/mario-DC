/*
 * 10-Level Progressive Action Campaign (Worlds 1-2 through 1-10) + Mario.LEVELS registry.
 * Each level increases in width, platforming complexity, ground enemy density,
 * and aerial combat squadrons (Helicopters & Supersonic Fighter Jets).
 */
(function () {
    window.Mario = window.Mario || {};

    var CAMPAIGN_SPECS = [
        {
            num: 2, name: '1-2', title: 'ГОТЭМ · ОКРАИНЫ',
            width: 240, timeLimit: 420, bg: '#1e325c', underground: false, weather: 'night',
            bossSpec: { name: 'БЭЙН И ДЖОКЕР', color: '#4c2672', visor: '#48ff78', weakness: 'explosive' },
            gaps: [[58, 61], [94, 97], [146, 149], [188, 191]],
            pipes: [[18, 2], [32, 3], [46, 4], [74, 3], [112, 4], [138, 3], [168, 3], [204, 2]],
            heliCount: 3, jetCount: 2, enemyStep: 11, hpBonus: 0
        },
        {
            num: 3, name: '1-3', title: 'МЕТРОПОЛИС · НЕБЕСНЫЙ МОСТ',
            width: 256, timeLimit: 440, bg: '#3b78e8', underground: false, weather: 'clear',
            bossSpec: { name: 'ГЕНЕРАЛ ЗОД', color: '#242b38', visor: '#ff2828', weakness: 'energy' },
            gaps: [[48, 52], [86, 90], [128, 132], [172, 176], [210, 213]],
            pipes: [[20, 3], [38, 4], [68, 3], [106, 4], [150, 3], [194, 4]],
            heliCount: 4, jetCount: 3, enemyStep: 10, hpBonus: 1
        },
        {
            num: 4, name: '1-4', title: 'БАШНЯ СТАРКА · ПЕРИМЕТР',
            width: 272, timeLimit: 460, bg: '#283c66', underground: false, weather: 'storm',
            bossSpec: { name: 'УЛЬТРОН ПРАЙМ', color: '#58647a', visor: '#ff1e38', weakness: 'electric' },
            gaps: [[52, 56], [92, 96], [136, 140], [180, 184], [220, 224]],
            pipes: [[16, 2], [34, 4], [72, 3], [114, 4], [158, 3], [202, 4], [234, 2]],
            heliCount: 5, jetCount: 3, enemyStep: 9, hpBonus: 1
        },
        {
            num: 5, name: '1-5', title: 'БУНКЕР Щ.И.Т. · ПОДЗЕМЕЛЬЕ',
            width: 284, timeLimit: 480, bg: '#0c1222', underground: true, weather: 'night',
            bossSpec: { name: 'ГИДРА-ЛЕВИАФАН', color: '#1f4e32', visor: '#ffe030', weakness: 'explosive' },
            gaps: [[46, 50], [84, 88], [124, 129], [166, 171], [208, 213], [242, 246]],
            pipes: [[22, 3], [40, 4], [66, 3], [104, 4], [146, 4], [188, 3], [228, 4]],
            heliCount: 5, jetCount: 4, enemyStep: 9, hpBonus: 1
        },
        {
            num: 6, name: '1-6', title: 'ВАКАНДА · РУБЕЖ ВИБРАНИУМА',
            width: 298, timeLimit: 500, bg: '#2a1c4e', underground: false, weather: 'clear',
            bossSpec: { name: 'ЭРИК КИЛЛМОНГЕР', color: '#241c38', visor: '#ffb820', weakness: 'kinetic' },
            gaps: [[44, 48], [82, 87], [122, 127], [164, 169], [204, 209], [246, 250]],
            pipes: [[18, 3], [36, 4], [64, 3], [102, 4], [144, 3], [184, 4], [224, 3], [260, 3]],
            heliCount: 6, jetCount: 4, enemyStep: 8, hpBonus: 2
        },
        {
            num: 7, name: '1-7', title: 'АСГАРД · РАДУЖНЫЙ МОСТ',
            width: 312, timeLimit: 520, bg: '#14244a', underground: false, weather: 'storm',
            bossSpec: { name: 'ЛОКИ · БОГ ОБМАНА', color: '#1a4c2e', visor: '#ffd838', weakness: 'electric' },
            gaps: [[40, 45], [78, 83], [118, 124], [158, 164], [198, 204], [238, 243], [272, 276]],
            pipes: [[20, 3], [58, 4], [98, 4], [140, 3], [180, 4], [220, 4], [258, 3]],
            heliCount: 7, jetCount: 5, enemyStep: 8, hpBonus: 2
        },
        {
            num: 8, name: '1-8', title: 'АПОКОЛИПС · ОГНЕННЫЙ ШТУРМ',
            width: 326, timeLimit: 540, bg: '#3e161c', underground: false, weather: 'night',
            bossSpec: { name: 'ДАРКСАЙД', color: '#2b2848', visor: '#ff2020', weakness: 'energy' },
            gaps: [[42, 47], [80, 86], [120, 126], [162, 168], [202, 208], [244, 250], [282, 287]],
            pipes: [[18, 3], [56, 4], [96, 4], [138, 4], [180, 3], [222, 4], [264, 4]],
            heliCount: 8, jetCount: 6, enemyStep: 7, hpBonus: 2
        },
        {
            num: 9, name: '1-9', title: 'СКАЙНЕТ · ЦИТАДЕЛЬ МАШИН',
            width: 340, timeLimit: 560, bg: '#0d1a2d', underground: true, weather: 'storm',
            bossSpec: { name: 'T-1000 / ОХОТНИК HK', color: '#68829e', visor: '#ff1818', weakness: 'explosive' },
            gaps: [[38, 44], [76, 82], [116, 122], [156, 162], [196, 202], [236, 242], [276, 282], [304, 308]],
            pipes: [[20, 4], [54, 4], [94, 4], [134, 4], [174, 4], [214, 4], [254, 4], [292, 3]],
            heliCount: 9, jetCount: 7, enemyStep: 7, hpBonus: 3
        },
        {
            num: 10, name: '1-10', title: 'КРИЗИС МИРОВ · ФИНАЛЬНАЯ БИТВА',
            width: 356, timeLimit: 600, bg: '#1e0e32', underground: false, weather: 'storm',
            bossSpec: { name: 'АНТИ-МОНИТОР', color: '#3a1458', visor: '#48f0ff', weakness: 'chaos' },
            gaps: [[36, 42], [74, 80], [112, 118], [150, 156], [188, 194], [226, 232], [264, 270], [300, 306]],
            pipes: [[18, 3], [52, 4], [90, 4], [128, 4], [168, 4], [206, 4], [244, 4], [282, 4], [316, 3]],
            heliCount: 11, jetCount: 8, enemyStep: 6, hpBonus: 3
        }
    ];

    function inAnyGap(x, gaps) {
        for (var i = 0; i < gaps.length; i++) {
            if (x >= gaps[i][0] - 1 && x <= gaps[i][1] + 1) return true;
        }
        return false;
    }

    function hasPipeAt(x, pipes) {
        for (var i = 0; i < pipes.length; i++) {
            if (Math.abs(x - pipes[i][0]) <= 2) return true;
        }
        return false;
    }

    function buildCampaignLevel(spec, loaderFn, nextLoaderFn) {
        var W = spec.width;
        var flagX = W - 16;
        var exitX = W - 10;

        level = new Mario.Level({
            name: spec.name,
            playerPos: [56, 192],
            loader: loaderFn,
            exit: exitX,
            width: W,
            timeLimit: spec.timeLimit,
            background: spec.bg,
            underground: spec.underground,
            weather: spec.weather || 'clear',
            bossSpec: spec.bossSpec || null,
            music: spec.underground ? 'underground' : 'overworld',
            next: nextLoaderFn || null
        });

        /* 1. Пол с пропастями (и мостами над широкими пропастями) */
        var cursor = 0;
        for (var g = 0; g < spec.gaps.length; g++) {
            var gapStart = spec.gaps[g][0];
            var gapEnd = spec.gaps[g][1];
            if (gapStart > cursor) {
                level.putFloor(cursor, gapStart);
            }
            /* Подвесные кирпичные островки над широкими пропастями */
            if (gapEnd - gapStart >= 5) {
                var mid = Math.floor((gapStart + gapEnd) / 2);
                level.putBrick(mid - 1, 9, null);
                level.putBrick(mid, 9, new Mario.Bcoin([0, 0]));
                level.putCoin(mid, 7);
            }
            cursor = gapEnd;
        }
        level.putFloor(cursor, W);

        /* 2. Облака, холмы и кусты */
        for (var cx = 8; cx < W - 12; cx += 22) {
            var cy = (cx % 44 === 0) ? 2 : 3;
            if (cx % 66 === 0) level.putThreeCloud(cx, cy);
            else if (cx % 44 === 0) level.putTwoCloud(cx, cy);
            else level.putCloud(cx, cy);
        }

        if (!spec.underground) {
            for (var hx = 4; hx < flagX - 18; hx += 28) {
                if (!inAnyGap(hx, spec.gaps) && !inAnyGap(hx + 4, spec.gaps)) {
                    if (hx % 56 === 4) level.putBigHill(hx, 12);
                    else level.putSmallHill(hx, 12);
                }
                var bx = hx + 12;
                if (bx < flagX - 16 && !inAnyGap(bx, spec.gaps) && !inAnyGap(bx + 3, spec.gaps)) {
                    level.putTwoBush(bx, 12);
                }
            }
        }

        /* 3. Трубы */
        spec.pipes.forEach(function (p) {
            if (!inAnyGap(p[0], spec.gaps) && !inAnyGap(p[0] + 1, spec.gaps)) {
                level.putPipe(p[0], 13, p[1]);
            }
        });

        /* 4. Боевые платформы, блоки с бонусами, звёздами и грибами */
        for (var sec = 18; sec < flagX - 28; sec += 24) {
            if (hasPipeAt(sec, spec.pipes) || hasPipeAt(sec + 2, spec.pipes)) continue;

            level.putBrick(sec, 9, null);
            if (sec % 72 === 18) {
                level.putQBlock(sec + 1, 9, new Mario.Mushroom([0, 0]));
            } else if (sec % 96 === 42) {
                level.putQBlock(sec + 1, 9, new Mario.Star([0, 0]));
            } else {
                level.putQBlock(sec + 1, 9, new Mario.Bcoin([0, 0]));
            }
            level.putBrick(sec + 2, 9, null);
            level.putQBlock(sec + 3, 9, new Mario.Bcoin([0, 0]));
            level.putBrick(sec + 4, 9, null);

            /* Верхний ярус для воздушного боя с вертолётами и истребителями */
            if (sec % 48 === 18) {
                level.putBrick(sec + 1, 5, null);
                level.putQBlock(sec + 2, 5, (sec % 96 === 18) ? new Mario.Mushroom([0, 0], true) : new Mario.Bcoin([0, 0]));
                level.putBrick(sec + 3, 5, null);
                level.putCoin(sec + 1, 4);
                level.putCoin(sec + 2, 4);
                level.putCoin(sec + 3, 4);
            }
        }

        /* 5. Каменные бастионы и финальная лестница к флагштоку */
        var stairStart = flagX - 12;
        for (var s = 0; s < 8; s++) {
            var wx = stairStart + s;
            if (!inAnyGap(wx, spec.gaps)) {
                level.putWall(wx, 13, Math.min(8, s + 1));
            }
        }
        level.putFlagpole(flagX);

        /* 6. Наземная армия врагов (Гумбы, элитные Гумбы с модификаторами, Купы) */
        var eliteMods = ['SHIELD', 'ARMOR', 'TELEPORT', 'REGEN'];
        var eIdx = 0;
        for (var ex = 22; ex < stairStart - 6; ex += spec.enemyStep) {
            if (inAnyGap(ex, spec.gaps) || hasPipeAt(ex, spec.pipes)) continue;
            if (ex % (spec.enemyStep * 3) === 0) {
                level.putKoopa(ex, 11, ex % 2 === 0);
            } else {
                var mod = (eIdx % 2 === 1) ? eliteMods[(eIdx + spec.num) % eliteMods.length] : null;
                level.putGoomba(ex, 12, mod);
                eIdx++;
                if (spec.num >= 5 && ex % 2 === 0 && !inAnyGap(ex + 2, spec.gaps)) {
                    level.putGoomba(ex + 2, 12, (eIdx % 3 === 0) ? eliteMods[eIdx % eliteMods.length] : null);
                    eIdx++;
                }
            }
        }

        /* 7. Боевая авиация: ударные вертолёты и сверхзвуковые самолёты */
        var span = flagX - 50;
        var heliSpacing = Math.max(24, Math.floor(span / spec.heliCount));
        for (var h = 0; h < spec.heliCount; h++) {
            var hxPos = 36 + h * heliSpacing;
            var hyPos = (h % 2 === 0) ? 2.5 : 3.5;
            level.putHelicopter(hxPos, hyPos, 3 + spec.hpBonus);
        }

        var jetSpacing = Math.max(30, Math.floor(span / spec.jetCount));
        for (var j = 0; j < spec.jetCount; j++) {
            var jxPos = 52 + j * jetSpacing;
            var jyPos = (j % 2 === 0) ? 1.5 : 2.5;
            level.putJet(jxPos, jyPos, 2 + Math.floor(spec.hpBonus / 2));
        }

        /* 8. Взрывоопасное окружение (бочки, баллоны, мины) для цепных детонаций */
        for (var hz = 26; hz < stairStart - 12; hz += 20) {
            if (inAnyGap(hz, spec.gaps) || inAnyGap(hz + 1, spec.gaps) || hasPipeAt(hz, spec.pipes)) continue;
            if (hz % 40 === 6) {
                level.putHazard(hz, 12, 'barrel');
                level.putHazard(hz + 1, 12, 'cylinder');
            } else if (hz % 60 === 26) {
                level.putHazard(hz, 12, 'mine');
            } else {
                level.putHazard(hz, 12, 'barrel');
            }
        }

        /* 9. Чекпоинт в середине уровня, динамическое событие мира и подбираемые предметы */
        var cpX = Math.floor(W * 0.5);
        while (inAnyGap(cpX, spec.gaps) || hasPipeAt(cpX, spec.pipes)) cpX++;
        level.putCheckpoint(cpX, 11);

        var evX = Math.floor(W * 0.32);
        while (inAnyGap(evX, spec.gaps) || hasPipeAt(evX, spec.pipes)) evX++;
        var eventKinds = ['bomb', 'hostage', 'defense'];
        level.putWorldEvent(evX, 12, eventKinds[spec.num % eventKinds.length]);

        var pickupKinds = ['energy', 'medkit', 'armor', 'cdr'];
        for (var pk = 30; pk < stairStart - 20; pk += 36) {
            if (!inAnyGap(pk, spec.gaps)) {
                level.putPickup(pk, 7, pickupKinds[(pk / 36) % pickupKinds.length | 0]);
            }
        }

        /* 10. Именной Босс мира перед финальным штурмом флагштока */
        var bossX = stairStart - 10;
        while (inAnyGap(bossX, spec.gaps) || inAnyGap(bossX + 1, spec.gaps) || hasPipeAt(bossX, spec.pipes)) {
            bossX--;
        }
        level.putBoss(bossX, 11, 10 + spec.num * 2, spec.bossSpec);
        if (!inAnyGap(bossX - 3, spec.gaps)) level.putHazard(bossX - 3, 12, 'barrel');
        if (!inAnyGap(bossX - 2, spec.gaps)) level.putHazard(bossX - 2, 12, 'cylinder');
    }

    /* Создаём загрузчики всех 10 уровней и связываем цепочку 1-1 -> 1-2 -> ... -> 1-10 */
    var loaders = {};
    for (var i = CAMPAIGN_SPECS.length - 1; i >= 0; i--) {
        (function (spec) {
            var nextFn = loaders[spec.num + 1] || null;
            var fn = function () {
                buildCampaignLevel(spec, fn, nextFn);
            };
            loaders[spec.num] = fn;
            Mario['level_' + spec.num] = fn;
        })(CAMPAIGN_SPECS[i]);
    }

    /* Обратная совместимость с Mario.one_two (1-2) */
    window.one_two = Mario.one_two = loaders[2];
    Mario.level_1 = Mario.oneone;

    Mario.LEVELS = [
        { num: 1, name: '1-1', title: 'ГРИБНОЕ КОРОЛЕВСТВО · СТАРТ', loader: function () { return Mario.oneone(); } }
    ];
    CAMPAIGN_SPECS.forEach(function (spec) {
        Mario.LEVELS.push({
            num: spec.num,
            name: spec.name,
            title: spec.title,
            loader: loaders[spec.num]
        });
    });
})();
