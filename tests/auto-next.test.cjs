'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../repaired.user.js');

function fixture() {
    let time = 0, timerId = 0;
    const timers = new Map(), messages = [], items = [], videos = [], blockers = [], loaders = [];
    const clock = { now: () => time,
        setTimeout(fn, delay) { timers.set(++timerId, { fn, at: time + delay }); return timerId; },
        clearTimeout(id) { timers.delete(id); },
        tick(ms) {
            const target = time + ms;
            let runs = 0;
            while (true) {
                const due = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
                if (!due) break;
                assert.ok(++runs < 1000, 'unbounded timer loop');
                time = due[1].at; timers.delete(due[0]); due[1].fn();
            }
            time = target;
        }, pending: () => timers.size
    };
    const settings = { autoNext: true };
    const location = { hostname: 'ua.ulearning.cn', pathname: '/learnCourse/learnCourse.html',
        href: 'https://ua.ulearning.cn/learnCourse/learnCourse.html?courseId=1' };
    const win = { location }; win.top = win;
    const section = { classList: { contains: () => false } };
    const doc = {
        defaultView: { getComputedStyle: element => ({ visibility: element.hidden ? 'hidden' : 'visible' }) },
        querySelectorAll(selector) {
            if (selector === '.page-item') return items;
            if (selector === '.next-page-btn') return this.buttons || [button];
            if (selector === '#MathDiv video') return videos;
            if (selector === '.page-loader') return loaders;
            if (selector.startsWith('.question-element-node,')) return blockers;
            throw new Error('Unexpected selector ' + selector);
        }
    };
    function node(extra = {}) {
        const classes = new Set();
        return { isConnected: true, ownerDocument: doc, getClientRects() { return this.isConnected && !this.hidden ? [1] : []; },
            classList: { contains: name => classes.has(name) }, classes,
            getAttribute() { return null; }, ...extra };
    }
    function page(id, glyph = '\ue852') {
        const icon = node({ textContent: glyph });
        const item = node({ id: 'page' + id, active: false, section, title: '视频 ' + id, icon,
            querySelector(selector) {
                if (selector === '.page-name.active') return this.active ? {} : null;
                if (selector === '.page-name span[data-bind*="page.name"]') return { textContent: this.title };
                throw new Error('Unexpected selector ' + selector);
            },
            querySelectorAll(selector) { assert.equal(selector, '.page-icon .iconfont'); return [this.icon]; },
            closest(selector) { return selector === '.section-item' ? this.section : null; }
        });
        items.push(item); return item;
    }
    const first = page(1), second = page(2), third = page(3); first.active = true;
    const button = node({ clicks: 0, title: second.title,
        querySelector(selector) { assert.equal(selector, '.page-title .text'); return { textContent: this.title }; },
        click() { this.clicks++; f.onClick?.(); }
    });
    function select(index) {
        items.forEach((item, i) => { item.active = i === index; });
        button.title = items[index + 1]?.title || '没有更多了';
    }
    function video() {
        const listeners = new Map(), captures = new Map();
        const v = node({ currentSrc: 'https://media.example/video' + (videos.length + 1), currentTime: 0, duration: 100,
            readyState: 4, paused: false, ended: false, seeking: false, error: null, played: { length: 1 },
            addEventListener(name, fn, capture) { listeners.set(name, fn); captures.set(name, capture); },
            removeEventListener(name, fn) { if (listeners.get(name) === fn) { listeners.delete(name); captures.delete(name); } },
            emit(name, event = { isTrusted: true }) { listeners.get(name)?.(event); }, listeners, captures
        });
        videos.push(v); return v;
    }
    const f = { win, doc, settings, items, videos, blockers, loaders, node, video, page, first, second, third,
        button, clock, select, messages, onClick: null };
    f.controller = core.createAutoNextController(win, doc, () => settings, msg => messages.push(msg), clock);
    f.progress = v => { v.currentTime = 10; v.emit('timeupdate'); };
    f.end = (v, event) => { v.currentTime = v.duration; v.ended = true; v.paused = true; v.emit('ended', event); };
    return f;
}

