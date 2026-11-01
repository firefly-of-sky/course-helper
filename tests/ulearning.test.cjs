'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../repaired.user.js');

test('平台查询只在标准优学院课程页启用', () => {
    assert.equal(core.isUlearningLesson({ hostname: 'ua.ulearning.cn', pathname: '/learnCourse/learnCourse.html' }), true);
    assert.equal(core.isUlearningLesson({ hostname: 'ua.ulearning.cn.evil.org', pathname: '/learnCourse/learnCourse.html' }), false);
    assert.equal(core.isUlearningLesson({ hostname: 'ua.ulearning.cn', pathname: '/exam.html' }), false);
});

test('平台答案解析保留 false 和 0，拒绝空或异常结果', () => {
    assert.deepEqual(core.parsePlatformAnswer({ correctAnswerList: [false] }), [false]);
    assert.deepEqual(core.parsePlatformAnswer({ data: { correctAnswerList: [0] } }), [0]);
    for (const value of [null, {}, { correctAnswerList: [] }, { correctAnswerList: [''] },
        { correctAnswerList: [null] }, { correctAnswerList: [{}] }]) assert.throws(() => core.parsePlatformAnswer(value));
});

test('单选、乱序选项文本、多选和判断匹配不猜测答案', () => {
    const options = [{ text: 'B' }, { text: '答案二' }, { text: '答案三' }];
    assert.deepEqual(core.choiceIndexes({ type: 'single', options }, 'B'), [0]);
    assert.deepEqual(core.choiceIndexes({ type: 'single', options }, 'B', true), [1]);
    assert.deepEqual(core.choiceIndexes({ type: 'multiple', options }, ['答案三', 'B']), [2, 0]);
    assert.throws(() => core.choiceIndexes({ type: 'single', options }, ['A', 'C']));
    assert.throws(() => core.choiceIndexes({ type: 'single', options }, 'D'));
    assert.throws(() => core.choiceIndexes({ type: 'single', options: [{ text: '相同' }, { text: '相同' }] }, '相同'));
    const judge = { type: 'judge', options: [{ text: '错误' }, { text: '正确' }] };
    assert.deepEqual(core.choiceIndexes(judge, false), [0]);
    assert.deepEqual(core.choiceIndexes(judge, true), [1]);
    assert.deepEqual(core.choiceIndexes(judge, 'false'), [0]);
});

test('认证头不会重复添加 Bearer，且只读取约定的同站凭据', () => {
    assert.deepEqual(core.platformHeaders('OTHER=secret'), { Accept: 'application/json' });
    assert.equal(core.platformHeaders('AUTHORIZATION=a.b.c').Authorization, 'Bearer a.b.c');
    assert.equal(core.platformHeaders('AUTHORIZATION=Bearer%20a.b.c').Authorization, 'Bearer a.b.c');
    assert.equal(core.platformHeaders('UA_AUTHORIZATION=own')['ua-authorization'], 'own');
});

function testWindow(fetch) {
    return { location: { hostname: 'ua.ulearning.cn', pathname: '/learnCourse/learnCourse.html' },
        document: { cookie: '' }, fetch };
}

test('平台请求仅访问固定官方端点，使用 GET 并传递取消信号', async () => {
    const controller = new AbortController();
    const provider = core.createPlatformProvider(testWindow(async (url, options) => {
        assert.equal(url, 'https://api.ulearning.cn/questionAnswer/123?parentId=456');
        assert.equal(options.method, 'GET');
        assert.equal(options.signal, controller.signal);
        assert.equal(options.redirect, 'error');
        return { ok: true, json: async () => ({ correctAnswerList: ['D'] }) };
    }));
    assert.deepEqual(await provider({ id: '123', parentId: '456' }, controller.signal), ['D']);
    await assert.rejects(provider({ id: '../x', parentId: '456' }, controller.signal), /标识/);
});

test('401、403、429、无答案和 HTML 响应会报告错误', async () => {
    for (const status of [401, 403, 429, 500]) {
        const provider = core.createPlatformProvider(testWindow(async () => ({ ok: false, status })));
        await assert.rejects(provider({ id: '123', parentId: '456' }), /拒绝|频繁|HTTP/);
    }
    const malformed = core.createPlatformProvider(testWindow(async () => ({ ok: true, json: async () => { throw new Error('HTML'); } })));
    await assert.rejects(malformed({ id: '123', parentId: '456' }), /JSON/);
});

