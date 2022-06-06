import './filesaver/index.js';
import './jszip/index.js';

import { bin, int } from './base.js';

const draw = (canvas, d) => {
    let ctx = canvas.getContext('2d');
    let [_w, _h] = [canvas.width, canvas.height];
    let [w, h] = [d.width, d.height];
    ctx.clearRect(0, 0, _w, _h);
    ctx.putImageData(d, Math.round((_w - w) / 2), Math.round((_h - h) / 2));
}

const _col = (x, y, z) => {
    if (x !== undefined && y !== undefined && z !== undefined) {
        return x * 256 * 256 + y * 256 + z;
    }

    let b = bin(x || 0);
    let c = new Array(3);
    c[0] = int(b, 0, 8, 24);
    c[1] = int(b, 8, 16, 24);
    c[2] = int(b, 16, 24, 24);
    return c;
}

const _rgb = c => {
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

const hex = '0123456789ABCDEF';
const _hex = c => {
    if (typeof c === 'string') {
        let s = c.slice(0, 6).toUpperCase();
        while (s.length < 6) s += '0';
        let v = new Array(6);
        for (let i = 0; i < 6; ++i) {
            v[i] = hex.indexOf(s[i]);
            if (v[i] < 0) v[i] = 0;
        }

        c = new Array(3);
        for (let i = 0; i < 3; ++i) {
            let j = i * 2;
            c[i] = v[j] * 16 + v[j + 1];
        }
        return c;
    }

    let s = '';
    for (let i = 0; i < 3; ++i) {
        let v = bin(c[i] || 0);
        s += hex[int(v, 0, 4, 8)] || '';
        s += hex[int(v, 4, 8, 8)] || '';
    }
    return s;
}

const compute = (cb, n = 250) => setTimeout(cb, n);
const wait = (cb, n = 3) => n ? requestAnimationFrame(() => wait(cb, n - 1)) : cb();

const image = (a, b, c, o) => {
    if (!a && !b && !c && !d) {
        let d = new ImageData(0, 0);
        d.naturalHeight = 0;
        d.naturalWidth = 0;
        d.filename = '';
        return d;
    }
    
    if (a) {
        let d = new ImageData(a, b, c);
        d.naturalHeight = o.naturalHeight;
        d.naturalWidth = o.naturalWidth;
        d.filename = o.filename;
        return d;
    }

    let ctx = b?.getContext('2d');
    let [_w, _h] = [b.width, b.height];
    if (!ctx || !_w || !_h) return undefined;
    let [w, h] = [c.naturalWidth, c.naturalHeight];
    if (!w || !h || w < 0 || h < 0) return undefined;
    let s = !o ? Math.min(_w / w, _h / h) : o(w, h);
    let sw = Math.max(Math.floor(w * s), 1);
    let sh = Math.max(Math.floor(h * s), 1);
    ctx.clearRect(0, 0, _w, _h);
    ctx.drawImage(c, 0, 0, sw, sh);
    let d = ctx.getImageData(0, 0, sw, sh);
    d.filename = c.filename;
    d.naturalHeight = h;
    d.naturalWidth = w;
    return d;
}

const blob = img => {
    return new Promise((resolve, reject) => {
        try {
            let canvas;
            if (!(img instanceof HTMLCanvasElement)) {
                canvas = document.createElement('canvas');
                let ctx = canvas.getContext('2d');
                canvas.height = img.height;
                canvas.width = img.width;
                ctx.putImageData(img, 0, 0);
            }
            else {
                canvas = img;
            }

            canvas.toBlob(resolve, { type: 'image/png' }, 1);
        }
        catch (err) {
            reject(err);
        }
    })
}

const png = (f, s) => {
    if (!f) f = 'image';
    let i = f.lastIndexOf('.');
    if (i > 0) f = f.slice(0, i);
    s = s ? `-${s}` : '';
    return f + s + '.png';
}

const zip = async d => {
    const zip = new JSZip();
    const blobs = await Promise.all(d.map(blob));

    blobs.forEach((blob, i) => {
        let n = 0;
        let s = png(d[i]?.filename);
        const name = () => png(s, n);
        while (zip.file(name())) ++n;
        zip.file(name(), blob, { binary: true });
    })

    return await zip.generateAsync({ type: 'blob' });
}

const download = (blob, filename) => saveAs(blob, filename);

const benchmark = (i, f) => {
    let s = performance.now();
    let r = f();
    let e = performance.now();
    if (typeof r === 'object') {
        r[i] = e - s;
    }
    return r;
}

export { draw, _col, _rgb, _hex, compute, wait, image, blob, png, zip, download, benchmark };
