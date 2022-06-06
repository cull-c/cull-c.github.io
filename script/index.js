import { link, section, restore } from './util/link.js';
import { wait } from './util/index.js';
import * as upload from './upload.js';
import * as gray from './gray.js';
import * as color from './color.js';
import * as duo from './duo.js';
import * as save from './save.js';

const state = {
    upload,
    gray,
    color,
    duo,
    save
}

const keys = Object.keys(state);

window.onload = () => {
    const top = document.querySelector('#main > #top');
    const bot = document.querySelector('#main > #bot');
    const steps = document.querySelector('#main > #steps');

    const text = bot.querySelector('.text');
    const back = bot.querySelector('button.back');
    const next = bot.querySelector('button.next');

    const step = s => {
        if (s === undefined) return top.childElementCount - 3;
        if (typeof s === 'number') return keys[s] || keys[0];
        return Math.max(0, keys.indexOf(s));
    }

    const _head = document.querySelector('#head');
    _head.remove();

    const head = id => {
        let i = id ? Math.max(0, step(id)) : -1;
        while (step() > i) top.lastElementChild.remove();
        if (step() + 1 < i) head(step(i - 1));
        if (step() >= i) return;

        let e = _head.cloneNode(true);
        wait(() => e.classList.remove('new'));
        e.querySelector('.box').onclick = () => set(id);
        e.querySelector('.icon').classList.add(id);
        e.removeAttribute('id');
        top.append(e);
    }

    const set = (id, data) => {
        let dir = false;
        let start = id === '';
        if (id === '') id = keys[0];
        let load = data || data === false;
        head(data === false ? undefined : id);
        if (id === undefined) id = keys[0];

        for (let i = 0; i < steps.childElementCount; ++i) {
            let e = steps.children[i];
            if (e.id === id) {
                e.classList.add('open');
                e.classList.remove('disabled');
                let d = data === false ? set : data;
                if (load) wait(() => state[id]?.load(e, _next, _back, d));
                continue;
            }

            if (!e.classList.contains('open')) continue;
            e.classList.remove('open');
            dir = i > step(id);
        }

        let first = id === keys[0];
        let last = id === keys[keys.length - 1];

        text.firstElementChild?.remove();
        let span = document.createElement('span');
        span.innerHTML = state[id]?.text?.[0] || '';
        span.classList.add(dir ? 'left' : 'right', 'new');
        text.prepend(span);

        _next(!start);
        _back(!first);
        next.className = last ? 'save' : 'next';
        wait(() => span.classList.remove('new'));
        return true;
    }

    const _next = state => {
        if (state) next.removeAttribute('disabled');
        else next.setAttribute('disabled', '');
        next.classList.remove('load');
        return true;
    }

    const _back = state => {
        if (state) back.removeAttribute('disabled');
        else back.setAttribute('disabled', '');
        return true;
    }

    const _done = (s, e, d) => {
        if (s >= keys.length - 1) s = keys.length - 3;
        if (d !== false) return set(step(s + 1), d);
        e.classList.remove('disabled');
        _next(true);
        _back(true);
        return true;
    }

    const previous = () => set(step(step() - 1));
    back.onclick = previous;
    next.onclick = () => {
        let s = step();
        let id = step(s);
        let e = document.querySelector('#steps > #' + id);
        if (!state[id]?.next(d => _done(s, e, d))) {
            _next(false);
            _back(false);
            e.classList.add('disabled');
            next.classList.add('load');
        }
    }

    window.onpopstate = () => {
        if (!back.disabled) previous();
        restore();
    }

    const html = document.documentElement.classList;
    link(top, '.name', 1, 'click', () => html.contains('static') ? 0 : 1, v => {
        v ? html.add('static') : html.remove('static');
    })

    keys.forEach(key => {
        let e = document.querySelector('#steps > #' + key);
        section(key);
        state[key].setup(e, _next, _back);
        section();
    })

    restore();
    set('', false);
}