function fixture(types = ['single']) {
    const controls = [];
    const nodes = [];
    const messages = [];
    const rows = [];
    const doc = {
        defaultView: { getComputedStyle: () => ({ visibility: 'visible' }) },
        querySelectorAll(selector) {
            if (selector === '.page-name.active') return [{ closest: () => ({ id: this.pageId || 'page456' }) }];
            if (selector === '.question-element-node') return nodes;
            throw new Error('Unexpected selector: ' + selector);
        },
        createElement(tag) {
            assert.equal(tag, 'template');
            return { content: { textContent: '' }, set innerHTML(value) { this.content.textContent = value.replace(/<[^>]*>/g, ''); } };
        }
    };
    const titles = { single: '单选题', multiple: '多选题', judge: '判断题', unsupported: '综合题' };
    types.forEach((type, questionIndex) => {
        const choices = [];
        for (let index = 0; index < (type === 'judge' ? 2 : 4); index++) {
            const classes = new Set(['checkbox', ...(type === 'judge' ? [index === 0 ? 'right-btn' : 'wrong-btn'] : [])]);
            const control = {
                isConnected: true, ownerDocument: doc, getClientRects: () => [1],
                classList: { contains: value => classes.has(value) },
                getAttribute: () => null,
                parentElement: { querySelector: () => ({ textContent: '选项' + index }) },
                clicks: 0,
                click() {
                    this.clicks++;
                    if (type !== 'multiple') choices.forEach(choice => choice.classes.delete('selected'));
                    if (classes.has('selected')) classes.delete('selected'); else classes.add('selected');
                }, classes
            };
            choices.push(control);
        }
        controls.push(choices);
        const element = {
            isConnected: true, ownerDocument: doc, getClientRects: () => [1],
            querySelector(selector) {
                if (selector === '.question-wrapper') return { id: 'question' + (123 + questionIndex) };
                if (selector === '.question-title-html') return { textContent: '题目' + questionIndex };
                if (selector === '.question-type-tag') return { textContent: titles[type] };
                throw new Error('Unexpected selector: ' + selector);
            },
            querySelectorAll(selector) {
                if (selector === '.checkbox' || selector === '.choice-btn') return choices;
                return [];
            }
        };
        nodes.push(element);
    });
    const runner = provider => core.createQuestionRunner({ doc, provider,
        report: message => messages.push(message), results: result => rows.push(result.map(row => ({ ...row }))) });
    return { doc, nodes, controls, messages, rows, runner };
}

test('真实选择器提取题干与当前练习标识，隐藏题目被跳过', () => {
    const f = fixture();
    const questions = core.collectQuestions(f.doc);
    assert.equal(questions[0].id, '123');
    assert.equal(questions[0].parentId, '456');
    assert.equal(questions[0].type, 'single');
    f.nodes[0].isConnected = false;
    assert.equal(core.collectQuestions(f.doc).length, 0);
});

test('多选按目标状态切换，重复运行不会取消已有正确选项', () => {
    const f = fixture(['multiple']);
    const question = core.collectQuestions(f.doc)[0];
    f.controls[0][1].classes.add('selected');
    const plan = core.planAnswer(question, ['A', 'C'], f.doc, true);
    core.applyAnswer(question, plan);
    assert.deepEqual(f.controls[0].map(control => control.classes.has('selected')), [true, false, true, false]);
    const counts = f.controls[0].map(control => control.clicks);
    core.applyAnswer(question, plan);
    assert.deepEqual(f.controls[0].map(control => control.clicks), counts);
});

test('页面在异步查询期间切换时，不写入旧题目', async () => {
    const f = fixture();
    const runner = f.runner(async () => { f.doc.pageId = 'page999'; return ['D']; });
    await runner.run();
    assert.equal(f.controls[0].reduce((sum, control) => sum + control.clicks, 0), 0);
    assert.match(f.messages.at(-1), /页面已切换/);
});

test('停止操作会阻止迟到的接口结果写入，双击不会并发查询', async () => {
    const f = fixture();
    let resolve;
    let requests = 0;
    const runner = f.runner(() => { requests++; return new Promise(done => { resolve = done; }); });
    const pending = runner.run();
    await runner.run();
    assert.equal(requests, 1);
    runner.cancel();
    resolve(['D']);
    await pending;
    assert.equal(f.controls[0].reduce((sum, control) => sum + control.clicks, 0), 0);
    assert.equal(runner.busy(), false);
});

test('接口错误不会猜选项，后续可用题仍可填写且不触发提交', async () => {
    const f = fixture(['single', 'single']);
    const runner = f.runner(async question => {
        if (question.id === '123') throw new Error('平台没有返回答案');
        return ['C'];
    });
    await runner.run();
    assert.equal(f.controls[0].reduce((sum, control) => sum + control.clicks, 0), 0);
    assert.equal(f.controls[1][2].clicks, 1);
    assert.match(f.messages.at(-1), /1 \/ 2/);
    assert.match(f.rows.at(-1)[0].status, /没有返回答案/);
});

