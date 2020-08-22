/**
 * Shuffles array in place.
 * @param {Array} a An array containing the items.
 */
function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

/**
 * Determines whether a coordinate is in an array
 * @param   {number[][]}        arr
 * @param   {[number, number]}  coord
 * @returns {boolean}
 */
function includesCoord(arr, coord) {
    for (let c of arr) {
        if (c[0] === coord[0] && c[1] === coord[1]) {
            return true;
        }
    }
    return false;
}

/**
 * Counts the number of trailing 0s in a 32-bit string
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
 * @param integer
 * @returns {number}
 */
function ctz(integer) { // count trailing zeros
    // 1. fill in all the higher bits after the first one
    integer |= integer << 16;
    integer |= integer << 8;
    integer |= integer << 4;
    integer |= integer << 2;
    integer |= integer << 1;
    // 2. Now, inverting the bits reveals the lowest bits
    return 32 - Math.clz32(~integer) | 0; // `|0` ensures integer coercion
}

/**
 * Generates the lexicographically next bit permutation.
 * @see https://graphics.stanford.edu/~seander/bithacks.html#NextBitPermutation
 * @param   {number}    v   previous bit-string
 * @returns {number}        next bit-string
 */
function nextBitPerm(v) {
    let t = v | (v - 1); // t gets v's least significant 0 bits set to 1
    // Next set to 1 the most significant bit to change,
    // set to 0 the least significant ones, and add the necessary 1 bits.
    return (t + 1) | (((~t & -~t) - 1) >> (ctz(v) + 1));
}

/**
 * Sort function for coordinate lists
 * @param   {[number, number]}  a
 * @param   {[number, number]}  b
 * @returns {number}
 */
function coordSortFunc(a, b) {
    return a[0] === b[0] ? a[1] - b[1] : a[0] - b[0];
}

/**
 * Converts a string of the form 'r,c' to a coordinate list
 * @param   {string}    s   string of form 'r,c'
 * @returns {number[]}      coordinate list
 */
function strToCoord(s) {
    return s.split(',').map(val => Number(val))
}
