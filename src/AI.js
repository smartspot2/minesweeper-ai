class AI {
    constructor(board) {
        /** @type Board */
        this.board = board;
        this.curpos = [0, 0];
        this.enabled = true;
        this.changed = true;

        /**
         * Positions left to visit (uncovered tiles adjacent to border tiles)
         * @type {number[][]}
         */
        this.posqueue = [];
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
            /** next permutation
             * @type {string} */
            next: '',
            /** temp permutation for display
             * @type {string} */
            temp: '',
            /** total number of permutations per group
             * @type {number[]} */
            counts: [],
            /** frequency of mines per tile
             * @type {number[][]} */
            freq: [],
            /** current group
             * @type {number} */
            group: 0,
            /** current permutation number
             * @type {number} */
            num: -1,
            /** if paused for display midway through permutation calculation
             * @type {boolean} */
            increasingNum: false,
            /** covered tiles next to adjacent uncovered tiles (by group)
             * @type {{string: number[]}[]} */
            adj: [],
            /** all possible permutations (as bit-strings) of mines for each number (by group)
             * @type {{string: string[]}[]} */
            adjPerms: [],
        };
        // this.permutations = [];
    }

    aiStep() {
        if (!this.board.created) {
            let firstR = Math.floor(Math.random() * CONFIG.rows);
            let firstC = Math.floor(Math.random() * CONFIG.cols);
            this.board.click(firstR, firstC, false);
        }

        if (this.permuting) {
            let permuteSuccessful = this.permuteStep();
            if (!permuteSuccessful) {
                this.curpos = [0, 0];
                this.enabled = false;
            }
        } else {
            this.nextPos();
            let [r, c] = this.curpos;

            if (!this.board.arr[r][c].covered) {
                this.changed |= this.board.click(r, c, true);
                this.changed |= this.flagAround(r, c);
            }

            this.borderTiles = this.getBorder()[0];
            this.groupedBorderTiles = this.groupBorder(this.borderTiles);
        }
    }

    nextPos() {
        if (this.posqueue.length === 0) {
            let [borderTiles, borderNums] = this.getBorder();
            this.posqueue = borderNums;
            this.borderTiles = borderTiles;
            if (this.posqueue.length === 0) {
                this.curpos = [0, 0];
                this.enabled = false;
                return;
            }
            if (this.changed) {
                this.changed = false;
            } else {
                this.permuting = true;
                this.changed = true;
                this.perm.group = 0;
                this.perm.num = 0;
                this.perm.counts = Array(this.groupedBorderTiles.length).fill(0);
                this.perm.freq = [];
                this.adjBorderTiles = [];
                this.perm.adj = Array(this.groupedBorderTiles.length).fill(0).map(() => Object());
                this.perm.adjPerms = Array(this.groupedBorderTiles.length).fill(0).map(() => Object());
                for (let [group_idx, group] of this.groupedBorderTiles.entries()) {
                    this.perm.freq.push(Array(group.length).fill(0));
                    let adj = this.#getUncoveredAdj(group);
                    this.adjBorderTiles.push(adj);
                    for (let coord of adj) {
                        this.perm.adj[group_idx][coord] = [];
                        let minesLeft = this.board.arr[coord[0]][coord[1]].val;
                        // Filter for uncovered & unflagged, counting flags in the process
                        for (let adjCoord of this.board.arr[coord[0]][coord[1]].adj) {
                            if (this.board.arr[adjCoord[0]][adjCoord[1]].covered && !this.board.arr[adjCoord[0]][adjCoord[1]].flagged) {
                                this.perm.adj[group_idx][coord].push(adjCoord);
                            } else if (this.board.arr[adjCoord[0]][adjCoord[1]].flagged) {
                                minesLeft--;
                            }
                        }
                        this.perm.adjPerms[group_idx][coord] = this.getCombinations(minesLeft, this.perm.adj[group_idx][coord].length);
                    }
                }
                console.log('generating permutations...')
                return;
            }
        }
        this.curpos = this.posqueue.shift();
    }

    /**
     * Flags all covered tiles around (r, c)
     * @param   {number}    r
     * @param   {number}    c
     * @returns {boolean}
     */
    flagAround(r, c) {
        let changed = false;
        if (board.countCoveredAround(r, c) === this.board.arr[r][c].val) {
            for (let [newR, newC] of this.board.arr[r][c].adj) {
                if (this.board.arr[newR][newC].covered && !this.board.arr[newR][newC].flagged) {
                    this.board.arr[newR][newC].setFlag();
                    changed = true;
                }
            }
        }
        return changed;
    }

    /**
     * Binary string with k 1s and n total bits
     * @param   {number}    k   number of 1s
     * @param   {number}    n   total bit length
     * @returns {string[]}
     */
    getCombinations(k, n) {
        let combs = [];
        for (let bitStr = ((1 << k) - 1); bitStr.toString(2).length <= n; bitStr = nextBitPerm(bitStr)) {
            combs.push(bitStr.toString(2).padStart(n, '0'));
        }
        return combs;
    }

    draw() {
        let [r, c] = this.curpos;
        if (!this.permuting) {
            P5.fill(0);
            P5.noStroke();
            P5.rectMode(P5.CENTER);
            P5.ellipse(CONFIG.board_tl.x + CONFIG.tilesize * (c + 0.5), CONFIG.board_tl.y + CONFIG.tilesize * (r + 0.5), 5, 5);
        }

        P5.rectMode(P5.CORNER);
        if (!this.permuting) {
            let coloridx = 0;
            for (let group of this.groupedBorderTiles) {
                for (let [br, bc] of group) {
                    P5.fill(CONFIG.shadecolors[coloridx]);
                    P5.noStroke();
                    P5.rect(CONFIG.board_tl.x + CONFIG.tilesize * bc, CONFIG.board_tl.y + CONFIG.tilesize * br, CONFIG.tilesize, CONFIG.tilesize);
                }
                coloridx = (coloridx + 1) % CONFIG.shadecolors.length;
            }
        } else {
            let coloridx = 0;
            this.groupedBorderTiles.forEach((group, group_idx) => {
                group.forEach(([br, bc], idx) => {
                    if (this.perm.counts[group_idx] !== 0) {
                        // console.log((this.permutationFrequency[group_idx][idx]));
                        let alpha = Math.floor(255 * (this.perm.freq[group_idx][idx] / this.perm.counts[group_idx]));
                        let alphaStr = alpha.toString(16).padStart(2, '0');
                        // console.log(alpha, alphaStr);
                        P5.fill(CONFIG.shadecolors[coloridx].slice(0, 7) + alphaStr);
                        P5.noStroke();
                        P5.rect(CONFIG.board_tl.x + CONFIG.tilesize * bc, CONFIG.board_tl.y + CONFIG.tilesize * br, CONFIG.tilesize, CONFIG.tilesize);
                    }

                    // console.log('draw', this.perm.temp[idx]);
                    if (this.perm.next[idx] === '1') {
                        P5.fill('#00000055');
                        P5.noStroke();
                        P5.ellipse(CONFIG.board_tl.x + CONFIG.tilesize * (bc + 0.5), CONFIG.board_tl.y + CONFIG.tilesize * (br + 0.5), 5, 5);
                    }
                });
                coloridx = (coloridx + 1) % CONFIG.shadecolors.length;
            });
        }
        for (let [br, bc] of this.posqueue) {
            P5.fill(0, 255, 0, 50);
            P5.noStroke();
            P5.rect(CONFIG.board_tl.x + CONFIG.tilesize * bc, CONFIG.board_tl.y + CONFIG.tilesize * br, CONFIG.tilesize, CONFIG.tilesize);
        }
    }

    // ----- BORDER -----

    /**
     * Finds border tiles and uncovered tiles next to border tiles.
     * @returns {number[][][]}
     */
    getBorder() {
        let borderTiles = new Set();
        let borderNums = new Set();
        for (let r = 0; r < CONFIG.rows; r++) {
            for (let c = 0; c < CONFIG.cols; c++) {
                if (!this.board.arr[r][c].covered || this.board.arr[r][c].flagged) continue;
                for (let [newR, newC] of this.board.arr[r][c].adj) {
                    if (!this.board.arr[newR][newC].covered) {
                        borderNums.add(`${newR},${newC}`);
                        borderTiles.add(`${r},${c}`);
                    }
                }
            }
        }
        borderTiles = Array.from(borderTiles).map(v => v.split(',').map(it => Number(it)));
        borderNums = Array.from(borderNums).map(v => v.split(',').map(it => Number(it)));
        borderTiles.sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
        borderNums.sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
        return [borderTiles, borderNums];
    }

    /**
     * Groups border tiles if adjacent
     * @param   {number[][]}    borderTiles
     * @returns {number[][][]}
     */
    groupBorder(borderTiles) {
        /** @type number[][][] */
        let borderGroups = [];
        for (let coord of borderTiles) {
            let adjIndices = [];
            borderGroups.forEach((group, idx) => {
                for (let otherCoord of group) {
                    if (this.#isAdjacent(coord, otherCoord)) {
                        adjIndices.push(idx);
                        return;
                    }
                }
            });
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
        borderGroups.forEach(group => group.sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
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

    permuteStep() {
        while (!this.nextPermutation()) {  // Get next, if no more then inc group and repeat
            if (this.perm.increasingNum) break;
            let certainChoice = this.choosePermutation();
            if (certainChoice) {
                this.permuting = false;
                this.perm.next = '';
                console.log('found certain permutation')
                return true;
            }
            this.perm.num = 0;
            this.perm.next = '';

            do {  // inc group, skipping over gruops that are too long
                this.perm.group++;
                if (this.perm.group >= this.groupedBorderTiles.length) {
                    this.permuting = false;
                    console.log('no more permutations')
                    return false;
                }
            } while (this.groupedBorderTiles[this.perm.group].length > 16)
            // TODO: split up large groups into sections?
        }
        if (this.perm.increasingNum) return true;

        console.log('permutation:', this.perm.next);

        Array.from(this.perm.next).forEach(
            (v, idx) => this.perm.freq[this.perm.group][idx] += (v === '1') | 0
        );
        return true;
    }

    nextPermutation() {
        let prevLookup = null;
        if (this.perm.next !== '') {
            prevLookup = new Map();
            for (let [coord_idx, coord] of this.groupedBorderTiles[this.perm.group].entries()) {
                prevLookup.set(coord.toString(), this.perm.next[coord_idx]);
            }
        }
        let res = this.recursivePermute(0, new Map(), prevLookup);
        if (res.done) {
            this.perm.next = this.groupedBorderTiles[this.perm.group].map(v => res.lookup.get(v.toString())).join('');
            this.perm.counts[this.perm.group]++;
            return true;
        } else {
            return false;
        }
    }

    /**
     * Recursively goes through different permutations, exiting on first valid permutation.
     * Uses lookup to return to previous state if there was one.
     * @param   {number}    idx
     * @param   {Map}       lookup
     * @param   {Map}   prevLookup
     * @returns {{done: boolean, lookup: Map}}
     * Flags if found a permutation, and includes the lookup map for retrieving
     * the permutation and resetting the state.
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
        // TODO: Check for previous state
        /** @type {string[]} */
        let curPerms = this.perm.adjPerms[this.perm.group][curTile];
        // console.log('prev state check:', lookup)
        if (prevLookup !== null) {
            if (curAdj.filter(v => !prevLookup.has(v.toString())).length !== 0) throw Error('invalid lookup prevLookup');
            let prevPerm = curAdj.map(v => prevLookup.get(v.toString())).join('');
            let prevPermIdx = curPerms.indexOf(prevPerm);
            if (idx === this.adjBorderTiles[this.perm.group].length - 1) {
                // next permutation if at the end; unflag prevLookup
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
                    if (curLookup.has(adjStr) && curLookup.get(adjStr) !== perm[adj_idx]) {
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

    nextPermutationOld() {
        let permStr;
        if (!this.perm.increasingNum) {
            console.log('\tincreasing perm num...')
        }
        this.perm.increasingNum = true;
        let numincrease = 0;
        do {
            numincrease++;
            if (numincrease >= CONFIG.maxincbreak) {
                this.perm.temp = permStr;
                // console.log('\t\ttemp ine exit', this.perm.temp)
                return false;
            }
            this.perm.num++;
            if (this.perm.num >= Math.pow(2, this.groupedBorderTiles[this.perm.group].length)) {
                this.perm.increasingNum = false;
                return false;  // no more permutations for current group
            }
            permStr = this.perm.num.toString(2).padStart(this.groupedBorderTiles[this.perm.group].length, '0');
        } while (!this.#validPermutation(this.groupedBorderTiles[this.perm.group], this.adjBorderTiles[this.perm.group], permStr))
        this.perm.increasingNum = false;
        console.log('\tfound next permutation')
        this.perm.next = permStr;
        this.perm.counts[this.perm.group]++;
        return true;
    }

    /**
     * Returns adjacent tiles that are uncovered
     * @param   {number[][]}    group
     * @returns {number[][]}
     */
    #getUncoveredAdj(group) {
        let uncoveredAdj = [];
        for (let coord of group) {
            for (let [newR, newC] of this.board.arr[coord[0]][coord[1]].adj) {
                if (!this.board.arr[newR][newC].covered && !includesCoord(uncoveredAdj, [newR, newC])) {
                    uncoveredAdj.push([newR, newC]);
                }
            }
        }
        return uncoveredAdj;
    }

    /**
     * Checks if a permutation is valid in context of surrounding tiles.
     * @param   {number[][]}    group
     * @param   {number[][]}    adj
     * @param   {string}        perm
     * @returns {boolean}
     */
    #validPermutation(group, adj, perm) {
        let lookup = {};
        group.forEach((coord, idx) => lookup[coord] = perm[idx] === '1');
        for (let [r, c] of adj) {
            let flagCount = 0;
            for (let [newR, newC] of this.board.arr[r][c].adj) {
                if (this.board.arr[newR][newC].covered) {
                    flagCount += this.board.arr[newR][newC].flagged || lookup[[newR, newC]];
                }
            }
            if (flagCount !== this.board.arr[r][c].val) {
                return false;
            }
        }
        return true;
    }

    choosePermutation() {
        let certain = false;
        let totalPermutations = this.perm.counts[this.perm.group];
        if (totalPermutations === 0) return false;
        this.perm.freq[this.perm.group].forEach((freq, idx) => {
            let curCoord = this.groupedBorderTiles[this.perm.group][idx];
            if (freq === 0) {
                this.board.click(curCoord[0], curCoord[1], false);
                certain = true;
            } else if (freq === totalPermutations) {
                this.board.flag(curCoord[0], curCoord[1]);
                certain = true;
            }
        });
        return certain;
    }
}