test('跨域请求仅允许固定优学院答案 URL，拒绝其他域名、路径和额外参数', async () => {
    const url = 'https://api.ulearning.cn/questionAnswer/123?parentId=456';
    assert.equal(core.validAnswerUrl(url), true);
    const denied = ['https://evil.org/questionAnswer/123?parentId=456',
        'http://api.ulearning.cn/questionAnswer/123?parentId=456',
        url + '&token=secret', url + '&parentId=789',
        'https://api.ulearning.cn/upload?parentId=456'];
    const transport = core.createPlatformTransport({ GM_xmlhttpRequest: () => { throw new Error('不应访问'); } });
    for (const value of denied) {
        assert.equal(core.validAnswerUrl(value), false);
        await assert.rejects(transport(value, {}), /拒绝/);
    }
});

test('GM 请求正确解析响应、固定 GET，拒绝重定向', async () => {
    const url = 'https://api.ulearning.cn/questionAnswer/123?parentId=456';
    const transport = core.createPlatformTransport({ GM_xmlhttpRequest(options) {
        assert.equal(options.method, 'GET');
        assert.equal(options.redirect, 'error');
        queueMicrotask(() => options.onload({ status: 200, finalUrl: url, responseText: '{"correctAnswerList":["D"]}' }));
    } });
    const response = await transport(url, { headers: {} });
    assert.deepEqual(await response.json(), { correctAnswerList: ['D'] });
    const redirected = core.createPlatformTransport({ GM_xmlhttpRequest(options) {
        queueMicrotask(() => options.onload({ status: 200, finalUrl: 'https://evil.org/', responseText: '{}' }));
    } });
    await assert.rejects(redirected(url, {}), /重定向/);
});

test('异步 GM API 的 Promise 与回调只结算一次', async () => {
    const url = 'https://api.ulearning.cn/questionAnswer/123?parentId=456';
    const transport = core.createPlatformTransport({ GM: { async xmlHttpRequest(options) {
        const response = { status: 200, finalUrl: url, responseText: '{"correctAnswerList":[false]}' };
        options.onload(response);
        return response;
    } } });
    const response = await transport(url, {});
    assert.deepEqual(await response.json(), { correctAnswerList: [false] });
});

test('取消和网络失败会正确结束 GM 请求并清理监听器', async () => {
    const url = 'https://api.ulearning.cn/questionAnswer/123?parentId=456';
    const controller = new AbortController();
    let aborts = 0;
    const transport = core.createPlatformTransport({ GM_xmlhttpRequest() { return { abort() { aborts++; } }; } });
    const pending = transport(url, { signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, /停止/);
    assert.equal(aborts, 1);
    const failed = core.createPlatformTransport({ GM_xmlhttpRequest(options) { queueMicrotask(options.onerror); } });
    await assert.rejects(failed(url, {}), /网络请求失败/);
});

function omitTypeLabel(f, label = '') {
    for (const node of f.nodes) {
        const original = node.querySelector;
        node.querySelector = function (selector) {
            return selector === '.question-type-tag' ? (label === null ? null : { textContent: label }) : original.call(this, selector);
        };
    }
}

test('同组单选省略题型文字时，依明确 radio 标记识别并正常查询填入 10 题', async () => {
    const f = fixture(Array(10).fill('single'));
    omitTypeLabel(f);
    for (const controls of f.controls) for (const control of controls) control.classes.add('radio');
    assert.ok(core.collectQuestions(f.doc).every(question => question.type === 'single'));
    let queries = 0;
    await f.runner(async () => { queries++; return ['B']; }).run();
    assert.equal(queries, 10);
    assert.ok(f.controls.every(controls => controls[1].classes.has('selected')));
    assert.match(f.messages.at(-1), /已填入 10 \/ 10/);
});

test('缺失题型且没有明确 radio 标记、标记混杂或非空未知题型时不猜测', () => {
    const f = fixture();
    omitTypeLabel(f, null);
    assert.equal(core.collectQuestions(f.doc)[0].type, 'unsupported');
    for (const control of f.controls[0]) control.classes.add('radio');
    assert.equal(core.collectQuestions(f.doc)[0].type, 'single');
    f.controls[0][0].classes.delete('radio');
    assert.equal(core.collectQuestions(f.doc)[0].type, 'unsupported');
    f.controls[0][0].classes.add('radio');
    omitTypeLabel(f, '综合题');
    assert.equal(core.collectQuestions(f.doc)[0].type, 'unsupported');
});
