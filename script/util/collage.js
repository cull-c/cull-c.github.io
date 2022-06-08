import { _rgb } from './index.js';

const collage = (d, b) => {
    let widths = d.map(i => i.width);
    let heights = d.map(i => i.height);
    let sizes = [widths, heights].map(l => Math.max(...l));
    let totals = [widths, heights].map(l => l.reduce((a, b) => a + b, 0));
    let diffs = [widths, heights].map((l, i) => sizes[i] - Math.min(...l));
    if (diffs[0] === diffs[1]) diffs = [widths, heights].map((_, i) => -totals[i]);
    const m = (l, f, s) => l.reduce((a, c, i) => f(c, a[0]) ? [c, i] : a, [s, 0])[1];
    const max = l => m(l, (c, a) => c > a, -Infinity);
    const min = l => m(l, (c, a) => c < a, Infinity);
    let c = diffs[0] <= diffs[1];
    let total = totals[+c];
    let size = sizes[+!c];
    let layers = [];

    let range = [Math.sqrt(d.length), Math.sqrt(total / size)].sort();
    range[1] = Math.min(d.length, Math.ceil(range[1]));
    range[0] = Math.max(1, Math.floor(range[0]));
    for (let l = range[0]; l <= range[1]; ++l) {
        layers.push(new Array(l).fill(0));
    }

    for (let l = 0; l < layers.length; ++l) {
        let layer = layers[l];

        for (let i = 0; i < d.length; ++i) {
            if (!l || !d[i].x || !d[i].y) {
                d[i].x = [];
                d[i].y = [];
            }

            let j = min(layer);
            d[i].x.push(c ? j * size : layer[j]);
            d[i].y.push(c ? layer[j] : j * size);
            layer[j] += c ? d[i].height : d[i].width;
        }
    }

    let { width, height, dim, layer, j } = layers.map((l, i) => {
        let dim = [l[max(l)], size * l.length];
        let height = c ? dim[0] : dim[1];
        let width = c ? dim[1] : dim[0];

        let fill = 1;
        for (let i = 0; i < l.length; ++ i) {
            fill -= (dim[0] - l[i]) / dim[0] / l.length;
        }

        let square = Math.min(...dim) / Math.max(...dim);

        let pow = 3;
        fill = Math.pow(fill, pow);
        square = Math.pow(square, 1 / pow);

        return {
            width,
            height,
            dim: dim[0],
            score: fill * square,
            layer: l,
            j: i
        }
    }).reduce((a, b) => {
        let c = a.score > b.score;
        return c ? a : b;
    })

    for (let i = 0; i < d.length; ++i) {
        d[i].x = d[i].x[j];
        d[i].y = d[i].y[j];
    }

    for (let i = 0; i < d.length; ++i) {
        let j = Math.floor((c ? d[i].x : d[i].y) / size);
        let a = (size - (c ? d[i].width : d[i].height)) / 2;
        let b = (dim - (layer[j] || dim)) / 2;
        d[i].x += Math.round(c ? a : b);
        d[i].y += Math.round(c ? b : a);
    }

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.height = height;
    canvas.width = width;

    ctx.fillStyle = _rgb(b);
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < d.length; ++i) {
        ctx.putImageData(d[i], d[i].x, d[i].y);
    }

    return canvas;
}

export { collage };
