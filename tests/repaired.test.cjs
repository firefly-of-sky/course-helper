'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const core = require('../repaired.user.js');
const source = fs.readFileSync(path.join(__dirname, '../repaired.user.js'), 'utf8');

test('修复版语法完整，原稿无法解析', () => {
    assert.doesNotThrow(() => new vm.Script(source));
    assert.throws(() => new vm.Script(fs.readFileSync(path.join(__dirname, '../original.user.js'), 'utf8')), SyntaxError);
});

test('元数据包含优学院、学习通和原稿遗漏的慕享，且没有损坏或重复的匹配项', () => {
    const matches = [...source.matchAll(/^\/\/ @match\s+(\S+)$/gm)].map(match => match[1]);
    assert.ok(matches.includes('*://*.ulearning.cn/*'));
    assert.ok(matches.includes('*://*.chaoxing.com/*'));
    assert.ok(matches.includes('*://web.moycp.com/*'));
    assert.equal(new Set(matches).size, matches.length);
    assert.doesNotMatch(source, /^\/\/ @include\s+\/\/ @match/m);
    assert.doesNotMatch(source, /^\/\/ @require/m);
    assert.deepEqual([...source.matchAll(/^\/\/ @connect\s+(\S+)$/gm)].map(match => match[1]), ['api.ulearning.cn']);
});

test('只按实际主机名识别平台，拒绝伪后缀域名', () => {
    assert.equal(core.detectPlatform('www.ulearning.cn'), '优学院');
    assert.equal(core.detectPlatform('ulearning.cn'), '优学院');
    assert.equal(core.detectPlatform('ulearning.cn.example.org'), 'ulearning.cn.example.org');
    assert.equal(core.detectPlatform('fakeulearning.cn'), 'fakeulearning.cn');
    assert.equal(core.detectPlatform('web.moycp.com'), '慕享');
});

test('存储损坏、字符串布尔值和非法倍速不会打开自动播放', () => {
    assert.deepEqual(core.normalizeSettings(null), { rate: 1, muted: false, autoPlay: false, autoNext: false, videoOnly: false });
    assert.deepEqual(core.normalizeSettings({ rate: '2', muted: true, autoPlay: true }),
        { rate: 2, muted: true, autoPlay: true, autoNext: false, videoOnly: false });
    for (const rate of ['', 0, -1, 17, NaN, Infinity, 'abc']) {
        assert.equal(core.normalizeSettings({ rate, autoPlay: 'false' }).rate, 1);
        assert.equal(core.normalizeSettings({ rate, autoPlay: 'false' }).autoPlay, false);
    }
});

test('题目规范化保留负号、百分号和引号，避免错误命中', () => {
    assert.equal(core.normalizeQuestion('  x - 1 = 50%?\n  '), 'x - 1 = 50%?');
    assert.notEqual(core.normalizeQuestion('x - 1'), core.normalizeQuestion('x 1'));
    assert.notEqual(core.normalizeQuestion('10%'), core.normalizeQuestion('10'));
});

test('兼容同步 GM_* 和异步 GM.*，并显式报告保存失败', async () => {
    for (const asyncAPI of [false, true]) {
        const values = new Map();
        const get = (key, fallback) => values.has(key) ? values.get(key) : fallback;
        const set = (key, value) => values.set(key, value);
        const env = asyncAPI ? { GM: { getValue: async (...args) => get(...args), setValue: async (...args) => set(...args) } } :
            { GM_getValue: get, GM_setValue: set };
        const storage = core.createStorage(env);
        assert.equal(await storage.get('key', 42), 42);
        await storage.set('key', false);
        assert.equal(await storage.get('key', 42), false);
    }
    const absent = core.createStorage({});
    assert.equal(await absent.get('key', 1), 1);
    await assert.rejects(absent.set('key', 1), /存储不可用/);
    await assert.rejects(core.createStorage({ GM: { getValue: async () => { throw new Error('bad'); } } }).get('x'), /bad/);
});

