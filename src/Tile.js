class Tile {
    constructor(r, c, val) {
        this.r = r;
        this.c = c;
        this.val = val;
        this.covered = true;
        this.flagged = false;
        this.adj = [];
        for (let drc of CONFIG.adj) {
            if (Board.borderCheck(r + drc[0], c + drc[1])) {
                this.adj.push([r + drc[0], c + drc[1]]);
            }
        }
    }

    draw() {
        let x = CONFIG.board_tl.x + CONFIG.tilesize * this.c;
        let y = CONFIG.board_tl.y + CONFIG.tilesize * this.r;
        P5.rectMode(P5.CORNER)
        if (this.covered) {
            let borderScale = 0.12;
            P5.noStroke();
            P5.fill(155);
            P5.rect(x, y, CONFIG.tilesize, CONFIG.tilesize);
            P5.fill(230);
            P5.triangle(x, y, x + CONFIG.tilesize, y, x, y + CONFIG.tilesize);
            P5.fill(220);
            P5.rect(x + borderScale * CONFIG.tilesize, y + borderScale * CONFIG.tilesize,
                CONFIG.tilesize * (1 - 2 * borderScale), CONFIG.tilesize * (1 - 2 * borderScale));

            if (this.flagged) {
                P5.image(IMG.flag, x, y, CONFIG.tilesize, CONFIG.tilesize);
            }
        } else {
            P5.fill(CONFIG.numcolors[0]);
            P5.stroke(128);
            P5.strokeWeight(2);
            P5.rect(x, y, CONFIG.tilesize, CONFIG.tilesize);

            P5.textAlign(P5.CENTER, P5.CENTER);
            P5.fill(CONFIG.numcolors[this.val]);
            P5.noStroke();
            P5.textSize(24);
            P5.textStyle(P5.BOLD);
            P5.textFont(FONT.nums);
            if (this.val > 0 && this.val < 9) {
                P5.text(this.val, x + CONFIG.tilesize / 2 + FONT_OFFSET.nums.x, y + CONFIG.tilesize / 2 + FONT_OFFSET.nums.y);
            } else if (this.val === 9) {
                P5.image(IMG.mine, x, y, CONFIG.tilesize, CONFIG.tilesize);
            }
        }
    }

    uncover() {
        if (!this.flagged) {
            this.covered = 0;
        }
    }

    flag() {
        if (this.covered) {
            this.flagged ^= 1;
        }
    }

    setFlag() {
        if (this.covered) {
            this.flagged = true;
        }
    }
}

