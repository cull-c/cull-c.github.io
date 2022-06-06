import { compute, image, benchmark } from './util/index.js';
import * as gray from './gray.js';
import * as color from './color.js';
import * as duo from './duo.js';
import * as save from './save.js';

let state;
let data;



export const setup = () => {}

export const load = (e, next, back, set) => {
    state = undefined;
    data = [];

    const upload = e.querySelector('#files');
    const images = e.querySelector('#images');
    images.innerHTML = '';
    upload.value = '';

    upload.oninput = () => {
        images.innerHTML = '';
        let files = [...upload.files || []];
        let l = files.length;
        state = false;
        gray.clear();
        color.clear();
        duo.clear();
        save.clear();

        if (!l) {
            text[0] = empty;
            set(undefined);
            next(false);
            return;
        }

        text[0] = `${l} Image${l === 1 ? '' : 's'}`;

        const onload = () => {
            if (--l === 0) {
                set('upload');
                next(true);
            }
        }

        data = files.map(f => {
            let img = new Image();
            img.filename = f.name;
            let url = URL.createObjectURL(f);
            img.onerror = onload;
            img.onload = onload;
            img.src = url;
            return img;
        })

        images.append(...data);
    }
}

export const next = done => {
    if (state) return done();
    if (!data) return done(false);

    compute(async () => {
        try {
            let d = benchmark('load', process);
            if (!d) return done(false);
            state = true;
            done(d);
        }
        catch (err) {
            done(false);
        }
    })
}

export const process = scale => {
    let e;
    let imgs = [];
    let [_w, _h] = [0, 0];
    if (!data) return undefined;
    if (!scale) e = document.querySelector('#main > #steps > .step > .preview > canvas');
    _h = !scale ? e.clientHeight : Math.max(...data.map(f => f.naturalHeight || 0));
    _w = !scale ? e.clientWidth : Math.max(...data.map(f => f.naturalWidth || 0));
    if (!_w || !_h || _w < 0 || _h < 0) return undefined;
    let canvas = document.createElement('canvas');
    canvas.height = _h;
    canvas.width = _w;
    data.forEach(file => {
        let img = image(null, canvas, file, scale);
        if (!img) return undefined;
        imgs.push(img);
    })

    if (!imgs.length) return undefined
    return { imgs, _w, _h };
}

export const clear = () => {}



let empty = 'Upload';
export let text = [empty];
