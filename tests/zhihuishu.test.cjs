'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../repaired.user.js');
const urls = {
    practice: 'https://studentexamcomh5.zhihuishu.com/studentReviewTestOrExam/30/1/1/100/name/1/true/true/true/1?foAiRun=1&point=1&classId=20&pointId=40&paperId=50',
    result: 'https://ai-smart-course-student-pro.zhihuishu.com/point/100/50/30/40/20',
    feedback: 'https://ai-smart-course-student-pro.zhihuishu.com/examPreview/100/50/30/40/20'
};
test('智慧树仅识别已核对的知识点练习、结果与解析，拒绝普通考试和伪域名', () => {
    for (const [kind, url] of Object.entries(urls)) assert.equal(core.zhihuishuContext(new URL(url)).kind, kind);
    for (const url of [urls.practice.replace('point=1', 'point=0'), urls.practice.replace('foAiRun=1', 'foAiRun=0'),
        urls.practice.replace('.com/', '.com.evil.org/'), urls.feedback + '/extra', urls.feedback.replace('/40/', '/bad/'),
        'https://studentexamcomh5.zhihuishu.com/exam/30']) assert.equal(core.zhihuishuContext(new URL(url)), null);
    assert.equal(core.zhihuishuContext(new URL(urls.practice)).key, core.zhihuishuContext(new URL(urls.feedback)).key);
});
test('反馈以选项 ID 集合匹配，选项调序后重新映射；没有答案不猜测', () => {
    const question = { type: 'multiple', options: [{id:'3',letter:'A'}, {id:'1',letter:'B'}, {id:'2',letter:'C'}] };
    assert.deepEqual(core.zhihuishuFeedbackAnswer(question, [{ key:'1,2,3',answerIds:['1','3'] }]), ['B','A']);
    assert.throws(() => core.zhihuishuFeedbackAnswer(question, []), /尚无/);
    assert.throws(() => core.zhihuishuFeedbackAnswer({...question,type:'single'}, [{key:'1,2,3',answerIds:['1','3']}]), /不一致/);
    assert.throws(() => core.zhihuishuFeedbackAnswer(question, [{key:'1,2,3',answerIds:['9']}]), /不一致/);
    for (const ids of [[],['1'],['1','1'],['1','x']]) assert.equal(core.zhihuishuOptionKey(ids), '');
});