test('自动切视频兼容旧设置且默认关闭，只接受真正布尔值', () => {
    assert.equal(core.normalizeSettings({ rate: 16, muted: true, autoPlay: true }).autoNext, false);
    assert.equal(core.normalizeSettings({ autoNext: 'true' }).autoNext, false);
    assert.equal(core.normalizeSettings({ autoNext: true }).autoNext, true);
});

test('目录确认视频，拒绝练习、图文、未知完成勾号、隐藏项和末尾', () => {
    const f = fixture();
    assert.equal(core.readLessonNavigation(f.doc, f.win.location).button, f.button);
    for (const glyph of ['\ue850', '\ue851', '\ue83d', 'video']) {
        f.second.icon.textContent = glyph;
        assert.equal(core.readLessonNavigation(f.doc, f.win.location).button, null);
    }
    f.second.icon.textContent = '\ue852'; f.second.icon.classes.add('finish');
    assert.equal(core.readLessonNavigation(f.doc, f.win.location).button, null);
    f.second.icon.classes.clear(); f.second.classes.add('is-hide');
    assert.equal(core.readLessonNavigation(f.doc, f.win.location).button, null);
    f.second.classes.clear(); f.second.section = f.node();
    assert.equal(core.readLessonNavigation(f.doc, f.win.location).button, f.button);
    f.select(2);
    assert.match(core.readLessonNavigation(f.doc, f.win.location).reason, /目录末尾/);
});

test('目录、下一页标题、按钮状态必须一致；多活动项与非课程页拒绝导航', () => {
    const f = fixture();
    f.button.title = '节统计';
    assert.equal(core.readLessonNavigation(f.doc, f.win.location).button, null);
    f.button.title = f.second.title; f.button.disabled = true;
    assert.equal(core.readLessonNavigation(f.doc, f.win.location).button, null);
    f.button.disabled = false; f.doc.buttons = [f.button, f.node()];
    assert.equal(core.readLessonNavigation(f.doc, f.win.location).button, null);
    f.doc.buttons = [f.button]; f.second.active = true;
    assert.equal(core.readLessonNavigation(f.doc, f.win.location), null);
    assert.equal(core.readLessonNavigation(f.doc, { hostname: 'example.org', pathname: '/' }), null);
});

test('正常播放结束后仅点击一次，等待目标页与新视频稳定后才报告成功', () => {
    const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v);
    f.onClick = () => { f.select(1); v.isConnected = false; f.videos.length = 0; f.video(); };
    f.end(v); f.end(v);
    assert.equal(f.button.clicks, 0); assert.equal(f.controller.busy(), true);
    f.clock.tick(500); assert.equal(f.button.clicks, 1);
    assert.doesNotMatch(f.messages.join('\n'), /已进入/);
    f.clock.tick(750);
    assert.match(f.messages.at(-1), /已进入下一视频/);
    assert.equal(f.controller.busy(), false);
    f.controller.stop(); assert.equal(f.clock.pending(), 0);
    v.emit('ended'); f.clock.tick(1000); assert.equal(f.button.clicks, 1);
    assert.equal(v.listeners.size, 0);
});

test('暂停、无播放进展、模拟 ended、拖动未恢复、错误与无效时长不翻页', () => {
    for (const kind of ['paused', 'no-progress', 'synthetic', 'seeking', 'error', 'infinite', 'zero', 'not-ended']) {
        const f = fixture(), v = f.video(); f.controller.scan();
        if (kind === 'paused') v.paused = true;
        if (kind !== 'no-progress') f.progress(v);
        if (kind === 'seeking') { v.seeking = true; v.emit('seeking'); }
        if (kind === 'error') v.error = {};
        if (kind === 'infinite') v.duration = Infinity;
        if (kind === 'zero') v.duration = 0;
        if (kind === 'not-ended' || kind === 'synthetic') v.emit('ended', { isTrusted: kind !== 'synthetic' });
        else f.end(v);
        f.clock.tick(15000);
        assert.equal(f.button.clicks, 0, kind);
    }
});

test('多视频页面等待全部正常结束，隐藏视频不触发导航', () => {
    const f = fixture(), a = f.video(), b = f.video(), hidden = f.video(); hidden.hidden = true;
    f.controller.scan(); f.progress(a); f.progress(b); f.end(a); f.clock.tick(1000);
    assert.equal(f.button.clicks, 0);
    f.end(b); f.clock.tick(500); assert.equal(f.button.clicks, 1);
    assert.equal(hidden.listeners.size, 0);
    f.controller.stop();
});

