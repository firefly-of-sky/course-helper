'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createPanelViewController, createPanelDragController } = require('../repaired.user.js');

const settle = async () => { for (let index = 0; index < 12; index++) await Promise.resolve(); };
function fixture(storage) {
    const panel = { hidden: false };
    const toggle = { hidden: true, attributes: new Map(), setAttribute(key, value) { this.attributes.set(key, value); } };
    const messages = [], changes = [];
    const root = { getElementById: id => ({ panel, toggle })[id] };
    const controller = createPanelViewController(root, storage, text => messages.push(text), 'test-panel-view', () => changes.push(panel.hidden));
    return { panel, toggle, messages, changes, controller };
}
function assertCollapsed(f, collapsed) {
    assert.equal(f.panel.hidden, collapsed);
    assert.equal(f.toggle.hidden, !collapsed);
    assert.equal(f.toggle.attributes.get('aria-expanded'), String(!collapsed));
}

test('首次无保存记录时显示收起悬浮球，损坏的状态也采用默认值', async () => {
    for (const saved of [null, undefined, 'false', 0, {}]) {
        const writes = [];
        const f = fixture({ get: async () => saved, set: async (...args) => writes.push(args) });
        await f.controller.ready;
        assertCollapsed(f, true);
        assert.equal(writes.length, 0, '初始化不应覆盖尚未保存的用户状态');
        f.controller.stop();
    }
});

test('切换页面分别恢复上次的展开和收起状态', async () => {
    const values = new Map();
    const storage = { get: async (key, fallback) => values.has(key) ? values.get(key) : fallback,
        set: async (key, value) => { values.set(key, value); } };
    const first = fixture(storage); await first.controller.ready;
    first.controller.toggle(); await settle(); assertCollapsed(first, false); first.controller.stop();
    const second = fixture(storage); await second.controller.ready; assertCollapsed(second, false);
    second.controller.toggle(); await settle(); assertCollapsed(second, true); second.controller.stop();
    const third = fixture(storage); await third.controller.ready; assertCollapsed(third, true); third.controller.stop();
});

test('快速切换串行保存，迟到的旧写入不会覆盖最终状态', async () => {
    const pending = [], calls = [];
    const f = fixture({ get: async () => true, set: (key, value) => {
        calls.push({ key, value }); return new Promise(resolve => pending.push(resolve));
    } });
    await f.controller.ready;
    f.controller.toggle(); f.controller.toggle(); f.controller.toggle();
    assertCollapsed(f, false); await settle();
    assert.deepEqual(calls, [{ key: 'test-panel-view', value: false }]);
    pending.shift()(); await settle();
    assert.deepEqual(calls.map(call => call.value), [false, true]);
    pending.shift()(); await settle();
    assert.deepEqual(calls.map(call => call.value), [false, true, false]);
    pending.shift()(); await settle(); f.controller.stop();
});

test('保存读取未结束时用户已切换，不用迟到的旧值覆盖当前界面', async () => {
    let resolveRead;
    const writes = [];
    const f = fixture({ get: () => new Promise(resolve => { resolveRead = resolve; }),
        set: async (key, value) => writes.push(value) });
    f.controller.toggle(); assertCollapsed(f, false);
    resolveRead(true); await f.controller.ready; await settle();
    assertCollapsed(f, false); assert.deepEqual(writes, [false]); f.controller.stop();
});

test('存储失败仍可展开收起，并提示无法保留状态', async () => {
    const f = fixture({ get: async () => { throw Error('读取异常'); }, set: async () => { throw Error('写入异常'); } });
    const warning = await f.controller.ready;
    assert.ok(warning || f.messages.length, '读取失败应产生可见提示');
    assertCollapsed(f, true);
    f.controller.toggle(); await settle(); assertCollapsed(f, false);
    assert.ok(f.messages.length, '写入失败应产生可见提示');
    f.controller.toggle(); await settle(); assertCollapsed(f, true); f.controller.stop();
});

test('销毁后迟到的读取和后续切换不改变界面或继续保存', async () => {
    let resolveRead;
    const writes = [];
    const f = fixture({ get: () => new Promise(resolve => { resolveRead = resolve; }), set: async (key, value) => writes.push(value) });
    const before = f.panel.hidden;
    f.controller.stop(); resolveRead(false); await f.controller.ready;
    f.controller.toggle(); await settle();
    assert.equal(f.panel.hidden, before); assert.deepEqual(writes, []);
});

test('位置恢复等待收起状态就绪，底部悬浮球不会先按展开面板尺寸被挪走', async () => {
    let restoreView;
    const readyView = new Promise(resolve => { restoreView = resolve; });
    const events = { addEventListener() {}, removeEventListener() {} };
    const win = { ...events, innerWidth: 1100, innerHeight: 850 };
    const host = { style: {}, width: 328, height: 650,
        getClientRects: () => [1],
        getBoundingClientRect() { return { width: this.width, height: this.height }; } };
    let reads = 0;
    const drag = createPanelDragController(win, host, [], {
        get: async () => { reads++; return { left: 900, top: 700 }; }, set: async () => {}
    }, () => {}, 'test-position', readyView);
    await settle(); assert.equal(reads, 0); assert.equal(host.style.left, undefined);
    host.width = 100; host.height = 40; restoreView(); await drag.ready;
    assert.equal(host.style.left, '900px'); assert.equal(host.style.top, '700px');
    drag.stop();
});

test('展开时为保持可见而移动的坐标会保存，重新收起并切页不会跳回旧位置', async () => {
    let saved = { left: 900, top: 700 };
    const writes = [];
    const storage = { get: async () => ({ ...saved }), set: async (key, value) => {
        saved = { ...value }; writes.push({ ...value });
    } };
    const win = { innerWidth: 1100, innerHeight: 850, addEventListener() {}, removeEventListener() {} };
    const makeHost = () => ({ style: {}, width: 100, height: 40, getClientRects: () => [1],
        getBoundingClientRect() { return { width: this.width, height: this.height }; } });
    const host = makeHost();
    const drag = createPanelDragController(win, host, [], storage, () => {}, 'test-position');
    await drag.ready;
    assert.equal(host.style.left, '900px'); assert.equal(host.style.top, '700px');
    host.width = 328; host.height = 650; drag.reflow(true); await settle();
    const expandedPosition = { left: Number.parseFloat(host.style.left), top: Number.parseFloat(host.style.top) };
    assert.equal(expandedPosition.left, 764); assert.equal(expandedPosition.top, 192);
    assert.deepEqual(saved, expandedPosition, '可见位置应取代尚未展开时的旧坐标');
    host.width = 100; host.height = 40; drag.reflow(true); await settle();
    assert.deepEqual(writes.at(-1), expandedPosition, '收起后保存的仍应是当前实际坐标');
    drag.stop();
    const nextHost = makeHost();
    const nextPage = createPanelDragController(win, nextHost, [], storage, () => {}, 'test-position');
    await nextPage.ready;
    assert.equal(nextHost.style.left, host.style.left); assert.equal(nextHost.style.top, host.style.top);
    nextPage.stop();
});
