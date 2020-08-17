let board;
let ai;
const IMG = {};
const FONT = {};
const FONT_OFFSET = {};

let P5 = new p5(function(p) {
    p.preload = function () {
        console.log('loading assets...');
        IMG.mine = p.loadImage('./img/mine.png');
        IMG.flag = p.loadImage('./img/flag.png');
        FONT.nums = p.loadFont('./font/Changa-Medium.ttf');
        FONT_OFFSET.nums = {x: 0, y: -7};
        console.log('finished loading assets');
    }

    p.setup = function () {
        let canvas = p.createCanvas(800, 800);
        canvas.parent('sketch');
        canvas.id('sketch-canvas');
        // Remove right click
        document.getElementById('sketch-canvas').oncontextmenu = e => e.preventDefault();

        CONFIG.tilesize = Math.min(CONFIG.board_w / CONFIG.cols, CONFIG.board_h / CONFIG.rows);
        CONFIG.board_tl = {
            x: 0.5 * (p.width - CONFIG.cols * CONFIG.tilesize),
            y: 0.5 * (p.height - CONFIG.rows * CONFIG.tilesize)
        };

        board = new Board();
        ai = new AI(board);
        // noLoop();
        p.redraw();
        p.frameRate(30);
    }

    p.draw = function () {
        // background(51);

        if (board.gameover) return;

        if (ai.enabled) {
            ai.aiStep();
        }
        board.draw();
        ai.draw();
    }

    p.mousePressed = function () {
        let mc = Math.floor((p.mouseX - CONFIG.board_tl.x) / CONFIG.tilesize);
        let mr = Math.floor((p.mouseY - CONFIG.board_tl.y) / CONFIG.tilesize);

        if (board.gameover) return;
        console.log(p.mouseButton);

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