test('延迟点击前重新核对页面、源、节点集合、目标标题与模态框', () => {
    for (const kind of ['page', 'source', 'removed', 'new-video', 'title', 'modal']) {
        const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v); f.end(v);
        if (kind === 'page') f.select(1);
        if (kind === 'source') v.currentSrc += '-changed';
        if (kind === 'removed') { v.isConnected = false; f.videos.length = 0; }
        if (kind === 'new-video') f.video();
        if (kind === 'title') f.button.title = '章节统计';
        if (kind === 'modal') f.blockers.push(f.node());
        f.clock.tick(500);
        assert.equal(f.button.clicks, 0, kind);
        assert.equal(f.controller.busy(), false);
    }
});

test('切页后的旧媒体迟到事件不能写到新的页面', () => {
    const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v); f.select(1);
    f.end(v); f.clock.tick(1000); assert.equal(f.button.clicks, 0);
});

test('关闭开关和 stop 取消待点击/待确认的定时器并解绑媒体', () => {
    for (const phase of ['pending', 'confirming']) {
        const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v); f.end(v);
        if (phase === 'confirming') f.clock.tick(500);
        f.settings.autoNext = false; f.controller.refresh();
        assert.equal(f.clock.pending(), 0); assert.equal(v.listeners.size, 0);
        f.clock.tick(20000); assert.equal(f.button.clicks, phase === 'pending' ? 0 : 1);
    }
    const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v); f.end(v); f.controller.stop();
    f.clock.tick(20000); assert.equal(f.button.clicks, 0); assert.equal(v.listeners.size, 0);
});

test('加载失败或按钮失效最多尝试一次，超时后不再轮询', () => {
    const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v); f.end(v); f.clock.tick(13000);
    assert.equal(f.button.clicks, 1); assert.match(f.messages.at(-1), /12 秒/);
    assert.equal(f.controller.busy(), false); assert.equal(f.clock.pending(), 0);
    f.end(v); f.clock.tick(20000); assert.equal(f.button.clicks, 1);
});

test('弹框、加载错误和意外目标页不会被当成成功，也不会点击继续', () => {
    for (const kind of ['modal', 'wrong-page', 'no-video', 'old-video']) {
        const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v);
        f.onClick = () => {
            if (kind === 'modal') f.blockers.push(f.node());
            else { f.select(kind === 'wrong-page' ? 2 : 1); if (kind !== 'old-video') f.videos.length = 0; }
        };
        f.end(v); f.clock.tick(13000);
        assert.equal(f.button.clicks, 1); assert.doesNotMatch(f.messages.at(-1), /已进入下一视频/);
        assert.equal(f.clock.pending(), 0);
    }
});

test('下一视频自然播放结束可继续处理，不复用旧节点的完成标记', () => {
    const f = fixture(), a = f.video(); f.controller.scan(); f.progress(a);
    let b;
    f.onClick = () => { f.select(1); a.isConnected = false; f.videos.length = 0; b = f.video(); };
    f.end(a); f.clock.tick(1250); assert.equal(f.button.clicks, 1);
    assert.equal(b.listeners.size, 5);
    f.onClick = null; f.progress(b); f.end(b); f.clock.tick(500);
    assert.equal(f.button.clicks, 2); f.controller.stop();
});

test('节点复用加载新媒体后重新要求播放进展，iframe 与非课程页不绑定', () => {
    const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v);
    f.select(1); v.currentSrc = 'new-video'; v.currentTime = 0; v.emit('loadedmetadata');
    f.end(v); f.clock.tick(500); assert.equal(f.button.clicks, 0);
    v.ended = false; v.paused = false; v.currentTime = 0; v.emit('loadedmetadata');
    f.progress(v); f.end(v); f.clock.tick(500); assert.equal(f.button.clicks, 1); f.controller.stop();
    const framed = fixture(); framed.win.top = {}; const frameVideo = framed.video(); framed.controller.scan();
    assert.equal(frameVideo.listeners.size, 0);
    const other = fixture(); other.win.location.hostname = 'courseweb.ulearning.cn';
    const otherVideo = other.video(); other.controller.scan(); assert.equal(otherVideo.listeners.size, 0);
});


