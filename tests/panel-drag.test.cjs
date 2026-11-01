'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createPanelDragController } = require('../repaired.user.js');

function target(extra = {}) {
    const listeners = new Map();
    return { ...extra, listeners,
        addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); },
        removeEventListener(name, fn) { listeners.set(name, (listeners.get(name) || []).filter(value => value !== fn)); },
        emit(name, props = {}) {
            const event = { target: this, button: 0, pointerId: 1, clientX: 780, clientY: 90, detail: 1,
                preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...props };
            for (const fn of listeners.get(name) || []) { fn(event); if (event.stopped) break; }
            return event;
        }, closest() { return null; }, setPointerCapture() {}, releasePointerCapture() {}
    };
}
function fixture(saved = null, overrides = {}) {
    const win = target({ innerWidth: 1100, innerHeight: 850 });
    const handle = target(), toggle = target(), attrs = new Map(), writes = [], messages = [];
    const host = { style: { right: '12px', top: '72px' }, width: 328, height: 650,
        getClientRects: () => [1], setAttribute: (k, v) => attrs.set(k, v), removeAttribute: k => attrs.delete(k),
        getBoundingClientRect() { return { left: this.style.left && this.style.left !== 'auto' ? Number.parseFloat(this.style.left) : win.innerWidth - this.width - 12,
            top: Number.parseFloat(this.style.top), width: this.width, height: this.height }; } };
    const controller = createPanelDragController(win, host, [handle, toggle], {
        get: async () => saved, set: async (key, value) => writes.push(value), ...overrides
    }, value => messages.push(value));
    const drag = (dx, dy, source = handle) => { source.emit('pointerdown'); win.emit('pointermove', { clientX: 780 + dx, clientY: 90 + dy }); win.emit('pointerup'); };
    return { win, handle, toggle, host, controller, drag, writes, messages, attrs };
}
const settled = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

test('拖动标题后保存位置，刷新后恢复；位置存储不覆盖播放设置', async () => {
    const f = fixture(); await f.controller.ready;
    f.drag(-400, 50); await settled();
    assert.deepEqual(f.writes, [{ left: 360, top: 122 }]);
    assert.equal(f.host.style.right, 'auto');
    const restored = fixture(f.writes[0]); await restored.controller.ready;
    assert.equal(restored.host.style.left, '360px'); assert.equal(restored.host.style.top, '122px');
    assert.equal(restored.writes.length, 0);
});

test('点击和轻微抖动不移动，不保存；收起按钮和表单控件不会开始拖动', async () => {
    const f = fixture(); await f.controller.ready;
    f.drag(2, 2); await settled(); assert.equal(f.writes.length, 0);
    assert.equal(f.toggle.emit('click').prevented, undefined);
    const button = target(); button.closest = () => button;
    f.handle.emit('pointerdown', { target: button }); f.win.emit('pointermove', { clientX: 20 }); f.win.emit('pointerup');
    await settled(); assert.equal(f.writes.length, 0); assert.equal(f.host.style.left, undefined);
});

test('拖动悬浮按钮后抑制兼容 click，下一次单击与键盘展开仍正常', async () => {
    const f = fixture(); await f.controller.ready; f.host.width = 100; f.host.height = 40;
    f.drag(-200, 100, f.toggle); await settled();
    assert.equal(f.toggle.emit('click').stopped, true);
    assert.equal(f.toggle.emit('click', { detail: 0 }).stopped, undefined);
    f.toggle.emit('pointerdown'); f.win.emit('pointerup');
    assert.equal(f.toggle.emit('click').stopped, undefined);
});

test('展开面板、窗口缩小和旧位置越界时保持可见，不把面板拖出窗口', async () => {
    const f = fixture({ left: 9999, top: 9999 }); await f.controller.ready;
    assert.equal(f.host.style.left, '764px'); assert.equal(f.host.style.top, '192px');
    f.drag(-9999, -9999); await settled();
    assert.deepEqual(f.writes.at(-1), { left: 8, top: 8 });
    f.host.width = 100; f.host.height = 40; f.drag(9999, 9999); await settled();
    f.host.width = 328; f.host.height = 650; f.controller.reflow();
    assert.equal(f.host.style.left, '764px'); assert.equal(f.host.style.top, '192px');
    f.win.innerWidth = 400; f.win.innerHeight = 700; f.win.emit('resize');
    assert.equal(f.host.style.left, '64px'); assert.equal(f.host.style.top, '42px');
});

test('异步读取的旧位置不覆盖已经开始的用户拖动，非法位置忽略', async () => {
    let resolve;
    const f = fixture(null, { get: () => new Promise(done => { resolve = done; }) });
    f.drag(-400, 20); resolve({ left: 20, top: 20 }); await f.controller.ready;
    assert.equal(f.host.style.left, '360px');
    for (const value of [{ left: NaN, top: 2 }, { left: '20', top: 2 }, { left: Infinity, top: 0 }, {}]) {
        const bad = fixture(value); await bad.controller.ready; assert.equal(bad.host.style.left, undefined);
    }
});

test('指针取消或窗口失焦时恢复起点；复位清除位置，stop 清理监听器', async () => {
    const f = fixture(); await f.controller.ready;
    f.handle.emit('pointerdown'); f.win.emit('pointermove', { clientX: 100, clientY: 100 }); f.win.emit('pointercancel');
    assert.equal(f.host.style.left, 'auto'); assert.equal(f.host.style.right, '12px'); assert.equal(f.writes.length, 0);
    f.drag(-300, 10); await settled(); const before = { ...f.host.style };
    f.handle.emit('pointerdown'); f.win.emit('pointermove', { clientX: 20 }); f.win.emit('blur');
    assert.equal(f.host.style.left, before.left); assert.equal(f.host.style.top, before.top);
    f.controller.reset(); await settled(); assert.equal(f.writes.at(-1), null); assert.equal(f.host.style.top, '72px');
    f.controller.stop();
    assert.equal([...f.win.listeners.values(), ...f.handle.listeners.values(), ...f.toggle.listeners.values()].flat().length, 0);
});

test('方向键可移动；存储失败有提示且面板仍可拖动', async () => {
    const f = fixture(null, { get: async () => { throw Error('read'); }, set: async () => { throw Error('write'); } });
    assert.match(await f.controller.ready, /读取失败/);
    f.handle.emit('keydown', { key: 'ArrowLeft', shiftKey: true }); await settled();
    assert.equal(f.host.style.left, '720px'); assert.match(f.messages.at(-1), /保存失败/);
    f.drag(-200, 10); assert.equal(f.host.style.left, '520px');
});
