const CONFIG = {
    board_tl: {x: 0, y: 0},
    board_w: 750,
    board_h: 750,
    tilesize: 32,
    rows: 30,
    cols: 30,
    mines: 150,

    maxincbreak: 1050,

    saferadius: 1,

    adj: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],

    numcolors: ['#C0C0C0', '#0100FE', '#017F01', '#FE0000', '#010080', '#810102', '#008081', '#000000', '#808080', '#FE0000'],
    shadecolors: ['#FF000033', '#0000FF33', '#FFFF0033', '#FF00FF33'],
}