test('已完成视频通过公开页面模型确认类型，模型与目录不一致时停留', () => {
    const f = fixture(); f.second.icon.textContent = '\ue83d';
    const model = { currentPage: () => ({ id: () => 1 }), nextPageFamily: () => ({ page: { id: () => 2, contentType: () => 6 } }) };
    assert.equal(core.readLessonNavigation(f.doc, f.win.location, model).button, f.button);
    model.nextPageFamily = () => ({ page: { id: () => 2, contentType: () => 7 } });
    assert.equal(core.readLessonNavigation(f.doc, f.win.location, model).button, null);
    model.nextPageFamily = () => ({ page: { id: () => 3, contentType: () => 6 } });
    assert.match(core.readLessonNavigation(f.doc, f.win.location, model).reason, /尚未同步/);
    assert.doesNotThrow(() => core.readLessonNavigation(f.doc, f.win.location, { currentPage() { throw Error('blocked'); } }));
});


test('原生结束事件漏发时，复查 ended 状态仍能切换；暂停与未播到结尾不误触发', () => {
    const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v);
    v.currentTime = v.duration; v.ended = true; v.paused = true;
    f.clock.tick(1000); assert.equal(f.button.clicks, 1); f.controller.stop();
    const paused = fixture(), p = paused.video(); paused.controller.scan(); paused.progress(p); p.paused = true;
    paused.clock.tick(5000); assert.equal(paused.button.clicks, 0); paused.controller.stop();
});

test('结束时目录按钮短暂不同步，恢复后继续处理且不提前消耗尝试次数', () => {
    const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v);
    f.button.title = '加载中'; f.end(v); f.clock.tick(1000);
    assert.equal(f.button.clicks, 0); assert.equal(f.controller.busy(), true);
    f.button.title = f.second.title; f.clock.tick(1000);
    assert.equal(f.button.clicks, 1); f.controller.stop();
});

test('节点直接换源且漏发 metadata 时，后续实际播放进展可重新绑定新页面', () => {
    const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v);
    f.select(1); v.currentSrc = 'second-source'; v.currentTime = 0;
    v.currentTime = 5; v.emit('timeupdate'); v.currentTime = 10; v.emit('timeupdate');
    f.end(v); f.clock.tick(500); assert.equal(f.button.clicks, 1); f.controller.stop();
});

test('跨页复用同节点同媒体源时，新的 playing 重新绑定页面，不沿用旧完成标记', () => {
    const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v);
    f.select(1); v.currentTime = 0; v.emit('playing'); f.progress(v); f.end(v);
    f.clock.tick(500); assert.equal(f.button.clicks, 1); f.controller.stop();
});

test('下一短视频在翻页确认期间就结束，确认后继续下一次切换', () => {
    const f = fixture(), a = f.video(); f.controller.scan(); f.progress(a);
    f.onClick = () => {
        f.select(1); a.isConnected = false; f.videos.length = 0;
        const b = f.video(); f.controller.scan(); f.progress(b); f.end(b); f.onClick = null;
    };
    f.end(a); f.clock.tick(2000); assert.equal(f.button.clicks, 2); f.controller.stop();
});

test('失败后关闭再开启可重新跟踪自然播放；停用后没有遗留复查定时器', () => {
    const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v); f.end(v); f.clock.tick(13000);
    assert.equal(f.button.clicks, 1); assert.equal(f.clock.pending(), 0);
    f.settings.autoNext = false; f.controller.refresh();
    f.settings.autoNext = true; v.ended = false; v.paused = false; v.currentTime = 0; f.controller.refresh();
    f.progress(v); f.end(v); f.clock.tick(500); assert.equal(f.button.clicks, 2);
    f.controller.stop(); assert.equal(f.clock.pending(), 0);
});