function fixture() {
    const win = { location:new URL(urls.practice) };
    const values = new Map(), messages = [], nodes = [], savedSelections = [];
    let cursor = 0, submitCount = 0, redoCount = 0, resultCount = 0;
    const component = { stuAnwser:null };
    const data = [
        { id:11,questionType:2,content:'<p>多选 -1</p>',optionVos:[{id:101,content:'一',isCorrect:null},{id:102,content:'二',isCorrect:null},{id:103,content:'三',isCorrect:null}] },
        { id:12,questionType:1,content:'<p>单选</p>',optionVos:[{id:201,content:'甲',isCorrect:null},{id:202,content:'乙',isCorrect:null}] }
    ];
    const visible = properties => ({isConnected:true,ownerDocument:doc,getClientRects:()=>[1],contains:()=>false,...properties});
    const doc = { defaultView:win, createElement(tag) {
        assert.equal(tag,'template');return {content:{textContent:''},set innerHTML(s){this.content.textContent=s.replace(/<[^>]*>/g,'');}};
    }, querySelector(selector) {
        if (selector === '.reviewTestOrExam') return {__vue__:model};
        if (selector === '.Review-container') return {__vue__:component};
        if (selector === '.Review-container .questionContent') return element;
        throw new Error(selector);
    },querySelectorAll(selector) {
        if (selector === '.el-tree-node__content') return cards;
        if (selector === '.question-item') return win.location.pathname.startsWith('/examPreview') ? nodes : [];
        if (selector.startsWith('button,a,')) return actions;
        throw new Error(selector);
    }};
    win.getComputedStyle = () => ({visibility:'visible'});
    const model = {get reviewTopicData(){return data[cursor];},get currentQues(){return {questionId:data[cursor].id,sort:String(cursor+1)};}};
    const controls = data.map((q,qi)=>q.optionVos.map(option=>visible({
        value:String(option.id),checked:false,getAttribute:()=>null,classList:{contains:()=>false},
        click(){if(q.questionType===2)this.checked=!this.checked;else component.stuAnwser=String(option.id);}
    })));
    const element = visible({querySelectorAll(){return controls[cursor];}});
    const cards = data.map((q,index)=>visible({textContent:String(index+1),click(){cursor=index; component.stuAnwser=null;}}));
    data.forEach((q,index)=>nodes.push(visible({querySelectorAll(){return q.optionVos.map(o=>({value:String(o.id)}));},
        querySelector(selector){if(selector==='.answer-title')return {textContent:index===0?'参考答案：B、C':'参考答案：B'};
            if(selector==='.question-result')return {textContent:submitCount>1?'回答正确！':'回答错误！'};}
    })));
    const actions = [
        visible({textContent:'提交作业',click(){submitCount++;savedSelections.push(controls[0].map(c=>c.checked));win.location=new URL(urls.result);}}),
        visible({textContent:'查看作答记录与解析',click(){resultCount++;win.location=new URL(urls.feedback);}}),
        visible({textContent:'重新答题',click(){redoCount++;win.location=new URL(urls.practice);cursor=0;component.stuAnwser=null;controls.flat().forEach(c=>c.checked=false);}})
    ];
    const storage = {async get(key,fallback){return values.has(key)?structuredClone(values.get(key)):fallback;},async set(key,value){values.set(key,structuredClone(value));}};
    const timers = {setInterval(){return 1;},clearInterval(){},setTimeout(fn){queueMicrotask(fn);}};
    const flow = () => core.createZhihuishuFlow({win,doc,storage,report:t=>messages.push(t),timers});
    return {win,doc,data,controls,component,model,nodes,messages,storage,values,actions,cards,flow,
        counts:()=>({submitCount,redoCount,resultCount}),savedSelections};
}
test('识题依据每题模型，不依赖错误的页面题型标题，null 答案不被当成 false', () => {
    const f=fixture(); const q=core.readZhihuishuQuestion(f.doc)[0];
    assert.equal(q.type,'multiple');assert.equal(q.title,'多选 -1');assert.deepEqual(q.publicAnswers,[]);
    f.data[0].optionVos[1].isCorrect=1;assert.deepEqual(core.readZhihuishuQuestion(f.doc)[0].publicAnswers,[]);
    f.data[0].optionVos.forEach((o,i)=>o.isCorrect=i===1?1:0);
    assert.deepEqual(core.readZhihuishuQuestion(f.doc)[0].publicAnswers,['B']);
    f.controls[0][0].value='999';assert.deepEqual(core.readZhihuishuQuestion(f.doc),[]);
});
test('平台逐题反馈提取完整多选，拒绝无答案、越界字母与重复选项', () => {
    const f=fixture(); f.win.location=new URL(urls.feedback);
    assert.deepEqual(core.collectZhihuishuFeedback(f.doc),[{key:'101,102,103',answerIds:['102','103']},{key:'201,202',answerIds:['202']}]);
    f.nodes[0].querySelector=()=>({textContent:'参考答案：Z'});assert.equal(core.collectZhihuishuFeedback(f.doc).length,1);
    f.nodes[0].querySelector=()=>({textContent:'参考答案：B、B'});assert.equal(core.collectZhihuishuFeedback(f.doc).length,1);
});
test('完整练习流程跨页恢复：首轮仅提交一次，按反馈重答一次，核对全对后结束', async () => {
    const f=fixture(); let flow=f.flow(); await flow.begin();
    assert.deepEqual(f.counts(),{submitCount:1,redoCount:0,resultCount:0});flow.stop();
    flow=f.flow();await flow.ready;await flow.tick();await flow.tick();await flow.tick();await flow.tick();
    assert.equal(f.counts().submitCount,2); assert.equal(f.counts().redoCount,1);
    assert.deepEqual(f.savedSelections[1],[false,true,true]);
    await flow.tick();await flow.tick();await flow.tick();
    assert.equal(flow.stage(),'done');assert.deepEqual(flow.records(),[]);
    assert.match(f.messages.at(-1),/2 \/ 2 题正确/);assert.equal(f.counts().submitCount,2);flow.stop();
});
test('从解析页启动直接收集后重答，不会再做一轮临时答案', async () => {
    const f=fixture();f.win.location=new URL(urls.feedback);const flow=f.flow();await flow.begin();await flow.tick();await flow.tick();
    assert.equal(f.counts().submitCount,1);assert.deepEqual(f.savedSelections[0],[false,true,true]);flow.stop();
});
test('重答换题时使用临时答案，不复用旧选项答案', async () => {
    const f=fixture();f.win.location=new URL(urls.feedback);const flow=f.flow();await flow.begin();await flow.tick();
    f.data[0].optionVos[0].id=999;f.controls[0][0].value='999';await flow.tick();
    assert.equal(flow.stage(),'await-feedback');assert.equal(f.counts().submitCount,1);assert.deepEqual(f.savedSelections[0],[true,false,false]);flow.stop();
});
test('部分反馈缺失时停止，防止缺答案仍提交第二轮', async () => {
    const f=fixture();const flow=f.flow();await flow.begin();await flow.tick();
    f.nodes[1].querySelector=()=>({textContent:'答案暂不公布'});await flow.tick();
    assert.equal(flow.stage(),'stopped');assert.equal(f.counts().submitCount,1);assert.equal(f.counts().redoCount,0);flow.stop();
});
test('停止保留平台已提交记录，但取消后续重答；正式考试不会开始流程', async () => {
    const f=fixture();const flow=f.flow();await flow.begin();await flow.cancel();await flow.tick();
    assert.equal(f.counts().submitCount,1);assert.equal(flow.active(),false);flow.stop();
    f.win.location=new URL('https://studentexamcomh5.zhihuishu.com/exam/30');const other=f.flow();await other.begin();
    assert.equal(f.counts().submitCount,1);assert.match(f.messages.at(-1),/请先打开/);other.stop();
});
test('双击启动与重复 tick 不并发，流程默认不执行；过期状态不恢复', async () => {
    const f=fixture();const flow=f.flow();await flow.ready;await flow.tick();assert.equal(f.counts().submitCount,0);
    await Promise.all([flow.begin(),flow.begin(),flow.tick()]);assert.equal(f.counts().submitCount,1);flow.stop();
    const value=f.values.get(core.ZHS_FLOW_KEY);value.expires=0;f.values.set(core.ZHS_FLOW_KEY,value);
    const other=f.flow();await other.ready;await other.tick();assert.equal(other.active(),false);other.stop();
});

 test('判断题 14 支持平台字母反馈', () => {
    const f=fixture();f.data[0].questionType=14;
    const q=core.readZhihuishuQuestion(f.doc)[0];assert.equal(q.type,'judge');
    const plan=core.planAnswer(q,['B'],f.doc,true);core.applyAnswer(q,plan);
    assert.equal(f.component.stuAnwser,'102');
 });
 test('持续错题最多提交三轮，反馈累计且不再启动第四轮', async () => {
    const f=fixture();for(const node of f.nodes){const original=node.querySelector;node.querySelector=s=>s==='.question-result'?{textContent:'回答错误'}:original(s);}
    const flow=f.flow();await flow.begin();for(let i=0;i<20;i++)await flow.tick();
    assert.equal(flow.stage(),'stopped');assert.equal(f.counts().submitCount,3);assert.equal(f.counts().redoCount,2);
    assert.match(f.messages.at(-1),/3 轮/);assert.equal(flow.records().length,2);flow.stop();
 });

