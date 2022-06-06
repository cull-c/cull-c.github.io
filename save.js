import { link, radio, check, range, snap, shot, changed } from './util/link.js';
import { _rgb, compute, blob, png, zip, download } from './util/index.js';
import * as upload from './upload.js';
import * as gray from './gray.js';
import * as color from './color.js';
import * as duo from './duo.js';

let data;



const collage = d => {
    let widths = d.map(i => i.width);
    let heights = d.map(i => i.height);
    let sizes = [widths, heights].map(l => Math.max(...l));
    let diffs = [widths, heights].map((l, i) => sizes[i] - Math.min(...l));
    const m = (f, s) => layers.reduce((a, c, i) => f(c, a[0]) ? [c, i] : a, [s, 0])[1];
    const max = () => m((c, a) => c > a, -Infinity);
    const min = () => m((c, a) => c < a, Infinity);
    let c = diffs[0] <= diffs[1];
    let size = sizes[+!c];

    let total = (c ? heights : widths).reduce((a, b) => a + b, 0);
    let layers = new Array(Math.max(1, Math.round(Math.sqrt(total / size))));
    if (layers.length > d.length) layers = layers.slice(0, d.length);
    layers.fill(0);

    for (let i = 0; i < d.length; ++i) {
        let j = min();
        d[i].x = c ? j * size : layers[j];
        d[i].y = c ? layers[j] : j * size;
        layers[j] += c ? d[i].height : d[i].width;
    }

    let width = c ? size * layers.length : layers[max()];
    let height = c ? layers[max()] : size * layers.length;
    let dim = c ? height : width;

    for (let i = 0; i < d.length; ++i) {
        let j = Math.floor((c ? d[i].x : d[i].y) / size);
        let a = (size - (c ? d[i].width : d[i].height)) / 2;
        let b = (dim - (layers[j] || dim)) / 2;
        d[i].x += Math.round(c ? a : b);
        d[i].y += Math.round(c ? b : a);
    }

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.height = height;
    canvas.width = width;

    let inv = data.inverse;
    ctx.fillStyle = _rgb(inv ? data.front : data.back);
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < d.length; ++i) {
        ctx.putImageData(d[i], d[i].x, d[i].y);
    }

    return canvas;
}

const _stats = ([o, t, w, h, s, scale, width, height]) => {
    let widths = data?.imgs?.map(img => img.naturalWidth) || [0];
    let heights = data?.imgs?.map(img => img.naturalHeight) || [0];
    let scales = new Array(widths.length);

    const set = (a, b) => {
        if (isNaN(a[0])) a[0] = b;
        if (b > 0) a[0] = Math.min(a[0], b);
    }

    for (let i = 0; i < scales.length; ++i) {
        let _scale = [1];
        if (s) set(_scale, scale / 100);
        if (w) set(_scale, width / widths[i]);
        if (h) set(_scale, height / heights[i]);
        scales[i] = _scale[0];
    }

    let _scale = [NaN];
    let _width = [NaN];
    let _height = [NaN];
    for (let i = 0; i < scales.length; ++i) {
        set(_scale, scales[i]);
        set(_width, widths[i] * scales[i]);
        set(_height, heights[i] * scales[i]);
    }

    return [
        Math.floor(_width[0] || 0),
        Math.floor(_height[0] || 0),
        _scale[0] || 0
    ];
}

const _scaling = ([o, t, w, h, s, scale, width, height], stats, _w, _h) => {
    const set = v => scaling = Math.min(scaling, v);
    let scaling = 1;
    if (w && width > 0) set(width / _w);
    if (h && height > 0) set(height / _h);
    if (s && scale > 0) set(scale / 100);
    if (t === 1) set(stats[0] / _w);
    if (t === 2) set(stats[1] / _h);
    if (t === 3) set(stats[2]);
    return scaling;
}

const processing = (d, stats) => {
    let { imgs, states, load, process, _w, _h } = data || {};
    if (!load || !process || !_w || !_h) return NaN;
    if (!imgs?.length || !states) return 0;
    states = states.length + 1;
    imgs = imgs.length;
    let i = 0;
    let p = 0;
    let o = 0;
    if (!d[0]) return 0;
    for (let j = 0; j < imgs; ++j) {
        let img = data.imgs[j];
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        let s = _scaling(d, stats, w, h);
        p += img.width * img.height;
        o += w * s * h * s;
        i += w * h;
    }

    if (i <= 0) return NaN;
    if (p <= 0) return NaN;
    if (o <= 0) return NaN;

    o *= states;
    process = process * 2;
    let save = process;

    let t = 0;
    t += load * (o / i);
    t += process * (o / p);
    t += save * (o / p);
    return t / 1000;
}