test('结束事件在捕获阶段记下，播放器自动回零并触发 seeking 后仍切换', () => {
    const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v);
    assert.equal(v.captures.get('ended'), true);
    f.end(v);
    v.currentTime = 0; v.ended = false; v.seeking = true; v.emit('seeking'); v.seeking = false;
    f.clock.tick(500); assert.equal(f.button.clicks, 1); f.controller.stop();
    assert.equal(v.listeners.size, 0); assert.equal(v.captures.size, 0);
});

test('结束后用户主动重新播放会取消待执行切换，不把旧结束证据用于重播', () => {
    const f = fixture(), v = f.video(); f.controller.scan(); f.progress(v); f.end(v);
    v.currentTime = 0; v.ended = false; v.seeking = true; v.emit('seeking'); v.seeking = false;
    v.paused = false; v.emit('playing'); f.progress(v); f.clock.tick(1000);
    assert.equal(f.button.clicks, 0); f.controller.stop();
});

function videoOnlyFixture() {
    const f = fixture();
    f.settings.videoOnly = true;
    const chapters = [], sections = [], pages = [], targets = [];
    let packed = false;
    for (let index = 0; index < 2; index++) {
        const chapterNode = f.node({ id: 'chapter' + (index + 1) });
        const sectionNode = f.node({ id: 'section' + (index + 1), open: true });
        sectionNode.getClientRects = () => sectionNode.open && !packed ? [1] : [];
        chapterNode.header = f.node({ clicks: 0, click() { this.clicks++; sectionNode.open = true; } });
        sectionNode.header = f.node({ clicks: 0, click() { this.clicks++; sectionNode.open = true; } });
        chapterNode.querySelector = selector => selector === '.chapter-name' ? chapterNode.header : null;
        sectionNode.querySelector = selector => selector === '.section-name' ? sectionNode.header : null;
        const section = { id: () => index + 1, isHide: () => false, pages: () => pages.filter(page => page.chapter === index) };
        const chapter = { id: () => index + 1, name: () => '第' + (index + 1) + '章', isHide: () => false,
            isPageLoaded: () => true, sections: () => [section], node: chapterNode };
        chapters.push(chapter); sections.push({ model: section, node: sectionNode });
    }
    f.items.forEach((item, index) => {
        const chapter = index < 2 ? 0 : 1;
        const page = { chapter, type: index === 1 ? 7 : 6, id: () => index + 1,
            name: () => item.title, contentType() { return this.type; }, isHide: () => false };
        pages.push(page);
        const target = f.node({ clicks: 0, click() { this.clicks++; f.onCatalogClick?.(index); } });
        target.getClientRects = () => sections[chapter].node.open && !packed ? [1] : [];
        const original = item.querySelector.bind(item);
        item.querySelector = selector => selector === '.page-name' ? target : original(selector);
        item.closest = selector => selector === '.chapter-item' ? chapters[chapter].node : selector === '.section-item' ? sections[chapter].node : null;
        targets.push(target);
    });
    const unpack = f.node({ clicks: 0, click() { this.clicks++; packed = false; } });
    f.doc.getElementById = id => f.items.find(item => item.id === id) || chapters.find(ch => ch.node.id === id)?.node || sections.find(sec => sec.node.id === id)?.node || null;
    f.doc.querySelector = selector => selector === '.hide-catalog-btn' ? unpack : null;
    f.win.koLearnCourseViewModel = { course: { chapters: () => chapters }, currentPage: () => pages[f.items.findIndex(item => item.active)], isMenuPack: () => packed };
    Object.assign(f, { chapters, sections, pages, targets, unpack, pack: () => { packed = true; } });
    return f;
}

test('只连播视频默认关闭，旧设置兼容且仅真正布尔值可启用', () => {
    assert.equal(core.normalizeSettings({ autoNext: true }).videoOnly, false);
    assert.equal(core.normalizeSettings({ videoOnly: 'true' }).videoOnly, false);
    assert.equal(core.normalizeSettings({ videoOnly: true }).videoOnly, true);
});

