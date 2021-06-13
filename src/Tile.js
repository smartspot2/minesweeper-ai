class Tile {
  /**
   * Creates a Minesweeper tile.
   * @param {number} r
   * @param {number} c
   * @param {number} val
   */
  constructor(r, c, val) {
    /**
     * Tile row
     * @type {number}
     */
    this.r = r;
    /**
     * Tile column
     * @type {number}
     */
    this.c = c;
    /**
     * Tile value; 9 = mine
     * @type {number}
     */
    this.val = val;
    /**
     * Whether the tile is covered
     * @type {boolean}
     */
    this.covered = true;
    /**
     * Whether the tile is flagged
     * @type {boolean}
     */
    this.flagged = false;
    /**
     * Coordinates of adjacent tiles
     * @type {[number, number][]}
     */
    this.adj = [];
    for (let drc of CONFIG.adj) {
      if (Board.borderCheck(r + drc[0], c + drc[1])) {
        this.adj.push([r + drc[0], c + drc[1]]);
      }
    }
  }

  draw() {
    let x = CONFIG.boardTL.x + CONFIG.tileSize * this.c;
    let y = CONFIG.boardTL.y + CONFIG.tileSize * this.r;
    P5.rectMode(P5.CORNER)
    if (this.covered) {
      let borderScale = 0.12;
      P5.noStroke();
      P5.fill(155);
      P5.rect(x, y, CONFIG.tileSize, CONFIG.tileSize);
      P5.fill(230);
      P5.triangle(x, y, x + CONFIG.tileSize, y, x, y + CONFIG.tileSize);
      P5.fill(220);
      P5.rect(
          x + borderScale * CONFIG.tileSize,
          y + borderScale * CONFIG.tileSize,
          CONFIG.tileSize * (1 - 2 * borderScale),
          CONFIG.tileSize * (1 - 2 * borderScale)
      );

      if (this.flagged) {
        P5.image(IMG.flag, x, y, CONFIG.tileSize, CONFIG.tileSize);
      }
    } else {
      P5.fill(CONFIG.numColors[0]);
      P5.stroke(128);
      P5.strokeWeight(2);
      P5.rect(x, y, CONFIG.tileSize, CONFIG.tileSize);

      P5.textAlign(P5.CENTER, P5.CENTER);
      P5.fill(CONFIG.numColors[this.val]);
      P5.noStroke();
      P5.textSize(24);
      P5.textStyle(P5.BOLD);
      P5.textFont(FONT.nums);
      if (this.val > 0 && this.val < 9) {
        P5.text(this.val,
            x + CONFIG.tileSize / 2 + FONT_OFFSET.nums.x,
            y + CONFIG.tileSize / 2 + FONT_OFFSET.nums.y
        );
      } else if (this.val === 9) {
        P5.image(IMG.mine, x, y, CONFIG.tileSize, CONFIG.tileSize);
      }
    }
  }

  /**
   * Uncover this tile; does nothing if tile is flagged.
   */
  uncover() {
    if (!this.flagged) {
      this.covered = false;
    }
  }

  /**
   * Toggles flag for this tile; does nothing if tile is uncovered.
   */
  flag() {
    if (this.covered) {
      this.flagged ^= true;
    }
  }

  /**
   * Flags this tile; does nothing if tile is uncovered.
   */
  setFlag() {
    if (this.covered) {
      this.flagged = true;
    }
  }
}

