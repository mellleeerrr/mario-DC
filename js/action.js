/*
 * Action Expansion v3:
 *  1. 22 Playable Characters (10 DC Justice League/Batman + 10 Marvel + Terminator T-800 + Mario)
 *  2. Full Explosion Physics Engine (radius falloff curve, mass-based impulse, shockwave,
 *     layered flash->fire->smoke->embers, pooled physical debris, scorch craters,
 *     destructible blocks, and 0.12-0.28s chain reactions + secondary aircraft/boss explosions)
 *  3. 22 Unique Z-Abilities (Table 2.1 TZ v3) with cooldowns, energy, level scaling, and HUD icons
 *  4. Explosive Hazards (Barrels, Gas Cylinders, Mines), Pickups (Medkit, Energy, Armor, CDR),
 *     Checkpoints, Helicopters, Fighter Jets, and Sector Bosses.
 */
(function () {
    window.Mario = window.Mario || {};

    function makeCanvas(w, h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        return { canvas: c, g: g };
    }

    function px(g, x, y, w, h, col) {
        g.fillStyle = col;
        g.fillRect(x, y, w, h);
    }

    /* ================================================================== */
    /* 1. ROSTER OF 22 HEROES + UNIQUE Z-ABILITIES (Table 2.1 TZ v3)      */
    /* ================================================================== */

    var HEROES = [
        /* 1. Бэтмен */
        {
            id: 'BATMAN', name: 'БЭТМЕН', universe: 'DC · ЛИГА СПРАВЕДЛИВОСТИ',
            weaponName: 'БЭТАРАНГИ', zName: 'ВЗРЫВНОЙ БЭТАРАНГ', zCooldown: 6, zCost: 30, zRange: 'СРЕДНЯЯ', zDmgType: 'explosive',
            color: '#ffd83d', accent: '#2b3548',
            speedMul: 1.12, jumpMul: 1.08, fireRate: 6, projType: 'batarang', damage: 2, shake: 2.0,
            skin: '#f2c29b', mask: '#141821', suit: '#2e3748', cape: '#0d1017', belt: '#f5c518', ears: true, batEmblem: true, glide: true
        },
        /* 2. Супермен */
        {
            id: 'SUPERMAN', name: 'СУПЕРМЕН', universe: 'DC · ЛИГА СПРАВЕДЛИВОСТИ',
            weaponName: 'ЛУЧ ЗРЕНИЯ', zName: 'ТЕПЛОВОЕ ЗРЕНИЕ', zCooldown: 8, zCost: 35, zRange: 'ДАЛЬНЯЯ', zDmgType: 'energy',
            color: '#ff3b3b', accent: '#1e64dc',
            speedMul: 1.18, jumpMul: 1.16, fireRate: 5, projType: 'laser', damage: 2, shake: 2.5,
            skin: '#f4c49c', hair: '#181c26', suit: '#1858c8', cape: '#d81e28', belt: '#ffd83d', boots: '#d81e28', sShield: true, glide: true
        },
        /* 3. Чудо-женщина */
        {
            id: 'WONDER_WOMAN', name: 'ЧУДО-ЖЕНЩИНА', universe: 'DC · ЛИГА СПРАВЕДЛИВОСТИ',
            weaponName: 'ЛАССО И ЩИТ', zName: 'УДАР ЛАССО ИСТИНЫ', zCooldown: 7, zCost: 30, zRange: 'СРЕДНЯЯ', zDmgType: 'kinetic',
            color: '#ffd83d', accent: '#d82028',
            speedMul: 1.14, jumpMul: 1.12, fireRate: 6, projType: 'lasso', damage: 2, shake: 2.2,
            skin: '#f0bc94', hair: '#16141c', suit: '#c81d25', legs: '#1848a8', belt: '#ffd700', tiara: '#ffd700'
        },
        /* 4. Флэш */
        {
            id: 'FLASH', name: 'ФЛЭШ', universe: 'DC · ЛИГА СПРАВЕДЛИВОСТИ',
            weaponName: 'МОЛНИЯ', zName: 'РЫВОК СПИДФОРСА', zCooldown: 9, zCost: 35, zRange: 'ДЛИННАЯ', zDmgType: 'electric',
            color: '#ffe640', accent: '#e01b24',
            speedMul: 1.35, jumpMul: 1.08, fireRate: 4, projType: 'lightning', damage: 1, shake: 2.0,
            skin: '#f4c49c', mask: '#c8141e', suit: '#dc1c26', belt: '#ffd700', boots: '#ffd700', flashBolt: true
        },
        /* 5. Аквамен */
        {
            id: 'AQUAMAN', name: 'АКВАМЕН', universe: 'DC · ЛИГА СПРАВЕДЛИВОСТИ',
            weaponName: 'ТРЕЗУБЕЦ', zName: 'ВОЛНА ТРЕЗУБЦА', zCooldown: 7, zCost: 30, zRange: 'СРЕДНЯЯ', zDmgType: 'kinetic',
            color: '#38e8ff', accent: '#f5a623',
            speedMul: 1.10, jumpMul: 1.10, fireRate: 6, projType: 'trident', damage: 2, shake: 2.4,
            skin: '#eab68c', hair: '#d49b35', suit: '#e8961e', legs: '#1b7a43', belt: '#ffd700', trident: true
        },
        /* 6. Киборг */
        {
            id: 'CYBORG', name: 'КИБОРГ', universe: 'DC · ЛИГА СПРАВЕДЛИВОСТИ',
            weaponName: 'ИОННАЯ ПУШКА', zName: 'ЗВУКОВАЯ ПУШКА ЭМИ', zCooldown: 8, zCost: 35, zRange: 'СРЕДНЯЯ', zDmgType: 'electric',
            color: '#ff3838', accent: '#c0cad8',
            speedMul: 1.05, jumpMul: 1.06, fireRate: 5, projType: 'sonic', damage: 2, shake: 2.8,
            skin: '#6e4730', hair: '#181818', suit: '#b8c4d4', chest: '#e2eaf4', visor: '#ff1818', cyborgCore: true
        },
        /* 7. Зелёный Фонарь */
        {
            id: 'GREEN_LANTERN', name: 'ЗЕЛЁНЫЙ ФОНАРЬ', universe: 'DC · ЛИГА СПРАВЕДЛИВОСТИ',
            weaponName: 'КОЛЬЦО ОА', zName: 'ИЗУМРУДНЫЙ КОНСТРУКТ', zCooldown: 9, zCost: 40, zRange: 'СРЕДНЯЯ', zDmgType: 'energy',
            color: '#2dff7e', accent: '#128a42',
            speedMul: 1.12, jumpMul: 1.14, fireRate: 5, projType: 'construct', damage: 2, shake: 2.2,
            skin: '#f0c098', hair: '#4a2e1b', mask: '#127a3a', suit: '#18a852', chest: '#18a852', legs: '#141820', boots: '#18a852', lanternLogo: true, glide: true
        },
        /* 8. Шазам */
        {
            id: 'SHAZAM', name: 'ШАЗАМ', universe: 'DC · ЛИГА СПРАВЕДЛИВОСТИ',
            weaponName: 'РАЗРЯД ЗЕВСА', zName: 'ГРОМ ЖИВОЙ ВЕЧНОСТИ', zCooldown: 10, zCost: 40, zRange: 'ТОЧЕЧНАЯ', zDmgType: 'electric',
            color: '#fff066', accent: '#e01b24',
            speedMul: 1.15, jumpMul: 1.14, fireRate: 5, projType: 'lightning', damage: 2, shake: 2.6,
            skin: '#f2c29b', hair: '#1a1c24', suit: '#d81b24', cape: '#f4f6fa', belt: '#ffd700', boots: '#ffd700', flashBolt: true
        },
        /* 9. Джокер */
        {
            id: 'JOKER', name: 'ДЖОКЕР', universe: 'DC · ГОТЭМ',
            weaponName: 'КАРТЫ ХАОСА', zName: 'СМЕЮЩИЙСЯ ЗАРЯД', zCooldown: 6, zCost: 25, zRange: 'СРЕДНЯЯ', zDmgType: 'chaos',
            color: '#b84dff', accent: '#28d854',
            speedMul: 1.10, jumpMul: 1.06, fireRate: 5, projType: 'cards', damage: 1, shake: 1.8,
            skin: '#f4f6f8', hair: '#22c848', suit: '#7828b4', chest: '#e8961e', legs: '#5c1d8c'
        },
        /* 10. Харли Квинн */
        {
            id: 'HARLEY', name: 'ХАРЛИ КВИНН', universe: 'DC · ГОТЭМ',
            weaponName: 'ПОП-ПУШКА', zName: 'КУВАЛДА-СЮРПРИЗ', zCooldown: 5, zCost: 25, zRange: 'БЛИЖНЯЯ', zDmgType: 'explosive',
            color: '#ff4da6', accent: '#38b6ff',
            speedMul: 1.18, jumpMul: 1.12, fireRate: 5, projType: 'blast', damage: 2, shake: 2.4,
            skin: '#f8e8e0', hair: '#ff3878', suit: '#d81c38', legs: '#1e58c8', belt: '#ffd700'
        },
        /* 11. Железный Человек */
        {
            id: 'IRON_MAN', name: 'ЖЕЛЕЗНЫЙ ЧЕЛОВЕК', universe: 'MARVEL · МСТИТЕЛИ',
            weaponName: 'РЕПУЛЬСОРЫ', zName: 'РЕПУЛЬСОРНЫЙ ЗАЛП', zCooldown: 7, zCost: 35, zRange: 'СРЕДНЯЯ', zDmgType: 'energy',
            color: '#66f0ff', accent: '#e02028',
            speedMul: 1.16, jumpMul: 1.16, fireRate: 5, projType: 'repulsor', damage: 2, shake: 2.5,
            skin: '#f5c518', mask: '#c81c24', suit: '#d41e26', chest: '#d41e26', belt: '#f5c518', visor: '#78f4ff', arcReactor: true, glide: true
        },
        /* 12. Капитан Америка */
        {
            id: 'CAPTAIN_AMERICA', name: 'КАПИТАН АМЕРИКА', universe: 'MARVEL · МСТИТЕЛИ',
            weaponName: 'ЩИТ ВИБРАНИУМА', zName: 'РИКОШЕТ ЩИТА', zCooldown: 6, zCost: 25, zRange: 'СРЕДНЯЯ', zDmgType: 'kinetic',
            color: '#5ca8ff', accent: '#e0242c',
            speedMul: 1.15, jumpMul: 1.10, fireRate: 6, projType: 'shield', damage: 2, shake: 2.0,
            skin: '#f4c49c', mask: '#1c54b8', suit: '#1e5cc8', belt: '#d82028', boots: '#c81d25', starChest: true
        },
        /* 13. Тор */
        {
            id: 'THOR', name: 'ТОР', universe: 'MARVEL · МСТИТЕЛИ',
            weaponName: 'МЬЁЛЬНИР', zName: 'МЬЁЛЬНИР-МОЛНИЯ', zCooldown: 8, zCost: 35, zRange: 'ТОЧЕЧНАЯ', zDmgType: 'electric',
            color: '#78e8ff', accent: '#d81e28',
            speedMul: 1.12, jumpMul: 1.15, fireRate: 6, projType: 'hammer', damage: 3, shake: 3.2,
            skin: '#f2c29b', hair: '#f0c848', suit: '#283244', cape: '#c81c24', belt: '#ffd700', wings: true, glide: true
        },
        /* 14. Человек-паук */
        {
            id: 'SPIDER_MAN', name: 'ЧЕЛОВЕК-ПАУК', universe: 'MARVEL · МСТИТЕЛИ',
            weaponName: 'ПАУТИНА', zName: 'ПАУТИННЫЙ РЫВОК', zCooldown: 5, zCost: 25, zRange: 'СРЕДНЯЯ', zDmgType: 'kinetic',
            color: '#ffffff', accent: '#e01b24',
            speedMul: 1.24, jumpMul: 1.20, fireRate: 4, projType: 'web', damage: 1, shake: 1.4,
            skin: '#dc1c26', mask: '#dc1c26', suit: '#dc1c26', legs: '#184cc8', boots: '#dc1c26', spiderEyes: true
        },
        /* 15. Халк */
        {
            id: 'HULK', name: 'ХАЛК', universe: 'MARVEL · МСТИТЕЛИ',
            weaponName: 'ГАММА-УДАР', zName: 'ГАММА-ХЛОПОК', zCooldown: 9, zCost: 40, zRange: 'ШИРОКАЯ', zDmgType: 'explosive',
            color: '#58ff38', accent: '#7c38b8',
            speedMul: 1.08, jumpMul: 1.22, fireRate: 7, projType: 'gamma', damage: 3, shake: 4.0,
            skin: '#38b832', hair: '#162814', suit: '#38b832', legs: '#682ca8', boots: '#38b832', bulky: true
        },
        /* 16. Росомаха */
        {
            id: 'WOLVERINE', name: 'РОСОМАХА', universe: 'MARVEL · ЛЮДИ ИКС',
            weaponName: 'КОГТИ Х', zName: 'ЯРОСТНЫЙ РЫВОК', zCooldown: 6, zCost: 25, zRange: 'БЛИЖНЯЯ', zDmgType: 'kinetic',
            color: '#ffd83d', accent: '#1e5cc8',
            speedMul: 1.18, jumpMul: 1.10, fireRate: 4, projType: 'claws', damage: 2, shake: 2.4,
            skin: '#f0c098', mask: '#f5c518', suit: '#f5c518', legs: '#1c54b8', belt: '#c81d25', ears: true, claws: true
        },
        /* 17. Дэдпул */
        {
            id: 'DEADPOOL', name: 'ДЭДПУЛ', universe: 'MARVEL · ЛЮДИ ИКС',
            weaponName: 'КАТАНЫ И ПУЛИ', zName: 'ХАОС-ПОДАРОК', zCooldown: 6, zCost: 25, zRange: 'СРЕДНЯЯ', zDmgType: 'chaos',
            color: '#ff3848', accent: '#1e222a',
            speedMul: 1.20, jumpMul: 1.12, fireRate: 3, projType: 'bullet', damage: 1, shake: 1.8,
            skin: '#c81822', mask: '#c81822', suit: '#c81822', legs: '#181c24', belt: '#d8a828', spiderEyes: true
        },
        /* 18. Доктор Стрэндж */
        {
            id: 'DR_STRANGE', name: 'ДОКТОР СТРЭНДЖ', universe: 'MARVEL · МСТИТЕЛИ',
            weaponName: 'МАНДАЛЫ', zName: 'ЗАМЕДЛЕНИЕ ВРЕМЕНИ', zCooldown: 12, zCost: 45, zRange: 'СРЕДНЯЯ', zDmgType: 'energy',
            color: '#ffae28', accent: '#d81e28',
            speedMul: 1.10, jumpMul: 1.15, fireRate: 5, projType: 'mandala', damage: 2, shake: 2.2,
            skin: '#f0c098', hair: '#202430', suit: '#1a428a', cape: '#c81c24', belt: '#d89020', glide: true
        },
        /* 19. Чёрная Пантера */
        {
            id: 'BLACK_PANTHER', name: 'ЧЁРНАЯ ПАНТЕРА', universe: 'MARVEL · ВАКАНДА',
            weaponName: 'КОГТИ ВАКАНДЫ', zName: 'КИНЕТИЧЕСКИЙ РАЗРЯД', zCooldown: 7, zCost: 30, zRange: 'БЛИЖНЯЯ', zDmgType: 'energy',
            color: '#b458ff', accent: '#282c38',
            speedMul: 1.25, jumpMul: 1.18, fireRate: 4, projType: 'vibranium', damage: 2, shake: 2.2,
            skin: '#181a22', mask: '#14161e', suit: '#1c202c', legs: '#14161e', belt: '#c8d2e0', ears: true, necklace: true
        },
        /* 20. Веном */
        {
            id: 'VENOM', name: 'ВЕНОМ', universe: 'MARVEL · СИМБИОТ',
            weaponName: 'СИМБИОТ', zName: 'СИМБИОТ-РЫВОК', zCooldown: 7, zCost: 30, zRange: 'СРЕДНЯЯ', zDmgType: 'kinetic',
            color: '#d8e4f0', accent: '#181c28',
            speedMul: 1.16, jumpMul: 1.18, fireRate: 5, projType: 'symbiote', damage: 2, shake: 2.8,
            skin: '#12151e', mask: '#12151e', suit: '#161a24', legs: '#12151e', spiderEyes: true, venomSymbol: true, bulky: true
        },
        /* 21. Терминатор T-800 */
        {
            id: 'TERMINATOR', name: 'ТЕРМИНАТОР T-800', universe: 'SPECIAL · СКАЙНЕТ',
            weaponName: 'МИНИГАН', zName: 'ПЛАЗМА-МИНИГАН + РАКЕТА', zCooldown: 8, zCost: 35, zRange: 'ДАЛЬНЯЯ', zDmgType: 'explosive',
            color: '#ff2222', accent: '#9aa4b2',
            speedMul: 0.98, jumpMul: 1.0, fireRate: 4, projType: 'plasma', damage: 2, shake: 3.0,
            skin: '#d2a684', hair: '#2a221d', suit: '#1b1d22', chest: '#4a525d', visor: '#ff1111', endo: true
        },
        /* 22. Марио */
        {
            id: 'MARIO', name: 'МАРИО', universe: 'CLASSIC · NINTENDO',
            weaponName: 'АК-47 / ФАЕРБОЛ', zName: 'СУПЕР-ЗВЕЗДА И ОГОНЬ', zCooldown: 8, zCost: 30, zRange: 'СРЕДНЯЯ', zDmgType: 'explosive',
            color: '#ff4040', accent: '#3b6eff',
            speedMul: 1.05, jumpMul: 1.05, fireRate: 6, projType: 'bullet', damage: 1, shake: 1.5
        }
    ];

    var heroMap = {};
    var heroSpriteCache = {};
    HEROES.forEach(function (h, idx) {
        h.index = idx;
        heroMap[h.id] = h;
    });

    /* Builds a detailed 24x32 3-frame animated pixel-art sheet (idle/walk/ability pose) for any hero. */
    function buildHeroCanvas(hero) {
        if (heroSpriteCache[hero.id]) return heroSpriteCache[hero.id];
        var W = 24, H = 32;
        var o = makeCanvas(W * 3, H);
        var g = o.g;

        for (var frame = 0; frame < 3; frame++) {
            var ox = frame * W;
            var bob = frame === 1 ? 1 : (frame === 2 ? -1 : 0);
            var stride = frame === 1 ? 2 : (frame === 2 ? 3 : 0);
            var isAbilityPose = (frame === 2);

            /* Светящаяся боевая аура в кадре Z-способности */
            if (isAbilityPose) {
                px(g, ox + 2, 2, 20, 28, 'rgba(255,255,255,0.16)');
            }

            /* 1. Плащ (для Бэтмена, Супермена, Тора, Шазама, Стрэнджа) */
            if (hero.cape) {
                var capeSpread = isAbilityPose ? 2 : 0;
                px(g, ox + 2 - capeSpread, 10 + bob, 6 + capeSpread, 17, hero.cape);
                px(g, ox + 1, 14 + bob, 5, 13 - stride, hero.cape);
                if (hero.id === 'BATMAN') {
                    px(g, ox + 1, 26, 2, 3, hero.cape);
                    px(g, ox + 4, 26, 2, 3, hero.cape);
                    px(g, ox + 7, 26, 2, 2, hero.cape);
                }
            }

            /* 2. Уши маски Бэтмена / Пантеры / Росомахи или крылья шлема Тора */
            if (hero.ears) {
                var earCol = hero.mask || hero.suit;
                px(g, ox + 7, 1 + bob, 2, 4, earCol);
                px(g, ox + 14, 1 + bob, 2, 4, earCol);
            }
            if (hero.wings) {
                px(g, ox + 5, 2 + bob, 2, 4, '#f0f4ff');
                px(g, ox + 16, 2 + bob, 2, 4, '#f0f4ff');
            }

            /* 3. Голова / шлем / причёска */
            var headColor = hero.mask || hero.skin || '#f2c29b';
            px(g, ox + 7, 4 + bob, 10, 8, headColor);

            if (hero.hair && !hero.mask) {
                px(g, ox + 7, 3 + bob, 10, 3, hero.hair);
                px(g, ox + 6, 4 + bob, 2, 4, hero.hair);
                if (hero.id === 'SUPERMAN') {
                    px(g, ox + 13, 6 + bob, 2, 2, hero.hair);
                }
            }

            if (hero.id === 'BATMAN') {
                px(g, ox + 9, 9 + bob, 7, 3, hero.skin);
                px(g, ox + 12, 7 + bob, 3, 1, isAbilityPose ? '#ffd83d' : '#ffffff');
            } else if (hero.spiderEyes) {
                px(g, ox + 11, 6 + bob, 5, 3, '#ffffff');
                px(g, ox + 11, 6 + bob, 1, 3, '#10141c');
                if (hero.id === 'VENOM') {
                    px(g, ox + 10, 10 + bob, 6, 2, '#ffffff');
                    px(g, ox + 12, 11 + bob, 4, 1, '#ff3858');
                }
            } else if (hero.visor) {
                px(g, ox + 11, 7 + bob, 5, 2, hero.visor);
                if (hero.endo) {
                    px(g, ox + 12, 5 + bob, 4, 6, '#b8c2cc');
                    px(g, ox + 13, 7 + bob, 3, 2, '#ff1111');
                }
            } else {
                px(g, ox + 13, 7 + bob, 2, 2, isAbilityPose ? hero.color : '#141820');
                px(g, ox + 12, 7 + bob, 1, 2, '#ffffff');
            }

            if (hero.tiara) {
                px(g, ox + 8, 4 + bob, 8, 2, hero.tiara);
                px(g, ox + 12, 4 + bob, 2, 2, '#ff2028');
            }

            /* 4. Торс и броня */
            var torsoW = hero.bulky ? 12 : 10;
            var torsoX = hero.bulky ? 6 : 7;
            px(g, ox + torsoX, 12 + bob, torsoW, 10, hero.suit);
            if (hero.chest) {
                px(g, ox + torsoX + 2, 13 + bob, torsoW - 4, 7, hero.chest);
            }

            if (hero.batEmblem) {
                px(g, ox + 9, 14 + bob, 6, 3, '#f5c518');
                px(g, ox + 10, 14 + bob, 4, 2, '#10141c');
            }
            if (hero.sShield) {
                px(g, ox + 9, 13 + bob, 6, 4, '#ffd83d');
                px(g, ox + 10, 14 + bob, 4, 2, '#d81e28');
            }
            if (hero.flashBolt) {
                px(g, ox + 11, 13 + bob, 3, 2, '#ffd700');
                px(g, ox + 10, 15 + bob, 3, 2, '#ffd700');
            }
            if (hero.cyborgCore) {
                px(g, ox + 10, 14 + bob, 4, 4, '#ff2020');
                px(g, ox + 11, 15 + bob, 2, 2, '#ffffff');
            }
            if (hero.lanternLogo) {
                px(g, ox + 9, 13 + bob, 5, 5, '#ffffff');
                px(g, ox + 10, 14 + bob, 3, 3, '#2dff7e');
            }
            if (hero.arcReactor) {
                px(g, ox + 10, 14 + bob, 4, 3, '#8ef7ff');
                px(g, ox + 11, 14 + bob, 2, 2, '#ffffff');
            }
            if (hero.starChest) {
                px(g, ox + 11, 14 + bob, 3, 3, '#ffffff');
                px(g, ox + 8, 18 + bob, 8, 2, '#ffffff');
                px(g, ox + 9, 18 + bob, 2, 2, '#d82028');
                px(g, ox + 13, 18 + bob, 2, 2, '#d82028');
            }
            if (hero.necklace) {
                px(g, ox + 8, 12 + bob, 8, 2, '#d8e2f0');
            }
            if (hero.venomSymbol) {
                px(g, ox + 8, 14 + bob, 8, 4, '#ffffff');
            }

            if (hero.belt) {
                px(g, ox + torsoX, 20 + bob, torsoW, 2, hero.belt);
            }

            /* Руки (в кадре Z-способности вытянуты вперёд со вспышкой энергии) */
            px(g, ox + torsoX - 2, 13 + bob, 2, 6, hero.suit);
            if (isAbilityPose) {
                px(g, ox + torsoX + torsoW, 11 + bob, 5, 3, hero.suit);
                px(g, ox + torsoX + torsoW + 4, 10 + bob, 3, 5, hero.color);
            } else {
                px(g, ox + torsoX + torsoW, 13 + bob, 2, 6, hero.suit);
            }

            if (hero.claws) {
                px(g, ox + torsoX + torsoW + 2, 15 + bob, 3, 1, '#e8f0f8');
                px(g, ox + torsoX + torsoW + 2, 17 + bob, 3, 1, '#e8f0f8');
            }
            if (hero.trident) {
                px(g, ox + 18, 6 + bob, 2, 22, '#ffd700');
                px(g, ox + 16, 5 + bob, 6, 2, '#ffd700');
            }

            /* 5. Ноги и сапоги */
            var legCol = hero.legs || hero.suit;
            var bootCol = hero.boots || hero.accent || '#182030';
            px(g, ox + 8 - stride, 22, 4, 6, legCol);
            px(g, ox + 12 + stride, 22, 4, 6, legCol);
            px(g, ox + 8 - stride, 28, 4, 4, bootCol);
            px(g, ox + 12 + stride, 28, 4, 4, bootCol);
        }

        heroSpriteCache[hero.id] = o.canvas;
        return o.canvas;
    }

    /* ================================================================== */
    /* 2. EXPLOSION PHYSICS ENGINE (Пул, Ударная волна, Осколки, Цепные)  */
    /* ================================================================== */

    var MAX_ACTIVE_EXPLOSIONS = 12;
    var MAX_DEBRIS = 96;
    var MAX_SCORCH = 24;

    var ExplosionSystem = Mario.ExplosionSystem = {
        active: [],
        delayed: [],
        debris: [],
        scorchMarks: [],
        abilityWaves: [],
        firePatches: [],

        reset: function () {
            this.active.length = 0;
            this.delayed.length = 0;
            this.debris.length = 0;
            this.scorchMarks.length = 0;
            this.abilityWaves.length = 0;
            this.firePatches.length = 0;
        },

        schedule: function (delaySec, opts) {
            this.delayed.push({ timer: delaySec, opts: opts });
        },

        spawnFirePatch: function (x, y, dur) {
            if (this.firePatches.length >= 16) this.firePatches.shift();
            this.firePatches.push({
                x: Math.round(x),
                y: Math.min(206, Math.max(176, Math.round(y))),
                w: 22,
                t: dur || 4.0,
                tick: 0.25
            });
        },

        /*
         * Main explosion entry point:
         * opts: { x, y, radius, damage, impulse, color, type, dmgType, hurtPlayer, chainDepth, secondary, wet, gas, freeze, burn }
         */
        trigger: function (opts) {
            opts = opts || {};
            var x = opts.x || 0;
            var y = opts.y || 0;
            var radius = opts.radius || 44;
            var damage = opts.damage !== undefined ? opts.damage : 2.5;
            var impulse = opts.impulse !== undefined ? opts.impulse : 4.5;
            var color = opts.color || '#ffe040';
            var type = opts.type || 'standard';
            var dmgType = opts.dmgType || (type === 'emp' ? 'electric' : 'explosive');
            var chainDepth = opts.chainDepth || 0;

            /* 1. Звук и вибрация экрана с затуханием по расстоянию */
            if (Mario.Audio && Mario.Audio.playExplosion) {
                Mario.Audio.playExplosion(x, radius / 40);
            }
            if (window.game && window.game.shakeAt) {
                window.game.shakeAt(x, y, Math.min(8, (radius / 10) * 1.15), Math.min(0.48, 0.16 + radius * 0.003));
            }

            /* 2. След / воронка на земле + распространение огня по земле */
            if (y >= 164) {
                if (this.scorchMarks.length >= MAX_SCORCH) this.scorchMarks.shift();
                this.scorchMarks.push({
                    x: x,
                    y: Math.min(208, Math.max(192, Math.round(y))),
                    w: Math.min(36, Math.round(radius * 0.65)),
                    t: 3.5
                });
                if ((opts.burn || type === 'hazard' || type === 'vehicle') && chainDepth < 2) {
                    this.spawnFirePatch(x, 204, 3.8);
                }
            }

            /* 3. Многослойное разрушаемое окружение: кирпичные и бетонные блоки в радиусе взрыва */
            if (typeof level !== 'undefined' && level && level.blocks) {
                var tx0 = Math.max(0, Math.floor((x - radius * 0.75) / 16));
                var tx1 = Math.floor((x + radius * 0.75) / 16);
                var ty0 = Math.max(0, Math.floor((y - radius * 0.75) / 16));
                var ty1 = Math.min(14, Math.floor((y + radius * 0.75) / 16));
                for (var ty = ty0; ty <= ty1; ty++) {
                    var row = level.blocks[ty];
                    if (!row) continue;
                    for (var tx = tx0; tx <= tx1; tx++) {
                        var bl = row[tx];
                        if (bl && !bl.dead) {
                            var bx = tx * 16 + 8, by = ty * 16 + 8;
                            var bDist = Math.hypot(bx - x, by - y);
                            if (bDist <= radius * 0.8) {
                                if (bl.damageBlock) bl.damageBlock(Math.max(1, Math.round(damage * 0.6)));
                                else if (bl.breakable) bl.break();
                                else bl.bonk(1);
                            }
                        }
                    }
                }
            }

            /* 4. Кривая падения урона и импульса от центра к краю + Стихийные реакции + Цепная детонация */
            if (typeof level !== 'undefined' && level) {
                var enemies = level.enemies || [];
                for (var i = 0; i < enemies.length; i++) {
                    var e = enemies[i];
                    if (!e || e.dead || e.flipped) continue;
                    var ehb = e.hitbox || [0, 0, 16, 16];
                    var ex = e.pos[0] + ehb[0] + ehb[2] * 0.5;
                    var ey = e.pos[1] + ehb[1] + ehb[3] * 0.5;
                    var dx = ex - x;
                    var dy = ey - y;
                    var isAircraft = (Mario.Helicopter && e instanceof Mario.Helicopter) || (Mario.Jet && e instanceof Mario.Jet);
                    var dist = isAircraft ? Math.hypot(dx, dy * 0.45) : Math.hypot(dx, dy);
                    if (dist <= radius) {
                        var falloff = Math.pow(Math.max(0.15, 1 - dist / radius), 1.35);
                        var effDmg = damage * falloff;
                        var mass = e.mass || 1.0;
                        var dirX = dx === 0 ? (Math.random() > 0.5 ? 1 : -1) : (dx / Math.max(1, dist));
                        var vx = (dirX * impulse * falloff) / mass;
                        var vy = (-impulse * 0.75 * falloff) / mass;

                        if (e.hitByWeapon) {
                            e.hitByWeapon(effDmg, {
                                vx: vx,
                                vy: vy,
                                stun: opts.stun ? opts.stun * falloff : 0,
                                slow: opts.slow ? opts.slow * falloff : 0,
                                panic: opts.panic ? opts.panic * falloff : 0,
                                freeze: opts.freeze ? opts.freeze * falloff : 0,
                                wet: opts.wet ? opts.wet * falloff : 0,
                                gas: opts.gas ? opts.gas * falloff : 0,
                                bleed: opts.burn,
                                emp: opts.emp,
                                dmgType: dmgType
                            });
                        } else if (e.applyImpulse) {
                            e.applyImpulse(vx, vy, effDmg);
                        }
                    }
                }

                /* Цепная реакция: Бочка -> Газ/Масло -> Машина -> Вертолёт -> Босс */
                var items = level.items || [];
                for (var j = 0; j < items.length; j++) {
                    var it = items[j];
                    if (!it || it.dead) continue;
                    if (it instanceof Mario.Hazard && !it.triggered) {
                        var hDist = Math.hypot((it.pos[0] + 8) - x, (it.pos[1] + 8) - y);
                        if (hDist <= radius + 14) {
                            it.triggerFuse(0.12 + Math.min(0.16, (hDist / radius) * 0.14), chainDepth + 1);
                        }
                    }
                }

                if (typeof cars !== 'undefined' && cars && chainDepth < 3) {
                    for (var cc = 0; cc < cars.length; cc++) {
                        var carObj = cars[cc];
                        if (carObj && !carObj.dead && !carObj.driver) {
                            var cDist = Math.hypot((carObj.pos[0] + 30) - x, (carObj.pos[1] + 13) - y);
                            if (cDist <= radius + 16 && carObj.hitByWeapon) {
                                carObj.hitByWeapon(damage * 1.5);
                            }
                        }
                    }
                }
            }

            /* Урон и отброс игрока от вражеских бомб (с учётом окна парирования X!) */
            if (opts.hurtPlayer && typeof player !== 'undefined' && player && !player.dying && !player.piping) {
                var pxCenter = player.pos[0] + 8;
                var pyCenter = player.pos[1] + (player.hitbox ? player.hitbox[3] * 0.5 : 8);
                var pDist = Math.hypot(pxCenter - x, pyCenter - y);
                if (pDist <= radius * 0.85) {
                    if (player.parryTimer > 0 && player.onParrySuccess) {
                        player.onParrySuccess(null);
                    } else {
                        var pFall = Math.pow(Math.max(0.2, 1 - pDist / radius), 1.35);
                        var pDir = pxCenter >= x ? 1 : -1;
                        player.vel[0] = pDir * Math.min(3.5, impulse * 0.55 * pFall);
                        player.vel[1] = -Math.min(4.0, impulse * 0.5 * pFall);
                        player.takeExplosionDamage(Math.ceil(22 * pFall));
                    }
                }
            }

            /* 5. Вторичные детонации для вертолётов, самолётов, машин и боссов */
            if (opts.secondary && chainDepth < 2) {
                this.schedule(0.15, {
                    x: x + (Math.random() * 28 - 14),
                    y: y + (Math.random() * 18 - 9),
                    radius: radius * 0.72,
                    damage: damage * 0.6,
                    impulse: impulse * 0.7,
                    color: '#ff7828',
                    type: 'secondary',
                    dmgType: dmgType,
                    chainDepth: chainDepth + 1
                });
            }

            /* 6. Визуал и осколки с учётом LOD, лимитов и настройки интенсивности эффектов (vfxIntensity) */
            var viewW = (typeof VW !== 'undefined') ? VW : 432;
            var camX = (typeof vX !== 'undefined') ? vX : 0;
            var onScreen = (x >= camX - 64 && x <= camX + viewW + 64);
            if (!onScreen) return;

            var vfxMul = (window.game && window.game.vfxIntensity) ? window.game.vfxIntensity : 1.0;
            var simplified = this.active.length >= MAX_ACTIVE_EXPLOSIONS || vfxMul <= 0.4;
            if (this.active.length >= MAX_ACTIVE_EXPLOSIONS) {
                this.active.shift();
            }

            var smokePuffs = [];
            var puffCount = Math.max(2, Math.round((simplified ? 3 : 7) * vfxMul));
            for (var s = 0; s < puffCount; s++) {
                var ang = (Math.PI * 2 * s) / puffCount;
                var spd = (0.7 + (s % 3) * 0.45) * (radius / 36);
                smokePuffs.push({
                    dx: Math.cos(ang) * 4,
                    dy: Math.sin(ang) * 4,
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd - 0.35,
                    size: 4 + (s % 3) * 2,
                    ember: s % 2 === 0
                });
            }

            this.active.push({
                x: x,
                y: y,
                radius: radius,
                color: color,
                type: type,
                t: 0,
                maxT: simplified ? 0.28 : 0.48,
                puffs: smokePuffs
            });

            var debrisCount = Math.max(1, Math.round((simplified ? 3 : Math.min(10, Math.round(radius / 6))) * vfxMul));
            for (var d = 0; d < debrisCount; d++) {
                if (this.debris.length >= MAX_DEBRIS) this.debris.shift();
                var dAng = -Math.PI * 0.15 - (Math.PI * 0.7 * (d / Math.max(1, debrisCount - 1)));
                var dSpd = 1.8 + (d % 4) * 0.85;
                this.debris.push({
                    x: x,
                    y: y,
                    vx: Math.cos(dAng) * dSpd * (d % 2 === 0 ? 1 : -1),
                    vy: Math.sin(dAng) * dSpd - 1.2,
                    life: 0.9 + (d % 3) * 0.35,
                    maxLife: 1.4,
                    color: d % 3 === 0 ? color : (d % 2 === 0 ? '#ff6820' : '#4a525d'),
                    burning: d % 2 === 0
                });
            }
        },

        addAbilityWave: function (wave) {
            this.abilityWaves.push(wave);
        },

        update: function (dt, vX) {
            var viewW = (typeof VW !== 'undefined') ? VW : 432;

            /* Отложенные цепные и вторичные взрывы */
            for (var d = this.delayed.length - 1; d >= 0; d--) {
                var item = this.delayed[d];
                item.timer -= dt;
                if (item.timer <= 0) {
                    this.delayed.splice(d, 1);
                    this.trigger(item.opts);
                }
            }

            /* Лужи горящего масла / напалма на земле (распространение огня) */
            for (var fp = this.firePatches.length - 1; fp >= 0; fp--) {
                var patch = this.firePatches[fp];
                patch.t -= dt;
                patch.tick -= dt;
                if (patch.tick <= 0) {
                    patch.tick = 0.45;
                    if (typeof level !== 'undefined' && level && level.enemies) {
                        for (var ei = 0; ei < level.enemies.length; ei++) {
                            var en = level.enemies[ei];
                            if (en && !en.dead && Math.abs((en.pos[0] + 8) - patch.x) <= patch.w * 0.65 && Math.abs(en.pos[1] - patch.y) <= 24) {
                                if (en.hitByWeapon) en.hitByWeapon(0.7, { bleed: true, dmgType: 'explosive' });
                            }
                        }
                    }
                }
                if (patch.t <= 0) this.firePatches.splice(fp, 1);
            }

            /* Активные многослойные взрывы (flash -> fire -> smoke -> embers) */
            for (var i = this.active.length - 1; i >= 0; i--) {
                var ex = this.active[i];
                ex.t += dt;
                for (var p = 0; p < ex.puffs.length; p++) {
                    var pf = ex.puffs[p];
                    pf.dx += pf.vx;
                    pf.dy += pf.vy;
                    pf.vx *= 0.96;
                    pf.vy -= 0.02;
                }
                if (ex.t >= ex.maxT) {
                    this.active.splice(i, 1);
                }
            }

            /* Физика осколков (отключается за пределами экрана) */
            for (var k = this.debris.length - 1; k >= 0; k--) {
                var db = this.debris[k];
                db.life -= dt;
                if (db.life <= 0 || db.x < vX - 48 || db.x > vX + viewW + 48 || db.y > 244) {
                    this.debris.splice(k, 1);
                    continue;
                }
                db.vy += 0.22;
                db.x += db.vx;
                db.y += db.vy;
                if (db.y >= 204 && db.vy > 0) {
                    db.y = 204;
                    db.vy = -db.vy * 0.42;
                    db.vx *= 0.72;
                }
            }

            /* Следы нагара на земле */
            for (var s = this.scorchMarks.length - 1; s >= 0; s--) {
                this.scorchMarks[s].t -= dt;
                if (this.scorchMarks[s].t <= 0) this.scorchMarks.splice(s, 1);
            }

            /* Визуальные волны способностей (лучи, купола, молнии, конструкты, напарники) */
            for (var w = this.abilityWaves.length - 1; w >= 0; w--) {
                var wv = this.abilityWaves[w];
                wv.t += dt;
                if (wv.onUpdate) wv.onUpdate(dt, wv);
                if (wv.t >= wv.maxT) {
                    this.abilityWaves.splice(w, 1);
                }
            }
        },

        render: function (ctx, vX, vY) {
            /* 1. Воронки / следы нагара на земле */
            for (var s = 0; s < this.scorchMarks.length; s++) {
                var sm = this.scorchMarks[s];
                var sx = Math.round(sm.x - vX - sm.w / 2);
                var sy = Math.round(sm.y - vY);
                ctx.fillStyle = 'rgba(18, 16, 22, 0.65)';
                ctx.fillRect(sx, sy, sm.w, 3);
                ctx.fillStyle = 'rgba(255, 96, 32, 0.35)';
                ctx.fillRect(sx + 4, sy, Math.max(4, sm.w - 8), 2);
            }

            /* 1b. Горящие лужи огня */
            for (var fp = 0; fp < this.firePatches.length; fp++) {
                var pt = this.firePatches[fp];
                var fx = Math.round(pt.x - vX - pt.w / 2);
                var fy = Math.round(pt.y - vY);
                var flick = Math.floor(pt.t * 16) % 2;
                ctx.fillStyle = '#ff4818';
                ctx.fillRect(fx, fy - 2, pt.w, 3);
                ctx.fillStyle = '#ffe040';
                ctx.fillRect(fx + 3 + flick * 2, fy - 5, pt.w - 6, 3);
            }

            /* 2. Эффекты способностей (Z, X, Ульта C, Team-Up T) */
            for (var w = 0; w < this.abilityWaves.length; w++) {
                var wv = this.abilityWaves[w];
                if (wv.onRender) wv.onRender(ctx, vX, vY, wv);
            }

            /* 3. Слои взрывов: Ударная волна + Flash -> Fire -> Smoke -> Embers */
            for (var i = 0; i < this.active.length; i++) {
                var ex = this.active[i];
                var prog = ex.t / ex.maxT;
                var cx = Math.round(ex.x - vX);
                var cy = Math.round(ex.y - vY);

                var ringR = Math.round(ex.radius * Math.min(1, prog * 1.45));
                ctx.fillStyle = ex.color;
                ctx.fillRect(cx - ringR, cy - 2, 4, 4);
                ctx.fillRect(cx + ringR - 4, cy - 2, 4, 4);
                ctx.fillRect(cx - 2, cy - ringR, 4, 4);
                ctx.fillRect(cx - 2, cy + ringR - 4, 4, 4);

                var coreR = Math.max(3, Math.round((1 - prog * 0.65) * (ex.radius * 0.42)));
                if (prog < 0.22) {
                    ctx.fillStyle = '#ffffff';
                } else if (prog < 0.58) {
                    ctx.fillStyle = ex.color;
                } else {
                    ctx.fillStyle = '#3b3842';
                }
                ctx.fillRect(cx - coreR, cy - coreR, coreR * 2, coreR * 2);

                for (var p = 0; p < ex.puffs.length; p++) {
                    var pf = ex.puffs[p];
                    var pxPos = Math.round(cx + pf.dx);
                    var pyPos = Math.round(cy + pf.dy);
                    ctx.fillStyle = prog < 0.45 ? (pf.ember ? ex.color : '#ff5820') : '#45424f';
                    ctx.fillRect(pxPos, pyPos, pf.size, pf.size);
                    if (pf.ember && prog < 0.85) {
                        ctx.fillStyle = '#fff080';
                        ctx.fillRect(pxPos + 1, pyPos - 2, 2, 2);
                    }
                }
            }

            /* 4. Физические осколки и горящие обломки */
            for (var k = 0; k < this.debris.length; k++) {
                var db = this.debris[k];
                var dx = Math.round(db.x - vX);
                var dy = Math.round(db.y - vY);
                ctx.fillStyle = db.color;
                ctx.fillRect(dx, dy, 3, 3);
                if (db.burning) {
                    ctx.fillStyle = '#fff090';
                    ctx.fillRect(dx, dy - 1, 2, 1);
                }
            }
        }
    };

    /* ================================================================== */
    /* 3. Z-ABILITY SYSTEM (Уникальные способности всех 22 персонажей)    */
    /* ================================================================== */

    var AbilityManager = Mario.AbilityManager = {
        getHeroPowerScale: function (p) {
            var lvlNum = (window.game && window.game.selectedLevelNum) ? window.game.selectedLevelNum : 1;
            var rank = (p && p.masteryRank) ? p.masteryRank : 1;
            var scale = 1 + (lvlNum - 1) * 0.08 + (rank - 1) * 0.08;
            var weather = (typeof level !== 'undefined' && level && level.weather) ? level.weather : 'clear';
            var hid = (p && p.hero) ? p.hero.id : '';
            if (weather === 'storm' && (hid === 'THOR' || hid === 'FLASH' || hid === 'SHAZAM' || hid === 'CYBORG')) {
                scale *= 1.3;
            } else if (weather === 'night' && (hid === 'BATMAN' || hid === 'BLACK_PANTHER' || hid === 'WOLVERINE' || hid === 'VENOM')) {
                scale *= 1.3;
            } else if (weather === 'clear' && (hid === 'SUPERMAN' || hid === 'GREEN_LANTERN' || hid === 'WONDER_WOMAN')) {
                scale *= 1.25;
            }
            return scale;
        },

        activate: function (p) {
            if (!p || !p.hero || p.dying || p.piping) return false;
            var h = p.hero;
            if (p.zCooldown > 0) {
                if (window.game) window.game.popup('Z КД ' + Math.ceil(p.zCooldown) + 'С (R - ПЕРЕЗАРЯДКА)', p.pos[0], p.pos[1] - 14, '#94a6d0');
                return false;
            }
            var cost = h.zCost || 25;
            if (p.energy < cost) {
                if (window.game) window.game.popup('МАЛО ЭНЕРГИИ Z! (НАЖМИ R)', p.pos[0], p.pos[1] - 14, '#ff6060');
                return false;
            }

            p.energy = Math.max(0, p.energy - cost);
            var rankCdr = Math.max(0.72, 1 - ((p.masteryRank || 1) - 1) * 0.06);
            p.zCooldown = Math.max(2.5, (h.zCooldown || 6) * rankCdr);
            p.zMaxCooldown = p.zCooldown;
            p.abilityAnimTimer = 0.42;
            if (p.syncHeroState) p.syncHeroState();

            var scale = this.getHeroPowerScale(p);
            var dir = p.left ? -1 : 1;
            var cx = p.pos[0] + 8;
            var cy = p.pos[1] + (p.hitbox ? p.hitbox[3] * 0.5 : 10);

            if (window.game) {
                window.game.popup('Z: ' + h.zName + '!', p.pos[0] - 8, p.pos[1] - 20, h.color);
            }

            var aimUp = !!(Mario.Input && Mario.Input.isDown('UP'));
            switch (h.id) {
                case 'BATMAN': {
                    /* 1. Взрывной Бэтаранг: веер из 3 бэтарангов с детонацией (на 3+ ранге — 5 бэтарангов) */
                    Mario.Audio.playAbility('dashZ');
                    var angles = (p.masteryRank >= 3) ? [-2.2, -1.1, 0, 1.1, 2.2] : [-1.6, 0, 1.6];
                    angles.forEach(function (vy) {
                        var proj = new Mario.HeroProjectile([cx + dir * 10, cy - 4], p.left, h, aimUp);
                        proj.vel[1] += vy * (aimUp ? 0.5 : 1);
                        proj.explosiveRadius = Math.round(42 * scale);
                        proj.damage = 3 * scale;
                        bullets.push(proj);
                    });
                    break;
                }

                case 'SUPERMAN': {
                    /* 2. Тепловое зрение: прожигающий луч по конусу на дальнюю дистанцию */
                    Mario.Audio.playAbility('laserZ');
                    this.castBeam(p, cx, cy - 4, dir, 210, 20, '#ff2828', '#fff090', 4 * scale, { burn: true });
                    break;
                }

                case 'WONDER_WOMAN': {
                    /* 3. Удар Лассо Истины: рывок с захватом, броском и станом */
                    Mario.Audio.playAbility('dashZ');
                    p.vel[0] = dir * 4.5;
                    p.invincibility = Math.max(p.invincibility, 35);
                    this.castLassoWave(p, cx, cy, dir, Math.round(92 * scale), 3.5 * scale);
                    break;
                }

                case 'FLASH': {
                    /* 4. Рывок Спидфорса: телепорт-рывок по линии + замедление врагов */
                    Mario.Audio.playAbility('thunder');
                    this.castSpeedforceDash(p, cx, cy, dir, Math.round(115 * scale), 3 * scale);
                    break;
                }

                case 'AQUAMAN': {
                    /* 5. Волна Трезубца: конус воды, смывающий врагов + статус ВОДА (под молнию!) */
                    Mario.Audio.playAbility('dashZ');
                    this.castTridentWave(p, cx, cy, dir, Math.round(130 * scale), 3.2 * scale);
                    break;
                }

                case 'CYBORG': {
                    /* 6. Звуковая пушка / ЭМИ: волна по площади, отключение техники */
                    Mario.Audio.playAbility('emp');
                    ExplosionSystem.trigger({
                        x: cx + dir * 24, y: cy,
                        radius: Math.round(96 * scale),
                        damage: 4.0 * scale,
                        impulse: 5.5,
                        color: '#68e8ff',
                        type: 'emp',
                        dmgType: 'electric',
                        stun: 3.5,
                        emp: true
                    });
                    break;
                }

                case 'GREEN_LANTERN': {
                    /* 7. Изумрудный конструкт: гигантский молот Оа с тяжёлым взрывом */
                    Mario.Audio.playAbility('laserZ');
                    this.castEmeraldHammer(p, cx + dir * 52, cy, Math.round(64 * scale), 4.5 * scale);
                    break;
                }

                case 'SHAZAM': {
                    /* 8. Гром Живой Вечности: мощная молния с неба + оглушение + взрыв */
                    Mario.Audio.playAbility('thunder');
                    this.castSkyLightning(cx + dir * 64, cy, Math.round(68 * scale), 5.0 * scale, '#fff066');
                    break;
                }

                case 'JOKER': {
                    /* 9. Смеющийся заряд: газовая бомба с хаосом/паникой + статус ГАЗ (под огонь!) */
                    Mario.Audio.playAbility('dashZ');
                    var jBomb = new Mario.HeroProjectile([cx + dir * 10, cy - 6], p.left, h, aimUp);
                    if (!aimUp) {
                        jBomb.vel = [dir * 5.2, -3.2];
                        jBomb.gravity = 0.18;
                    }
                    jBomb.explosiveRadius = Math.round(62 * scale);
                    jBomb.panic = 4.0;
                    jBomb.gas = 5.0;
                    jBomb.damage = 3.2 * scale;
                    bullets.push(jBomb);
                    break;
                }

                case 'HARLEY': {
                    /* 10. Кувалда-сюрприз: ближний удар с мощной взрывной детонацией */
                    Mario.Audio.playAbility('dashZ');
                    p.vel[0] = dir * 3.2;
                    p.vel[1] = -3.4;
                    ExplosionSystem.trigger({
                        x: cx + dir * 26, y: cy,
                        radius: Math.round(58 * scale),
                        damage: 4.2 * scale,
                        impulse: 6.2,
                        color: '#ff4da6',
                        type: 'ability',
                        dmgType: 'explosive',
                        secondary: true
                    });
                    break;
                }

                case 'IRON_MAN': {
                    /* 11. Репульсорный залп + Юнибим */
                    Mario.Audio.playAbility('laserZ');
                    this.castBeam(p, cx, cy - 2, dir, 195, 24, '#66f0ff', '#ffffff', 4.5 * scale, { explodeEnd: true, burn: true });
                    break;
                }

                case 'CAPTAIN_AMERICA': {
                    /* 12. Рикошет щита: отскоки по нескольким целям с вибраниум-волной */
                    Mario.Audio.playAbility('dashZ');
                    var sh = new Mario.HeroProjectile([cx + dir * 10, cy - 4], p.left, h, aimUp);
                    sh.ricochetLeft = 4 + (p.masteryRank || 1);
                    sh.explosiveRadius = Math.round(38 * scale);
                    sh.damage = 3.2 * scale;
                    bullets.push(sh);
                    break;
                }

                case 'THOR': {
                    /* 13. Мьёльнир-молния: удар с неба + шок + взрыв */
                    Mario.Audio.playAbility('thunder');
                    this.castSkyLightning(cx + dir * 56, cy, Math.round(74 * scale), 5.2 * scale, '#78e8ff');
                    break;
                }

                case 'SPIDER_MAN': {
                    /* 14. Паутинный рывок: подтяг + воздушный удар + стан паутиной */
                    Mario.Audio.playAbility('dashZ');
                    p.vel[0] = dir * 5.2;
                    p.vel[1] = -4.2;
                    p.invincibility = Math.max(p.invincibility, 35);
                    ExplosionSystem.trigger({
                        x: cx + dir * 36, y: cy,
                        radius: Math.round(56 * scale),
                        damage: 3.0 * scale,
                        impulse: 4.0,
                        color: '#ffffff',
                        dmgType: 'kinetic',
                        stun: 3.2
                    });
                    break;
                }

                case 'HULK': {
                    /* 15. Гамма-хлопок: широкая ударная волна + мощный отброс */
                    Mario.Audio.playAbility('thunder');
                    ExplosionSystem.trigger({
                        x: cx, y: cy,
                        radius: Math.round(108 * scale),
                        damage: 5.5 * scale,
                        impulse: 8.0,
                        color: '#58ff38',
                        type: 'gamma',
                        dmgType: 'explosive',
                        secondary: true
                    });
                    break;
                }

                case 'WOLVERINE': {
                    /* 16. Яростный рывок: серия ударов когтями + кровотечение */
                    Mario.Audio.playAbility('dashZ');
                    p.vel[0] = dir * 5.6;
                    p.invincibility = Math.max(p.invincibility, 40);
                    this.castClawFlurry(p, cx, cy, dir, Math.round(68 * scale), 4.0 * scale);
                    break;
                }

                case 'DEADPOOL': {
                    /* 17. Хаос-подарок: веер взрывных гранат + конфетти */
                    Mario.Audio.playAbility('dashZ');
                    [-4.2, -2.6, -1.2].forEach(function (vy, idx) {
                        var gProj = new Mario.HeroProjectile([cx + dir * 8, cy - 6], p.left, h, aimUp);
                        if (!aimUp) {
                            gProj.vel = [dir * (3.5 + idx * 1.4), vy];
                            gProj.gravity = 0.20;
                        }
                        gProj.explosiveRadius = Math.round(48 * scale);
                        gProj.damage = 3.0 * scale;
                        bullets.push(gProj);
                    });
                    break;
                }

                case 'DR_STRANGE': {
                    /* 18. Замедление времени: зона Глаза Агамотто замедляет всех врагов */
                    Mario.Audio.playAbility('timewarp');
                    this.castTimeDome(cx, cy, Math.round(128 * scale));
                    break;
                }

                case 'BLACK_PANTHER': {
                    /* 19. Кинетический разряд: накопленный вибраниум-импульс */
                    Mario.Audio.playAbility('emp');
                    p.invincibility = Math.max(p.invincibility, 35);
                    ExplosionSystem.trigger({
                        x: cx, y: cy,
                        radius: Math.round(78 * scale),
                        damage: 4.4 * scale,
                        impulse: 6.8,
                        color: '#b458ff',
                        type: 'kinetic',
                        dmgType: 'energy'
                    });
                    break;
                }

                case 'VENOM': {
                    /* 20. Симбиот-рывок: хлыст щупалец + захват */
                    Mario.Audio.playAbility('dashZ');
                    p.vel[0] = dir * 4.8;
                    this.castLassoWave(p, cx, cy, dir, Math.round(88 * scale), 4.0 * scale, '#181c28');
                    break;
                }

                case 'TERMINATOR': {
                    /* 21. Плазма-миниган + термобарическая ракета */
                    Mario.Audio.playAbility('laserZ');
                    for (var m = 0; m < 4; m++) {
                        var pb = new Mario.HeroProjectile([cx + dir * (10 + m * 8), cy - 3 + (m % 2) * 3], p.left, h, aimUp);
                        pb.damage = 2.2 * scale;
                        bullets.push(pb);
                    }
                    var rocket = new Mario.HeroProjectile([cx + dir * 14, cy - 2], p.left, h, aimUp);
                    rocket.explosiveRadius = Math.round(64 * scale);
                    rocket.damage = 4.8 * scale;
                    rocket.color = '#ff3820';
                    bullets.push(rocket);
                    break;
                }

                default: {
                    /* 22. Марио: Супер-звезда + огненный шторм */
                    Mario.Audio.play('powerup');
                    p.starTime = Math.max(p.starTime, 240);
                    [-2.2, -0.8, 0.8].forEach(function (vy) {
                        var fb = new Mario.HeroProjectile([cx + dir * 10, cy - 4], p.left, h, aimUp);
                        fb.vel[1] += vy * (aimUp ? 0.5 : 1);
                        fb.explosiveRadius = Math.round(42 * scale);
                        fb.damage = 3.0 * scale;
                        fb.color = '#ff6820';
                        bullets.push(fb);
                    });
                    break;
                }
            }
            return true;
        },

        /* ============================================================== */
        /* ВТОРАЯ СПОСОБНОСТЬ НА X: ТАКТИЧЕСКИЙ ПРИЁМ, ПАРИРОВАНИЕ,       */
        /* УКЛОНЕНИЕ И ДОБИВАНИЕ (FINISHER)                               */
        /* ============================================================== */
        activateTacticalX: function (p) {
            if (!p || !p.hero || p.dying || p.piping) return false;
            if (p.inAircraft && p.aircraft) {
                /* В угнанном вертолёте/истребителе X сбрасывает авиабомбу! */
                if (typeof level !== 'undefined' && level && level.items) {
                    var ac = p.aircraft;
                    var b = new Mario.Bomb([ac.pos[0] + 18, ac.pos[1] + 18], [ac.left ? -2.2 : 2.2, 2.2]);
                    b.friendly = true;
                    level.items.push(b);
                    Mario.Audio.play('kick');
                    if (window.game) window.game.popup('АВИАБОМБА!', ac.pos[0], ac.pos[1] - 10, '#ffe040');
                }
                return true;
            }
            if (p.xCooldown > 0) {
                if (window.game) window.game.popup('X КД ' + Math.ceil(p.xCooldown) + 'С', p.pos[0], p.pos[1] - 14, '#94a6d0');
                return false;
            }
            if (p.energy < 15) {
                if (window.game) window.game.popup('МАЛО ЭНЕРГИИ X!', p.pos[0], p.pos[1] - 14, '#ff6060');
                return false;
            }

            var h = p.hero;
            var dir = p.left ? -1 : 1;
            var cx = p.pos[0] + 8;
            var cy = p.pos[1] + (p.hitbox ? p.hitbox[3] * 0.5 : 10);
            var scale = this.getHeroPowerScale(p);

            p.energy = Math.max(0, p.energy - 15);
            p.xCooldown = 3.5;
            p.xMaxCooldown = 3.5;
            p.parryTimer = 0.38; /* Окно блока и идеального парирования! */
            p.invincibility = Math.max(p.invincibility, 24);
            p.abilityAnimTimer = 0.30;
            if (p.syncHeroState) p.syncHeroState();

            /* Проверка на ДОБИВАНИЕ (Finisher) раненого элитного врага или Босса рядом */
            if (typeof level !== 'undefined' && level && level.enemies) {
                for (var i = 0; i < level.enemies.length; i++) {
                    var e = level.enemies[i];
                    if (!e || e.dead || e.flipped) continue;
                    var dist = Math.hypot((e.pos[0] + 12) - cx, (e.pos[1] + 12) - cy);
                    var lowHp = (e.maxHp && e.hp <= Math.max(1.5, e.maxHp * 0.38));
                    if (dist <= 56 && lowHp) {
                        p.pos[0] = e.pos[0] - dir * 12;
                        p.invincibility = Math.max(p.invincibility, 55);
                        if (window.game) {
                            window.game.cinematicZoom = 1.18;
                            window.game.cinematicTimer = 0.42;
                            window.game.hitstopTimer = 0.08;
                            window.game.popup('ДОБИВАНИЕ! +35% УЛЬТА', e.pos[0] - 12, e.pos[1] - 22, '#ff38ff');
                        }
                        p.ultCharge = Math.min(100, (p.ultCharge || 0) + 35);
                        p.hp = Math.min(p.maxHp, p.hp + 15);
                        ExplosionSystem.trigger({
                            x: e.pos[0] + 12,
                            y: e.pos[1] + 12,
                            radius: 56,
                            damage: 9.0 * scale,
                            impulse: 7.0,
                            color: '#ff38ff',
                            dmgType: h.zDmgType || 'energy'
                        });
                        return true;
                    }
                }
            }

            /* Тактический приём X: рывок-уклонение + щит парирования + стихийный эффект (заморозка / вода / газ / шок) */
            Mario.Audio.playAbility('dashZ');
            p.vel[0] = dir * 4.4;
            var isFreeze = (h.id === 'SUPERMAN' || h.id === 'BATMAN' || h.id === 'DR_STRANGE' || h.id === 'AQUAMAN');
            var isGas = (h.id === 'JOKER' || h.id === 'DEADPOOL' || h.id === 'HARLEY');
            var isWet = (h.id === 'AQUAMAN');
            var xTitle = isFreeze ? 'X: КРИО-ЩИТ И ПАРИРОВАНИЕ!' : (isGas ? 'X: ГАЗОВЫЙ РЫВОК!' : 'X: УКЛОНЕНИЕ + ПАРИРОВАНИЕ!');
            if (window.game) {
                window.game.popup(xTitle, p.pos[0] - 8, p.pos[1] - 18, '#8ef7ff');
            }

            ExplosionSystem.trigger({
                x: cx + dir * 24,
                y: cy,
                radius: 48,
                damage: 2.2 * scale,
                impulse: 4.5,
                color: isFreeze ? '#5cecff' : (isGas ? '#58ff68' : h.color),
                dmgType: h.zDmgType || 'kinetic',
                freeze: isFreeze ? 3.2 : 0,
                wet: isWet ? 6.0 : 0,
                gas: isGas ? 6.0 : 0,
                stun: 1.4
            });
            return true;
        },

        /* ============================================================== */
        /* УЛЬТИМАТИВНАЯ СПОСОБНОСТЬ НА C (ПРИ ЗАРЯДЕ УЛЬТЫ 100%)         */
        /* ============================================================== */
        activateUltimateC: function (p) {
            if (!p || !p.hero || p.dying || p.piping) return false;
            if ((p.ultCharge || 0) < 100) return false;

            var h = p.hero;
            var scale = this.getHeroPowerScale(p);
            var dir = p.left ? -1 : 1;
            var cx = p.pos[0] + 8;
            var cy = p.pos[1] + 10;

            p.ultCharge = 0;
            p.invincibility = Math.max(p.invincibility, 90);
            p.abilityAnimTimer = 0.65;

            Mario.Audio.playAbility('thunder');
            if (window.game) {
                window.game.cinematicZoom = 1.22;
                window.game.cinematicTimer = 0.65;
                window.game.hitstopTimer = 0.11;
                window.game.shake(6.5, 0.45);
                window.game.popup('УЛЬТА C: ' + h.name + ' СВЕРХУДАР!', cx - 24, cy - 28, '#ffe040');
            }

            /* Каскад орбитальных/экранных ударов по всем целям в видимой зоне */
            for (var k = 0; k < 4; k++) {
                (function (idx) {
                    ExplosionSystem.schedule(idx * 0.10, {
                        x: cx + dir * (36 + idx * 48),
                        y: cy - (idx % 2) * 18,
                        radius: 84,
                        damage: 7.5 * scale,
                        impulse: 7.5,
                        color: idx % 2 === 0 ? h.color : '#ffe040',
                        type: 'ultimate',
                        dmgType: h.zDmgType || 'energy',
                        stun: 3.5,
                        burn: true,
                        secondary: idx === 3
                    });
                })(k);
            }

            this.castSkyLightning(cx + dir * 80, cy, 96, 8.0 * scale, h.color);
            return true;
        },

        /* ============================================================== */
        /* TEAM-UP СПОСОБНОСТЬ НА T: ДВА ГЕРОЯ РЯДОМ -> КОМБО-СИНЕРГИЯ!   */
        /* (Тор+Супермен, Железный Человек+Киборг, Халк+Терминатор и др.) */
        /* ============================================================== */
        activateTeamUp: function (p) {
            if (!p || !p.hero || p.dying || p.piping) return false;
            if ((p.teamUpCooldown || 0) > 0) {
                if (window.game) window.game.popup('НАПАРНИК КД ' + Math.ceil(p.teamUpCooldown) + 'С', p.pos[0], p.pos[1] - 14, '#94a6d0');
                return false;
            }

            var h = p.hero;
            var partnerId = 'SUPERMAN';
            var comboTitle = 'TEAM-UP: СОЮЗ ГЕРОЕВ!';
            var dmgType = 'energy';

            if (h.id === 'THOR' || h.id === 'SUPERMAN') {
                partnerId = (h.id === 'THOR') ? 'SUPERMAN' : 'THOR';
                comboTitle = 'КОМБО: ТОР + СУПЕРМЕН · ГРОМ КРИПТОНА!';
                dmgType = 'electric';
            } else if (h.id === 'IRON_MAN' || h.id === 'CYBORG') {
                partnerId = (h.id === 'IRON_MAN') ? 'CYBORG' : 'IRON_MAN';
                comboTitle = 'КОМБО: ЖЕЛЕЗНЫЙ ЧЕЛОВЕК + КИБОРГ · ГИПЕР-ЮНИБИМ!';
                dmgType = 'electric';
            } else if (h.id === 'HULK' || h.id === 'TERMINATOR') {
                partnerId = (h.id === 'HULK') ? 'TERMINATOR' : 'HULK';
                comboTitle = 'КОМБО: ХАЛК + ТЕРМИНАТОР · СУДНЫЙ ГАММА-ШТОРМ!';
                dmgType = 'explosive';
            } else if (h.id === 'BATMAN' || h.id === 'SPIDER_MAN') {
                partnerId = (h.id === 'BATMAN') ? 'SPIDER_MAN' : 'BATMAN';
                comboTitle = 'КОМБО: БЭТМЕН + ЧЕЛОВЕК-ПАУК · СЕТЬ НОЧИ!';
                dmgType = 'explosive';
            } else {
                var nextIdx = ((h.index || 0) + 1) % HEROES.length;
                partnerId = HEROES[nextIdx].id;
                comboTitle = 'TEAM-UP: ' + h.name + ' + ' + HEROES[nextIdx].name + '!';
            }

            var partner = heroMap[partnerId] || HEROES[1];
            var dir = p.left ? -1 : 1;
            var cx = p.pos[0] + 8;
            var cy = p.pos[1] + 10;
            var scale = this.getHeroPowerScale(p);

            p.teamUpCooldown = 9.0;
            p.teamUpMaxCooldown = 9.0;
            p.teamUpPartner = partner;
            p.teamUpTimer = 1.15;
            p.ultCharge = Math.min(100, (p.ultCharge || 0) + 25);

            Mario.Audio.playAbility('thunder');
            if (window.game) {
                window.game.cinematicZoom = 1.15;
                window.game.cinematicTimer = 0.45;
                window.game.shake(5.5, 0.35);
                window.game.popup(comboTitle, cx - 24, cy - 26, '#ffe040');
            }

            /* Визуальный призыв героя-напарника плечом к плечу с игроком на 1.2 секунды */
            var partnerSheet = buildHeroCanvas(partner);
            ExplosionSystem.addAbilityWave({
                t: 0, maxT: 1.15,
                onRender: function (ctx, vX, vY) {
                    var pxPos = Math.round(p.pos[0] - dir * 18 - vX);
                    var pyPos = Math.round(p.pos[1] - vY - 12);
                    ctx.drawImage(partnerSheet, 48, 0, 24, 32, pxPos, pyPos, 24, 32);
                }
            });

            /* Двойной комбинированный удар (Луч + Молния + Взрывная волна) */
            this.castBeam(p, cx, cy - 2, dir, 220, 24, h.color, partner.color, 6.0 * scale, { explodeEnd: true, burn: true });
            this.castSkyLightning(cx + dir * 72, cy, 84, 6.5 * scale, partner.color);
            ExplosionSystem.trigger({
                x: cx + dir * 48,
                y: cy,
                radius: 88,
                damage: 6.5 * scale,
                impulse: 7.2,
                color: partner.color,
                dmgType: dmgType,
                stun: 3.2,
                emp: true,
                secondary: true
            });
            return true;
        },

        castBeam: function (p, x, y, dir, len, height, colOuter, colInner, dmg, opts) {
            opts = opts || {};
            var aimUp = !!(Mario.Input && Mario.Input.isDown('UP'));
            var x0 = dir > 0 ? x + 8 : x - len;
            if (typeof level !== 'undefined' && level) {
                var enemies = level.enemies || [];
                for (var i = 0; i < enemies.length; i++) {
                    var e = enemies[i];
                    if (!e || e.dead || e.flipped || e.pilot) continue;
                    var isAir = (Mario.Helicopter && e instanceof Mario.Helicopter) || (Mario.Jet && e instanceof Mario.Jet);
                    var hitBeam = Mario.Util.hits(e, x0, y - height / 2, len, height) ||
                        ((aimUp || isAir) && Mario.Util.hits(e, x0, 0, len, y + height));
                    if (hitBeam) {
                        if (e.hitByWeapon) e.hitByWeapon(dmg, { vx: dir * 3.5, vy: -2.5, bleed: opts.burn, dmgType: 'energy' });
                        else e.bump(dir * 3.5, -2.5);
                    }
                }
            }
            if (opts.explodeEnd) {
                ExplosionSystem.trigger({
                    x: x + dir * (len * 0.75),
                    y: y,
                    radius: 52,
                    damage: dmg,
                    impulse: 5.0,
                    color: colOuter,
                    dmgType: 'energy',
                    burn: opts.burn
                });
            } else {
                ExplosionSystem.trigger({
                    x: x + dir * 64,
                    y: y,
                    radius: 36,
                    damage: dmg * 0.6,
                    impulse: 3.5,
                    color: colOuter,
                    dmgType: 'energy',
                    burn: opts.burn
                });
            }
            ExplosionSystem.addAbilityWave({
                t: 0, maxT: 0.32,
                onRender: function (ctx, vX, vY, wv) {
                    var rx = Math.round(x0 - vX);
                    var ry = Math.round(y - vY - height / 2);
                    var hNow = Math.max(2, Math.round(height * (1 - wv.t / wv.maxT)));
                    ctx.fillStyle = colOuter;
                    ctx.fillRect(rx, ry + (height - hNow) / 2, len, hNow);
                    ctx.fillStyle = colInner;
                    ctx.fillRect(rx, ry + (height - hNow * 0.5) / 2, len, Math.max(1, hNow * 0.5));
                }
            });
        },

        castLassoWave: function (p, x, y, dir, reach, dmg, customCol) {
            var col = customCol || '#ffd83d';
            ExplosionSystem.trigger({
                x: x + dir * (reach * 0.6),
                y: y,
                radius: reach * 0.65,
                damage: dmg,
                impulse: 5.2,
                color: col,
                dmgType: 'kinetic',
                stun: 2.5
            });
            ExplosionSystem.addAbilityWave({
                t: 0, maxT: 0.30,
                onRender: function (ctx, vX, vY, wv) {
                    var sx = Math.round(x - vX);
                    var sy = Math.round(y - vY);
                    var curLen = Math.round(reach * Math.sin((wv.t / wv.maxT) * Math.PI));
                    ctx.fillStyle = col;
                    ctx.fillRect(dir > 0 ? sx : sx - curLen, sy - 2, curLen, 4);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(dir > 0 ? sx + curLen - 6 : sx - curLen, sy - 5, 6, 10);
                }
            });
        },

        castSpeedforceDash: function (p, x, y, dir, dist, dmg) {
            var targetX = x + dir * dist;
            var tileY = Math.floor(p.pos[1] / 16);
            for (var step = 16; step <= dist; step += 16) {
                var tx = Math.floor((x + dir * step) / 16);
                if (typeof level !== 'undefined' && level && tileY >= 0 && tileY <= 14 &&
                    (level.statics[tileY][tx] || level.blocks[tileY][tx])) {
                    break;
                }
                targetX = x + dir * step;
            }
            p.pos[0] = Math.max(0, targetX - 8);
            p.invincibility = Math.max(p.invincibility, 40);
            ExplosionSystem.trigger({
                x: (x + targetX) * 0.5,
                y: y,
                radius: Math.abs(targetX - x) * 0.65 + 28,
                damage: dmg,
                impulse: 4.5,
                color: '#ffe640',
                dmgType: 'electric',
                slow: 4.0
            });
            ExplosionSystem.addAbilityWave({
                t: 0, maxT: 0.35,
                onRender: function (ctx, vX, vY) {
                    var x0 = Math.round(Math.min(x, targetX) - vX);
                    var w = Math.max(12, Math.round(Math.abs(targetX - x)));
                    var sy = Math.round(y - vY);
                    ctx.fillStyle = '#ffe640';
                    ctx.fillRect(x0, sy - 6, w, 3);
                    ctx.fillRect(x0 + 4, sy + 2, w - 4, 3);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x0, sy - 2, w, 2);
                }
            });
        },

        castTridentWave: function (p, x, y, dir, reach, dmg) {
            ExplosionSystem.trigger({
                x: x + dir * (reach * 0.55),
                y: y,
                radius: reach * 0.6,
                damage: dmg,
                impulse: 6.4,
                color: '#38e8ff',
                dmgType: 'kinetic',
                wet: 7.0
            });
            ExplosionSystem.addAbilityWave({
                t: 0, maxT: 0.38,
                onRender: function (ctx, vX, vY, wv) {
                    var prog = wv.t / wv.maxT;
                    var wx = Math.round(x + dir * (reach * prog) - vX);
                    var wy = Math.round(y - vY - 14);
                    ctx.fillStyle = '#1e88e5';
                    ctx.fillRect(wx - 10, wy, 20, 26);
                    ctx.fillStyle = '#8ef7ff';
                    ctx.fillRect(wx - 6, wy - 4, 12, 8);
                }
            });
        },

        castEmeraldHammer: function (p, tx, ty, radius, dmg) {
            ExplosionSystem.trigger({
                x: tx, y: ty,
                radius: radius,
                damage: dmg,
                impulse: 6.5,
                color: '#2dff7e',
                dmgType: 'energy',
                secondary: true
            });
            ExplosionSystem.addAbilityWave({
                t: 0, maxT: 0.36,
                onRender: function (ctx, vX, vY) {
                    var rx = Math.round(tx - vX - 14);
                    var ry = Math.round(ty - vY - 22);
                    ctx.fillStyle = '#18a852';
                    ctx.fillRect(rx, ry, 28, 18);
                    ctx.fillStyle = '#78ffaa';
                    ctx.fillRect(rx + 4, ry + 3, 20, 12);
                    ctx.fillRect(rx + 11, ry + 18, 6, 14);
                }
            });
        },

        castSkyLightning: function (tx, ty, radius, dmg, color) {
            if (typeof level !== 'undefined' && level && level.enemies) {
                for (var i = 0; i < level.enemies.length; i++) {
                    var e = level.enemies[i];
                    if (!e || e.dead) continue;
                    if (Math.abs((e.pos[0] + 16) - tx) <= radius) {
                        if (e.hitByWeapon) e.hitByWeapon(dmg, { stun: 3.0, dmgType: 'electric' });
                        else e.bump(0, -3.5);
                    }
                }
            }
            ExplosionSystem.trigger({
                x: tx, y: ty,
                radius: radius,
                damage: dmg,
                impulse: 6.0,
                color: color || '#fff066',
                dmgType: 'electric',
                stun: 2.8,
                secondary: true
            });
            ExplosionSystem.addAbilityWave({
                t: 0, maxT: 0.34,
                onRender: function (ctx, vX, vY) {
                    var lx = Math.round(tx - vX);
                    ctx.fillStyle = color || '#fff066';
                    ctx.fillRect(lx - 5, 0, 10, 220);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(lx - 2, 0, 4, 220);
                }
            });
        },

        castClawFlurry: function (p, x, y, dir, radius, dmg) {
            ExplosionSystem.trigger({
                x: x + dir * 24, y: y,
                radius: radius,
                damage: dmg,
                impulse: 4.8,
                color: '#ffd83d',
                dmgType: 'kinetic'
            });
            if (typeof level !== 'undefined' && level && level.enemies) {
                for (var i = 0; i < level.enemies.length; i++) {
                    var e = level.enemies[i];
                    if (e && !e.dead && Math.hypot(e.pos[0] - x, e.pos[1] - y) <= radius) {
                        if (e.hitByWeapon) e.hitByWeapon(dmg, { bleed: true, dmgType: 'kinetic' });
                    }
                }
            }
            ExplosionSystem.addAbilityWave({
                t: 0, maxT: 0.25,
                onRender: function (ctx, vX, vY) {
                    var sx = Math.round(x + dir * 18 - vX);
                    var sy = Math.round(y - vY - 10);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(sx - 8, sy, 18, 2);
                    ctx.fillRect(sx - 6, sy + 6, 18, 2);
                    ctx.fillRect(sx - 8, sy + 12, 18, 2);
                }
            });
        },

        castTimeDome: function (cx, cy, radius) {
            if (typeof level !== 'undefined' && level && level.enemies) {
                for (var i = 0; i < level.enemies.length; i++) {
                    var e = level.enemies[i];
                    if (!e || e.dead) continue;
                    if (Math.hypot(e.pos[0] - cx, e.pos[1] - cy) <= radius) {
                        e.slowTimer = 5.5;
                        e.stunTimer = 2.0;
                    }
                }
            }
            ExplosionSystem.trigger({
                x: cx, y: cy,
                radius: radius * 0.7,
                damage: 2.5,
                impulse: 2.0,
                color: '#ffae28',
                dmgType: 'energy',
                slow: 5.5
            });
            ExplosionSystem.addAbilityWave({
                t: 0, maxT: 1.2,
                onRender: function (ctx, vX, vY, wv) {
                    var rx = Math.round(cx - vX);
                    var ry = Math.round(cy - vY);
                    var r = Math.round(radius * 0.65);
                    ctx.fillStyle = 'rgba(255, 174, 40, ' + (0.22 * (1 - wv.t / wv.maxT)).toFixed(2) + ')';
                    ctx.fillRect(rx - r, ry - r * 0.6, r * 2, r * 1.2);
                }
            });
        }
    };

    /* ================================================================== */
    /* 4. HERO PROJECTILES (Batarangs, Ricochet Shield, Grenades, etc.)   */
    /* ================================================================== */

    var HeroProjectile = Mario.HeroProjectile = function (pos, left, hero, aimUp) {
        this.pos = [pos[0], pos[1]];
        this.left = !!left;
        this.aimUp = !!aimUp;
        this.hero = hero;
        this.type = hero.projType;
        this.damage = hero.damage || 1;
        this.dmgType = hero.zDmgType || 'kinetic';
        this.color = hero.color || '#ffe066';
        this.accent = hero.accent || '#ffffff';
        this.dead = false;
        this.age = 0;
        this.gravity = 0;
        this.explosiveRadius = 0;
        this.ricochetLeft = 0;
        this.panic = 0;
        this.gas = 0;
        var spd = this.type === 'laser' ? 12 : (this.type === 'hammer' || this.type === 'gamma' ? 8.5 : 10.0);
        if (this.aimUp) {
            /* Зенитный выстрел ВВЕРХ + C:
               - Вправо: 60° (cos 60° = 0.5, sin 60° = 0.8660254)
               - Влево: 120° (cos 120° = -0.5, sin 120° = 0.8660254) */
            this.vel = [(left ? -0.5 : 0.5) * spd, -0.8660254 * spd];
        } else {
            this.vel = [left ? -spd : spd, 0];
        }
        this.hitbox = [0, 0, 12, 8];
    };

    HeroProjectile.prototype.remove = function () {
        if (this.dead) return;
        this.dead = true;
        if (this.explosiveRadius > 0) {
            ExplosionSystem.trigger({
                x: this.pos[0] + 6,
                y: this.pos[1] + 4,
                radius: this.explosiveRadius,
                damage: this.damage,
                impulse: 4.5,
                color: this.color,
                dmgType: this.dmgType,
                panic: this.panic,
                gas: this.gas
            });
        }
    };

    HeroProjectile.prototype.update = function (dt) {
        this.age += dt * 60;
        if (this.gravity && !this.aimUp) {
            this.vel[1] += this.gravity;
        }
        /* При зенитной стрельбе (60° вправо / 120° влево) мягко корректируем траекторию
           на воздушные цели (вертолёты и истребители) в верхней полусфере */
        if (this.aimUp && typeof level !== 'undefined' && level && level.enemies) {
            for (var i = 0; i < level.enemies.length; i++) {
                var e = level.enemies[i];
                if (!e || e.dead || e.pilot) continue;
                var isAir = (Mario.Helicopter && e instanceof Mario.Helicopter) || (Mario.Jet && e instanceof Mario.Jet);
                if (!isAir) continue;
                var ex = e.pos[0] + 22, ey = e.pos[1] + 10;
                var dx = ex - this.pos[0], dy = ey - this.pos[1];
                if (dy < 18 && ((this.left && dx < 32) || (!this.left && dx > -32)) && Math.hypot(dx, dy) < 120) {
                    var ang = Math.atan2(dy, dx);
                    var spd = Math.hypot(this.vel[0], this.vel[1]) || 10.0;
                    this.vel[0] = this.vel[0] * 0.76 + Math.cos(ang) * spd * 0.24;
                    this.vel[1] = this.vel[1] * 0.76 + Math.sin(ang) * spd * 0.24;
                    break;
                }
            }
        }
        this.pos[0] += this.vel[0];
        this.pos[1] += this.vel[1];

        var viewW = (typeof VW !== 'undefined') ? VW : 432;
        if (this.pos[0] < vX - 32 || this.pos[0] > vX + viewW + 48 || this.pos[1] > 236 || this.pos[1] < -36) {
            this.remove();
        }
    };

    HeroProjectile.prototype.render = function (ctx, vX, vY) {
        if (this.dead) return;
        var x = Math.round(this.pos[0] - vX);
        var y = Math.round(this.pos[1] - vY);
        var rotated = this.aimUp || Math.abs(this.vel[1]) > 0.8;
        if (rotated) {
            ctx.save();
            ctx.translate(x + 6, y + 4);
            var ang = Math.atan2(this.vel[1], this.vel[0]);
            ctx.rotate(ang);
            x = -6;
            y = -4;
        }

        switch (this.type) {
            case 'batarang':
                ctx.fillStyle = '#141821';
                ctx.fillRect(x, y + 2, 10, 4);
                ctx.fillStyle = '#ffd83d';
                var wing = Math.floor(this.age / 2) % 2 === 0 ? 0 : 2;
                ctx.fillRect(x + 1, y + wing, 8, 2);
                ctx.fillRect(x + 3, y + 2, 4, 2);
                break;

            case 'laser':
                ctx.fillStyle = '#ff1e28';
                ctx.fillRect(x - 6, y, 20, 4);
                ctx.fillStyle = '#fff0a0';
                ctx.fillRect(x - 4, y + 1, 16, 2);
                break;

            case 'shield':
                ctx.fillStyle = '#e02028';
                ctx.fillRect(x, y + 1, 12, 6);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x + 2, y + 2, 8, 4);
                ctx.fillStyle = '#1e5cc8';
                ctx.fillRect(x + 4, y + 3, 4, 2);
                break;

            case 'hammer':
                ctx.fillStyle = '#8a96a8';
                ctx.fillRect(x + 2, y, 8, 6);
                ctx.fillStyle = '#c8d4e4';
                ctx.fillRect(x + 3, y + 1, 6, 2);
                ctx.fillStyle = '#78e8ff';
                ctx.fillRect(x - 2, y + (Math.floor(this.age) % 2) * 3, 14, 2);
                break;

            case 'lightning':
                ctx.fillStyle = this.color;
                ctx.fillRect(x, y + 1, 6, 2);
                ctx.fillRect(x + 4, y + 3, 6, 2);
                ctx.fillRect(x + 8, y, 5, 2);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x + 2, y + 2, 8, 1);
                break;

            case 'gamma':
                ctx.fillStyle = '#38b832';
                ctx.fillRect(x, y - 2, 12, 12);
                ctx.fillStyle = '#98ff68';
                ctx.fillRect(x + 3, y, 6, 8);
                break;

            default:
                ctx.fillStyle = this.color;
                ctx.fillRect(x, y + 1, 10, 5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x + (this.left && !rotated ? 1 : 6), y + 2, 3, 3);
                break;
        }
        if (rotated) {
            ctx.restore();
        }
    };

    HeroProjectile.prototype.checkCollisions = function () {
        if (this.dead) return;

        var tx = Math.floor((this.pos[0] + 6) / 16);
        var ty = Math.floor((this.pos[1] + 4) / 16);
        if (ty >= 0 && ty <= 14 && tx >= 0) {
            var bl = level.blocks[ty][tx];
            if (bl) {
                bl.bonk(1);
                if (!this.aimUp && this.type !== 'shield' && this.type !== 'hammer') {
                    this.remove();
                    return;
                }
            } else if (level.statics[ty][tx] && !this.aimUp) {
                if (this.ricochetLeft > 0) {
                    this.ricochetLeft--;
                    this.vel[0] = -this.vel[0];
                } else {
                    this.remove();
                    return;
                }
            }
        }

        /* Детонация бочек, баллонов и мин при попадании снаряда */
        var items = level.items || [];
        for (var h = 0; h < items.length; h++) {
            var it = items[h];
            if (it && !it.dead && it instanceof Mario.Hazard) {
                if (Mario.Util.hits(it, this.pos[0], this.pos[1], 12, 8)) {
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
            if (Mario.Util.hits(e, this.pos[0] - 2, this.pos[1] - 2, 16, 12)) {
                if (e.hitByWeapon) {
                    var airMul = this.aimUp && ((Mario.Helicopter && e instanceof Mario.Helicopter) || (Mario.Jet && e instanceof Mario.Jet)) ? 1.45 : 1.0;
                    e.hitByWeapon(this.damage * airMul, { dmgType: this.dmgType, gas: this.gas });
                } else {
                    e.bump();
                    if (game.addScore) {
                        game.addScore(500);
                        game.popup('500', e.pos[0], e.pos[1] - 8, this.color);
                    }
                }
                if (this.ricochetLeft > 0) {
                    this.ricochetLeft--;
                    this.vel[0] = -this.vel[0];
                    this.vel[1] = (this.ricochetLeft % 2 === 0 ? -2.2 : 2.2);
                    return;
                }
                if (this.type !== 'shield' && this.type !== 'laser') {
                    this.remove();
                    return;
                }
            }
        }
    };

    /* ================================================================== */
    /* 5. EXPLOSIVE ENVIRONMENT HAZARDS (Бочки, Газовые баллоны, Мины)    */
    /* ================================================================== */

    var Hazard = Mario.Hazard = function (pos, kind) {
        this.pos = [pos[0], pos[1]];
        this.kind = kind || 'barrel'; /* 'barrel' | 'cylinder' | 'mine' */
        this.hitbox = this.kind === 'mine' ? [2, 10, 12, 6] : [2, 0, 12, 16];
        this.dead = false;
        this.triggered = false;
        this.fuseTimer = 0;
        this.chainDepth = 0;
    };

    Hazard.prototype.remove = function () {
        this.dead = true;
    };

    Hazard.prototype.triggerFuse = function (delay, depth) {
        if (this.dead || this.triggered) return;
        this.triggered = true;
        this.fuseTimer = delay !== undefined ? delay : 0.16;
        this.chainDepth = depth || 0;
    };

    Hazard.prototype.detonate = function (depth) {
        if (this.dead) return;
        this.dead = true;
        var rad = this.kind === 'cylinder' ? 68 : (this.kind === 'barrel' ? 58 : 48);
        var dmg = this.kind === 'cylinder' ? 4.0 : 3.2;
        var col = this.kind === 'cylinder' ? '#38e8ff' : '#ff6820';
        ExplosionSystem.trigger({
            x: this.pos[0] + 8,
            y: this.pos[1] + 8,
            radius: rad,
            damage: dmg,
            impulse: 5.8,
            color: col,
            type: 'hazard',
            dmgType: 'explosive',
            burn: this.kind === 'barrel',
            gas: this.kind === 'cylinder' ? 5.0 : 0,
            hurtPlayer: false,
            chainDepth: depth || this.chainDepth,
            secondary: this.kind === 'cylinder'
        });
        if (window.game && window.game.addScore) {
            window.game.addScore(300);
            window.game.popup('ЦЕПНОЙ ВЗРЫВ!', this.pos[0], this.pos[1] - 10, col);
        }
    };

    Hazard.prototype.update = function (dt) {
        if (this.dead) return;
        if (this.triggered) {
            this.fuseTimer -= dt;
            if (this.fuseTimer <= 0) {
                this.detonate(this.chainDepth);
            }
        }
    };

    Hazard.prototype.checkCollisions = function () {
        if (this.dead || !player || player.dying || player.piping) return;
        if (this.kind === 'mine' && Mario.Util.hits(player, this.pos[0] + 2, this.pos[1] + 10, 12, 6)) {
            this.detonate(0);
            if (!player.starTime && !player.inCar && !player.inAircraft) {
                player.takeExplosionDamage(18);
            }
        }
    };

    Hazard.prototype.render = function (ctx, vX, vY) {
        if (this.dead) return;
        var x = Math.round(this.pos[0] - vX);
        var y = Math.round(this.pos[1] - vY);
        var flash = this.triggered && (Math.floor(this.fuseTimer * 30) % 2 === 0);

        if (this.kind === 'barrel') {
            ctx.fillStyle = flash ? '#ffffff' : '#c82028';
            ctx.fillRect(x + 2, y + 1, 12, 15);
            ctx.fillStyle = '#242830';
            ctx.fillRect(x + 1, y + 3, 14, 2);
            ctx.fillRect(x + 1, y + 11, 14, 2);
            ctx.fillStyle = '#ffe040';
            ctx.fillRect(x + 5, y + 6, 6, 4);
        } else if (this.kind === 'cylinder') {
            ctx.fillStyle = flash ? '#ffffff' : '#2498d8';
            ctx.fillRect(x + 4, y + 2, 8, 14);
            ctx.fillStyle = '#ffd83d';
            ctx.fillRect(x + 6, y, 4, 2);
            ctx.fillStyle = '#ff3838';
            ctx.fillRect(x + 5, y + 7, 6, 3);
        } else {
            ctx.fillStyle = '#2d3640';
            ctx.fillRect(x + 2, y + 12, 12, 4);
            ctx.fillStyle = (Math.floor((window.game ? window.game.gameTime : 0) * 6) % 2 === 0) ? '#ff2020' : '#ffd83d';
            ctx.fillRect(x + 6, y + 10, 4, 2);
        }
    };

    /* ================================================================== */
    /* 6. PICKUPS (Аптечки, Энергоячейки Z, Броня, Ускорители КД)         */
    /* ================================================================== */

    var Pickup = Mario.Pickup = function (pos, kind) {
        this.pos = [pos[0], pos[1]];
        this.baseY = pos[1];
        this.kind = kind || 'energy'; /* 'medkit' | 'energy' | 'armor' | 'cdr' */
        this.hitbox = [0, 0, 14, 14];
        this.dead = false;
        this.phase = (pos[0] % 50) * 0.1;
    };

    Pickup.prototype.remove = function () {
        this.dead = true;
    };

    Pickup.prototype.update = function (dt) {
        if (this.dead) return;
        this.phase += dt * 4;
        this.pos[1] = this.baseY + Math.sin(this.phase) * 2.5;
    };

    Pickup.prototype.collect = function () {
        if (this.dead || !player) return;
        this.dead = true;
        Mario.Audio.play('powerup');
        if (this.kind === 'medkit') {
            player.hp = Math.min(player.maxHp, player.hp + 40);
            if (window.game) window.game.popup('+40 HP', this.pos[0], this.pos[1] - 8, '#48ff78');
        } else if (this.kind === 'armor') {
            player.armor = Math.min(player.maxArmor, player.armor + 35);
            if (window.game) window.game.popup('+35 БРОНЯ', this.pos[0], this.pos[1] - 8, '#5ca8ff');
        } else if (this.kind === 'cdr') {
            player.zCooldown = 0;
            player.xCooldown = 0;
            player.teamUpCooldown = 0;
            player.energy = player.maxEnergy;
            player.ultCharge = Math.min(100, (player.ultCharge || 0) + 35);
            if (player.syncHeroState) player.syncHeroState();
            if (window.game) window.game.popup('Z/X ГОТОВО +35% УЛЬТА!', this.pos[0], this.pos[1] - 8, '#ffe040');
        } else {
            player.energy = Math.min(player.maxEnergy, player.energy + 50);
            player.ultCharge = Math.min(100, (player.ultCharge || 0) + 20);
            if (player.syncHeroState) player.syncHeroState();
            if (window.game) window.game.popup('+50 ЭНЕРГИЯ +20% УЛЬТА', this.pos[0], this.pos[1] - 8, '#8ef7ff');
        }
        if (window.game && window.game.addScore) window.game.addScore(250);
    };

    Pickup.prototype.checkCollisions = function () {
        if (this.dead || !player || player.dying) return;
        if (Mario.Util.hits(player, this.pos[0], this.pos[1], 14, 14)) {
            this.collect();
        }
    };

    Pickup.prototype.render = function (ctx, vX, vY) {
        if (this.dead) return;
        var x = Math.round(this.pos[0] - vX);
        var y = Math.round(this.pos[1] - vY);
        if (this.kind === 'medkit') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 1, y + 2, 12, 10);
            ctx.fillStyle = '#e02028';
            ctx.fillRect(x + 6, y + 4, 2, 6);
            ctx.fillRect(x + 4, y + 6, 6, 2);
        } else if (this.kind === 'armor') {
            ctx.fillStyle = '#1e5cc8';
            ctx.fillRect(x + 2, y + 2, 10, 11);
            ctx.fillStyle = '#8ef7ff';
            ctx.fillRect(x + 4, y + 4, 6, 7);
        } else if (this.kind === 'cdr') {
            ctx.fillStyle = '#ffe040';
            ctx.fillRect(x + 2, y + 2, 10, 10);
            ctx.fillStyle = '#141821';
            ctx.fillRect(x + 4, y + 4, 6, 2);
            ctx.fillRect(x + 4, y + 8, 6, 2);
        } else {
            ctx.fillStyle = '#18385c';
            ctx.fillRect(x + 2, y + 1, 10, 12);
            ctx.fillStyle = '#66f0ff';
            ctx.fillRect(x + 4, y + 3, 6, 8);
        }
    };

    /* ================================================================== */
    /* 7. CHECKPOINT BEACON & WORLD EVENT (Динамические миссии на уровне) */
    /* ================================================================== */

    var Checkpoint = Mario.Checkpoint = function (pos) {
        this.pos = [pos[0], pos[1]];
        this.hitbox = [0, 0, 16, 32];
        this.active = false;
        this.dead = false;
    };

    Checkpoint.prototype.update = function () {};

    Checkpoint.prototype.checkCollisions = function () {
        if (this.active || !player || player.dying) return;
        if (player.pos[0] + 12 >= this.pos[0]) {
            this.active = true;
            Mario.Audio.play('oneUp');
            if (window.game) {
                window.game.checkpointPos = [this.pos[0], this.pos[1] + 16];
                window.game.popup('ЧЕКПОИНТ!', this.pos[0], this.pos[1] - 10, '#48ff78');
            }
        }
    };

    Checkpoint.prototype.render = function (ctx, vX, vY) {
        var x = Math.round(this.pos[0] - vX);
        var y = Math.round(this.pos[1] - vY);
        ctx.fillStyle = '#8a96a8';
        ctx.fillRect(x + 6, y, 3, 32);
        ctx.fillStyle = this.active ? '#2dff7e' : '#ff4040';
        ctx.fillRect(x + 9, y + 2, 10, 7);
    };

    /* Динамическое событие уровня: Разминирование / Спасение заложника / Удержание маяка */
    var WorldEvent = Mario.WorldEvent = function (pos, kind) {
        this.pos = [pos[0], pos[1]];
        this.kind = kind || 'bomb'; /* 'bomb' | 'hostage' | 'defense' */
        this.hitbox = [0, 0, 18, 24];
        this.completed = false;
        this.dead = false;
        this.progress = 0;
    };

    WorldEvent.prototype.update = function (dt) {
        if (this.completed || this.dead || !player || player.dying) return;
        if (Math.abs((player.pos[0] + 8) - (this.pos[0] + 9)) <= 28 &&
            Math.abs((player.pos[1] + 8) - (this.pos[1] + 12)) <= 32) {
            this.progress += dt * 1.4;
            if (this.progress >= 1.0) {
                this.complete();
            }
        }
    };

    WorldEvent.prototype.complete = function () {
        if (this.completed) return;
        this.completed = true;
        Mario.Audio.play('oneUp');
        if (player) {
            player.ultCharge = 100;
            player.energy = player.maxEnergy;
            player.zCooldown = 0;
            player.xCooldown = 0;
            player.masteryRank = Math.min(5, (player.masteryRank || 1) + 1);
            if (player.syncHeroState) player.syncHeroState();
        }
        var label = this.kind === 'hostage'
            ? 'ЗАЛОЖНИК СПАСЁН! УЛЬТА 100% + РАНГ UP!'
            : (this.kind === 'defense' ? 'ТОЧКА ЗАЩИЩЕНА! УЛЬТА 100% + РАНГ UP!' : 'БОМБА ОБЕЗВРЕЖЕНА! УЛЬТА 100% + РАНГ UP!');
        if (window.game) {
            window.game.addScore(1500);
            window.game.popup(label, this.pos[0] - 24, this.pos[1] - 16, '#ffe040');
        }
    };

    WorldEvent.prototype.checkCollisions = function () {
        if (this.completed || this.dead || !player || player.dying) return;
        if (Mario.Util.hits(player, this.pos[0], this.pos[1], 18, 24)) {
            this.complete();
        }
    };

    WorldEvent.prototype.render = function (ctx, vX, vY) {
        if (this.dead) return;
        var x = Math.round(this.pos[0] - vX);
        var y = Math.round(this.pos[1] - vY);
        var pulse = Math.floor((window.game ? window.game.gameTime : 0) * 6) % 2 === 0;

        ctx.fillStyle = this.completed ? '#18a852' : '#1e283c';
        ctx.fillRect(x + 2, y + 4, 14, 20);
        ctx.fillStyle = this.completed ? '#48ff78' : (pulse ? '#ffe040' : '#ff3838');
        ctx.fillRect(x + 4, y + 6, 10, 6);
        if (!this.completed && Mario.Font) {
            var tag = this.kind === 'hostage' ? 'SOS' : (this.kind === 'defense' ? 'ЩИТ' : 'ТНТ');
            Mario.Font.draw(ctx, tag, x - 2, y - 7, { color: pulse ? '#ffe040' : '#8ef7ff' });
        }
    };

    /* ================================================================== */
    /* 8. ATTACK HELICOPTER & SUPERSONIC FIGHTER JET (с угоном на V!)     */
    /* ================================================================== */

    var heliCanvas = null;
    function getHeliCanvas() {
        if (heliCanvas) return heliCanvas;
        var o = makeCanvas(44, 22);
        var g = o.g;
        px(g, 28, 9, 14, 3, '#2d3a2e');
        px(g, 39, 5, 3, 8, '#465848');
        px(g, 40, 4, 2, 2, '#d83838');
        px(g, 6, 7, 24, 9, '#394a3a');
        px(g, 8, 6, 18, 2, '#526854');
        px(g, 4, 10, 6, 5, '#2b382c');
        px(g, 6, 8, 9, 5, '#68d8ff');
        px(g, 7, 8, 7, 2, '#b8f0ff');
        px(g, 13, 14, 10, 3, '#1e2420');
        px(g, 11, 15, 3, 2, '#ff4838');
        px(g, 2, 13, 5, 2, '#181c1a');
        px(g, 10, 17, 2, 3, '#1c2024');
        px(g, 22, 17, 2, 3, '#1c2024');
        px(g, 7, 19, 20, 2, '#2c3238');
        px(g, 16, 3, 3, 3, '#22282a');
        heliCanvas = o.canvas;
        return heliCanvas;
    }

    var Helicopter = Mario.Helicopter = function (pos, hp) {
        Mario.Entity.call(this, {
            pos: [pos[0], pos[1]],
            sprite: new Mario.Sprite(getHeliCanvas(), [0, 0], [44, 22], 0, [0]),
            hitbox: [4, 4, 36, 16]
        });
        this.baseX = pos[0];
        this.baseY = pos[1];
        this.hp = hp || 3;
        this.maxHp = this.hp;
        this.mass = 2.8;
        this.weakness = 'electric';
        this.phase = (pos[0] % 100) * 0.06;
        this.fireTimer = 55 + (pos[0] % 40);
        this.hitFlash = 0;
        this.stunTimer = 0;
        this.slowTimer = 0;
        this.pilot = null;
        this.left = true;
    };

    Mario.Util.inherits(Helicopter, Mario.Entity);

    Helicopter.prototype.update = function (dt, vX) {
        if (this.dead) return;
        this.phase += dt * 2.8;
        if (this.pilot) return; /* Управляется игроком через updateAircraft */

        var viewW = (typeof VW !== 'undefined') ? VW : 432;
        if (this.pos[0] - vX > viewW + 96 || this.pos[0] - vX < -96) return;

        if (this.hitFlash > 0) this.hitFlash--;
        if (this.stunTimer > 0) {
            this.stunTimer = Math.max(0, this.stunTimer - dt);
            this.pos[1] = Math.min(156, this.pos[1] + 0.55);
            return;
        }

        var speedScale = this.slowTimer > 0 ? 0.35 : 1.0;
        if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);

        var targetX = player ? player.pos[0] + 64 : this.baseX;
        var diff = targetX - this.pos[0];
        var desiredVel = Mario.Util.clamp(diff * 0.025, -1.6, 1.6) * speedScale;
        this.vel[0] += (desiredVel - this.vel[0]) * 0.08;
        this.pos[0] += this.vel[0];
        this.pos[1] = this.baseY + Math.sin(this.phase * 1.5) * 8;
        this.left = player ? (player.pos[0] < this.pos[0]) : (this.vel[0] <= 0);
        this.sprite.flipH = !this.left;

        this.fireTimer -= speedScale;
        if (this.fireTimer <= 0) {
            this.fireTimer = 78;
            if (typeof level !== 'undefined' && level && Math.abs(this.pos[0] - (player ? player.pos[0] : 0)) < 240) {
                level.items.push(new Mario.Bomb([this.pos[0] + 18, this.pos[1] + 18], [this.left ? -1.4 : 1.4, 1.2]));
                Mario.Audio.play('kick');
            }
        }
    };

    Helicopter.prototype.render = function (ctx, vX, vY) {
        if (this.dead) return;
        var dx = Math.round(this.pos[0] - vX);
        var dy = Math.round(this.pos[1] - vY);
        var rotorW = (Math.floor(this.phase * 18) % 2 === 0) ? 42 : 20;
        ctx.fillStyle = this.pilot ? '#48ff78' : (this.stunTimer > 0 ? '#68e8ff' : '#d8e4f0');
        ctx.fillRect(dx + 22 - rotorW / 2, dy + 1, rotorW, 2);

        this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);

        if (this.pilot) {
            ctx.fillStyle = '#48ff78';
            ctx.fillRect(dx + 6, dy - 5, 32, 2);
        } else if (this.hp < this.maxHp || this.hitFlash > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(dx + 8, dy - 5, 28, 3);
            ctx.fillStyle = '#ff4040';
            ctx.fillRect(dx + 8, dy - 5, Math.max(2, Math.round(28 * (this.hp / this.maxHp))), 3);
        }
    };

    Helicopter.prototype.checkCollisions = function () {
        if (this.dead || this.pilot || !player || player.dying || player.piping) return;
        var hb = this.hitbox, ehb = player.hitbox;
        if (Mario.Util.overlap(
            this.pos[0] + hb[0], this.pos[1] + hb[1], hb[2], hb[3],
            player.pos[0] + ehb[0], player.pos[1] + ehb[1], ehb[2], ehb[3])) {
            var feet = player.pos[1] + ehb[1] + ehb[3];
            if (player.starTime || player.inCar || player.inAircraft || (player.vel[1] > 0 && feet <= this.pos[1] + 12)) {
                player.bounce = true;
                this.hitByWeapon(2);
            } else if (player.parryTimer > 0 && player.onParrySuccess) {
                player.onParrySuccess(this);
            } else {
                player.damage();
            }
        }
    };

    Helicopter.prototype.applyImpulse = function (vx, vy, dmg) {
        if (this.pilot) return;
        this.pos[0] += vx * 2;
        this.hitByWeapon(dmg);
    };

    Helicopter.prototype.hitByWeapon = function (dmg, opts) {
        if (this.dead || this.pilot) return;
        opts = opts || {};
        var isWeak = (opts.emp || opts.dmgType === 'electric');
        var mult = isWeak ? 1.85 : 1.0;
        var finalDmg = (dmg || 1) * mult;
        this.hp -= finalDmg;
        this.hitFlash = 10;
        if (opts.stun) this.stunTimer = Math.max(this.stunTimer, opts.stun);
        if (opts.slow) this.slowTimer = Math.max(this.slowTimer, opts.slow);
        if (window.game && window.game.registerCombatHit) {
            window.game.registerCombatHit(this, finalDmg, false, isWeak);
        }
        Mario.Audio.play('bump');
        if (this.hp <= 0) {
            this.explode();
        }
    };

    Helicopter.prototype.bump = function () {
        this.hitByWeapon(2);
    };

    Helicopter.prototype.explode = function () {
        if (this.dead) return;
        if (this.pilot && this.pilot.exitAircraft) {
            this.pilot.exitAircraft();
        }
        this.dead = true;
        if (window.game) {
            window.game.addScore(1000);
            window.game.popup('1000', this.pos[0], this.pos[1], '#ffe000');
        }
        ExplosionSystem.trigger({
            x: this.pos[0] + 22,
            y: this.pos[1] + 11,
            radius: 58,
            damage: 3.5,
            impulse: 5.5,
            color: '#ff6820',
            type: 'aircraft',
            secondary: true
        });
        if (typeof level !== 'undefined' && level && level.items) {
            level.items.push(new Mario.Pickup([this.pos[0] + 14, Math.min(188, this.pos[1] + 24)], 'energy'));
        }
    };

    var jetCanvas = null;
    function getJetCanvas() {
        if (jetCanvas) return jetCanvas;
        var o = makeCanvas(46, 16);
        var g = o.g;
        px(g, 34, 2, 8, 6, '#3b4a64');
        px(g, 36, 3, 5, 3, '#d82838');
        px(g, 2, 7, 40, 5, '#54688a');
        px(g, 0, 8, 6, 3, '#2d384c');
        px(g, 6, 6, 28, 2, '#7890b8');
        px(g, 10, 5, 11, 3, '#78ecff');
        px(g, 16, 11, 16, 3, '#3b4a64');
        px(g, 14, 13, 8, 2, '#ff4040');
        jetCanvas = o.canvas;
        return jetCanvas;
    }

    var Jet = Mario.Jet = function (pos, hp) {
        Mario.Entity.call(this, {
            pos: [pos[0], pos[1]],
            sprite: new Mario.Sprite(getJetCanvas(), [0, 0], [46, 16], 0, [0]),
            hitbox: [2, 4, 42, 10]
        });
        this.hp = hp || 2;
        this.maxHp = this.hp;
        this.mass = 2.4;
        this.weakness = 'electric';
        this.vel = [-2.8, 0];
        this.dropTimer = 42;
        this.stunTimer = 0;
        this.slowTimer = 0;
        this.pilot = null;
        this.left = true;
        this.active = false;
    };

    Mario.Util.inherits(Jet, Mario.Entity);

    Jet.prototype.update = function (dt, vX) {
        if (this.dead) return;
        if (this.pilot) return; /* Управляется игроком */

        var viewW = (typeof VW !== 'undefined') ? VW : 432;
        if (!this.active) {
            if (this.pos[0] - vX <= viewW + 64) {
                this.active = true;
            } else {
                return;
            }
        }
        if (this.stunTimer > 0) {
            this.stunTimer = Math.max(0, this.stunTimer - dt);
            this.pos[1] = Math.min(156, this.pos[1] + 0.65);
            return;
        }
        var speedScale = this.slowTimer > 0 ? 0.35 : 1.0;
        if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);

        this.pos[0] += this.vel[0] * speedScale;
        if (this.pos[0] < vX - 80) {
            this.pos[0] = vX + viewW + 120;
        }

        this.dropTimer -= speedScale;
        if (this.dropTimer <= 0) {
            this.dropTimer = 68;
            if (typeof level !== 'undefined' && level && this.pos[0] > vX && this.pos[0] < vX + viewW) {
                level.items.push(new Mario.Bomb([this.pos[0] + 16, this.pos[1] + 14], [-0.8, 1.8]));
            }
        }
    };

    Jet.prototype.render = function (ctx, vX, vY) {
        if (this.dead || (!this.active && !this.pilot)) return;
        this.sprite.flipH = !this.left;
        this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
        var dx = Math.round(this.pos[0] - vX);
        var dy = Math.round(this.pos[1] - vY);
        var fx = Math.round(this.pos[0] - vX + (this.left ? 42 : -6));
        var fy = Math.round(this.pos[1] - vY + 8);
        ctx.fillStyle = '#ff6820';
        ctx.fillRect(fx, fy, 6 + (Math.floor((window.game ? window.game.gameTime : 0) * 30) % 4), 3);
        ctx.fillStyle = '#fff080';
        ctx.fillRect(fx, fy + 1, 4, 1);
        if (this.pilot) {
            ctx.fillStyle = '#48ff78';
            ctx.fillRect(dx + 6, dy - 4, 34, 2);
        } else if (this.hp < this.maxHp || this.hitFlash > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(dx + 8, dy - 4, 30, 3);
            ctx.fillStyle = '#ff4040';
            ctx.fillRect(dx + 8, dy - 4, Math.max(2, Math.round(30 * (this.hp / this.maxHp))), 3);
        }
    };

    Jet.prototype.checkCollisions = function () {
        if (this.dead || this.pilot || !this.active || !player || player.dying || player.piping) return;
        var hb = this.hitbox, ehb = player.hitbox;
        if (Mario.Util.overlap(
            this.pos[0] + hb[0], this.pos[1] + hb[1], hb[2], hb[3],
            player.pos[0] + ehb[0], player.pos[1] + ehb[1], ehb[2], ehb[3])) {
            if (player.starTime || player.inCar || player.inAircraft || player.vel[1] > 0) {
                player.bounce = true;
                this.hitByWeapon(2);
            } else if (player.parryTimer > 0 && player.onParrySuccess) {
                player.onParrySuccess(this);
            } else {
                player.damage();
            }
        }
    };

    Jet.prototype.applyImpulse = function (vx, vy, dmg) {
        if (this.pilot) return;
        this.hitByWeapon(dmg);
    };

    Jet.prototype.hitByWeapon = function (dmg, opts) {
        if (this.dead || this.pilot) return;
        opts = opts || {};
        this.active = true;
        this.hitFlash = 10;
        var isWeak = (opts.emp || opts.dmgType === 'electric');
        var mult = isWeak ? 2.0 : 1.0;
        var finalDmg = (dmg || 1) * mult;
        this.hp -= finalDmg;
        if (opts.stun) this.stunTimer = Math.max(this.stunTimer, opts.stun);
        if (opts.slow) this.slowTimer = Math.max(this.slowTimer, opts.slow);
        if (window.game && window.game.registerCombatHit) {
            window.game.registerCombatHit(this, finalDmg, false, isWeak);
        }
        Mario.Audio.play('bump');
        if (this.hp <= 0) {
            this.dead = true;
            if (window.game) {
                window.game.addScore(1500);
                window.game.popup('1500', this.pos[0], this.pos[1], '#8ef7ff');
            }
            ExplosionSystem.trigger({
                x: this.pos[0] + 22,
                y: this.pos[1] + 8,
                radius: 64,
                damage: 4.0,
                impulse: 6.0,
                color: '#ff5020',
                type: 'aircraft',
                secondary: true
            });
        }
    };

    Jet.prototype.bump = function () {
        this.hitByWeapon(2);
    };

    /* ================================================================== */
    /* 9. NAMED WORLD BOSSES (10 Именных Боссов Миров DC / Marvel / Skynet) */
    /* ================================================================== */

    var bossCanvasCache = {};
    function getBossCanvas(color, visor) {
        var key = (color || '#3d4a60') + '_' + (visor || '#ff2424');
        if (bossCanvasCache[key]) return bossCanvasCache[key];
        var o = makeCanvas(32, 36);
        var g = o.g;
        px(g, 6, 2, 20, 10, '#2b3444');
        px(g, 9, 5, 14, 4, visor || '#ff2424');
        px(g, 2, 12, 28, 14, color || '#3d4a60');
        px(g, 8, 15, 16, 8, '#1e2634');
        px(g, 12, 17, 8, 4, visor || '#ff5020');
        px(g, 0, 14, 4, 8, '#7888a0');
        px(g, 28, 14, 4, 8, '#7888a0');
        px(g, 6, 26, 8, 10, '#242c3a');
        px(g, 18, 26, 8, 10, '#242c3a');
        bossCanvasCache[key] = o.canvas;
        return o.canvas;
    }

    var Boss = Mario.Boss = function (pos, hp, bossSpec) {
        bossSpec = bossSpec || {};
        this.bossName = bossSpec.name || 'ДРЕДНОУТ МК-I';
        this.name = this.bossName;
        this.bossColor = bossSpec.color || '#3d4a60';
        this.bossVisor = bossSpec.visor || '#ff2424';
        this.weakness = bossSpec.weakness || 'electric';
        this.modifier = bossSpec.modifier || null;

        Mario.Entity.call(this, {
            pos: [pos[0], pos[1]],
            sprite: new Mario.Sprite(getBossCanvas(this.bossColor, this.bossVisor), [0, 0], [32, 36], 0, [0]),
            hitbox: [2, 2, 28, 34]
        });
        this.baseX = pos[0];
        this.hp = hp || 12;
        this.maxHp = this.hp;
        this.mass = 6.0;
        this.stunTimer = 0;
        this.slowTimer = 0;
        this.freezeTimer = 0;
        this.wetTimer = 0;
        this.gasTimer = 0;
        this.dotTimer = 0;
        this.fireTimer = 60;
        this.dir = -1;
    };

    Mario.Util.inherits(Boss, Mario.Entity);

    Boss.prototype.update = function (dt, vX) {
        if (this.dead) return;
        var viewW = (typeof VW !== 'undefined') ? VW : 432;
        if (Math.abs(this.pos[0] - vX) > viewW + 96) return;

        if (this.wetTimer > 0) this.wetTimer = Math.max(0, this.wetTimer - dt);
        if (this.gasTimer > 0) this.gasTimer = Math.max(0, this.gasTimer - dt);
        if (this.dotTimer > 0) {
            this.dotTimer = Math.max(0, this.dotTimer - dt);
            this.hp -= dt * 1.4;
            if (this.hp <= 0) {
                this.hitByWeapon(1);
                return;
            }
        }
        if (this.freezeTimer > 0) {
            this.freezeTimer = Math.max(0, this.freezeTimer - dt);
            return;
        }
        if (this.stunTimer > 0) {
            this.stunTimer = Math.max(0, this.stunTimer - dt);
            return;
        }
        var speedScale = this.slowTimer > 0 ? 0.4 : 1.0;
        if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);

        this.pos[0] += this.dir * 0.65 * speedScale;
        if (this.pos[0] < this.baseX - 36) this.dir = 1;
        if (this.pos[0] > this.baseX + 36) this.dir = -1;

        this.fireTimer -= speedScale;
        if (this.fireTimer <= 0) {
            this.fireTimer = 70;
            if (typeof level !== 'undefined' && level && player && Math.abs(player.pos[0] - this.pos[0]) < 220) {
                var bDir = player.pos[0] < this.pos[0] ? -1 : 1;
                level.items.push(new Mario.Bomb([this.pos[0] + 12, this.pos[1] + 10], [bDir * 2.4, -2.0]));
                Mario.Audio.play('kick');
            }
        }
    };

    Boss.prototype.render = function (ctx, vX, vY) {
        if (this.dead) return;
        var dx = Math.round(this.pos[0] - vX);
        var dy = Math.round(this.pos[1] - vY);
        this.sprite.render(ctx, this.pos[0], this.pos[1], vX, vY);
        if (this.freezeTimer > 0) {
            ctx.fillStyle = 'rgba(110, 235, 255, 0.45)';
            ctx.fillRect(dx, dy, 32, 36);
        }
        /* Полоска HP босса и его имя */
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(dx - 8, dy - 8, 48, 4);
        ctx.fillStyle = this.stunTimer > 0 ? '#68e8ff' : this.bossVisor;
        ctx.fillRect(dx - 8, dy - 8, Math.max(2, Math.round(48 * (this.hp / this.maxHp))), 4);
        if (Mario.Font) {
            Mario.Font.draw(ctx, this.bossName.slice(0, 12), dx - 12, dy - 16, { color: '#ffe040' });
        }
    };

    Boss.prototype.checkCollisions = function () {
        if (this.dead || !player || player.dying || player.piping) return;
        var hb = this.hitbox, ehb = player.hitbox;
        if (Mario.Util.overlap(
            this.pos[0] + hb[0], this.pos[1] + hb[1], hb[2], hb[3],
            player.pos[0] + ehb[0], player.pos[1] + ehb[1], ehb[2], ehb[3])) {
            if (player.starTime || player.inCar || player.inAircraft || player.vel[1] > 0) {
                player.bounce = true;
                this.hitByWeapon(2, { stun: 0.6 });
            } else if (player.parryTimer > 0 && player.onParrySuccess) {
                player.onParrySuccess(this);
            } else {
                player.damage();
            }
        }
    };

    Boss.prototype.applyImpulse = function (vx, vy, dmg) {
        this.pos[0] += vx * 0.4;
        this.stunTimer = Math.max(this.stunTimer, 0.45);
        this.hitByWeapon(dmg);
    };

    Boss.prototype.hitByWeapon = function (dmg, opts) {
        if (this.dead) return;
        opts = opts || {};
        var actualDmg = dmg !== undefined ? dmg : 1;
        var dmgType = opts.dmgType || (player && player.hero ? player.hero.zDmgType : 'kinetic');
        var isWeak = (dmgType && this.weakness && dmgType === this.weakness);
        if (isWeak) actualDmg *= 1.75;

        /* Стихийные реакции на Боссе: Вода + Молния / Газ + Огонь */
        if (opts.wet) this.wetTimer = Math.max(this.wetTimer, opts.wet);
        if (opts.gas) this.gasTimer = Math.max(this.gasTimer, opts.gas);
        if (opts.freeze) this.freezeTimer = Math.max(this.freezeTimer, opts.freeze);
        if (opts.bleed) this.dotTimer = Math.max(this.dotTimer, 3.0);

        if (this.wetTimer > 0 && (dmgType === 'electric' || opts.emp)) {
            actualDmg *= 2.2;
            this.stunTimer = Math.max(this.stunTimer, 3.2);
            this.wetTimer = 0;
            if (window.game) window.game.popup('ВОДА + МОЛНИЯ ×2.2!', this.pos[0] - 10, this.pos[1] - 24, '#68e8ff');
        }
        if (this.gasTimer > 0 && (dmgType === 'explosive' || dmgType === 'energy' || opts.bleed)) {
            actualDmg *= 2.5;
            this.gasTimer = 0;
            if (window.game) window.game.popup('ГАЗ + ОГОНЬ ×2.5!', this.pos[0] - 10, this.pos[1] - 24, '#ff6820');
        }

        var isCrit = opts.crit || (Math.random() < 0.16);
        if (isCrit) actualDmg *= 1.5;

        this.hp -= actualDmg;
        if (opts.stun) this.stunTimer = Math.max(this.stunTimer, opts.stun * 0.65);
        if (opts.slow) this.slowTimer = Math.max(this.slowTimer, opts.slow);
        if (window.game && window.game.registerCombatHit) {
            window.game.registerCombatHit(this, actualDmg, isCrit, isWeak);
        }
        Mario.Audio.play('bump');
        if (this.hp <= 0) {
            this.dead = true;
            if (window.game) {
                window.game.cinematicZoom = 1.2;
                window.game.cinematicTimer = 0.55;
                window.game.addScore(3000);
                window.game.popup(this.bossName + ' ПОВЕРЖЕН +3000!', this.pos[0] - 20, this.pos[1] - 14, '#ffe040');
            }
            var bx = this.pos[0] + 16, by = this.pos[1] + 18;
            ExplosionSystem.trigger({ x: bx, y: by, radius: 76, damage: 5, impulse: 7, color: '#ff3820', type: 'boss', secondary: true });
            ExplosionSystem.schedule(0.18, { x: bx - 16, y: by - 10, radius: 58, damage: 3, impulse: 5, color: '#ffe040', type: 'boss' });
            ExplosionSystem.schedule(0.34, { x: bx + 16, y: by - 6, radius: 64, damage: 3, impulse: 5, color: '#ff6820', type: 'boss' });
            if (typeof level !== 'undefined' && level && level.items) {
                level.items.push(new Mario.Pickup([bx - 12, 188], 'medkit'));
                level.items.push(new Mario.Pickup([bx + 8, 188], 'cdr'));
            }
        }
    };

    Boss.prototype.bump = function () {
        this.hitByWeapon(3, { stun: 0.8 });
    };

    /* ================================================================== */
    /* 10. AERIAL BOMB (Авиабомба с воронкой и ударной волной)            */
    /* ================================================================== */

    var Bomb = Mario.Bomb = function (pos, vel) {
        this.pos = [pos[0], pos[1]];
        this.vel = [vel ? vel[0] : 0, vel ? vel[1] : 1.5];
        this.hitbox = [0, 0, 6, 8];
        this.friendly = false;
        this.dead = false;
    };

    Bomb.prototype.remove = function () {
        this.dead = true;
    };

    Bomb.prototype.update = function () {
        if (this.dead) return;
        this.vel[1] = Math.min(5, this.vel[1] + 0.14);
        this.pos[0] += this.vel[0];
        this.pos[1] += this.vel[1];

        var tx = Math.floor((this.pos[0] + 3) / 16);
        var ty = Math.floor((this.pos[1] + 7) / 16);
        if (ty >= 13 || (ty >= 0 && ty <= 14 && tx >= 0 && (level.statics[ty][tx] || level.blocks[ty][tx]))) {
            this.detonate();
            return;
        }
        if (this.pos[1] > 236) {
            this.detonate();
        }
    };

    Bomb.prototype.checkCollisions = function () {
        if (this.dead || this.friendly || !player || player.dying || player.piping) return;
        if (Mario.Util.hits(player, this.pos[0], this.pos[1], 6, 8)) {
            this.detonate();
        }
    };

    Bomb.prototype.detonate = function () {
        if (this.dead) return;
        this.dead = true;
        ExplosionSystem.trigger({
            x: this.pos[0] + 3,
            y: this.pos[1] + 4,
            radius: this.friendly ? 48 : 36,
            damage: this.friendly ? 3.5 : 1.5,
            impulse: 4.2,
            color: this.friendly ? '#ffe040' : '#ff7828',
            type: 'bomb',
            hurtPlayer: !this.friendly
        });
    };

    Bomb.prototype.render = function (ctx, vX, vY) {
        if (this.dead) return;
        var x = Math.round(this.pos[0] - vX);
        var y = Math.round(this.pos[1] - vY);
        ctx.fillStyle = '#242830';
        ctx.fillRect(x, y, 6, 7);
        ctx.fillStyle = this.friendly ? '#48ff78' : '#ff3838';
        ctx.fillRect(x + 1, y + 5, 4, 2);
        ctx.fillStyle = '#ffd83d';
        ctx.fillRect(x + 2, y - 2, 2, 2);
    };

    /* ================================================================== */
    /* 11. EXPORTED ROSTER API                                            */
    /* ================================================================== */

    Mario.Action = {
        HEROES: HEROES,
        getHero: function (idOrIdx) {
            if (typeof idOrIdx === 'number') {
                return HEROES[((idOrIdx % HEROES.length) + HEROES.length) % HEROES.length];
            }
            return heroMap[idOrIdx] || HEROES[0];
        },
        getHeroCanvas: buildHeroCanvas
    };
})();