test('只连播视频按课程顺序跳过练习和图文，已完成视频仍依据模型确认', () => {
    const f = videoOnlyFixture();
    f.third.icon.textContent = '\ue83d'; f.third.icon.classes.add('finish');
    const nav = core.readLessonNavigation(f.doc, f.win.location, f.win.koLearnCourseViewModel, true);
    assert.equal(nav.button, f.targets[2]); assert.equal(nav.nextId, 'page3'); assert.equal(nav.skipped, 1);
    f.pages[1].type = 5;
    assert.equal(core.readLessonNavigation(f.doc, f.win.location, f.win.koLearnCourseViewModel, true).button, f.targets[2]);
    assert.equal(f.targets[1].clicks, 0);
    // 普通模式仍停在练习前。
    f.second.icon.textContent = '\ue850';
    assert.equal(core.readLessonNavigation(f.doc, f.win.location).button, null);
});

test('只连播视频使用目录点击跨章，不进入练习、不点击下一页且只切一次', () => {
    const f = videoOnlyFixture(), v = f.video(); f.controller.scan(); f.progress(v);
    f.onCatalogClick = index => { f.select(index); v.isConnected = false; f.videos.length = 0; f.video(); };
    f.end(v); f.end(v); f.clock.tick(1250);
    assert.equal(f.targets[2].clicks, 1); assert.equal(f.targets[1].clicks, 0); assert.equal(f.button.clicks, 0);
    assert.match(f.messages.join('\n'), /跳过 1 项/); assert.match(f.messages.at(-1), /已进入下一视频/);
    f.controller.stop(); assert.equal(f.clock.pending(), 0);
});

test('后续章节折叠或目录收起时只展开一次，目录就绪后继续导航', () => {
    for (const kind of ['chapter', 'catalog']) {
        const f = videoOnlyFixture(), v = f.video();
        if (kind === 'chapter') f.sections[1].node.open = false; else f.pack();
        f.controller.scan(); f.progress(v); f.end(v); f.clock.tick(1000);
        assert.equal(kind === 'chapter' ? f.chapters[1].node.header.clicks : f.unpack.clicks, 1);
        assert.equal(f.targets[2].clicks, 1); assert.equal(f.targets[1].clicks, 0);
        f.controller.stop();
    }
});

test('未知类型与尚未加载的空章节不能被跳过，锁定目录和不可读模型停留', () => {
    const f = videoOnlyFixture(), model = f.win.koLearnCourseViewModel;
    f.pages[1].type = 0;
    assert.equal(core.readLessonNavigation(f.doc, f.win.location, model, true).button, null);
    f.pages[1].type = 7; f.third.classes.add('locked');
    assert.match(core.readLessonNavigation(f.doc, f.win.location, model, true).reason, /不可用/);
    f.third.classes.clear(); f.sections[1].model.canstudy = true;
    assert.equal(core.readLessonNavigation(f.doc, f.win.location, model, true).button, null);
    f.sections[1].model.canstudy = false;
    f.chapters[1].isPageLoaded = () => false; f.chapters[1].sections = () => [];
    const unloaded = core.readLessonNavigation(f.doc, f.win.location, model, true);
    assert.equal(unloaded.button, null); assert.equal(unloaded.prepareButton, f.chapters[1].node.header);
    assert.equal(core.readLessonNavigation(f.doc, f.win.location, null, true).button, null);
});

test('最后一个视频结束后停止，不回头重播，不进入剩余练习', () => {
    const f = videoOnlyFixture(); f.pages[2].type = 7;
    assert.match(core.readLessonNavigation(f.doc, f.win.location, f.win.koLearnCourseViewModel, true).reason, /没有视频/);
    const v = f.video(); f.controller.scan(); f.progress(v); f.end(v); f.clock.tick(15000);
    assert.equal(f.targets.reduce((sum, target) => sum + target.clicks, 0), 0);
    assert.match(f.messages.at(-1), /练习保留/); assert.equal(f.clock.pending(), 0);
});

test('待切换期间关闭只连播模式或出现弹窗时，不触发跨练习导航', () => {
    for (const kind of ['mode', 'dialog']) {
        const f = videoOnlyFixture(), v = f.video(); f.controller.scan(); f.progress(v); f.end(v);
        if (kind === 'mode') { f.settings.videoOnly = false; f.controller.refresh(); }
        else f.blockers.push(f.node());
        f.clock.tick(2000);
        assert.equal(f.targets[2].clicks, 0); assert.equal(f.targets[1].clicks, 0);
        f.controller.stop(); assert.equal(f.clock.pending(), 0);
    }
});
