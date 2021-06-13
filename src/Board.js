class Board {
  /** @type   {Tile[][]} */
  arr;

  constructor() {
    this.created = false;
    this.gameover = false;

    this.initBoard();
  }

  /**
   * Checks whether (r, c) is a valid tile.
   * @param {number} r
   * @param {number} c
   * @returns {boolean}
   */
  static borderCheck(r, c) {
    return !(r < 0 || r >= CONFIG.rows || c < 0 || c >= CONFIG.cols);
  }

  /**
   * Initializes board array to 0s, all covered.
   */
  initBoard() {
    this.arr = Array(CONFIG.rows)
        .fill(0).map(() => Array(CONFIG.cols).fill(0));
    for (let i = 0; i < CONFIG.rows; i++) {
      for (let j = 0; j < CONFIG.cols; j++) {
        this.arr[i][j] = new Tile(i, j, 0);
      }
    }
  }

  /**
   * Creates a new board filled with mines.
   * Safe zone around the player's first click.
   * @param {number} safe_r - Row of first click
   * @param {number} safe_c - Column of first click
   */
  createBoard(safe_r, safe_c) {
    this.created = true;
    let arr = Array(CONFIG.rows)
        .fill(0).map(() => Array(CONFIG.cols).fill(0));
    let choices = [];
    for (let r = 0; r < CONFIG.rows; r++) {
      for (let c = 0; c < CONFIG.cols; c++) {
        if (Math.abs(safe_r - r) <= CONFIG.safeRadius
            && Math.abs(safe_c - c) <= CONFIG.safeRadius) {
          continue;
        }
        choices.push([r, c]);
      }
    }
    choices = shuffle(choices);
    for (let i = 0; i < CONFIG.mines; i++) {
      let mine_idx = choices[i];
      arr[mine_idx[0]][mine_idx[1]] = 9;
    }

    for (let r = 0; r < CONFIG.rows; r++) {
      for (let c = 0; c < CONFIG.cols; c++) {
        for (let drc of CONFIG.adj) {
          if (arr[r][c] === 9) continue;
          let new_r = r + drc[0], new_c = c + drc[1];
          if (new_r < 0 || new_r >= CONFIG.rows
              || new_c < 0 || new_c >= CONFIG.cols) {
            continue;
          }
          arr[r][c] += arr[r + drc[0]][c + drc[1]] === 9;
        }
      }
    }

    arr.forEach((row, r) =>
        row.forEach((tile, c) =>
            this.arr[r][c] = new Tile(r, c, tile)
        )
    );
  }

  draw() {
    this.drawBoard();
  }

  drawBoard() {
    this.arr.forEach(row => row.forEach(tile => tile.draw()));
  }

  /**
   * Flags tile at (r, c).
   * Checks borders and flag validity.
   * @param {number} r
   * @param {number} c
   */
  flag(r, c) {
    if (Board.borderCheck(r, c) && this.arr[r][c].covered) {
      this.arr[r][c].flag();
    }
  }

  /**
   * Clicks on tile at (r, c).
   * Checks borders, and if middle click,
   * checks for validity before clicking around tile
   * @param {number} r
   * @param {number} c
   * @param {boolean} middleClick - Whether to click around tile
   * @returns {boolean} Whether any tiles were changed
   */
  click(r, c, middleClick) {
    if (!Board.borderCheck(r, c)) {
      return false;
    }

    if (!this.created) {
      this.createBoard(r, c);
    }

    // check middle click flags
    let flagsAround = this.countFlagsAround(r, c);
    if (middleClick && this.arr[r][c].val === flagsAround &&
        this.countCoveredAround(r, c) > flagsAround) {
      this.clickAround(r, c);
    } else if (this.arr[r][c].covered && !this.arr[r][c].flagged) {
      this.uncover(r, c);
      if (this.arr[r][c].val === 0) {
        this.clickAround(r, c);
      }
    } else {
      return false;
    }
    return true;
  }

  /**
   * Clicks around (r, c) recursively (flood fill).
   * Checks for boundaries and recurses only if surrounding tile is 0.
   * Returns true if board was modified, false otherwise.
   * @param {number} r
   * @param {number} c
   * @returns {boolean} Whether any tiles were changed
   */
  clickAround(r, c) {
    if (!Board.borderCheck(r, c)) {
      return false;
    }

    if (this.arr[r][c].val === 9) {
      this.gameover = true;
    }

    let changed = false;
    for (let [newR, newC] of this.arr[r][c].adj) {
      if (!Board.borderCheck(newR, newC) ||
          !this.arr[newR][newC].covered || this.arr[newR][newC].flagged) {
        continue;
      }
      this.uncover(newR, newC);
      changed = true;
      if (this.arr[newR][newC].val === 0) {
        this.clickAround(newR, newC);
      }
    }
    return changed;
  }

  /**
   * Uncovers tile at (r, c), checking for game over.
   * @param {number} r
   * @param {number} c
   */
  uncover(r, c) {
    this.arr[r][c].uncover();

    if (this.arr[r][c].val === 9) {
      this.gameover = true;
    }
  }

  /**
   * Counts the number of flagged tiles surrounding (r, c)
   * @param {number} r
   * @param {number} c
   * @returns {number}
   */
  countFlagsAround(r, c) {
    let numFlags = 0;
    for (let [newR, newC] of this.arr[r][c].adj) {
      numFlags += this.arr[newR][newC].flagged;
    }
    return numFlags;
  }

  /**
   * Counts the number of covered tiles surrounding (r, c)
   * @param {number} r
   * @param {number} c
   * @returns {number}
   */
  countCoveredAround(r, c) {
    let numCovered = 0;
    for (let [newR, newC] of this.arr[r][c].adj) {
      numCovered += this.arr[newR][newC].covered;
    }
    return numCovered;
  }

  /**
   * Counts the number of covered tiles with no flag surrounding (r, c)
   * @param {number} r
   * @param {number} c
   * @returns {number}
   */
  countUnflaggedAround(r, c) {
    let numUnflagged = 0;
    for (let [newR, newC] of this.arr[r][c].adj) {
      numUnflagged +=
          this.arr[newR][newC].covered && !this.arr[newR][newC].flagged;
    }
    return numUnflagged;
  }
}
