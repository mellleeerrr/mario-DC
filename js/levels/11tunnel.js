/*
 * Underground bonus room of World 1-1.
 */
var oneonetunnel = Mario.oneonetunnel = function () {
    level = new Mario.Level({
        name: '1-1',
        playerPos: [40, 16],
        loader: Mario.oneonetunnel,
        scrolling: false,
        underground: true,
        width: 16
    });

    level.putFloor(0, 16);
    level.putWall(0, 13, 11);

    [4, 5, 6, 7, 8, 9, 10].forEach(function (loc) {
        level.putWall(loc, 13, 3);
        level.putWall(loc, 3, 1);
    });

    [
        [5, 5], [6, 5], [7, 5], [8, 5], [9, 5],
        [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7],
        [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9]
    ].forEach(function (pos) {
        level.putCoin(pos[0], pos[1]);
    });

    level.putRealPipe(13, 11, 3, 'RIGHT', function () {
        game.warpLevel(Mario.oneone, [2616, 176], 'UP');
    });

    level.putPipe(15, 13, 13);
};