const state = () => ({
    gray: snap('gray'),
    color: snap('color'),
    duo: snap('duo')
})

const save = async (d, o) => {

    if (o === 1) {
        for (let i = 0; i < d.length; ++i) {
            let name = png(d[i].filename, 'cull');
            let file = await blob(d[i]);
            download(file, name);
        }
    }

    if (o === 2) {
        let name = 'cullage.png';
        let file = await blob(collage(d));
        download(file, name);
    }

    if (o === 3) {
        let name = 'cull.zip';
        let file = await zip(d);
        download(file, name);
    }

}

export const setup = e => {
    radio(e, 'output', 2);
    radio(e, 'scale', 2, true);
    check(e, 'width', 'height', 'scale');
    range(e, ['scale'], [7], 0, ([v], [e]) => e.nextElementSibling.innerHTML = `${v}%`);

    const set = (v, e) => e.value = v || '';
    const val = e => Math.max(0, parseInt(e.value) || 0);
    ['width', 'height'].map(s => link(e, `#${s}-input`, 15, 'input', val, set));
}

export const load = (e, next, back, d) => {
    let states = data?.states || [];
    data = { ...d, states };

    let colors = ['green', 'yellow', 'red'];
    const i = i => i >= 10 ? 2 : i >= 3 ? 1 : i > 0 ? 0 : -1;
    let l = (data.imgs?.length || 0) * (data.states.length + 1);
    let s = `${l} file${l === 1 ? '' : 's'}${'!'.repeat(Math.floor(l / 10))}`;    
    const target = e.querySelectorAll('.row > input[type=radio] ~ label .target');
    target[0].className = 'target ' + (colors[i(l) || -1] || '');
    target[0].innerHTML = s;

    const process = e.lastElementChild;
    const estimate = process.querySelector('.estimate');
    const OK = process.querySelector('.estimate + button');
    if (!OK.onclick) OK.onclick = () => (OK.classList.add('OK'), next(true));

    changed('save', _l => {
        let d = shot('save');
        let stats = _stats(d);
        target[1].innerHTML = `${stats[0]}px`;
        target[2].innerHTML = `${stats[1]}px`;
        target[3].innerHTML = `${Math.round(stats[2] * 100)}%`;

        let o = d[0];
        let t = processing(d, stats);
        let j = isNaN(t) ? 2 : Math.max(i(t), o === 1 ? i(l) : -1);
        let [ms, s, m] = [Math.floor((t % 1) * 1000), Math.floor(t % 60), Math.floor(t / 60)];
        let time = m > 0 ? `${m}m ${s}s` : s >= 1 ? `${s}s` : `${ms}ms`;
        estimate.innerHTML = isNaN(t)? 'Unknown' : t <= 0 ? 'None' : time;
        estimate.className = 'estimate ' + (colors[j] || '');
        if (j > 0) OK.classList.remove('OK');

        next(j < 1);
        back(o !== 0);
    })
}

export const next = done => {
    let o = shot('save')[0];
    if (!data) return done(false);
    data.states.push(state());
    if (!o) return done();

    compute(async () => {
        try {
            let d = process(data, snap('save'));
            if (!d) return done(false);
            data.states = [];
            save(d, o);

            setTimeout(() => {
                done();
            }, 1000);
        }
        catch (err) {
            done(false);
        }
    })
}

export const process = (data, save) => {
    let imgs = [];
    let d = shot('save', save);
    let stats = _stats(d);
    const scale = (w, h) => {
        return _scaling(d, stats, w, h);
    }

    data.states?.forEach(state => {
        let p = upload.process(scale);
        if (p) p = gray.process(p, state.gray);
        if (p) p = color.process(p, state.color);
        if (p) p = duo.process(p, state.duo);
        imgs.push(...p?.imgs || []);
    })

    if (!imgs.length) {
        return undefined;
    }
    return imgs;
}

export const clear = () => {
    data = undefined;
}



export const text = ['Output'];
