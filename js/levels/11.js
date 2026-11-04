/*
 * World 1-1.
 */
var oneone = Mario.oneone = function () {
    level = new Mario.Level({
        name: '1-1',
        playerPos: [72, 192],
        loader: Mario.oneone,
        exit: 204,
        width: 214,
        next: Mario.one_two
    });

    [[0, 69], [71, 86], [89, 153], [155, 212]].forEach(function (loc) {
        level.putFloor(loc[0], loc[1]);
    });

    [[7, 3], [19, 2], [56, 3], [67, 2], [87, 2], [103, 2], [152, 3], [163, 2], [200, 3]].forEach(function (c) {
        level.putCloud(c[0], c[1]);
    });
    [[36, 2], [132, 2], [180, 2]].forEach(function (c) { level.putTwoCloud(c[0], c[1]); });
    [[27, 3], [75, 3], [123, 3], [171, 3]].forEach(function (c) { level.putThreeCloud(c[0], c[1]); });

    [0, 48, 96, 144, 192].forEach(function (x) { level.putBigHill(x, 12); });
    [16, 64, 111, 160].forEach(function (x) { level.putSmallHill(x, 12); });
    [23, 71, 118, 167].forEach(function (x) { level.putBush(x, 12); });
    [41, 89, 137].forEach(function (x) { level.putTwoBush(x, 12); });
    [11, 59, 106].forEach(function (x) { level.putThreeBush(x, 12); });

    /* Blocks & items */
    [
        [16, 9], [22, 5], [23, 9], [94, 5], [105, 9],
        [108, 9], [111, 9], [129, 5], [130, 5], [170, 9]
    ].forEach(function (p) {
        level.putQBlock(p[0], p[1], new Mario.Bcoin([0, 0]));
    });

    [[21, 9], [78, 9], [108, 5]].forEach(function (p) {
        level.putQBlock(p[0], p[1], new Mario.Mushroom([0, 0]));
    });

    [
        [20, 9], [22, 9], [24, 9], [77, 9], [79, 9],
        [80, 5], [81, 5], [82, 5], [83, 5], [84, 5], [85, 5], [86, 5], [87, 5],
        [91, 5], [92, 5], [93, 5], [94, 9], [101, 9], [117, 9],
        [120, 5], [121, 5], [122, 5], [123, 5], [128, 5],
        [129, 9], [130, 9], [131, 5], [168, 9], [169, 9], [171, 9]
    ].forEach(function (p) {
        level.putBrick(p[0], p[1], null);
    });

    level.putBrick(100, 9, new Mario.Star([0, 0]));
    level.putBrick(119, 9, new Mario.Mushroom([0, 0], true));

    /* Pipes */
    [[28, 2], [38, 3], [46, 4], [163, 2], [179, 2]].forEach(function (p) {
        level.putPipe(p[0], 13, p[1]);
    });
    level.putRealPipe(57, 9, 4, 'DOWN', function () {
        game.warpLevel(Mario.oneonetunnel);
    });

    /* Walls / staircases */
    [
        [134, 1], [135, 2], [136, 3], [137, 4],
        [140, 4], [141, 3], [142, 2], [143, 1],
        [148, 1], [149, 2], [150, 3], [151, 4], [152, 4],
        [155, 4], [156, 3], [157, 2], [158, 1],
        [181, 1], [182, 2], [183, 3], [184, 4], [185, 5], [186, 6], [187, 7], [188, 8], [189, 8]
    ].forEach(function (w) {
        level.putWall(w[0], 13, w[1]);
    });

    level.putFlagpole(198);

    /* Enemies (including Elite Modifiers: SHIELD, ARMOR, TELEPORT, REGEN) */
    var mods = ['SHIELD', 'ARMOR', 'TELEPORT', 'REGEN'];
    [
        [22, 12], [40, 12], [50, 12], [51, 12], [82, 4], [84, 4],
        [100, 12], [102, 12], [114, 12], [115, 12], [122, 12], [123, 12],
        [125, 12], [126, 12], [170, 12], [172, 12]
    ].forEach(function (e, idx) {
        var mod = (idx % 3 === 2) ? mods[(idx / 3 | 0) % mods.length] : null;
        level.putGoomba(e[0], e[1], mod);
    });
    level.putKoopa(35, 11);
    level.putHelicopter(92, 3, 2);
    level.putHelicopter(162, 3, 3);
    level.putJet(140, 2, 2);

    /* Взрывоопасное окружение (бочки, газовые баллоны, мины) для цепных реакций */
    level.putHazard(25, 12, 'barrel');
    level.putHazard(26, 12, 'cylinder');
    level.putHazard(49, 12, 'barrel');
    level.putHazard(50, 12, 'barrel');
    level.putHazard(98, 12, 'barrel');
    level.putHazard(99, 12, 'cylinder');
    level.putHazard(113, 12, 'mine');
    level.putHazard(124, 12, 'barrel');
    level.putHazard(125, 12, 'cylinder');
    level.putHazard(168, 12, 'barrel');

    /* Динамическое событие мира (разминирование бомбы) */
    level.putWorldEvent(68, 12, 'bomb');

    /* Чекпоинт, аптечки, броня и заряды Z */
    level.putCheckpoint(104, 11);
    level.putPickup(32, 8, 'energy');
    level.putPickup(84, 3, 'armor');
    level.putPickup(106, 8, 'medkit');
    level.putPickup(145, 8, 'cdr');

    /* Босс сектора перед финальной лестницей */
    level.putBoss(174, 11, 10, {
        name: 'ДРЕДНОУТ МК-I',
        color: '#3d4a60',
        visor: '#ff2424',
        weakness: 'electric'
    });
};
