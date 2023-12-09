import { bin, int, encode, decode } from './base.js';

const _default = '8____0000000o8AJv00_bo280010';

let i = 0;
let b = [];

const get = (i, n) => {
    return int(b, i, i + n);
}

const set = (i, n, v) => {
    let s = bin(v);
    let l = s.length;
    for (let j = 0, v; j < n; ++j) {
        if (l - n < -j) v = false;
        else if (l > n) v = true;
        else v = s[l - n + j];
        b[i + j] = v;
    }
    return b;
}

const init = () => {
    let s = location.hash.slice(1);
    s = s + _default.slice(s.length);
    s = s.slice(0, _default.length);
    b = decode(s);
    store();
}

const hash = () => {
    let q = encode(b);
    let i = q.length - 1;
    while (i >= 0 && (q[i] === (_default[i] || '0'))) --i;
    q = i >= 0 ? '/#' + q.slice(0, i + 1) : '/';
    return q;
}

let storage = 0;
const store = () => {
    clearTimeout(storage);
    storage = setTimeout(() => {
        history.replaceState(null, '', hash());
    }, 500);
}

const restore = () => {
    history.pushState(null, '', hash());
}

let current = '';
const sections = {};
const section = s => {
    if (sections[s]) return sections[s];
    if (s) sections[s] = { data: [i] };
    current = s;
}

const snap = s => {
    let c = sections[s]?.data;
    if (!c?.length) return '';
    let [i, j] = [0, c.length - 1].map(i => c[i] || 0);
    return encode(b.slice(i, j));
}

const shot = (s, _s) => {
    let c = sections[s];
    if (!c?.data?.length) return [];
    let _b = _s ? decode(_s) : b;
    let o = _s ? c.data[0] : 0;
    let d = [];
    c.data.forEach((n, i) => {
        if (!i) return;
        let j = c.data[i - 1];
        d.push(int(_b, j - o, n - o));
    })

    if (c.index !== undefined) {
        d.push(c.index);
    }

    return d;
}

const changed = (s, cb) => {
    let c = sections[s];
    if (!c) return;
    c.changed = cb;
    c.changed?.();
}

const scrolled = (s, cb) => {
    let c = sections[s];
    if (!c) return;
    if (!cb) {
        delete c.scrolled;
        c.changed?.();
        return;
    }

    c.scrolled = cb;
    c.scrolled?.();
}

const link = (el, q, n, e, v, s) => {
    let j = (i += n) - n;
    let c = sections[current];
    if (c?.data) c.data.push(i);
    el = q ? el.querySelector(q) : el;
    const ev = v => (s(v, el), set(j, n, v), store(), c?.changed?.());
    if (typeof e === 'string' && e) el['on' + e] = () => ev(v(el));
    else if (typeof e === 'function' && e) e(() => ev(v(el)), el);
    ev(get(j, n));
}

const radio = (e, s, n, r) => {
    let event;
    let value = 0;
    const q = `input[type=radio][name=${s}]`;
    const radio = [...e.querySelectorAll(q)];
    const ev = ev => (event = v => (set(v), ev()), radio.map(s => s.onclick = ev));
    const val = () => (v => r && v === value ? 0 : v)(parseInt(radio.find(s => s.checked)?.value) || 0);
    const set = v => (value = v, radio.forEach(s => s.checked = s.value === `${v || 0}`));
    link(e, '', n, ev, val, set);
    return event;
}

const check = (e, ...s) => {
    const val = e => e.checked ? 1 : 0;
    const set = (v, e) => e.checked = !!v;
    s.map(s => link(e, `#${s}-check`, 1, 'input', val, set));
}

const range = (e, s, n, j, cb) => {
    const events = [];
    const el = s.map(s => e.querySelector(`#${s}-range`));
    const event = i => events[i] ? events[i]() : events.forEach(e => e());
    const ev = (ev, e) => (events.push(ev), e.oninput = ev);
    const val = e => parseInt(e.value) || 0;
    const set = (v, e) => (e.value = v, cb(el.map(val), el, el.indexOf(e), j, event));
    s.map((_, i) => link(el[i], '', n[i], ev, val, set));
}

const scroll = (s, l, e) => {
    let c = sections[s];
    if (!c) return;
    delete c.index;

    const set = i => {
        if (i === c.index) return;
        bar.children[c.index]?.removeAttribute('class');
        bar.children[i]?.classList.add('open');
        c.index = i;

        if (c.scrolled) c.scrolled?.();
        else c.changed?.();
    }

    e = e.querySelector('.scroll');
    if (l <= 1) e.classList.add('only');
    else e.classList.remove('only');

    const [back, bar, next] = e.children;
    const bound = i => i < 0 ? l + i : i >= l ? i - l : i;
    back.onclick = l > 1 ? () => set(bound(c.index - 1)) : undefined;
    next.onclick = l > 1 ? () => set(bound(c.index + 1)) : undefined;

    bar.innerHTML = '';
    for (let i = 0; i < l; ++i) {
        let div = document.createElement('div');
        if (l > 1) div.onclick = () => set(i);
        bar.appendChild(div);
    }

    set(0);
}

init();

export { restore, link, radio, check, range, scroll };
export { section, snap, shot, changed, scrolled };
