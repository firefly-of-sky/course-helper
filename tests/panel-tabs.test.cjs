'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createPanelTabController}=require('../repaired.user.js');
function fixture(storage,enabled=true){
 const nodes=Object.fromEntries(['media-page','qa-page','media-tab','qa-tab'].map(id=>[id,{hidden:false,attrs:{},setAttribute(k,v){this.attrs[k]=v;}}]));
 const errors=[];const c=createPanelTabController({getElementById:id=>nodes[id]},storage,m=>errors.push(m),'tabs',enabled);
 return {nodes,c,errors};
}
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
test('答题/视频页签切页恢复，初始化不重写用户偏好',async()=>{
 let saved=null,writes=0;const storage={get:async()=>saved,set:async(k,v)=>{saved=v;writes++;}};
 const a=fixture(storage);await a.c.ready;assert.equal(a.nodes['media-page'].hidden,false);
 a.c.select('qa');await settle();a.c.stop();
 const b=fixture(storage);await b.c.ready;assert.equal(b.nodes['qa-page'].hidden,false);assert.equal(b.nodes['qa-tab'].attrs['aria-selected'],'true');assert.equal(writes,1);
 b.c.select('media');await settle();b.c.stop();const c=fixture(storage);await c.c.ready;assert.equal(c.nodes['media-page'].hidden,false);c.c.stop();
});
test('异步读取不覆盖用户新选择，快速切换按顺序保存',async()=>{
 let resolve;const calls=[];const f=fixture({get:()=>new Promise(r=>resolve=r),set:async(k,v)=>calls.push(v)});
 f.c.select('qa');f.c.select('media');f.c.select('qa');resolve('media');await f.c.ready;await settle();
 assert.equal(f.nodes['qa-page'].hidden,false);assert.deepEqual(calls,['qa','media','qa']);f.c.stop();
});
test('无答题功能的页面临时显示视频，不覆盖答题偏好',async()=>{
 const writes=[];const f=fixture({get:async()=> 'qa',set:async(k,v)=>writes.push(v)},false);await f.c.ready;
 assert.equal(f.nodes['media-page'].hidden,false);f.c.select('qa');await settle();assert.deepEqual(writes,[]);f.c.stop();
});
test('损坏存储与读取失败仍显示可用页签，销毁后忽略迟到恢复',async()=>{
 for(const saved of [{},'other']){const f=fixture({get:async()=>saved,set:async()=>{}});await f.c.ready;assert.equal(f.nodes['media-page'].hidden,false);f.c.stop();}
 const f=fixture({get:async()=>{throw Error('read');},set:async()=>{throw Error('write');}});assert.match(await f.c.ready,/读取失败/);f.c.select('qa');await settle();assert.equal(f.nodes['qa-page'].hidden,false);assert.equal(f.errors.length,1);f.c.stop();
 let resolve;const g=fixture({get:()=>new Promise(r=>resolve=r),set:async()=>{}});g.c.stop();resolve('qa');await g.c.ready;g.c.select('qa');assert.equal(g.nodes['media-page'].hidden,false);
});
