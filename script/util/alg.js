const _rgb = [...Array(256).keys()].map(v => v / 255).map(v => {
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
})

const _xyz = [...Array(10000).keys()].map(v => v / 9999).map(v => {
    return Math.pow(v, 1 / 3);
})

// https://github.com/hamada147/IsThisColourSimilar
export const lab = (r, g, b) => {
    r = _rgb[r];
    g = _rgb[g];
    b = _rgb[b];
    let x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.94811;
    let y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / 1.00000;
    let z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.07304;
    x = x > 0.008856 ? _xyz[Math.round(Math.min(1, x) * 9999)] : (7.787 * x) + 16 / 116;
    y = y > 0.008856 ? _xyz[Math.round(Math.min(1, y) * 9999)] : (7.787 * y) + 16 / 116;
    z = z > 0.008856 ? _xyz[Math.round(Math.min(1, z) * 9999)] : (7.787 * z) + 16 / 116;
    return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)];
}

// https://github.com/antimatter15/rgb-lab
export const dist = (x, y) => {
    let l = x[0] - y[0];
    let a = x[1] - y[1];
    let b = x[2] - y[2];
    let c = Math.sqrt(x[1] * x[1] + x[2] * x[2]);
    let d = c - Math.sqrt(y[1] * y[1] + y[2] * y[2]);
    let e = a * a + b * b - d * d;
    e = e < 0 ? 0 : Math.sqrt(e);
    a = d / (1 + 0.045 * c);
    b = e / (1 + 0.015 * c);
    let f = l * l + a * a + b * b;
    return f < 0 ? 0 : Math.sqrt(f);
}



// https://stackoverflow.com/a/17243070
export const rgb = (h, s, v) => {
    h = Math.min(1, h / 360);
    s = Math.min(1, s / 100);
    v = Math.min(1, v / 100);

    let r, g, b;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// https://stackoverflow.com/a/17243070
export const hsv = (r, g, b) => {
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let d = max - min;
    let s = (max === 0 ? 0 : d / max);
    let v = max / 255;
    let h;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6 : 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

// https://stackoverflow.com/a/17243070
export const hsl = (h, s, v) => {
    s = Math.min(1, s / 100);
    v = Math.min(1, v / 100);

    let _s = s * v;
    let _l = (2 - s) * v;
    _s /= _l <= 1 ? _l : 2 - _l;
    if (isNaN(_s)) _s = 1;
    _l /= 2;

    return [h, Math.round(_s * 100), Math.round(_l * 100)];
}



// https://github.com/gre/bezier-easing
const subdivide = (x, a, b, ax, bx) => {
    let cx, ct;
    let i = 0;
    do {
        ct = a + (b - a) / 2;
        cx = calc(ct, ax, bx) - x;
        if (cx > 0) b = ct;
        else a = ct;
    } while (Math.abs(cx) > 0.0000001 && ++i < 10);
    return ct;
}

// https://github.com/gre/bezier-easing
const iterate = (x, g, ax, bx) => {
    for (let i = 0; i < 4; ++i) {
        let cs = slope(g, ax, bx);
        if (!cs) return g;
        let cx = calc(g, ax, bx) - x;
        g -= cx / cs;
    }
    return g;
}

// https://github.com/gre/bezier-easing
const slope = (t, a, b) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);
const calc = (t, a, b) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t;
const A = (a, b) => 1 - 3 * b + 3 * a;
const B = (a, b) => 3 * b - 6 * a;
const C = (a) => 3 * a;

// https://github.com/gre/bezier-easing
export const bezier = (ax, ay, bx, by) => {
    if (ax === ay && bx === by) return x => x;
    let sample = new Array(11);
    let l = sample.length - 1;
    let s = 1 / (l - 1);
    for (let i = 0; i <= l; ++i) {
        sample[i] = calc(i * s, ax, bx);
    }

    const t = x => {
        let i = 0;
        let p = 0;
        for (; i < l - 1 && sample[i + 1] <= x; ++i) p += s;
        let d = (x - sample[i]) / (sample[i + 1] - sample[i]);
        let g = p + d * s;
        let initial = slope(g, ax, bx);
        if (initial >= 0.001) return iterate(x, g, ax, bx);
        else if (initial) return subdivide(x, p, p + s, ax, bx);
        else return g;
    }

    return x => {
        if (x === 0 || x === 1) return x;
        return calc(t(x), ay, by);
    }
}
