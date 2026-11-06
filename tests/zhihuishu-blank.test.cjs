'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../repaired.user.js');

function asyncBlanks(count = 2) {
    let committed = Array(count).fill(''), pending = null, generation = 0, stopped = false, id = '11';
    const events = [], writes = [];
    class Input {
        constructor(index) { this.index=index;this.tagName='INPUT';this.type='text';this.disabled=false;this.readOnly=false;this.ownerDocument=doc;this.local=committed[index];this.created=generation; }
        get value() { return this.local; }
        set value(value) { assert.equal(this.created,generation,'不得写入已重建的旧输入框');this.local=String(value);writes.push([this.index,this.local]); }
        dispatchEvent(event) { events.push([this.index,event.type]);if(event.type==='keyup') { const next=[...committed];next[this.index]=this.local;pending=next; }return true; }
    }
    class Event { constructor(type,options={}){this.type=type;Object.assign(this,options);} }
    const win={HTMLInputElement:Input,HTMLTextAreaElement:class{},Event,KeyboardEvent:Event,getComputedStyle:()=>({visibility:'visible'})};
    const doc={defaultView:win};
    const fresh=()=>({id,parentId:'100:40:20',title:'填空',type:'blank',rawContent:'<p>填空 <img src="formula.png"></p>',blankIds:Array.from({length:count},(_,i)=>String(101+i)),options:[],
        element:{ownerDocument:doc,isConnected:true,getClientRects:()=>[1]},inputs:Array.from({length:count},(_,i)=>new Input(i)),savedInput:i=>committed[i]});
    const f={collect:()=>[fresh()],delay:async()=>{if(pending){committed=pending;pending=null;generation++;}},assertCurrent:()=>{if(stopped)throw Error('流程已取消');},
        values:()=>[...committed],events,writes,stop:()=>{stopped=true;},change:()=>{id='12';}};
    return f;
}

test('智慧树填空逐空触发保存并使用新输入框，保留0、负号与逗号',async()=>{
    const f=asyncBlanks(3),plan={kind:'text',answers:['0','-1','f(z),g(z)']};
    await core.applyZhihuishuAnswer(f.collect()[0],plan,f);
    assert.deepEqual(f.values(),plan.answers);
    for(let i=0;i<3;i++)for(const type of ['input','change','keyup'])assert.ok(f.events.some(e=>e[0]===i&&e[1]===type));
});
test('填空只有输入框值变化但平台未保存时停止',async()=>{
    const f=asyncBlanks(1);f.delay=async()=>{};
    await assert.rejects(core.applyZhihuishuAnswer(f.collect()[0],{kind:'text',answers:['0']},f),/未保存/);
    assert.deepEqual(f.values(),['']);
});
test('填空保存等待期间取消或切题，不继续写入下一空',async()=>{
    for(const kind of ['stop','change']) {
        const f=asyncBlanks(2),delay=f.delay;f.delay=async()=>{await delay();f[kind]();};
        await assert.rejects(core.applyZhihuishuAnswer(f.collect()[0],{kind:'text',answers:['0','-1']},f),kind==='stop'?/取消/:/题目变化/);
        assert.deepEqual(f.writes,[[0,'0']]);
    }
});
test('填空输入框只读或空数量变化时不提交',async()=>{
    const f=asyncBlanks(1),q=f.collect()[0];q.inputs[0].readOnly=true;f.collect=()=>[q];
    await assert.rejects(core.applyZhihuishuAnswer(q,{kind:'text',answers:['0']},f),/不可编辑/);
    assert.deepEqual(f.writes,[]);
    const changed=asyncBlanks(1);
    await assert.rejects(core.applyZhihuishuAnswer(changed.collect()[0],{kind:'text',answers:['0','-1']},changed),/变化|不可编辑/);
    assert.deepEqual(changed.writes,[]);
});
test('填空反馈按专用题目标识与空数量匹配，拒绝缺失和不完整记录',()=>{
    const question={type:'blank',options:[],inputs:[{},{}],blankIds:['101','102'],blankKey:'blank-key',publicAnswers:[]};
    assert.deepEqual(core.zhihuishuFeedbackAnswer(question,[{key:'blank-key',answers:['0','-1']}]),['0','-1']);
    assert.throws(()=>core.zhihuishuFeedbackAnswer(question,[{key:'other',answers:['0','-1']}]),/尚无/);
    for(const answers of [[],['0'],['0','-1','2'],['0','']])assert.throws(()=>core.zhihuishuFeedbackAnswer(question,[{key:'blank-key',answers}]),/不一致|无|缺|空|匹配/);
});
test('填空题指纹保留公式图片顺序和空数量，不把不同数学题合并',()=>{
    const fp=core.zhihuishuBlankFingerprint;
    assert.equal(fp('函数 f(z)，求留数。',['https://example.test/a.png'],1),fp('函数 f(z), 求留数.',['https://example.test/a.png'],1));
    assert.notEqual(fp('求留数',['https://example.test/a.png'],1),fp('求留数',['https://example.test/b.png'],1));
    assert.notEqual(fp('求留数',['a.png','b.png'],2),fp('求留数',['b.png','a.png'],2));
    assert.notEqual(fp('求留数',['a.png'],1),fp('求留数',['a.png'],2));
    assert.notEqual(fp('f=-1',[],1),fp('f=1',[],1));
});

