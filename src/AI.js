class AI {
  /**
   * Creates a new AI from a pre-existing board.
   * @param {Board} board - Board to create AI from
   */
  constructor(board) {
    /**
     * Current board.
     * @type {Board}
     */
    this.board = board;
    /**
     * Current tile the Ai is looking at.
     * @type {number[]}
     */
    this.curPos = [0, 0];
    /**
     * Whether to run the AI.
     * @type {boolean}
     */
    this.enabled = true;
    /**
     * Whether the AI has run out of certain moves.
     * @type {boolean}
     */
    this.gameOver = false;
    /**
     * Whether anything has changed in current loop through the board.
     * @type {boolean}
     */
    this.changed = true;

    /**
     * Positions left to visit (uncovered tiles adjacent to border tiles)
     * @type {number[][]}
     */
    this.posQueue = [];
    /**
     * Covered tiles adjacent to at least one uncovered tile
     * @type {number[][]}
     */
    this.borderTiles = [];
    /**
     * Uncovered tiles adjacent to border tiles, by group
     * @type {number[][][]}
     */
    this.adjBorderTiles = [];
    /**
     * Border tiles, grouped if adjacent
     * @type {number[][][]}
     */
    this.groupedBorderTiles = [];

    this.permuting = false;
    this.perm = {
      /**
       * next permutation
       * @type {string} */
      next: '',
      /**
       * total number of permutations per group
       * @type {number[]} */
      counts: [],
      /**
       * frequency of mines per tile
       * @type {number[][]} */
      freq: [],
      /**
       * current group
       * @type {number} */
      group: 0,
      /**
       * covered tiles next to adjacent uncovered tiles (by group)
       * @type {{string: number[]}[]} */
      adj: [],
      /**
       * all possible permutations of mines (as bit-strings)
       * for each number (by group)
       * @type {{string: string[]}[]} */
      adjPerms: [],
    };
  }

  /**
   * Run one step of the AI algorithm.
   */
  aiStep() {
    if (!this.board.created) {
      let firstR = Math.floor(Math.random() * CONFIG.rows);
      let firstC = Math.floor(Math.random() * CONFIG.cols);
      this.board.click(firstR, firstC, false);
    }

    if (this.permuting) {
      let permuteSuccessful = this.permuteStep();
      if (!permuteSuccessful) {
        this.curPos = [0, 0];
        this.gameOver = true;
      }
    } else {
      this.nextPos();
      let [r, c] = this.curPos;
      let prevNums = this.getBorder()[1];
      let curClicked, curFlagged;
      if (!this.board.arr[r][c].covered) {
        curClicked = this.board.click(r, c, true);
        curFlagged = this.flagAround(r, c);
      }
      this.changed |= curClicked || curFlagged;
      let [afterBorder, afterNums] = this.getBorder();
      this.borderTiles = afterBorder;
      // Add uncovered number tiles to front of list
      if (curClicked) {
        let newNums = afterNums.filter(tile => !includesCoord(prevNums, tile));
        // Remove all tiles surrounding current tile from queue
        for (let coordIdx = this.posQueue.length - 1; coordIdx >= 0; coordIdx--) {
          if (includesCoord(this.board.arr[r][c].adj, this.posQueue[coordIdx])) {
            this.posQueue.splice(coordIdx, 1);
          }
        }
        this.posQueue.unshift(...newNums);
      }
      // Add potential number tiles to front of list
      if (curFlagged) {
        let newNums = [];
        // Flags surrounding current tile
        for (let [flagR, flagC] of this.board.arr[r][c].adj) {
          if (!this.board.arr[flagR][flagC].flagged) continue;
          // Uncovered tiles surrounding flag
          for (let [flagAdjR, flagAdjC] of this.board.arr[flagR][flagC].adj) {
            let invalidPotential = (flagAdjR === r && flagAdjC === c)
                || this.board.arr[flagAdjR][flagAdjC].covered
                || this.board.countUnflaggedAround(flagAdjR, flagAdjC) === 0
                || includesCoord(newNums, [flagAdjR, flagAdjC]);
            if (invalidPotential) {
              let posQueueIdx = this.posQueue.findIndex(
                  coord => coord[0] === flagAdjR && coord[1] === flagAdjC
              );
              // Remove from queue if not potential candidate anymore
              if (posQueueIdx >= 0) {
                this.posQueue.splice(posQueueIdx, 1);
              }
              continue;
            }
            newNums.push([flagAdjR, flagAdjC]);
          }
        }
        this.posQueue = this.posQueue.filter(
            tile => !includesCoord(newNums, tile)
        );
        newNums.sort(coordSortFunc);
        this.posQueue.unshift(...newNums);
      }
      this.groupedBorderTiles = this.groupBorder(this.borderTiles);
    }
  }

  /**
   * Get next tile to visit.
   * Goes from top to bottom, with the exception of newly uncovered tiles.
   */
  nextPos() {
    if (this.posQueue.length === 0) {
      if (this.changed) {
        this.changed = false;
      } else {
        this.#initPermuting();
        return;
      }
      let [borderTiles, borderNums] = this.getBorder();
      this.posQueue = borderNums;
      this.borderTiles = borderTiles;
      this.groupedBorderTiles = this.groupBorder(this.borderTiles);
      if (this.posQueue.length === 0) {
        this.curPos = [0, 0];
        this.gameOver = true;
        return;
      }
    }
    this.curPos = this.posQueue.shift();
  }

  /**
   * Initialize permutation process and variables.
   */
  #initPermuting() {
    this.permuting = true;
    this.changed = true;
    this.perm.group = 0;
    this.perm.next = '';
    this.perm.counts = Array(this.groupedBorderTiles.length).fill(0);
    this.perm.freq = [];
    this.adjBorderTiles = [];
    this.perm.adj = Array(this.groupedBorderTiles.length)
        .fill(0).map(() => Object());
    this.perm.adjPerms = Array(this.groupedBorderTiles.length)
        .fill(0).map(() => Object());
    for (let [group_idx, group] of this.groupedBorderTiles.entries()) {
      this.perm.freq.push(Array(group.length).fill(0));
      let adj = this.#getUncoveredAdj(group);
      this.adjBorderTiles.push(adj);
      for (let coord of adj) {
        this.perm.adj[group_idx][coord] = [];
        let minesLeft = this.board.arr[coord[0]][coord[1]].val;
        // Filter for uncovered & unflagged, counting flags in the process
        for (let adjCoord of this.board.arr[coord[0]][coord[1]].adj) {
          if (this.board.arr[adjCoord[0]][adjCoord[1]].covered
              && !this.board.arr[adjCoord[0]][adjCoord[1]].flagged) {
            this.perm.adj[group_idx][coord].push(adjCoord);
          } else if (this.board.arr[adjCoord[0]][adjCoord[1]].flagged) {
            minesLeft--;
          }
        }
        this.perm.adjPerms[group_idx][coord] = this.getCombinations(
            minesLeft, this.perm.adj[group_idx][coord].length
        );
      }
    }
  }

  /**
   * Flag all covered tiles around (r, c).
   * @param {number} r
   * @param {number} c
   * @returns {boolean} Whether any tiles were changed
   */
  flagAround(r, c) {
    let changed = false;
    if (board.countCoveredAround(r, c) === this.board.arr[r][c].val) {
      for (let [newR, newC] of this.board.arr[r][c].adj) {
        if (this.board.arr[newR][newC].covered
            && !this.board.arr[newR][newC].flagged) {
          this.board.arr[newR][newC].setFlag();
          changed = true;
        }
      }
    }
    return changed;
  }

  /**
   * Return all binary strings with `k` 1s of `n` total bits.
   * @param {number} k - Number of 1s
   * @param {number} n - Total bit length
   * @returns {string[]}
   */
  getCombinations(k, n) {
    let combs = [];
    let bitStr = ((1 << k) - 1);
    while (bitStr.toString(2).length <= n) {
      combs.push(bitStr.toString(2).padStart(n, '0'));
      bitStr = nextBitPerm(bitStr);
    }
    return combs;
  }

  /**
   * Draw current AI state to screen.
   */
  draw() {
    let [r, c] = this.curPos;
    if (!this.permuting) {
      P5.fill(0);
      P5.noStroke();
      P5.rectMode(P5.CENTER);
      P5.ellipse(
          CONFIG.boardTL.x + CONFIG.tileSize * (c + 0.5),
          CONFIG.boardTL.y + CONFIG.tileSize * (r + 0.5),
          5, 5
      );
    }

    P5.rectMode(P5.CORNER);
    if (!this.permuting) {
      let color_idx = 0;
      for (let group of this.groupedBorderTiles) {
        for (let [br, bc] of group) {
          P5.fill(CONFIG.shadeColors[color_idx]);
          P5.noStroke();
          P5.rect(
              CONFIG.boardTL.x + CONFIG.tileSize * bc,
              CONFIG.boardTL.y + CONFIG.tileSize * br,
              CONFIG.tileSize, CONFIG.tileSize
          );
        }
        color_idx = (color_idx + 1) % CONFIG.shadeColors.length;
      }
    } else {
      let color_idx = 0;
      for (let [group_idx, group] of this.groupedBorderTiles.entries()) {
        for (let [idx, [br, bc]] of group.entries()) {
          if (this.perm.counts[group_idx] !== 0) {
            let alphaScale =
                this.perm.freq[group_idx][idx] / this.perm.counts[group_idx];
            let alpha = Math.floor(255 * (alphaScale));
            let alphaStr = alpha.toString(16).padStart(2, '0');
            P5.fill(CONFIG.shadeColors[color_idx].slice(0, 7) + alphaStr);
            P5.noStroke();
            P5.rect(
                CONFIG.boardTL.x + CONFIG.tileSize * bc,
                CONFIG.boardTL.y + CONFIG.tileSize * br,
                CONFIG.tileSize, CONFIG.tileSize
            );
          }

          if (this.perm.next[idx] === '1' && this.perm.group === group_idx) {
            P5.fill('#00000055');
            P5.noStroke();
            P5.ellipse(CONFIG.boardTL.x + CONFIG.tileSize * (bc + 0.5),
                CONFIG.boardTL.y + CONFIG.tileSize * (br + 0.5),
                5, 5
            );
          }
        }
        color_idx = (color_idx + 1) % CONFIG.shadeColors.length;
      }
    }
    for (let [br, bc] of this.posQueue) {
      P5.fill(0, 255, 0, 50);
      P5.noStroke();
      P5.rect(
          CONFIG.boardTL.x + CONFIG.tileSize * bc,
          CONFIG.boardTL.y + CONFIG.tileSize * br,
          CONFIG.tileSize, CONFIG.tileSize
      );
    }
  }

  // ----- BORDER -----

  /**
   * Find border tiles and uncovered tiles next to border tiles.
   * @returns {number[][][]}
   */
  getBorder() {
    let borderTiles = new Set();
    let borderNums = new Set();
    for (let r = 0; r < CONFIG.rows; r++) {
      for (let c = 0; c < CONFIG.cols; c++) {
        if (!this.board.arr[r][c].covered || this.board.arr[r][c].flagged) {
          continue;
        }
        for (let [newR, newC] of this.board.arr[r][c].adj) {
          if (!this.board.arr[newR][newC].covered) {
            borderNums.add(`${newR},${newC}`);
            borderTiles.add(`${r},${c}`);
          }
        }
      }
    }
    borderTiles = Array.from(borderTiles).map(strToCoord);
    borderNums = Array.from(borderNums).map(strToCoord);
    borderTiles.sort(coordSortFunc);
    borderNums.sort(coordSortFunc);
    return [borderTiles, borderNums];
  }

  /**
   * Group border tiles if adjacent.
   * @param {number[][]} borderTiles
   * @returns {number[][][]}
   */
  groupBorder(borderTiles) {
    /** @type number[][][] */
    let borderGroups = [];
    for (let coord of borderTiles) {
      let adjIndices = [];
      for (let [idx, group] of borderGroups.entries()) {
        for (let otherCoord of group) {
          if (this.#isAdjacent(coord, otherCoord)) {
            adjIndices.push(idx);
            break;
          }
        }
      }
      if (adjIndices.length === 0) {  // Create new group
        borderGroups.push([coord]);
      } else if (adjIndices.length === 1) {  // Add to group
        borderGroups[adjIndices[0]].push(coord);
      } else if (adjIndices.length > 1) {  // Join groups
        let firstIdx = adjIndices[0];
        for (let idx of adjIndices.slice(1).reverse()) {
          borderGroups[firstIdx].push(...borderGroups[idx]);
          borderGroups.splice(idx, 1);
        }
        borderGroups[firstIdx].push(coord);
      }
    }
    borderGroups.forEach(group => group.sort(coordSortFunc));
    borderGroups.sort((groupA, groupB) => groupA.length - groupB.length)
    return borderGroups;
  }

  #isAdjacent(coordA, coordB) {
    let adjA = this.board.arr[coordA[0]][coordA[1]].adj
        .filter(([newR, newC]) => !this.board.arr[newR][newC].covered)
        .map(coord => coord.toString());
    let adjB = this.board.arr[coordB[0]][coordB[1]].adj
        .filter(([newR, newC]) => !this.board.arr[newR][newC].covered)
        .map(coord => coord.toString());
    let intersection = adjA.filter(coord => adjB.includes(coord));
    return intersection.length > 0;
  }

  // ----- PERMUTATIONS -----

  /**
   * One step of calculating permutations.
   * @returns {boolean} Whether permutation was successful.
   * Only returns false if no certain permutation was found,
   * or if there are no more permutations left.
   */
  permuteStep() {
    // Get next permutation; if no more then increase group and repeat
    while (!this.nextPermutation()) {
      let certainChoice = this.choosePermutation();
      if (certainChoice) {
        this.permuting = false;
        this.perm.next = '';
        return true;
      }
      this.perm.next = '';

      this.perm.group++;
      if (this.perm.group >= this.groupedBorderTiles.length) {
        this.permuting = false;
        return false;
      }
    }

    for (let [idx, v] of Array.from(this.perm.next).entries()) {
      this.perm.freq[this.perm.group][idx] += (v === '1') | 0;
    }
    return true;
  }

  /**
   * Calculates the next valid permutation.
   * @returns {boolean} Whether any next permutation exists
   */
  nextPermutation() {
    let prevLookup = null;
    if (this.perm.next !== '') {
      prevLookup = new Map();
      for (let [coordIdx, coord]
          of this.groupedBorderTiles[this.perm.group].entries()) {
        prevLookup.set(coord.toString(), this.perm.next[coordIdx]);
      }
    }
    let res = this.recursivePermute(0, new Map(), prevLookup);
    if (res.done) {
      this.perm.next = this.groupedBorderTiles[this.perm.group]
          .map(v => res.lookup.get(v.toString())).join('');
      this.perm.counts[this.perm.group]++;
      return true;
    } else {
      return false;
    }
  }

  /**
   * Recursively goes through different permutations,
   * exiting on first valid permutation.
   * Uses lookup to return to previous state if there was one.
   * @param {number} idx - Current group index
   * @param {Map} lookup - Current lookup map for current state
   * @param {Map} prevLookup - Previous lookup map used to restore state
   * @returns {{done: boolean, lookup: Map}} Flags if found a permutation,
   * and includes the lookup map for retrieving the permutation
   * and resetting the state.
   */
  recursivePermute(idx, lookup, prevLookup) {
    if (idx >= this.adjBorderTiles[this.perm.group].length) {
      return {
        done: true,
        lookup: new Map(lookup)
      };
    }
    let curTile = this.adjBorderTiles[this.perm.group][idx];
    /** @type {number[]} */
    let curAdj = this.perm.adj[this.perm.group][curTile.toString()];
    /** @type {string[]} */
    let curPerms = this.perm.adjPerms[this.perm.group][curTile];
    if (prevLookup !== null) {
      if (curAdj.filter(v => !prevLookup.has(v.toString())).length !== 0) {
        throw Error('invalid lookup prevLookup');
      }
      let prevPerm = curAdj.map(v => prevLookup.get(v.toString())).join('');
      let prevPermIdx = curPerms.indexOf(prevPerm);
      if (idx === this.adjBorderTiles[this.perm.group].length - 1) {
        curPerms = curPerms.slice(prevPermIdx + 1);
        prevLookup = null;
      } else {
        curPerms = curPerms.slice(prevPermIdx);
      }
    }
    permLoop:
        for (let perm of curPerms) {
          let curLookup = new Map(lookup);
          for (let [adj_idx, adj] of curAdj.entries()) {
            let adjStr = adj.toString();
            // Check validity
            if (curLookup.has(adjStr)
                && curLookup.get(adjStr) !== perm[adj_idx]) {
              continue permLoop;
            }
            curLookup.set(adjStr, perm[adj_idx]);
          }
          // Recurse
          if (prevLookup !== null && perm !== curPerms[0]) prevLookup = null;
          let res = this.recursivePermute(idx + 1, curLookup, prevLookup);
          if (res.done) return res;
        }
    return {done: false, lookup: null}
  }

  /**
   * Get all uncovered tiles adjacent to a group.
   * @param {number[][]} group
   * @returns {number[][]} Adjacent uncovered tile list
   */
  #getUncoveredAdj(group) {
    let uncoveredAdj = [];
    for (let coord of group) {
      for (let [newR, newC] of this.board.arr[coord[0]][coord[1]].adj) {
        if (!this.board.arr[newR][newC].covered
            && !includesCoord(uncoveredAdj, [newR, newC])) {
          uncoveredAdj.push([newR, newC]);
        }
      }
    }
    return uncoveredAdj;
  }

  /**
   * If there exists a certain subset of the permutation, execute it.
   * @returns {boolean} Whether there were any certain actions
   */
  choosePermutation() {
    let certain = false;
    let totalPermutations = this.perm.counts[this.perm.group];
    if (totalPermutations === 0) return false;
    for (let [idx, freq] of this.perm.freq[this.perm.group].entries()) {
      let curCoord = this.groupedBorderTiles[this.perm.group][idx];
      if (freq === 0) {
        this.board.click(curCoord[0], curCoord[1], false);
        certain = true;
      } else if (freq === totalPermutations) {
        this.board.flag(curCoord[0], curCoord[1]);
        certain = true;
      }
    }
    return certain;
  }
}
