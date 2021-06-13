const CONFIG = {
  /**
   * Top-left coordinate of the board in pixels.
   * @type {{x: number, y: number}}
   */
  boardTL: {x: 0, y: 0},
  /**
   * Width of the Minesweeper board in pixels.
   * @type number
   */
  boardWidth: 750,
  /**
   * Height of the Minesweeper board in pixels.
   * @type number
   */
  boardHeight: 750,
  /**
   * Size of each Minesweeper tile in pixels.
   * This is both the width and height, as each tile is a square.
   * @type number
   */
  tileSize: 32,
  /**
   * Number of rows in the Minesweeper board.
   * @type number
   */
  rows: 30,
  /**
   * Number of columns in the Minesweeper board.
   * @type number
   */
  cols: 30,
  /**
   * Number of mines in the Minesweeper board.
   * @type number
   */
  mines: 175,

  /**
   * Radius in which no mines will appear on the first click.
   * This radius defines a square centered on the first click;
   * the width and height of this safe square are
   * one more than twice this number.
   * @type number
   */
  safeRadius: 1,

  /**
   * Offset for adjacent tiles in the form [dr, dc]
   * @type {number[][]}
   */
  adj: [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
  ],

  /**
   * Colors of the number hints, from 0 through 9.
   * The color for 0 is used as the background color for the tile, and the
   * color for 9 is only used if the mine image is not loaded.
   * @type {string[]}
   */
  numColors: [
    '#C0C0C0', '#0100FE', '#017F01',
    '#FE0000', '#010080', '#810102',
    '#008081', '#000000', '#808080',
    '#FE0000'
  ],
  /**
   * Possible colors of border tile shading.
   * These colors are iterated over for each group,
   * looping back to the beginning if there are not enough.
   * @type {string[]}
   */
  shadeColors: ['#FF000033', '#0000FF33', '#FFFF0033', '#FF00FF33'],
}
