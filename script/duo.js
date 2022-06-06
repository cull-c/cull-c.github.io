import { check, range, scroll, shot, changed } from './util/link.js';
import { draw, image } from './util/index.js';
import { bezier } from './util/alg.js';

let data;



const duo = (o, d, l, c, inv, data) => {
    let r = l - d;
    if (r <= 0) return;
    let b = data.back;
    let f = data.front;
    let _f = new Array(3);
    _f[0] = f[0] - b[0];
    _f[1] = f[1] - b[1];
    _f[2] = f[2] - b[2];

    c = c / 10;
    if (c < 0) c = 0;
    if (c > 1) c = 1;
    let p = bezier(c, 0, 1 - c, 1);

    let i, v;
    for (i = 0; i < o.length; i += 4) {
        if (!o[i + 3]) continue;
        v = o[i + 0];
        if (v < d) v = d;
        if (v > l) v = l;
        v = p((v - d) / r);
        if (inv) v = 1 - v;
        o[i + 0] = v * _f[0] + b[0];
        o[i + 1] = v * _f[1] + b[1];
        o[i + 2] = v * _f[2] + b[2];
    }
}

const img = ([inverse, contrast, dark, light, i], _data) => {
    _data = _data || data;
    let d = _data?.imgs[i];
    if (!d) return image();
    let [w, h] = [d.width, d.height];
    let o = new Uint8ClampedArray(d.data); 
    duo(o, dark, light, contrast, inverse, _data);
    return image(o, w, h, d);
}

export const setup = e => {
    check(e, 'inverse');
    const duo = e.querySelector('.row + .row');
    const buttons = [false, ...e.querySelectorAll('.row:last-child button')];
    range(e, ['contrast'], [4], 0, ([v], [e]) => e.nextElementSibling.innerHTML = v);

    const set = (v, e, i, _, cb) => {
        i = i ? 0 : 1;
        let change = v[1] <= v[0];
        if (change && i) v[1] = v[0] + 3;
        if (change && !i) v[0] = v[1] - 3;
        duo.firstElementChild.innerHTML = v[0];
        duo.lastElementChild.innerHTML = v[1];
        if (change) e[i].value = v[i];
        if (change) cb(i);
    }

    const click = (e, i, cb) => () => {
        let v = e.map(e => parseInt(e.value) || 0);
        let o = i % 2 ? 1 : -1;
        let j = i < 2 ? 0 : 1;
        v[j] += o * 3;
        e[j].value = v[j];
        set(v, e, j, 0, cb);
        cb(j);
    }

    const hold = new Array(8).fill(NaN);

    const down = (i, f) => () => {
        hold[i * 2] = setTimeout(() => {
            hold[i * 2 + 1] = setInterval(f, 100);
        }, 250);
    }

    const up = i => () => {
        clearTimeout(hold[i * 2]);
        clearInterval(hold[i * 2 + 1]);
    }

    range(e, ['dark', 'light'], [8, 8], 0, (v, e, i, _, cb) => {
        if (!buttons[0] && buttons.length && !buttons.shift()) {
            buttons.forEach((b, i) => {
                const f = click(e, i, cb);
                b.onpointerdown = down(i, f);
                b.onpointercancel = up(i);
                b.onpointerout = up(i);
                b.onpointerup = up(i);
                b.onclick = f;
            })
        }

        set(v, e, i, _, cb);
    })
}

export const load = (e, next, back, d) => {
    data = d;

    scroll('duo', data.imgs.length, e);
    let canvas = e.querySelector('canvas');
    let { _w, _h } = data;
    canvas.height = _h;
    canvas.width = _w;

    changed('duo', () => draw(canvas, img(shot('duo'))));

    return true;
}

export const next = done => {
    if (!data) return done(false);
    let [inverse] = shot('duo');
    data.inverse = !!inverse;
    return done(data);
}

export const process = (data, duo) => {
    let out = { ...data };
    out.imgs = [];

    let d = shot('duo', duo).slice(0, -1);
    for (let i = 0; i < data.imgs.length; ++i) {
        out.imgs.push(img(d.concat(i), data));
    }

    if (!out.imgs.length) {
        return undefined;
    }
    return out;
}

export const clear = () => {
    data = undefined;
}



export const text = ['Duochrome'];
