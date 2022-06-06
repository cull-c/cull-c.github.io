import { link, radio, check, scroll, snap, shot, changed, scrolled } from './util/link.js';
import { draw, _col, _rgb, _hex, compute, image, benchmark } from './util/index.js';
import { lab, dist } from './util/alg.js'; 

let state;
let data;



const simple = (o, r, g, b) => {
    let n = r + g + b;
    if (!n) return;
    r /= n;
    g /= n;
    b /= n;

    let v, i;
    for (i = 0; i < o.length; i += 4) {
        if (!o[i + 3]) continue;
        v = r * o[i + 0] + g * o[i + 1] + b * o[i + 2];
        o[i + 0] = v;
        o[i + 1] = v;
        o[i + 2] = v;
    }
}

const advanced = (o, f, b, c) => {
    let lf = lab(f[0], f[1], f[2]);
    let lb = lab(b[0], b[1], b[2]);
    let d = dist(lf, lb);

    let v, i, lc, df, db;
    for (i = 0; i < o.length; i += 4) {
        if (!o[i + 3]) continue;
        lc = lab(o[i + 0], o[i + 1], o[i + 2]);
        df = dist(lc, lf);
        db = dist(lc, lb);
        if (c && (df >= d || db >= d)) v = df < db ? 255 : 0;
        else v = db ? db / (db + df) * 255 : 0;
        o[i + 0] = v;
        o[i + 1] = v;
        o[i + 2] = v;
    }
}

const img = ([mode, red, green, blue, front, back, range, i], _data) => {
    let d = (_data || data)?.imgs[i];
    if (!d) return image();
    let [w, h] = [d.width, d.height];
    let o = new Uint8ClampedArray(d.data); 
    if (mode === 0) simple(o, 0.3, 0.59, 0.11);
    else if (mode === 1) simple(o, red, green, blue);
    else if (mode === 2) advanced(o, _col(front), _col(back), range);
    return image(o, w, h, d);
}

const dark = lab(16, 16, 16);
const palette = (e, r, g, b) => {
    let l = dist(lab(r, g, b), dark);
    e.classList.remove('light', 'dark');
    e.style.backgroundColor = _rgb([r, g, b]);
    e.classList.add(l < 20 ? 'dark' : 'light');
}

const picker = (f, c, next, back,  cb) => {
    const q = '#main > #steps > #gray ';
    const bot = document.querySelector(q + '.bot');
    const canvas = document.querySelector(q + 'canvas');
    const [target, gray, row, hex, cancel, reset, pick] = [
        '.target', '#gray-check', '.color', '#pick-hex', '.cancel', '.reset', '.pick'
    ].map(s => bot.lastElementChild.querySelector(s));

    next(false);
    back(false);

    let i = 0;
    let front = f === 'front';
    const picking = () => {
        let s = shot('gray');
        i = s[s.length - 1];
        let col = _col(c[0], c[1], c[2]);
        if (front) s[4] = col;
        else s[5] = col;
        if (gray.checked) s[0] = 2;
        else s[0] = 3;
        draw(canvas, img(s));
    }

    const pop = () => {
        next(true);
        back(true);
        scrolled('gray', undefined);
        bot.classList.remove('pick');
    }

    const set = (x, y, z) => {
        c = [x || 0, y || 0, z || 0];
        hex.value = _hex(c);
        palette(row, c[0], c[1], c[2]);
        if (gray.checked) picking();
    }

    const touch = e => {
        if (e.touches?.[0]) e = e.touches[0];
        else if (!e.button && !(e.buttons % 2)) return;
        let img = data?.imgs[i];
        if (!img) return set(0, 0, 0);
        let rect = canvas.getBoundingClientRect();
        let [_x, _y] = [e.pageX - rect.left, e.pageY - rect.top];
        let [_w, _h] = [canvas.width, canvas.height];
        let [w, h] = [img.width, img.height];
        let x = Math.round(_x - (_w - w) / 2);
        let y = Math.round(_y - (_h - h) / 2);
        if (x >= w || y >= h || x < 0 || y < 0) return set(0, 0, 0);
        let [d, j] = [img.data, (y * w + x) * 4];
        set(d[j + 0], d[j + 1], d[j + 2]);
    }

    canvas.onmousedown = touch;
    canvas.onmousemove = touch;
    canvas.ontouchmove = touch;
    canvas.ontouchstart = touch;

    target.innerHTML = front ? 'foreground' : 'background';
    reset.onclick = () => front ? set(255, 255, 255) : set(0, 0, 0);
    pick.onclick = () => (cb(c[0], c[1], c[2]), pop());
    hex.onblur = () => set(..._hex(hex.value));
    cancel.onclick = pop;

    bot.classList.add('pick');

    set(c[0], c[1], c[2]);
    gray.oninput = picking;
    scrolled('gray', picking);
}

export const setup = (e, n, b) => {
    radio(e, 'gray', 2);
    check(e, 'red', 'green', 'blue');
    const val = e => parseInt(e.color) || 0;
    const set = (v, e) => (e.color = v, palette(e, ..._col(v)));
    const ev = s => (cb, e) => {
        const v = () => _col(parseInt(e.color) || 0);
        e.onclick = () => picker(s, v(), n, b, (r, g, b) => {
            let v = `${_col(r, g, b)}`;
            e.color = v;
            cb();
        })
    }

    ['front', 'back'].map(s => link(e, `button#${s}`, 24, ev(s), val, set));
    check(e, 'range');
}

export const load = (e, next, back, d) => {
    state = undefined;
    data = d;

    scroll('gray', data.imgs.length, e);
    let canvas = e.querySelector('canvas');
    let { _w, _h } = data;
    canvas.height = _h;
    canvas.width = _w;

    changed('gray', () => draw(canvas, img(shot('gray'))));

    return true;
}

export const next = done => {
    let gray = snap('gray');
    if (state === gray) return done();
    if (!data) return done(false);

    compute(async () => {
        try {
            let d = benchmark('process', () => process(data, gray));
            if (!d) return done(false);
            state = gray;
            done(d);
        }
        catch (err) {
            done(false);
        }
    })
}

export const process = (data, gray) => {
    let out = { ...data };
    out.imgs = [];

    let d = shot('gray', gray).slice(0, -1);
    for (let i = 0; i < data.imgs.length; ++i) {
        out.imgs.push(img(d.concat(i), data));
    }

    if (!out.imgs.length) {
        return undefined;
    }
    return out;
}

export const clear = () => {
    state = undefined;
    data = undefined;
}



export const text = ['Grayscale'];