test('不同试卷解析不能作为刚提交试卷的反馈', async () => {
    const f=fixture();const flow=f.flow();await flow.begin();await flow.tick();
    f.win.location=new URL(urls.feedback.replace('/50/','/51/'));await flow.tick();
    assert.equal(flow.stage(),'stopped');assert.equal(f.counts().redoCount,0);flow.stop();
});
test('隐藏标签不执行自动提交', async () => {
    const f=fixture();f.doc.visibilityState='hidden';const flow=f.flow();await flow.begin();
    assert.equal(f.counts().submitCount,0);await flow.cancel();flow.stop();
});
test('反馈冲突不覆盖旧答案，停止继续重答', async () => {
    const f=fixture();const flow=f.flow();await flow.begin();
    for(let i=0;i<4;i++)await flow.tick();await flow.tick();
    f.nodes[0].querySelector=s=>({textContent:s==='.answer-title'?'参考答案：A':'回答错误'});
    await flow.tick();assert.equal(flow.stage(),'stopped');assert.equal(f.counts().submitCount,2);flow.stop();
});

test('判断题语义反馈按选项标签对应 ID，支持对错与正确错误，拒绝不明确标签', () => {
 const f=fixture();f.win.location=new URL(urls.feedback);
 f.nodes[0].querySelector=()=>({textContent:'参考答案：对'});
 f.nodes[0].querySelectorAll=()=>[{value:'102',closest:()=>({textContent:'错'})},{value:'101',closest:()=>({textContent:'对'})}];
 assert.deepEqual(core.collectZhihuishuFeedback(f.doc)[0],{key:'101,102',answerIds:['101']});
 f.nodes[0].querySelector=()=>({textContent:'参考答案：错误'});
 assert.deepEqual(core.collectZhihuishuFeedback(f.doc)[0].answerIds,['102']);
 f.nodes[0].querySelectorAll=()=>[{value:'102',closest:()=>({textContent:'选项'})},{value:'101',closest:()=>({textContent:'对'})}];
 assert.equal(core.collectZhihuishuFeedback(f.doc).length,1);
});
test('翻译添加波浪号的正确提示仍能完成，全对后不再重答', async () => {
 const f=fixture();for(const n of f.nodes){const original=n.querySelector;n.querySelector=s=>s==='.question-result'?{textContent:'回答～正确'}:original(s);}
 const flow=f.flow();await flow.begin();await flow.tick();await flow.tick();assert.equal(flow.stage(),'done');assert.equal(f.counts().submitCount,1);flow.stop();
});

