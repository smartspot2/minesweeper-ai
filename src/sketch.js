let board;
let ai;
const IMG = {};
const FONT = {};
const FONT_OFFSET = {};

let P5 = new p5(function (p) {
  p.preload = function () {
    IMG.mine = p.loadImage('./img/mine.png');
    IMG.flag = p.loadImage('./img/flag.png');
    FONT.nums = p.loadFont('./font/Changa-Medium.ttf');
    FONT_OFFSET.nums = {x: 0, y: -7};
  }

  p.setup = function () {
    let canvas = p.createCanvas(800, 800);
    canvas.parent('sketch');
    canvas.id('sketch-canvas');
    // Remove right click context menu
    document.getElementById('sketch-canvas').oncontextmenu =
            e => e.preventDefault();

    CONFIG.tileSize = Math.min(
        CONFIG.boardWidth / CONFIG.cols,
        CONFIG.boardHeight / CONFIG.rows
    );
    CONFIG.boardTL = {
      x: 0.5 * (p.width - CONFIG.cols * CONFIG.tileSize),
      y: 0.5 * (p.height - CONFIG.rows * CONFIG.tileSize)
    };

    board = new Board();
    ai = new AI(board);
    // noLoop();
    p.redraw();
    p.frameRate(60);
  }

  p.draw = function () {
    // background(51);

    if (board.gameover || ai.gameOver) return;

    if (ai.enabled) {
      ai.aiStep();
    }
    board.draw();
    ai.draw();
  }

  p.mousePressed = function () {
    let mc = Math.floor((p.mouseX - CONFIG.boardTL.x) / CONFIG.tileSize);
    let mr = Math.floor((p.mouseY - CONFIG.boardTL.y) / CONFIG.tileSize);

    if (board.gameover) return;

    if (p.mouseButton === p.LEFT) {
      if (p.keyIsPressed && p.key === 'Shift') {
        board.click(mr, mc, true);
      } else {
        board.click(mr, mc, false);
      }
    } else if (p.mouseButton === p.RIGHT) {
      board.flag(mr, mc);
    } else { // (mouseButton == CENTER) {
      board.click(mr, mc, true);
    }
    p.redraw();
  }
});

