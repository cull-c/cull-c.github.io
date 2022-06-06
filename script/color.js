import { range, snap, shot } from './util/link.js';
import { _col, _rgb, _hex } from './util/index.js'
import { rgb, hsv, hsl } from './util/alg.js';

let state;
let data;



export const setup = e => {
    const n = [9, 7, 7];
    const t = ['back', 'front'];
    const s = ['hue-', 'saturation-', 'value-'];
    const preview = e.querySelector('.preview');
    const hex = t.map(s => e.querySelector(`#${s}-hex`));

    const color = (v, e, i, j, cb) => {
        if (i !== 0) {
            const p = v => `${v}%`;
            let [_, s, l] = hsl(0, v[1], v[2]);
            e[0].style.setProperty('--s', p(s));
            e[0].style.setProperty('--l', p(l));
        }

        if (i !== 1) {
            let c = _rgb(rgb(v[0], 100, v[2]));
            e[1].style.setProperty('--c', c);
        }

        if (i !== 2) {
            let c = _rgb(rgb(v[0], v[1], 100));
            e[2].style.setProperty('--c', c);
        }

        let c = rgb(v[0], v[1], v[2]);
        preview.style.setProperty('--' + t[j], _rgb(c));
        hex[j].value = _hex(c);

        if (!cb || hex[j].onblur) return;
        hex[j].onblur = () => {
            let v = _hex(hex[j].value);
            let c = hsv(...v);
            e[0].value = c[0];
            e[1].value = c[1];
            e[2].value = c[2];
            color(c, e, -1, j);
            cb();
        }
    }

    range(e, s.map(s => s + t[0]), n, 0, color);
    range(e, s.map(s => s + t[1]), n, 1, color);
}

export const load = (e, next, back, d) => {
    state = undefined;
    data = d;

    return true;
}

export const next = done => {
    let color = snap('color');
    if (state === color) return done();
    if (!data) return done(false);

    let d = process(data, color);
    if (!d) return done(false);
    state = color;
    return done(d);
}

export const process = (data, color) => {
    let out = { ...data };

    let [bh, bs, bv, fh, fs, fv] = shot('color', color);
    out.front = rgb(fh, fs, fv);
    out.back = rgb(bh, bs, bv);
    return out;
}

export const clear = () => {
    state = undefined;
    data = undefined;
}



export const text = ['Palette'];