const blankUrls={practice:'https://studentexamcomh5.zhihuishu.com/studentReviewTestOrExam/30/1/1/100/name/1/true/true/true/1?foAiRun=1&point=1&classId=20&pointId=40&paperId=50',feedback:'https://ai-smart-course-student-pro.zhihuishu.com/examPreview/100/50/30/40/20'};
const htmlText=html=>String(html).replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function sourceBlank(count=1) {
    const win={location:new URL(blankUrls.practice),getComputedStyle:()=>({visibility:'visible'})};
    const doc={defaultView:win};
    const visible=extra=>({isConnected:true,ownerDocument:doc,getClientRects:()=>[1],...extra});
    const inputs=Array.from({length:count},()=>visible({value:'',type:'text'}));
    const data={id:11,questionType:3,content:'<p>函数 <img src="https://example.test/f.png"> 留数___.</p>',optionVos:Array.from({length:count},(_,i)=>({id:101+i,content:null,isCorrect:null,sort:i+1}))};
    const saved=data.optionVos.map(o=>({id:o.id,content:'0'}));
    const model={reviewTopicData:data,currentQues:{questionId:11,sort:'2'}};
    const element=visible({querySelectorAll:s=>{assert.match(s,/input\.el-input__inner\[type="text"\]/);return inputs;}});
    doc.querySelector=s=>s==='.reviewTestOrExam'?{__vue__:model}:s==='.Review-container .questionContent'?element:s==='.input-ques'?{__vue__:{$props:{preData:saved}}}:null;
    doc.createElement=tag=>{assert.equal(tag,'template');let html='';return {set innerHTML(v){html=String(v);},get content(){return {textContent:htmlText(html),querySelectorAll:s=>{assert.equal(s,'img');return [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m=>({getAttribute:k=>k==='src'?m[1]:null}));}};}};};
    return {doc,data,inputs,saved};
}
function feedbackBlank(answers=['0'],options={}) {
    const win={location:new URL(blankUrls.feedback),getComputedStyle:()=>({visibility:'visible'})},doc={defaultView:win};
    const visible=extra=>({isConnected:true,ownerDocument:doc,getClientRects:()=>[1],...extra});
    const reference=value=>({children:[{tagName:'SPAN',textContent:value,querySelector:()=>options.imageAnswer?{}:null}]});
    const references=answers.map(reference);
    const title={cloneNode(){let prefix='2、';return {get textContent(){return prefix+(options.title||'函数  留数___.');},querySelector:s=>s==='.option-index'?{remove(){prefix='';}}:null,
        querySelectorAll:s=>{assert.equal(s,'img');return (options.images||['https://example.test/f.png']).map(src=>({getAttribute:k=>k==='src'?src:null}));}};}};
    const item=visible({querySelector:s=>s==='.quest-type'?{textContent:'填空客观题（自动批阅）'}:s==='.quest-title'?title:null,
        querySelectorAll:s=>s==='.answer-item'?Array.from({length:options.slotCount??answers.length},()=>({})):s==='.answer-title'?references:[]});
    doc.querySelectorAll=s=>{assert.equal(s,'.question-item');return[item];};
    return{doc,references};
}
test('智慧树题型3单空与多空可识别，不把file上传框作为答案输入',()=>{
    for(const count of [1,2]) {
        const f=sourceBlank(count),q=core.readZhihuishuQuestion(f.doc)[0];
        assert.equal(q.type,'blank');assert.equal(q.inputs.length,count);assert.equal(q.options.length,0);
        assert.deepEqual(q.blankIds,Array.from({length:count},(_,i)=>String(101+i)));
        assert.equal(q.savedInput(0),'0');assert.ok(q.blankKey);
    }
    const f=sourceBlank(1);f.data.optionVos[0].id='invalid';assert.deepEqual(core.readZhihuishuQuestion(f.doc),[]);
});
test('填空控件隐藏、空数不对应或空位ID重复时拒绝识别',()=>{
    const hidden=sourceBlank(1);hidden.inputs[0].getClientRects=()=>[];assert.deepEqual(core.readZhihuishuQuestion(hidden.doc),[]);
    const missing=sourceBlank(2);missing.inputs.pop();assert.deepEqual(core.readZhihuishuQuestion(missing.doc),[]);
    const duplicate=sourceBlank(2);duplicate.data.optionVos[1].id=101;assert.deepEqual(core.readZhihuishuQuestion(duplicate.doc),[]);
});
test('填空解析保留单空0、负数和多空独立答案，不拆分数学逗号',()=>{
    for(const answers of [['0'],['-1'],['0','-1','f(z),g(z)']]) {
        const f=feedbackBlank(answers),records=core.collectZhihuishuFeedback(f.doc);
        assert.equal(records.length,1);assert.deepEqual(records[0].answers,answers);
    }
});
test('源题与反馈题干移除序号后对应同一填空指纹，公式不同则不匹配',()=>{
    const q=core.readZhihuishuQuestion(sourceBlank().doc)[0];
    const record=core.collectZhihuishuFeedback(feedbackBlank(['0']).doc)[0];
    assert.equal(record.key,q.blankKey);
    assert.deepEqual(core.zhihuishuFeedbackAnswer(q,[record]),['0']);
    const other=core.collectZhihuishuFeedback(feedbackBlank(['0'],{images:['https://example.test/other.png']}).doc)[0];
    assert.throws(()=>core.zhihuishuFeedbackAnswer(q,[other]),/尚无/);
});
test('填空反馈缺空、多个候选SPAN、空字符串或图片公式不尝试填入',()=>{
    for(const f of [feedbackBlank(['0'],{slotCount:2}),feedbackBlank(['']),feedbackBlank(['0'],{imageAnswer:true})])assert.deepEqual(core.collectZhihuishuFeedback(f.doc),[]);
    const ambiguous=feedbackBlank(['0']);ambiguous.references[0].children.push({tagName:'SPAN',textContent:'1',querySelector:()=>null});
    assert.deepEqual(core.collectZhihuishuFeedback(ambiguous.doc),[]);
});