function mediaFixture() {
    const nodes = [];
    let settings = { rate: 1, muted: false, autoPlay: false };
    const messages = [];
    const controller = core.createMediaController({ querySelectorAll: () => nodes }, () => settings,
        value => messages.push(value));
    function add() {
        const listeners = new Map();
        const media = {
            isConnected: true, paused: true, ended: false, playbackRate: 1, muted: false, plays: 0,
            play() { this.plays++; return Promise.resolve(); },
            addEventListener: (name, listener) => listeners.set(name, listener),
            removeEventListener: name => listeners.delete(name),
            emit: name => listeners.get(name)?.(), listeners
        };
        nodes.push(media);
        return media;
    }
    return { controller, nodes, messages, add, settings: value => { settings = value; } };
}

test('扫描动态视频，默认不自动播放，重复扫描不重复绑定', () => {
    const f = mediaFixture();
    f.controller.scan();
    assert.equal(f.controller.count(), 0);
    const media = f.add();
    f.controller.scan();
    f.controller.scan();
    assert.equal(f.controller.count(), 1);
    assert.equal(media.plays, 0);
    assert.equal(media.listeners.size, 1);
    f.settings({ rate: 2, muted: true, autoPlay: false });
    f.controller.refresh();
    assert.equal(media.playbackRate, 2);
    assert.equal(media.muted, true);
    media.playbackRate = 1;
    media.emit('loadedmetadata');
    assert.equal(media.playbackRate, 2);
});

test('自动播放拒绝被捕获，DOM 变更不会反复重试；显式应用可重试', async () => {
    const f = mediaFixture();
    const media = f.add();
    media.play = function () { this.plays++; return Promise.reject(new Error('NotAllowedError')); };
    f.settings({ rate: 1, muted: false, autoPlay: true });
    f.controller.refresh();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(media.plays, 1);
    assert.match(f.messages[0], /自动播放被浏览器阻止/);
    f.controller.scan();
    assert.equal(media.plays, 1);
    f.controller.refresh();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(media.plays, 2);
});

test('已结束的视频不重播，媒体删除和页面清理会解绑监听器', () => {
    const f = mediaFixture();
    const media = f.add();
    media.ended = true;
    f.settings({ rate: 1, muted: false, autoPlay: true });
    f.controller.scan();
    assert.equal(media.plays, 0);
    media.isConnected = false;
    f.nodes.length = 0;
    f.controller.scan();
    assert.equal(f.controller.count(), 0);
    assert.equal(media.listeners.size, 0);
    const next = f.add();
    f.controller.scan();
    f.controller.stop();
    assert.equal(next.listeners.size, 0);
    assert.equal(f.controller.count(), 0);
});

test('单个播放器拒绝倍速不会阻断其他媒体', () => {
    const f = mediaFixture();
    const broken = f.add();
    Object.defineProperty(broken, 'playbackRate', { get: () => 1, set: () => { throw new Error('unsupported'); } });
    const normal = f.add();
    f.settings({ rate: 2, muted: true, autoPlay: false });
    assert.doesNotThrow(() => f.controller.scan());
    assert.equal(normal.playbackRate, 2);
    assert.match(f.messages[0], /unsupported/);
});

test('原生控件 setter 触发 input/change，拒绝只读、密码或选择控件', () => {
    class NativeInput { set value(value) { this.nativeValue = value; } }
    class NativeTextarea { set value(value) { this.nativeValue = value; } }
    const events = [];
    const input = {
        tagName: 'INPUT', type: 'text', disabled: false, readOnly: false,
        ownerDocument: { defaultView: { HTMLInputElement: NativeInput, HTMLTextAreaElement: NativeTextarea, Event } },
        dispatchEvent: event => events.push([event.type, event.bubbles])
    };
    assert.equal(core.setInputValue(input, '0'), true);
    assert.equal(input.nativeValue, '0');
    assert.deepEqual(events, [['input', true], ['change', true]]);
    for (const type of ['password', 'radio', 'checkbox', 'hidden', 'submit']) {
        assert.equal(core.setInputValue({ ...input, type }, 'x'), false);
    }
    assert.equal(core.setInputValue({ ...input, readOnly: true }, 'x'), false);
    assert.equal(core.setInputValue({ ...input, disabled: true }, 'x'), false);
});
