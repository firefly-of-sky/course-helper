'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../repaired.user.js');

// 模拟 Vue 选择组件：同一渲染轮内，多个点击都依据旧值计算新值，
// 只保留最后一次更新；更新结束后选项节点全部重建。
function asyncChoices(initial = [], type = 'multiple') {
    let committed = new Set(initial), pending = null, generation = 0, stopped = false, questionId = '11';
    const clicks = [], delays = [];
    const win = { getComputedStyle: () => ({ visibility: 'visible' }) };
    const doc = { defaultView: win };
    const fresh = () => {
        const created = generation;
        const element = { ownerDocument: doc, get isConnected() { return created === generation; }, getClientRects: () => [1] };
        const options = ['101', '102', '103'].map((id, index) => ({
            id, letter: String.fromCharCode(65 + index), text: id,
            control: {
                ownerDocument: doc, disabled: false, value: id,
                get isConnected() { return created === generation; },
                get checked() { return committed.has(index); },
                getAttribute: () => null,
                classList: { contains: () => false },
                click() {
                    assert.equal(created, generation, '不能继续点击已被 Vue 替换的旧选项');
                    clicks.push(index);
                    const next = type === 'multiple' ? new Set(committed) : new Set();
                    if (type === 'multiple' && next.has(index)) next.delete(index); else next.add(index);
                    pending = next;
                }
            }
        }));
        return { element, id: questionId, parentId: '100:40:20', title: '多选题', rawContent: '<p>多选题</p>', type,
            options, inputs: [], selected: index => options[index].control.checked };
    };
    const collect = () => [fresh()];
    const delay = async ms => {
        delays.push(ms);
        if (pending) { committed = pending; pending = null; generation++; }
    };
    const assertCurrent = () => {
        if (stopped) throw new Error('流程已取消');
        if (questionId !== '11') throw new Error('当前题目已切换');
    };
    return { collect, delay, assertCurrent, clicks, delays,
        selected: () => [...committed].sort(), stop: () => { stopped = true; },
        changeQuestion: () => { questionId = '12'; } };
}

test('智慧树多选逐项等待渲染并使用重建后的控件，保留所有目标答案', async () => {
    const old = asyncChoices();
    core.applyAnswer(old.collect()[0], { kind: 'choice', indexes: [1, 2] }, false);
    await old.delay(250);
    assert.deepEqual(old.selected(), [2], '同步连点确实会丢失倒数第二个选项');

    const f = asyncChoices();
    await core.applyZhihuishuAnswer(f.collect()[0], { kind: 'choice', indexes: [1, 2] }, f);
    assert.deepEqual(f.selected(), [1, 2]);
    assert.deepEqual(f.clicks, [1, 2]);
    assert.ok(f.delays.length >= 2);
});

test('智慧树异步多选先移除多余选项再填入缺少答案，重复应用不会取消选中', async () => {
    const f = asyncChoices([0]);
    const plan = { kind: 'choice', indexes: [1, 2] };
    await core.applyZhihuishuAnswer(f.collect()[0], plan, f);
    assert.deepEqual(f.selected(), [1, 2]);
    assert.deepEqual(f.clicks, [0, 1, 2]);
    const count = f.clicks.length;
    await core.applyZhihuishuAnswer(f.collect()[0], plan, f);
    assert.equal(f.clicks.length, count);
    assert.deepEqual(f.selected(), [1, 2]);
});

test('智慧树逐项填答等待期间取消，不再点击后续选项', async () => {
    const f = asyncChoices();
    const originalDelay = f.delay;
    f.delay = async ms => { await originalDelay(ms); f.stop(); };
    await assert.rejects(core.applyZhihuishuAnswer(f.collect()[0], { kind: 'choice', indexes: [1, 2] }, f), /取消/);
    assert.deepEqual(f.clicks, [1]);
    assert.deepEqual(f.selected(), [1]);
});

test('智慧树逐项填答等待期间切题，不写入新题选项', async () => {
    const f = asyncChoices();
    const originalDelay = f.delay;
    f.delay = async ms => { await originalDelay(ms); f.changeQuestion(); };
    await assert.rejects(core.applyZhihuishuAnswer(f.collect()[0], { kind: 'choice', indexes: [1, 2] }, f), /切换/);
    assert.deepEqual(f.clicks, [1]);
});

test('智慧树多选保存被平台拒绝时停止，不继续点击其他选项', async () => {
    const f = asyncChoices();
    f.delay = async () => {};
    await assert.rejects(core.applyZhihuishuAnswer(f.collect()[0], { kind: 'choice', indexes: [1, 2] }, f), /未保存/);
    assert.deepEqual(f.clicks, [1]);
    assert.deepEqual(f.selected(), []);
});

test('智慧树异步填写每次获取控件时核对题目签名', async () => {
    const f = asyncChoices();
    f.assertCurrent = () => {};
    const originalDelay = f.delay;
    f.delay = async ms => { await originalDelay(ms); f.changeQuestion(); };
    await assert.rejects(core.applyZhihuishuAnswer(f.collect()[0], { kind: 'choice', indexes: [1, 2] }, f), /题目变化/);
    assert.deepEqual(f.clicks, [1]);
});
