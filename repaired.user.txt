// ==UserScript==
// @name         全国网课辅助（本地修复版）
// @namespace    super_coolhii_video_helper_cat
// @version      5.6.1
// @description  视频播放控制、正常结束自动切视频与优学院自动答题。填入后由本人核对提交。
// @author       coolhii（原稿）；本地修复
// @license      AGPL-3.0-only
// @downloadURL  none
// @match        *://*.chaoxing.com/*
// @match        *://*.zhihuishu.com/*
// @match        *://*.unipus.cn/*
// @match        *://*.umajor.org/*
// @match        *://*.zjy2.icve.com.cn/*
// @match        *://*.yuketang.cn/*
// @match        *://*.tsinghua.edu.cn/*
// @match        *://*.utalk.com/*
// @match        *://*.icourse163.org/*
// @match        *://*.yinghuaonline.com/*
// @match        *://*.cqgx.com/*
// @match        *://*.kaoshixing.com/*
// @match        *://*.168wangxiao.com/*
// @match        *://*.lemonwen.com/*
// @match        *://*.yixuebao.com/*
// @match        *://*.youkexuetang.com/*
// @match        *://*.xiaoetong.com/*
// @match        *://*.ahjxjy.cn/*
// @match        *://*.shou.edu.cn/*
// @match        *://*.hqu.edu.cn/*
// @match        *://*.hexue.com.cn/*
// @match        *://*.pmph.com/*
// @match        *://*.ouchn.cn/*
// @match        *://*.scetc.edu.cn/*
// @match        *://*.zjedu.org/*
// @match        *://*.cug.edu.cn/*
// @match        *://*.zjzs.net/*
// @match        *://*.hneao.cn/*
// @match        *://*.ulearning.cn/*
// @match        *://*.xueqiplus.com/*
// @match        *://*.qingshuxuetang.com/*
// @match        *://*.xuetangx.com/*
// @match        *://*.yinghuaxuetang.com/*
// @match        *://*.gdou.com/*
// @match        *://xuexi.jsou.cn/*
// @match        *://*.edu-edu.com/*
// @match        *://spoc-exam.icve.com.cn/*
// @match        *://*.icve.com.cn/*
// @match        *://zice.cnzx.info/*
// @match        *://www.icourse163.org/*
// @match        *://*.shou.org.cn/*
// @match        *://main.ahjxjy.cn/*
// @match        *://exam.chinaedu.net/*
// @match        *://degree.qingshuxuetang.com/*
// @match        *://cce.org.uooconline.com/*
// @match        *://*.courshare.cn/*
// @match        *://*.cep.webtrn.cn/*
// @match        *://*.webtrn.cn/*
// @match        *://*.cj-edu.com/*
// @match        *://*.ytccr.com/*
// @match        *://*.exam-cloud.cn/*
// @match        *://gdrtvu.exam-cloud.cn/*
// @match        *://*.open.ha.cn/*
// @match        *://lhycjy.cloudwis.tech/*
// @match        *://*.sclecb.cn/*
// @match        *://*.web2.superchutou.com/*
// @match        *://*.ls365.net/*
// @match        *://*.jijiaox.com/*
// @match        *://*.wencaischool.net/*
// @match        *://sdrz.gxk.yxlearning.com/*
// @match        *://*.crjxjy.net/*
// @match        *://*.cjnep.net/*
// @match        *://*.91huayi.com/*
// @match        *://teach.ynou.edu.cn/*
// @match        *://*.edu-edu.com.cn/*
// @match        *://*.21tb.com/*
// @match        *://web.moycp.com/*
// @include      /^https?:\/\/any\.cnzx\.info:81\/.*$/
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// @connect      api.ulearning.cn
// @run-at       document-idle
// ==/UserScript==
(function () {
    'use strict';

    const PANEL_ID = 'course-helper-repaired-panel';
    const SETTINGS_KEY = 'course-helper-repaired-settings-v1';
    const POSITION_KEY = 'course-helper-panel-position-v1';
    const DEFAULTS = Object.freeze({ rate: 1, muted: false, autoPlay: false, autoNext: false, videoOnly: false });

    function isDomain(host, domain) {
        return host === domain || host.endsWith('.' + domain);
    }

    function detectPlatform(host) {
        const platforms = [
            ['ulearning.cn', '优学院'], ['chaoxing.com', '超星学习通'],
            ['zhihuishu.com', '智慧树'], ['unipus.cn', 'U校园'],
            ['icourse163.org', '中国大学MOOC'], ['icve.com.cn', '职教云'],
            ['yuketang.cn', '雨课堂'], ['qingshuxuetang.com', '青书学堂'],
            ['xueqiplus.com', '学起Plus'], ['ouchn.cn', '国家开放大学'],
            ['moycp.com', '慕享'], ['yinghuaonline.com', '英华在线'],
            ['yinghuaxuetang.com', '英华学堂'], ['xuetangx.com', '学堂在线']
        ];
        return platforms.find(([domain]) => isDomain(host, domain))?.[1] || host;
    }

    function normalizeSettings(value) {
        const source = value && typeof value === 'object' ? value : {};
        const rate = Number(source.rate);
        return {
            rate: Number.isFinite(rate) && rate >= 0.25 && rate <= 16 ? rate : 1,
            muted: source.muted === true,
            autoPlay: source.autoPlay === true,
            autoNext: source.autoNext === true,
            videoOnly: source.videoOnly === true
        };
    }

    // 保留数学符号、引号、百分号和标点，避免将不同题目归并为一题。
    function normalizeQuestion(text) {
        return String(text ?? '').replace(/\s+/g, ' ').trim();
    }

    function answerText(answer) {
        if (answer === true) return '正确';
        if (answer === false) return '错误';
        return String(answer);
    }

    // 使用控件所属文档的原生 setter，触发依赖 input/change 的页面更新。
    function setInputValue(input, value) {
        const view = input.ownerDocument.defaultView;
        const tag = input.tagName.toLowerCase();
        if (!['input', 'textarea'].includes(tag) || input.disabled || input.readOnly) return false;
        if (tag === 'input' && !['text', 'search', 'number', 'url', 'tel', 'email'].includes(input.type)) {
            return false;
        }
        const prototype = tag === 'textarea' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (!setter) return false;
        setter.call(input, value);
        input.dispatchEvent(new view.Event('input', { bubbles: true }));
        input.dispatchEvent(new view.Event('change', { bubbles: true }));
        return true;
    }

    function isVisible(element) {
        return element.isConnected && element.getClientRects().length > 0 &&
            element.ownerDocument.defaultView.getComputedStyle(element).visibility !== 'hidden';
    }

    function isUlearningLesson(location) {
        return location.hostname === 'ua.ulearning.cn' && /^\/learnCourse\/learnCourse\.html$/.test(location.pathname);
    }

    function detectQuestionType(element) {
        const label = normalizeQuestion(element.querySelector('.question-type-tag')?.textContent);
        const types = { 单选题: 'single', 多选题: 'multiple', 判断题: 'judge', 填空题: 'blank', 简答题: 'text' };
        if (label) return types[label] || 'unsupported';
        // 同一组单选题可能不显示题型文字；平台仍给每个选择控件标记 checkbox radio。
        // 只有所有可见选项都明确为 radio 才回退到单选，不能按选项数量猜测。
        const controls = [...element.querySelectorAll('.checkbox')].filter(isVisible);
        if (controls.length >= 2 && controls.every(control => control.classList.contains('radio'))) return 'single';
        return 'unsupported';
    }

    // 选择器来自真实优学院课件练习页；不操作隐藏的历史节点。
    function collectQuestions(doc) {
        const activePages = [...doc.querySelectorAll('.page-name.active')]
            .map(element => element.closest('[id^="page"]')?.id).filter(Boolean);
        const parentId = activePages.length === 1 ? /^page(\d+)$/.exec(activePages[0])?.[1] || '' : '';
        return [...doc.querySelectorAll('.question-element-node')].filter(isVisible).map(element => {
            const wrapper = element.querySelector('.question-wrapper');
            const title = normalizeQuestion(element.querySelector('.question-title-html')?.textContent);
            const type = detectQuestionType(element);
            const id = /^question(\d+)$/.exec(wrapper?.id || '')?.[1] || '';
            const controls = [...element.querySelectorAll(type === 'judge' ? '.choice-btn' : '.checkbox')].filter(isVisible);
            const options = controls.map((control, index) => {
                // 题库优先允许用选项字母匹配；文本匹配只使用实际选项内容。
                const content = control.parentElement.querySelector('.option-content,.option-text,.option-html,[data-bind*="html:"]');
                return {
                    letter: String.fromCharCode(65 + index),
                    text: type === 'judge' ? (control.classList.contains('right-btn') ? '正确' :
                        control.classList.contains('wrong-btn') ? '错误' : normalizeQuestion(control.textContent)) :
                        normalizeQuestion(content?.textContent || ''),
                    control
                };
            });
            const inputs = [...element.querySelectorAll(type === 'blank' ? 'input.blank-input,textarea.blank-input' :
                'textarea.form-control,input.form-control')].filter(isVisible);
            return { element, id, parentId, title, type, options, inputs };
        });
    }

    function questionSignature(questions) {
        return JSON.stringify(questions.map(question => [question.parentId, question.id, question.title,
            question.type, question.options.map(option => [option.letter, option.text])]));
    }

    function parsePlatformAnswer(payload) {
        const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
        const answers = data?.correctAnswerList;
        if (!Array.isArray(answers) || answers.length === 0 ||
            answers.some(answer => !['string', 'number', 'boolean'].includes(typeof answer) ||
                (typeof answer === 'number' && !Number.isFinite(answer)) || String(answer).trim() === '')) {
            throw new Error('平台没有返回可用答案');
        }
        return answers;
    }

    function plainAnswer(doc, value) {
        if (typeof value !== 'string') return answerText(value);
        const template = doc.createElement('template');
        template.innerHTML = value;
        return normalizeQuestion(template.content.textContent);
    }

    function choiceIndexes(question, answers, preferLetters = false) {
        let values = Array.isArray(answers) ? answers : [answers];
        if (!values.length) throw new Error('答案为空');
        const indexes = values.map(value => {
            const text = normalizeQuestion(answerText(value));
            if (question.type === 'judge') {
                const trueValues = ['正确', '对', '是', 'true', '√'];
                const falseValues = ['错误', '错', '否', 'false', '×'];
                const normalized = trueValues.includes(text.toLowerCase()) ? '正确' :
                    falseValues.includes(text.toLowerCase()) ? '错误' : text;
                const matches = question.options.map((option, index) => option.text === normalized ? index : -1).filter(index => index >= 0);
                if (matches.length !== 1) throw new Error('判断答案无法唯一匹配');
                return matches[0];
            }
            const letter = /^[A-Z]$/i.test(text) ? text.toUpperCase().charCodeAt(0) - 65 : -1;
            const matches = question.options.map((option, index) => option.text && option.text === text ? index : -1).filter(index => index >= 0);
            if (preferLetters && letter >= 0 && letter < question.options.length) return letter;
            if (matches.length === 1) return matches[0];
            if (matches.length === 0 && letter >= 0 && letter < question.options.length) return letter;
            throw new Error('答案无法唯一匹配当前选项：' + text);
        });
        const unique = [...new Set(indexes)];
        if (question.type !== 'multiple' && unique.length !== 1) throw new Error('单选或判断题只能有一个答案');
        return unique;
    }

    function planAnswer(question, rawAnswers, doc, preferLetters = false) {
        const answers = (Array.isArray(rawAnswers) ? rawAnswers : [rawAnswers]).map(value => plainAnswer(doc, value));
        if (['single', 'multiple', 'judge'].includes(question.type)) {
            const indexes = choiceIndexes(question, answers, preferLetters);
            if (question.options.some(option => option.control.disabled || option.control.getAttribute('aria-disabled') === 'true')) {
                throw new Error('选项已锁定');
            }
            return { kind: 'choice', indexes, summary: indexes.map(index => question.options[index].letter).join('、') };
        }
        if (['blank', 'text'].includes(question.type)) {
            if (!question.inputs.length || question.inputs.length !== answers.length ||
                question.inputs.some(input => input.disabled || input.readOnly)) {
                throw new Error('文本答案与可编辑输入框数量不一致，或控件已锁定');
            }
            return { kind: 'text', answers, summary: answers.join('；') };
        }
        throw new Error('该题型尚未适配');
    }

    function applyAnswer(question, plan) {
        if (!isVisible(question.element)) throw new Error('题目已离开当前页面');
        if (plan.kind === 'text') {
            question.inputs.forEach((input, index) => {
                if (!setInputValue(input, plan.answers[index])) throw new Error('无法填写当前文本控件');
            });
            return;
        }
        const selected = control => control.classList.contains('selected') || control.getAttribute('aria-checked') === 'true';
        if (question.type === 'multiple') {
            question.options.forEach((option, index) => {
                if (selected(option.control) !== plan.indexes.includes(index)) option.control.click();
            });
        } else {
            const target = question.options[plan.indexes[0]].control;
            if (!selected(target)) target.click();
        }
        const actual = question.options.flatMap((option, index) => selected(option.control) ? [index] : []);
        if (actual.length !== plan.indexes.length || actual.some(index => !plan.indexes.includes(index))) {
            throw new Error('页面未确认选中状态，请人工检查');
        }
    }

    function cookieValue(cookie, name) {
        const entry = cookie.split(';').map(item => item.trim()).find(item => item.startsWith(name + '='));
        if (!entry) return '';
        try { return decodeURIComponent(entry.slice(name.length + 1)); } catch { return ''; }
    }

    function platformHeaders(cookie) {
        const headers = { Accept: 'application/json' };
        let token = cookieValue(cookie, 'AUTHORIZATION') || cookieValue(cookie, 'token');
        if (/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) token = 'Bearer ' + token;
        const uaToken = cookieValue(cookie, 'UA_AUTHORIZATION') || cookieValue(cookie, 'ua-authorization');
        if (token) headers.Authorization = token;
        if (uaToken) headers['ua-authorization'] = uaToken;
        return headers;
    }

    function validAnswerUrl(value) {
        try {
            const url = new URL(value);
            return url.origin === 'https://api.ulearning.cn' && /^\/questionAnswer\/\d+$/.test(url.pathname) &&
                /^\d+$/.test(url.searchParams.get('parentId') || '') &&
                [...url.searchParams.keys()].length === 1;
        } catch { return false; }
    }

    function createPlatformTransport(env) {
        const invoke = typeof env.GM_xmlhttpRequest === 'function' ? options => env.GM_xmlhttpRequest(options) :
            typeof env.GM?.xmlHttpRequest === 'function' ? options => env.GM.xmlHttpRequest(options) : null;
        if (!invoke) return null;
        return (url, options) => new Promise((resolve, reject) => {
            if (!validAnswerUrl(url)) { reject(new Error('拒绝访问非优学院答案接口')); return; }
            let handle;
            let settled = false;
            const finish = (error, value) => {
                if (settled) return;
                settled = true;
                options.signal?.removeEventListener('abort', abort);
                if (error) reject(error); else resolve(value);
            };
            const abort = () => {
                try { handle?.abort?.(); } finally { finish(new Error('请求已停止')); }
            };
            const loaded = response => {
                if (settled) return;
                if (!response || typeof response.status !== 'number') { finish(new Error('平台响应无效')); return; }
                if (response.finalUrl && response.finalUrl !== url) {
                    finish(new Error('平台接口发生意外重定向')); return;
                }
                finish(null, { ok: response.status >= 200 && response.status < 300, status: response.status,
                    json: async () => JSON.parse(response.responseText) });
            };
            if (options.signal?.aborted) { abort(); return; }
            options.signal?.addEventListener('abort', abort, { once: true });
            try {
                handle = invoke({ method: 'GET', url, headers: options.headers, timeout: 12000,
                    responseType: 'text', anonymous: false, redirect: 'error',
                    onload: loaded, onerror: () => finish(new Error('平台网络请求失败')),
                    ontimeout: () => finish(new Error('平台请求超时')),
                    onabort: () => finish(new Error('请求已停止')) });
                // 异步 GM.* 管理器可能同时提供 Promise 和回调。
                if (typeof handle?.then === 'function') handle.then(loaded, () => finish(new Error('平台请求失败')));
            } catch { finish(new Error('无法启动平台请求，请确认已授予脚本请求权限')); }
        });
    }

    function createPlatformProvider(win, transport = null) {
        return async (question, signal) => {
            if (!isUlearningLesson(win.location)) throw new Error('平台查询仅适用于标准优学院课件练习页');
            if (!/^\d+$/.test(question.id) || !/^\d+$/.test(question.parentId)) throw new Error('缺少题目或练习页面标识');
            // 仅请求固定的优学院官方域名，不接入第三方题库，不记录登录凭据。
            const url = 'https://api.ulearning.cn/questionAnswer/' + question.id + '?parentId=' + question.parentId;
            const response = await (transport || ((...args) => win.fetch(...args)))(url, {
                method: 'GET', credentials: 'include', cache: 'no-store', redirect: 'error', signal,
                headers: platformHeaders(win.document.cookie)
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) throw new Error('平台拒绝访问，请检查登录状态或课程权限');
                if (response.status === 429) throw new Error('平台请求过于频繁，请稍后再试');
                throw new Error('平台接口返回 HTTP ' + response.status);
            }
            let payload;
            try { payload = await response.json(); } catch { throw new Error('平台接口未返回有效 JSON'); }
            return parsePlatformAnswer(payload);
        };
    }

    function createQuestionRunner({ doc, provider, report, results, controller = () => new AbortController() }) {
        let active = null;
        function cancel() { active?.abort(); }
        async function run() {
            if (active) return;
            const operation = controller();
            active = operation;
            const questions = collectQuestions(doc);
            const signature = questionSignature(questions);
            const rows = [];
            let filled = 0;
            try {
                if (!questions.length) { report('当前页面没有可识别的优学院课件练习题。'); return; }
                for (let index = 0; index < questions.length; index++) {
                    if (operation.signal.aborted) throw new Error('已停止填答');
                    const question = questions[index];
                    const row = { title: question.title, status: '', answer: '' };
                    rows.push(row);
                    report('正在处理第 ' + (index + 1) + ' / ' + questions.length + ' 题…');
                    try {
                        if (!question.title) throw new Error('未识别到题干');
                        if (question.type === 'unsupported') throw new Error('题型尚未适配');
                        let answers;
                        const timeout = setTimeout(() => operation.abort(), 12000);
                        try { answers = await provider(question, operation.signal); }
                        finally { clearTimeout(timeout); }
                        if (operation.signal.aborted) throw new Error('请求已停止或超时');
                        if (questionSignature(collectQuestions(doc)) !== signature) throw new Error('页面已切换，停止写入');
                        const plan = planAnswer(question, answers, doc, true);
                        applyAnswer(question, plan);
                        row.status = '已填入（平台答案）';
                        row.answer = plan.summary;
                        filled++;
                    } catch (error) {
                        row.status = error.message;
                        if (operation.signal.aborted || questionSignature(collectQuestions(doc)) !== signature) throw error;
                    }
                    results(rows);
                }
                report('完成：已填入 ' + filled + ' / ' + questions.length + ' 题。请核对后自行提交。');
            } catch (error) { report(operation.signal.aborted ? '已停止（或请求超时）。已填入内容请自行核对。' : error.message); }
            finally { results(rows); active = null; }
        }
        return { run, cancel, busy: () => active !== null };
    }

    function createStorage(env) {
        return {
            async get(key, fallback) {
                if (typeof env.GM_getValue === 'function') return await env.GM_getValue(key, fallback);
                if (typeof env.GM?.getValue === 'function') return await env.GM.getValue(key, fallback);
                return fallback;
            },
            async set(key, value) {
                if (typeof env.GM_setValue === 'function') return await env.GM_setValue(key, value);
                if (typeof env.GM?.setValue === 'function') return await env.GM.setValue(key, value);
                throw new Error('脚本管理器存储不可用，本次更改仅在当前页面生效');
            }
        };
    }

    function createMediaController(doc, getSettings, report) {
        const tracked = new Map();
        const blocked = new WeakSet();
        let stopped = false;

        function play(media) {
            const settings = getSettings();
            if (!settings.autoPlay || !media.paused || media.ended || blocked.has(media)) return;
            // play() 必须处理 Promise 拒绝，浏览器可能要求用户先点击播放。
            blocked.add(media);
            try {
                Promise.resolve(media.play()).catch(() => {
                    if (!stopped) report('自动播放被浏览器阻止，请先手动播放视频。');
                });
            } catch (error) {
                report('无法自动播放：' + error.message);
            }
        }

        function apply(media) {
            const settings = getSettings();
            try {
                if (media.playbackRate !== settings.rate) media.playbackRate = settings.rate;
                if (media.muted !== settings.muted) media.muted = settings.muted;
                play(media);
            } catch (error) {
                report('播放器未接受设置：' + error.message);
            }
        }

        function scan() {
            if (stopped) return;
            for (const [media, listener] of tracked) {
                if (!media.isConnected) {
                    media.removeEventListener('loadedmetadata', listener);
                    tracked.delete(media);
                }
            }
            for (const media of doc.querySelectorAll('video,audio')) {
                if (tracked.has(media)) continue;
                const listener = () => { blocked.delete(media); apply(media); };
                tracked.set(media, listener);
                media.addEventListener('loadedmetadata', listener);
                apply(media);
            }
        }

        return {
            scan,
            count: () => tracked.size,
            refresh() {
                const existing = [...tracked.keys()];
                scan();
                for (const media of existing) {
                    if (tracked.has(media)) { blocked.delete(media); apply(media); }
                }
            },
            stop() {
                stopped = true;
                for (const [media, listener] of tracked) media.removeEventListener('loadedmetadata', listener);
                tracked.clear();
            }
        };
    }

    // 官方 Page.js 定义 5=图文、6=视频、7=练习；目录用 e852 表示未完成的视频。
    // 已完成项只有勾号时，尝试只读页面公开模型；无法确定类型则停留，不按标题猜测。
    function readLessonNavigation(doc, location, model, videoOnly = false) {
        if (!isUlearningLesson(location)) return null;
        const items = [...doc.querySelectorAll('.page-item')];
        const active = items.filter(item => item.querySelector('.page-name.active'));
        if (active.length !== 1 || !/^page\d+$/.test(active[0].id)) return null;
        const current = active[0];
        const next = items[items.indexOf(current) + 1];
        const key = location.href + '|' + current.id;
        const result = { key, current, nextId: next?.id || '', button: null, reason: '' };
        if (videoOnly) return readVideoOnlyNavigation(doc, model, items, result);
        if (!next) return { ...result, reason: '已到目录末尾，请自行确认章节统计。' };
        if (!/^page\d+$/.test(next.id) || next.classList.contains('is-hide') ||
            next.closest('.section-item')?.classList.contains('is-hide') ||
            next.closest('.chapter-item')?.classList.contains('is-hide')) {
            return { ...result, reason: '下一项不可用或目录结构无法确认，已停留。' };
        }
        let type;
        try {
            const modelCurrent = model?.currentPage?.();
            const modelNext = model?.nextPageFamily?.()?.page;
            if (modelCurrent && modelNext) {
                if ('page' + modelCurrent.id() !== current.id || 'page' + modelNext.id() !== next.id) {
                    return { ...result, pending: true, reason: '页面模型与目录尚未同步，等待更新。' };
                }
                type = modelNext.contentType();
            }
        } catch (_) { /* 管理器可能不暴露页面变量，继续使用可确认的目录图标。 */ }
        const icons = [...next.querySelectorAll('.page-icon .iconfont')];
        const videoIcon = icons.length === 1 && !icons[0].classList.contains('finish') && icons[0].textContent.trim() === '\ue852';
        if (type !== 6 && !(type === undefined && videoIcon)) {
            return { ...result, pending: type === undefined && icons.some(icon => icon.classList.contains('finish')),
                reason: '下一项不是可确认的视频（可能是练习或已完成项），已停留。' };
        }
        const title = normalizeQuestion(next.querySelector('.page-name span[data-bind*="page.name"]')?.textContent);
        const buttons = [...doc.querySelectorAll('.next-page-btn')].filter(isVisible);
        const button = buttons.length === 1 ? buttons[0] : null;
        if (!title || !button || button.disabled || button.getAttribute('aria-disabled') === 'true' ||
            button.classList.contains('disabled') ||
            normalizeQuestion(button.querySelector('.page-title .text')?.textContent) !== title) {
            return { ...result, pending: true, reason: '下一页按钮与目录不一致或不可用，等待更新。' };
        }
        return { ...result, button, title };
    }

    // 只读完整目录，最终仍点击平台目录项，由平台处理学习记录和访问限制。
    function readVideoOnlyNavigation(doc, model, items, result) {
        const wait = reason => ({ ...result, pending: true, reason });
        try {
            const chapters = model?.course?.chapters?.();
            if (!Array.isArray(chapters) || 'page' + model?.currentPage?.()?.id?.() !== result.current.id) {
                return wait('只连播视频：等待完整课程目录与当前页面同步。');
            }
            const entries = [];
            const ids = new Set();
            for (const chapter of chapters) {
                const sections = chapter.sections();
                if (!Array.isArray(sections)) return wait('只连播视频：章节目录尚未加载完整。');
                let chapterPages = 0;
                for (const section of sections) {
                    const pages = section.pages();
                    if (!Array.isArray(pages)) return wait('只连播视频：视频目录尚未加载完整。');
                    for (const page of pages) {
                        chapterPages++;
                        const id = 'page' + page.id();
                        if (!/^page\d+$/.test(id) || ids.has(id)) return { ...result, reason: '课程目录标识异常，已停止连播。' };
                        ids.add(id); entries.push({ page, section, chapter, id });
                    }
                }
                if (!chapterPages && chapter.isPageLoaded?.() === false) entries.push({ unloadedChapter: chapter });
            }
            const position = entries.findIndex(entry => entry.id === result.current.id);
            if (position < 0) return wait('只连播视频：当前视频不在完整目录中，等待更新。');
            let skipped = 0;
            for (const entry of entries.slice(position + 1)) {
                if (entry.unloadedChapter) return { ...wait('只连播视频：正在加载下一章节目录。'),
                    prepareButton: doc.getElementById('chapter' + entry.unloadedChapter.id())?.querySelector('.chapter-name') };
                const { page, section, chapter, id } = entry;
                if (page.isHide?.() || section.isHide?.() || chapter.isHide?.()) continue;
                const chapterNode = doc.getElementById('chapter' + chapter.id());
                const sectionNode = doc.getElementById('section' + section.id());
                const item = items.find(node => node.id === id);
                const type = page.contentType();
                if (type === 5 || type === 7) { skipped++; continue; }
                if (type !== 6) {
                    return { ...wait('只连播视频：后续任务类型尚未确认，等待章节加载。'),
                        prepareButton: chapter.isPageLoaded?.() === false ? chapterNode?.querySelector('.chapter-name') : null };
                }
                if (!item || !chapterNode || !sectionNode) return wait('只连播视频：等待目标视频目录加载。');
                if (item.closest('.chapter-item') !== chapterNode || item.closest('.section-item') !== sectionNode ||
                    item.classList.contains('is-hide') || sectionNode.classList.contains('is-hide') ||
                    item.classList.contains('disabled') || item.classList.contains('locked') ||
                    item.getAttribute('aria-disabled') === 'true' || section.canstudy) {
                    return { ...result, reason: '后续视频目录不可用或受平台学习顺序限制，已停留。' };
                }
                const target = item.querySelector('.page-name');
                const title = normalizeQuestion(item.querySelector('.page-name span[data-bind*="page.name"]')?.textContent);
                if (!target || !title || title !== normalizeQuestion(page.name())) return wait('只连播视频：目标标题与课程目录尚未同步。');
                if (!isVisible(target)) {
                    let prepareButton;
                    if (model.isMenuPack?.()) prepareButton = doc.querySelector('.hide-catalog-btn');
                    else if (!isVisible(sectionNode)) prepareButton = chapterNode.querySelector('.chapter-name');
                    else prepareButton = sectionNode.querySelector('.section-name');
                    return { ...wait('只连播视频：正在展开后续视频所在章节。'), prepareButton };
                }
                if (target.getAttribute('aria-disabled') === 'true' || target.classList.contains('disabled')) {
                    return { ...result, reason: '后续视频被平台禁用，已停留。' };
                }
                return { ...result, button: target, title, nextId: id, skipped,
                    destination: normalizeQuestion(chapter.name()) + ' · ' + title };
            }
            return { ...result, reason: '后续已没有视频，视频连播结束。练习保留，稍后可从目录统一答题。' };
        } catch (_) { return wait('只连播视频：课程目录暂时不可读，等待更新。'); }
    }

    function createAutoNextController(win, doc, getSettings, report, clock = win, getModel = () => win.koLearnCourseViewModel, onUpdate = () => {}) {
        const tracked = new Map();
        const attempted = new Set();
        let stopped = false;
        let timer = null;
        let watchTimer = null;
        let operation = null;
        let preparing = null;
        let lastMode = getSettings().videoOnly === true;
        const now = () => clock.now ? clock.now() : Date.now();
        const navigation = () => {
            let model;
            try { model = getModel(); } catch (_) { /* 页面模型暂时不可读时按目录处理。 */ }
            return readLessonNavigation(doc, win.location, model, getSettings().videoOnly === true);
        };
        const enabled = () => !stopped && win.top === win && isUlearningLesson(win.location) && getSettings().autoNext;
        const source = video => video.currentSrc || video.src || '';
        const videos = () => [...doc.querySelectorAll('#MathDiv video')].filter(isVisible);
        const hardBlocked = () => [...doc.querySelectorAll(
            '.question-element-node,.question-setting-panel,.load-failed-page,.modal.in,.modal.show,[role="dialog"]'
        )].some(isVisible);
        const blocked = () => hardBlocked() || [...doc.querySelectorAll('.page-loader')].some(isVisible);
        const ended = video => video.ended && !video.seeking && !video.error &&
            Number.isFinite(video.duration) && video.duration > 0 &&
            Math.abs(video.currentTime - video.duration) < 0.5 && video.played.length > 0;
        // MediaElement 默认在 ended 的冒泡监听器中回到 0 秒；保留先前捕获的真实结束证据。
        const rewoundAfterEnd = (video, state) => state.endProof && now() - state.endProof.at <= 15000 &&
            state.endProof.duration === video.duration && !video.error && !video.seeking && video.paused &&
            video.currentTime < 0.5 && video.played.length > 0;

        function cancel() {
            if (timer !== null) clock.clearTimeout(timer);
            timer = null;
            operation = null;
        }
        function finish(text) { cancel(); report(text); }
        function halt(text, key) {
            attempted.add(key);
            preparing = null;
            finish(text);
            updateWatch();
        }
        function schedule(callback, delay) {
            timer = clock.setTimeout(() => { timer = null; callback(); }, delay);
        }
        function allFinished(key) {
            const active = videos();
            return active.length > 0 && active.every(video => {
                const state = tracked.get(video);
                return state?.key === key && state.source === source(video) && state.finished &&
                    (ended(video) || rewoundAfterEnd(video, state));
            });
        }
        function confirmNavigation() {
            if (!enabled()) { cancel(); return; }
            if (operation.videoOnly !== (getSettings().videoOnly === true)) { cancel(); return; }
            const current = navigation();
            if (hardBlocked()) {
                halt('翻页遇到练习、提示或加载错误，自动切换已停止。', current?.key || operation.before.key); return;
            }
            if (current && current.key !== operation.before.key) {
                if (current.current.id !== operation.before.nextId) {
                    halt('页面已由其他操作切换，自动切换已停止。', current.key); return;
                }
                const loaded = videos();
                if (!blocked() && loaded.length > 0 && loaded.every(video => source(video) && video.readyState >= 1 && !video.error &&
                    !operation.media.some(([old, src]) => old === video && src === source(video)))) {
                    if (!operation.stableAt) operation.stableAt = now();
                    if (now() - operation.stableAt >= 500) {
                        finish('已进入下一视频：' + operation.before.title + '。播放由“自动播放”设置控制。');
                        scan(); return;
                    }
                } else operation.stableAt = 0;
            } else operation.stableAt = 0;
            if (now() - operation.startedAt >= 12000) {
                halt('翻页未在 12 秒内完成，已停止；请检查页面后手动继续，或关闭再开启自动切换。', current?.key || operation.before.key); return;
            }
            schedule(confirmNavigation, 250);
        }
        function navigate() {
            if (!enabled()) { cancel(); return; }
            if (operation.videoOnly !== (getSettings().videoOnly === true)) { cancel(); return; }
            const before = operation.before;
            const current = navigation();
            if (!current || current.key !== before.key || current.current !== before.current ||
                current.nextId !== before.nextId || current.button !== before.button || current.title !== before.title ||
                blocked() || !allFinished(before.key) || videos().length !== operation.media.length ||
                operation.media.some(([video, src]) => !isVisible(video) || source(video) !== src)) {
                halt('页面或视频状态已改变，已取消自动切换。', before.key); return;
            }
            operation.startedAt = now();
            attempted.add(before.key);
            try { before.button.click(); }
            catch (error) { halt('无法切换视频：' + error.message, before.key); return; }
            schedule(confirmNavigation, 250);
        }
        function recordEnd(video) {
            const state = tracked.get(video);
            const page = navigation();
            if (!page || !state || state.key !== page.key || state.source !== source(video) ||
                !state.progress || !isVisible(video) || !ended(video)) return;
            state.finished = true;
            state.endProof = { at: now(), duration: video.duration };
        }
        function evaluate() {
            if (!enabled() || operation) return;
            const page = navigation();
            if (!page) return;
            if (!allFinished(page.key) || attempted.has(page.key)) return;
            if (blocked()) { halt('视频已结束，但页面有练习、加载提示或弹窗，请处理后重新开启自动切换。', page.key); return; }
            if (!page.button) {
                if (!page.pending) { halt(page.reason, page.key); return; }
                if (preparing?.key !== page.key) {
                    preparing = { key: page.key, startedAt: now(), expanded: new Set() };
                    report('视频已结束，正在等待目录与下一页按钮就绪…');
                }
                if (page.prepareButton && !preparing.expanded.has(page.prepareButton)) {
                    preparing.expanded.add(page.prepareButton);
                    try { page.prepareButton.click(); }
                    catch (_) { halt('无法展开后续视频目录，已停留；请手动展开后重新开启连播。', page.key); return; }
                }
                if (now() - preparing.startedAt >= 12000) halt('等待目录超过 12 秒，已停止；请关闭再开启自动切换以重试。', page.key);
                return;
            }
            preparing = null;
            operation = { before: page, media: videos().map(video => [video, source(video)]), startedAt: 0, stableAt: 0,
                videoOnly: getSettings().videoOnly === true };
            report(page.skipped ? '视频已结束，将跳过 ' + page.skipped + ' 项非视频任务，继续：' + page.destination : '当前页视频已结束，正在核对下一视频…');
            schedule(navigate, 500);
        }
        function onEnded(video, event) {
            if (!enabled() || event.isTrusted !== true) return;
            // 换页确认期间新短视频也可能结束：先记录，确认完成后再处理。
            recordEnd(video);
            evaluate();
        }
        function updateWatch() {
            const page = navigation();
            const wanted = enabled() && (operation || videos().length > 0 && (!page || !attempted.has(page.key)));
            if (!wanted && watchTimer !== null) { clock.clearTimeout(watchTimer); watchTimer = null; }
            if (wanted && watchTimer === null) {
                watchTimer = clock.setTimeout(() => {
                    watchTimer = null;
                    scan();
                    if (!enabled()) return;
                    for (const video of tracked.keys()) recordEnd(video);
                    evaluate();
                    updateWatch();
                    onUpdate();
                }, 500);
            }
        }
        function detach(video, state) {
            for (const [name, listener] of Object.entries(state.listeners)) video.removeEventListener(name, listener, name === 'ended');
            tracked.delete(video);
        }
        function scan() {
            const mode = getSettings().videoOnly === true;
            if (mode !== lastMode) {
                lastMode = mode; cancel(); preparing = null; attempted.clear();
                for (const [video, state] of tracked) detach(video, state);
            }
            if (!enabled()) {
                cancel();
                preparing = null;
                attempted.clear();
                if (watchTimer !== null) clock.clearTimeout(watchTimer);
                watchTimer = null;
                for (const [video, state] of tracked) detach(video, state);
                return;
            }
            const active = videos();
            for (const [video, state] of tracked) if (!active.includes(video)) detach(video, state);
            const page = navigation();
            if (!page) { updateWatch(); return; }
            if (preparing && preparing.key !== page.key) preparing = null;
            for (const video of active) {
                if (tracked.has(video)) continue;
                const state = { key: page.key, source: source(video), lastTime: video.currentTime,
                    progress: false, finished: false, endProof: null, listeners: {} };
                const reset = () => {
                    const current = navigation();
                    if (!current) return;
                    state.key = current.key; state.source = source(video);
                    state.lastTime = video.currentTime; state.progress = false; state.finished = false; state.endProof = null;
                };
                state.listeners = {
                    loadedmetadata: reset,
                    playing() {
                        if (!video.paused && !video.seeking && !video.ended &&
                            (state.finished || state.source !== source(video) || navigation()?.key !== state.key)) reset();
                    },
                    seeking() {
                        const rewind = state.finished && state.endProof && now() - state.endProof.at <= 1000 &&
                            navigation()?.key === state.key && source(video) === state.source && video.currentTime < 0.5;
                        state.lastTime = video.currentTime;
                        if (rewind) return;
                        state.progress = false; state.finished = false; state.endProof = null;
                    },
                    timeupdate(event) {
                        if (event?.isTrusted === false) return;
                        // 部分播放器复用节点、直接换源，未再次发送 loadedmetadata。
                        if (!video.paused && !video.seeking && !video.ended && state.source !== source(video)) reset();
                        if (navigation()?.key !== state.key || state.source !== source(video)) return;
                        if (!video.paused && !video.seeking && !video.error && !video.ended && video.currentTime > state.lastTime) state.progress = true;
                        state.lastTime = video.currentTime;
                    },
                    ended: event => onEnded(video, event)
                };
                tracked.set(video, state);
                for (const [name, listener] of Object.entries(state.listeners)) video.addEventListener(name, listener, name === 'ended');
            }
            updateWatch();
        }
        return { scan, refresh: scan, busy: () => operation !== null || preparing !== null,
            describe() {
                const page = navigation();
                const next = page?.button ? (getSettings().videoOnly ? '视频连播：' + page.destination : '下一项：' + page.title + '（视频）') : page?.reason || '等待课程目录加载。';
                if (!enabled()) return '自动切换已关闭；' + next;
                const phase = operation ? '正在准备或确认切换' : preparing ? '等待目录就绪' :
                    page && attempted.has(page.key) ? '本页已停止，关闭再开启可重试' :
                    [...tracked.values()].some(state => state.key === page?.key && state.progress) ? '正在等待视频自然结束' : '等待视频产生播放进展';
                return phase + '；' + next;
            },
            stop() { stopped = true; scan(); } };
    }

    function createPanelDragController(win, host, handles, storage, report, key = POSITION_KEY) {
        let position = null, gesture = null, suppressClick = null;
        let stopped = false, interacted = false, writes = Promise.resolve();
        const removers = [];
        const listen = (target, name, fn, options) => {
            target.addEventListener(name, fn, options);
            removers.push(() => target.removeEventListener(name, fn, options));
        };
        const valid = value => value && typeof value.left === 'number' && Number.isFinite(value.left) &&
            typeof value.top === 'number' && Number.isFinite(value.top);
        function reflow() {
            if (stopped || !position || !host.getClientRects().length) return;
            const rect = host.getBoundingClientRect(), margin = 8;
            position = {
                left: Math.round(Math.max(margin, Math.min(position.left, Math.max(margin, win.innerWidth - rect.width - margin)))),
                top: Math.round(Math.max(margin, Math.min(position.top, Math.max(margin, win.innerHeight - rect.height - margin))))
            };
            host.style.left = position.left + 'px'; host.style.top = position.top + 'px';
            host.style.right = 'auto';
        }
        function save() {
            const snapshot = position ? { ...position } : null;
            writes = writes.then(() => storage.set(key, snapshot)).catch(error => {
                if (!stopped) report('面板位置保存失败：' + error.message);
            });
        }
        function finish(cancelled = false) {
            const active = gesture;
            if (!active) return;
            gesture = null;
            host.removeAttribute('data-dragging');
            if (active.moved) {
                if (cancelled) {
                    position = active.previous;
                    if (!position) { host.style.left = 'auto'; host.style.right = '12px'; host.style.top = '72px'; }
                    reflow();
                }
                else { reflow(); save(); }
                suppressClick = { handle: active.handle, until: Date.now() + 500 };
            }
            try { active.handle.releasePointerCapture(active.pointerId); } catch (_) { /* 失焦时可能已经释放。 */ }
        }
        function reset() {
            interacted = true; finish(true); position = null;
            host.style.left = 'auto'; host.style.right = '12px'; host.style.top = '72px';
            save();
        }
        for (const handle of handles) {
            listen(handle, 'pointerdown', event => {
                suppressClick = null;
                if (stopped || gesture || event.button !== 0 || event.isPrimary === false) return;
                const control = event.target.closest?.('button,a,input,select,textarea,[contenteditable="true"]');
                if (control && control !== handle) return;
                interacted = true;
                const rect = host.getBoundingClientRect();
                gesture = { handle, pointerId: event.pointerId, x: event.clientX, y: event.clientY,
                    left: rect.left, top: rect.top, previous: position ? { ...position } : null, moved: false };
                try { handle.setPointerCapture(event.pointerId); } catch (_) { /* 仍由窗口监听当前手势。 */ }
            });
            listen(handle, 'lostpointercapture', event => { if (gesture?.pointerId === event.pointerId) finish(true); });
            listen(handle, 'click', event => {
                if (suppressClick?.handle === handle && Date.now() <= suppressClick.until && event.detail !== 0) {
                    suppressClick = null; event.preventDefault(); event.stopImmediatePropagation();
                }
            }, true);
            listen(handle, 'keydown', event => {
                if (event.target !== handle || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
                event.preventDefault(); interacted = true;
                const rect = host.getBoundingClientRect(), step = event.shiftKey ? 40 : 10;
                position = { left: rect.left + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0),
                    top: rect.top + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0) };
                reflow(); save();
            });
        }
        listen(win, 'pointermove', event => {
            if (!gesture || event.pointerId !== gesture.pointerId) return;
            const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
            if (!gesture.moved && Math.hypot(dx, dy) < 5) return;
            gesture.moved = true; event.preventDefault();
            host.setAttribute('data-dragging', 'true');
            position = { left: gesture.left + dx, top: gesture.top + dy }; reflow();
        }, { passive: false });
        listen(win, 'pointerup', event => { if (gesture?.pointerId === event.pointerId) finish(); });
        listen(win, 'pointercancel', event => { if (gesture?.pointerId === event.pointerId) finish(true); });
        listen(win, 'blur', () => finish(true));
        listen(win, 'resize', reflow);
        const observer = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(reflow) : null;
        observer?.observe(host);
        const ready = (async () => {
            try {
                const saved = await storage.get(key, null);
                if (!stopped && !interacted && valid(saved)) { position = { left: saved.left, top: saved.top }; reflow(); }
                return '';
            } catch (error) { return '面板位置读取失败：' + error.message; }
        })();
        return { ready, reflow, reset, stop() {
            finish(true); stopped = true; observer?.disconnect();
            for (const remove of removers) remove();
        } };
    }

    function start(win, doc, storage) {
        if (doc.getElementById(PANEL_ID)) return null;
        const host = doc.createElement('div');
        host.id = PANEL_ID;
        host.style.cssText = 'all:initial;position:fixed;top:72px;right:12px;z-index:2147483647;display:block;';
        // 页面 CSS 不会覆盖面板内的控件；面板关闭后可由右侧按钮重新展开。
        const root = host.attachShadow({ mode: 'open' });
        root.innerHTML = `
          <style>
            :host{color-scheme:light dark;font:14px/1.5 system-ui,-apple-system,"PingFang SC",sans-serif;color:light-dark(#23303e,#e7edf3)}
            *{box-sizing:border-box}[hidden]{display:none!important}
            #panel{--bg:light-dark(#fff,#1b2128);--fg:light-dark(#23303e,#e7edf3);--muted:light-dark(#647482,#adbac7);--line:light-dark(#e7edf0,#343f49);--soft:light-dark(#f5f8fa,#252e37);--accent:light-dark(#236b91,#99cee9);--on-accent:light-dark(#fff,#102d3d);--tint:light-dark(#eaf4f9,#263c48);width:328px;max-width:calc(100vw - 24px);max-height:calc(100vh - 96px);overflow:auto;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:18px;box-shadow:0 10px 32px light-dark(#142d3e20,#0005)}
            button,input{font:inherit}button{cursor:pointer;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:9px;padding:8px 11px;transition:background .15s}button:hover{background:var(--soft)}button:disabled{opacity:.45;cursor:default}button:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
            #toggle{display:block;margin-left:auto;background:light-dark(#236b91,#99cee9);color:light-dark(#fff,#102d3d);border:0;border-radius:24px;padding:10px 16px;box-shadow:0 4px 16px light-dark(#142d3e20,#0005)}
            #drag-handle{cursor:grab;touch-action:none;user-select:none}:host([data-dragging]) #drag-handle,:host([data-dragging]) #toggle{cursor:grabbing}#toggle{cursor:grab;touch-action:none;user-select:none}#reset-position{padding:4px;border:0;font-size:11px;color:var(--muted)}header{display:flex;align-items:center;gap:10px;padding:18px 18px 14px}.brand{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:var(--tint);color:var(--accent);font-weight:600}.identity{flex:1;min-width:0}h2{margin:0;font-size:16px;font-weight:600}.version{font-size:10px;font-weight:400;color:var(--muted);margin-left:5px}#platform{font-size:12px;margin:2px 0 0;color:var(--muted)}#collapse{border:0;padding:2px;width:30px;height:30px;font-size:20px;line-height:1;color:var(--muted)}
            nav{display:flex;gap:22px;margin:0 18px 16px;border-bottom:1px solid var(--line)}nav button{border:0;border-radius:0;padding:10px 0 11px;background:transparent;color:var(--muted);position:relative}nav button[aria-selected=true]{color:var(--accent);font-weight:600}nav button[aria-selected=true]:after{content:"";position:absolute;bottom:-1px;left:0;right:0;height:2px;background:var(--accent)}
            .page{padding:0 18px 16px}h3{margin:0;font-size:13px;font-weight:600}.section-heading{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px}#media-count{margin:0;font-size:11px;color:var(--muted)}.speed{padding:12px;background:var(--soft);border-radius:11px;margin-bottom:9px}.speed label{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}#rate{width:64px;min-width:0;border:1px solid var(--line);border-radius:6px;padding:4px 5px;background:var(--bg);color:var(--fg);font-variant-numeric:tabular-nums}.presets{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.presets button{padding:5px 0;font-size:12px;border:0;border-radius:6px}.presets button[aria-pressed=true]{background:var(--accent);color:var(--on-accent)}
            .switch-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;cursor:pointer}.copy{display:flex;flex-direction:column;gap:3px;min-width:0}small{font-size:11px;color:var(--muted)}input[type=checkbox]{appearance:none;width:33px;height:20px;border-radius:12px;background:light-dark(#cbd5dc,#53616e);position:relative;border:0;margin:0;flex-shrink:0;cursor:pointer}input[type=checkbox]:after{content:"";position:absolute;left:3px;top:3px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform .15s}input[type=checkbox]:checked{background:var(--accent)}input[type=checkbox]:checked:after{transform:translateX(13px)}input:disabled{opacity:.45;cursor:default}#auto-next-label{border-top:1px solid var(--line);margin-top:6px;padding-top:13px}#auto-next-state{display:block;font-size:11px;color:var(--muted);overflow-wrap:anywhere;margin:3px 0 0}
            .actions{display:flex;gap:7px;margin-top:14px;flex-wrap:wrap}.primary{background:var(--accent);color:var(--on-accent);border-color:transparent;font-weight:500}.primary:hover{background:var(--accent);filter:brightness(.96)}#apply{flex:1}#reset{color:var(--muted);font-size:12px}#message{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--soft);border-radius:10px;padding:11px;font-size:12px;color:var(--fg);margin:0 18px 16px}
            #qa-count{font-size:16px;font-weight:500;margin:10px 0 8px}#qa-note{font-size:12px;color:var(--muted);margin:0 0 18px}#qa-run{width:100%}.qa-actions{display:flex;justify-content:space-between;margin-top:7px}.qa-actions button{padding:6px 0;border:0;background:transparent;color:var(--muted);font-size:12px}#qa-results{list-style:none;padding:0;margin:12px 0 0}#qa-results li{padding:10px 0;border-top:1px solid var(--line);white-space:pre-wrap;font-size:12px;overflow-wrap:anywhere}.qa-footer{margin:12px 0 0;color:var(--muted);font-size:11px}footer{border-top:1px solid var(--line);padding:10px 18px;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px}.dot{width:6px;height:6px;flex-shrink:0;background:light-dark(#30816b,#79cbb3);border-radius:50%}
            @media(pointer:coarse){button{min-height:40px}.switch-row{min-height:48px}#rate{font-size:16px}}
          </style>
          <button id="toggle" type="button" aria-expanded="true" aria-controls="panel" title="点击展开，按住可拖动" hidden>网课助手</button>
          <section id="panel" aria-label="网课助手">
            <header id="drag-handle" tabindex="0" aria-label="拖动网课助手；也可用方向键移动，按住 Shift 加速" title="按住标题栏拖动"><span class="brand" aria-hidden="true">课</span><div class="identity"><h2>网课助手<span class="version">5.6.1</span></h2><p id="platform"></p></div><button id="reset-position" type="button" title="恢复面板默认位置" aria-label="恢复面板默认位置">复位</button><button id="collapse" type="button" aria-label="收起网课助手">−</button></header>
            <nav role="tablist" aria-label="功能"><button id="media-tab" type="button" role="tab" aria-selected="true" aria-controls="media-page">视频播放</button><button id="qa-tab" type="button" role="tab" aria-selected="false" aria-controls="qa-page">自动答题</button></nav>
            <section id="media-page" class="page" role="tabpanel" aria-labelledby="media-tab">
              <div class="section-heading"><h3>播放设置</h3><p id="media-count"></p></div>
              <div class="speed"><label for="rate">播放倍速 <input id="rate" type="number" min="0.25" max="16" step="0.25" value="1"></label><div class="presets" aria-label="倍速预设"><button type="button" data-rate="1" aria-pressed="true">1×</button><button type="button" data-rate="1.5" aria-pressed="false">1.5×</button><button type="button" data-rate="2" aria-pressed="false">2×</button><button type="button" data-rate="16" aria-pressed="false">16×</button></div></div>
              <label class="switch-row"><span class="copy">静音播放</span><input id="muted" type="checkbox"></label>
              <label class="switch-row"><span class="copy">自动播放<small>新视频出现后开始播放</small></span><input id="auto-play" type="checkbox"></label>
              <label id="auto-next-label" class="switch-row" hidden><span class="copy">结束后自动下一视频<small>开关立即保存，按下方连播模式执行</small></span><input id="auto-next" type="checkbox"></label><small id="auto-next-state" hidden></small>
              <label id="video-only-label" class="switch-row" hidden><span class="copy">只连播视频，暂不答题<small>跳过练习；开启时同时启用自动播放和自动下一视频</small></span><input id="video-only" type="checkbox"></label>
              <div class="actions"><button id="apply" class="primary" type="button">应用播放设置</button><button id="reset" type="button">恢复默认</button></div>
            </section>
            <section id="qa-page" class="page" role="tabpanel" aria-labelledby="qa-tab" hidden>
              <h3>优学院自动答题</h3><p id="qa-count"></p><p id="qa-note">使用优学院平台答案，依次查询并填入当前练习。</p>
              <button id="qa-run" class="primary" type="button">查询答案并自动填入</button><div class="qa-actions"><button id="qa-scan" type="button">重新识别题目</button><button id="qa-stop" type="button" disabled>停止</button></div>
              <ol id="qa-results" aria-label="逐题填入结果"></ol><p class="qa-footer">填入后请核对，提交由你操作。</p>
            </section>
            <p id="message" role="status" aria-live="polite">面板已启动，正在读取设置…</p><footer><span class="dot" aria-hidden="true"></span>控制当前课件 · 支持收起</footer>
          </section>
`;
        (doc.body || doc.documentElement).appendChild(host);
        const ui = id => root.getElementById(id);
        const message = text => { ui('message').textContent = text; };
        const positionKey = POSITION_KEY + (win.top === win ? ':top' : ':frame:' + win.location.hostname);
        const panelDrag = createPanelDragController(win, host, [ui('drag-handle'), ui('toggle')], storage, message, positionKey);
        ui('reset-position').addEventListener('click', panelDrag.reset);
        let settings = { ...DEFAULTS };
        let stopped = false;
        let pending = false;
        let settingsQueue = Promise.resolve();
        const framed = win.top !== win;
        const media = createMediaController(doc, () => settings, message);
        const lesson = isUlearningLesson(win.location);
        // 仅只读同页公开的导航模型；不从页面全局读取认证信息，不调用其导航函数。
        const autoNext = createAutoNextController(win, doc, () => settings, message, win,
            () => (typeof unsafeWindow !== 'undefined' ? unsafeWindow : win).koLearnCourseViewModel, () => updateCounts());
        ui('auto-next-label').hidden = ui('auto-next-state').hidden = ui('video-only-label').hidden = !lesson || framed;
        ui('qa-tab').hidden = !lesson;
        const transport = createPlatformTransport({
            GM_xmlhttpRequest: typeof GM_xmlhttpRequest === 'function' ? GM_xmlhttpRequest : undefined,
            GM: typeof GM !== 'undefined' ? GM : undefined
        });
        const questionRunner = createQuestionRunner({ doc,
            provider: createPlatformProvider(win, transport), report: message,
            results(rows) {
                ui('qa-results').replaceChildren(...rows.map(row => {
                    const item = doc.createElement('li');
                    item.textContent = row.title.slice(0, 55) + '\n' + row.status + (row.answer ? '：' + row.answer : '');
                    return item;
                }));
            }
        });
        const updateCounts = () => {
            ui('platform').textContent = detectPlatform(win.location.hostname) + (framed ? ' · 嵌入页面' : '');
            ui('media-count').textContent = '检测到 ' + media.count() + ' 个视频 / 音频';
            const questions = lesson ? collectQuestions(doc) : [];
            ui('qa-run').disabled = !lesson || questions.length === 0 || questionRunner.busy();
            ui('qa-count').textContent = questions.length ? '已识别 ' + questions.length + ' 道题' : '当前页没有可识别的练习题';
            if (lesson && !framed) ui('auto-next-state').textContent = autoNext.describe();
            if (framed) host.style.display = media.count() || questions.length ? 'block' : 'none';
        };
        const updateInputs = () => {
            ui('rate').value = String(settings.rate);
            ui('muted').checked = settings.muted;
            ui('auto-play').checked = settings.autoPlay;
            ui('auto-next').checked = settings.autoNext;
            ui('video-only').checked = settings.videoOnly;
            updatePresets();
        };
        function updatePresets() {
            const value = Number(ui('rate').value);
            for (const button of root.querySelectorAll('[data-rate]')) {
                button.setAttribute('aria-pressed', String(Number(button.dataset.rate) === value));
            }
        }
        const selectPage = page => {
            if (page === 'qa' && !lesson) return;
            for (const name of ['media', 'qa']) {
                ui(name + '-page').hidden = name !== page;
                ui(name + '-tab').setAttribute('aria-selected', String(name === page));
            }
            panelDrag.reflow();
        };
        for (const name of ['media', 'qa']) {
            ui(name + '-tab').addEventListener('click', () => selectPage(name));
            ui(name + '-tab').addEventListener('keydown', event => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || !lesson) return;
                event.preventDefault();
                const target = event.key === 'Home' ? 'media' : event.key === 'End' ? 'qa' : name === 'media' ? 'qa' : 'media';
                selectPage(target); ui(target + '-tab').focus();
            });
        }
        for (const button of root.querySelectorAll('[data-rate]')) button.addEventListener('click', () => {
            ui('rate').value = button.dataset.rate;
            updatePresets();
            message('已选择 ' + button.dataset.rate + ' 倍速，点击“应用播放设置”后生效。');
        });
        ui('rate').addEventListener('input', updatePresets);
        const toggle = () => {
            const closed = !ui('panel').hidden;
            ui('panel').hidden = closed;
            ui('toggle').hidden = !closed;
            ui('toggle').setAttribute('aria-expanded', String(!closed));
            panelDrag.reflow();
        };
        ui('toggle').addEventListener('click', toggle);
        ui('collapse').addEventListener('click', toggle);
        if (framed) toggle();
        ui('qa-scan').addEventListener('click', () => {
            const questions = collectQuestions(doc);
            updateCounts();
            message('已识别 ' + questions.length + ' 道练习题，支持 ' + questions.filter(question => question.type !== 'unsupported').length + ' 道。');
        });
        ui('qa-run').addEventListener('click', async () => {
            if (!lesson || questionRunner.busy()) return;
            ui('qa-run').disabled = true;
            ui('qa-stop').disabled = false;
            try { await questionRunner.run(); }
            finally { ui('qa-stop').disabled = true; updateCounts(); }
        });
        ui('qa-stop').addEventListener('click', () => { questionRunner.cancel(); });

        function persistSettings() {
            // 串行写入，避免快速连续点击时较早的异步写入覆盖较新的设置。
            const snapshot = { ...settings };
            settingsQueue = settingsQueue.then(() => storage.set(SETTINGS_KEY, snapshot))
                .catch(error => message(error.message));
            return settingsQueue;
        }
        function applySettings(next) {
            settings = next;
            updateInputs();
            message('已应用播放设置。若播放器限制倍速，请在播放器内确认实际速度。');
            media.refresh();
            autoNext.refresh();
            updateCounts();
            return persistSettings();
        }
        ui('apply').addEventListener('click', () => {
            const rate = Number(ui('rate').value);
            if (!Number.isFinite(rate) || rate < 0.25 || rate > 16) {
                message('倍速必须是 0.25 到 16 之间的数字。');
                return;
            }
            void applySettings({ rate, muted: ui('muted').checked, autoPlay: ui('auto-play').checked, autoNext: settings.autoNext, videoOnly: settings.videoOnly });
        });
        ui('auto-next').addEventListener('change', () => {
            settings = { ...settings, autoNext: ui('auto-next').checked };
            autoNext.refresh();
            message(settings.autoNext ? '已启用自动切视频；从当前视频的正常播放开始跟踪。' : '已关闭自动切视频，待执行的切换已取消。');
            void persistSettings();
        });
        ui('video-only').addEventListener('change', () => {
            const selected = ui('video-only').checked;
            settings = { ...settings, videoOnly: selected,
                autoNext: selected ? true : settings.autoNext, autoPlay: selected ? true : settings.autoPlay };
            updateInputs(); autoNext.refresh(); media.refresh(); updateCounts();
            message(selected ? '已启用只连播视频：从当前视频正常播放开始跟踪，跳过练习，最后再统一答题。' :
                '已关闭只连播视频，恢复遇练习停留。');
            void persistSettings();
        });
        ui('reset').addEventListener('click', () => { void applySettings({ ...DEFAULTS }); });
        const observer = new win.MutationObserver(() => {
            if (pending || stopped) return;
            pending = true;
            win.queueMicrotask(() => {
                pending = false;
                if (stopped) return;
                if (!host.isConnected) (doc.body || doc.documentElement).appendChild(host);
                media.scan();
                autoNext.scan();
                updateCounts();
            });
        });
        function onPageHide(event) { if (!event.persisted) stop(); }
        function stop() {
            stopped = true;
            observer.disconnect();
            media.stop();
            autoNext.stop();
            questionRunner.cancel();
            panelDrag.stop();
            win.removeEventListener('pagehide', onPageHide);
            host.remove();
        }
        // 先画面板，再异步读取；损坏的存储或 API 异常不会导致面板消失。
        const ready = (async () => {
            ui('apply').disabled = ui('reset').disabled = ui('qa-run').disabled = ui('auto-next').disabled = ui('video-only').disabled = true;
            const warnings = [];
            const positionWarning = await panelDrag.ready;
            if (positionWarning) warnings.push(positionWarning);
            try { settings = normalizeSettings(await storage.get(SETTINGS_KEY, DEFAULTS)); }
            catch (error) { warnings.push('设置读取失败：' + error.message); }
            if (stopped) return;
            updateInputs();
            message(warnings.join('\n') || '运行正常。修改播放设置后，点击“应用播放设置”。');
            media.scan();
            autoNext.scan();
            updateCounts();
            observer.observe(doc.documentElement, { childList: true, subtree: true });
            win.addEventListener('pagehide', onPageHide);
            ui('apply').disabled = ui('reset').disabled = ui('auto-next').disabled = ui('video-only').disabled = false;
            updateCounts();
        })();
        return { ready, stop, root, media, autoNext, panelDrag };
    }

    if (typeof window === 'undefined' && typeof module !== 'undefined') {
        module.exports = { detectPlatform, normalizeSettings, normalizeQuestion,
            answerText, setInputValue, createStorage, createMediaController, start,
            PANEL_ID, SETTINGS_KEY, POSITION_KEY, createPanelDragController, isUlearningLesson, collectQuestions, questionSignature,
            parsePlatformAnswer, choiceIndexes, planAnswer, applyAnswer, platformHeaders, createPlatformProvider, createQuestionRunner,
            createPlatformTransport, validAnswerUrl, readLessonNavigation, createAutoNextController, detectQuestionType };
        return;
    }
    // typeof 允许脚本在只提供 GM.* 异步 API 的管理器中启动。
    const storage = createStorage({
        GM_getValue: typeof GM_getValue === 'function' ? GM_getValue : undefined,
        GM_setValue: typeof GM_setValue === 'function' ? GM_setValue : undefined,
        GM: typeof GM !== 'undefined' ? GM : undefined
    });
    const boot = () => {
        try {
            const instance = start(window, document, storage);
            instance?.ready.catch(error => console.error('[网课辅助] 初始化失败', error));
        } catch (error) { console.error('[网课辅助] 面板创建失败', error); }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
})();
