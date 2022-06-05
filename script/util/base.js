const chars = ['09', 'az', 'AZ', '--', '__'].map(c => c.split('').map((c, i) => c.charCodeAt(0) + i));

const dec = s => {
    let j;
    let l = 0;
    if (!s) return 0;
    let i = s.charCodeAt(0) || 0;
    for (j = 0; j < chars.length; ++j) {
        if (chars[j][0] <= i && i < chars[j][1]) break;
        if (j >= chars.length - 1) return 0;
        l += chars[j][1] - chars[j][0];
    }

    let c = l + i - chars[j][0]
    return Math.max(0, Math.min(63, c));
}

const enc = i => {
    let j;
    i = Math.max(0, Math.min(63, i || 0));
    for (j = 0; j < chars.length; ++j) {
        i -= chars[j][1] - chars[j][0];
        if (i < 0) break;
    }

    let c = i + chars[j][1];
    return String.fromCharCode(c);
}

const bin = i => {
    if (!i || i < 0) return [false];
    let b = [];
    do {
        if (i % 2) b.unshift(true);
        else b.unshift(false);
        i = Math.floor(i / 2);
    } while (i);
    return b;
}

const int = (b, _i, _j, _l, r) => {
    let l = b?.length;
    if (!l) return 0;
    _l = _l  || 0;
    _i = _i || 0;
    _j = _j || l;
    let j;
    let i = 0;
    let n = 1;
    let o = _l - l;
    if (o < 0) o = 0;
    if (_j > l + o) _j = l + o;
    for (j = 1; j <= _j - _i; ++j) {
        if (r && b[_i + j - 1 - o]) i += n;
        if (!r && b[_j - j - o]) i += n;
        n *= 2;
    }
    return i;
}

const encode = b => {
    let s = '';
    if (!b?.length) return '';
    for (let i = 0; i < b.length; i += 6) {
        s += enc(int(b, i, i + 6, 0, true));
    }
    return s;
}

const decode = s => {
    let b = [];
    if (!s) return b;
    for (let i = 0; i < s.length; ++i) {
        let c = bin(dec(s[i])).reverse();
        while (c.length < 6) c.push(false);
        b.push(...c);
    }
    return b;
}

export { bin, int, encode, decode };