test('重新答题阶段保存未完成时取消，不再点击重答', async () => {
    const f = fixture();
    f.win.location = new URL(urls.feedback);
    let reachedSave, releaseSave;
    const reached = new Promise(resolve => { reachedSave = resolve; });
    const gate = new Promise(resolve => { releaseSave = resolve; });
    const originalSet = f.storage.set;
    f.storage.set = async (key, value) => {
        await originalSet(key, value);
        if (value.stage === 'refill') { reachedSave(); await gate; }
    };
    const flow = f.flow();
    await flow.begin();
    const pending = flow.tick();
    try {
        await reached;
        await flow.cancel();
        releaseSave();
        await pending;
        assert.equal(f.counts().redoCount, 0);
        assert.equal(f.counts().submitCount, 0);
        assert.equal(flow.stage(), 'stopped');
    } finally { releaseSave(); flow.stop(); }
});

test('结果页状态保存未完成时取消，不再点击解析链接', async () => {
    const f = fixture();
    let reachedSave, releaseSave;
    const reached = new Promise(resolve => { reachedSave = resolve; });
    const gate = new Promise(resolve => { releaseSave = resolve; });
    const originalSet = f.storage.set;
    f.storage.set = async (key, value) => {
        await originalSet(key, value);
        if (value.stage === 'feedback') { reachedSave(); await gate; }
    };
    const flow = f.flow();
    await flow.begin();
    const pending = flow.tick();
    try {
        await reached;
        await flow.cancel();
        releaseSave();
        await pending;
        assert.equal(f.counts().resultCount, 0);
        assert.equal(f.counts().submitCount, 1);
        assert.equal(flow.stage(), 'stopped');
    } finally { releaseSave(); flow.stop(); }
});

test('填答途中切换同知识点另一试卷，停止且不提交新试卷', async () => {
    const f = fixture();
    const originalClick = f.controls[0][0].click;
    f.controls[0][0].click = function () {
        originalClick.call(this);
        const next = new URL(f.win.location.href);
        next.searchParams.set('paperId', '51');
        f.win.location = next;
    };
    const flow = f.flow();
    try {
        await flow.begin();
        assert.equal(f.counts().submitCount, 0);
        assert.equal(flow.stage(), 'stopped');
    } finally { flow.stop(); }
});

test('填写途中标签隐藏，不继续自动提交', async () => {
    const f = fixture();
    const originalClick = f.controls[0][0].click;
    f.controls[0][0].click = function () { originalClick.call(this); f.doc.visibilityState = 'hidden'; };
    const flow = f.flow();
    try {
        await flow.begin();
        assert.equal(f.counts().submitCount, 0);
    } finally { flow.stop(); }
});
