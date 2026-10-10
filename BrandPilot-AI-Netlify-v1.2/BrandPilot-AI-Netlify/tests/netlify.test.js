'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

async function imported(name) {
  const url = pathToFileURL(path.join(__dirname, '..', 'netlify', 'functions', name + '.mjs'));
  return (await import(url.href)).default;
}
const valid = {brand:'测试品牌',product:'日常消费产品',audience:'学生与年轻上班族',objective:'新品上市',channels:['小红书']};

test('Netlify health function reports unconfigured model safely', async() => {
  const fn=await imported('health');
  const key=process.env.AI_API_KEY;
  try {
    delete process.env.AI_API_KEY;
    const r=await fn(new Request('https://test.netlify.app/api/health'));
    assert.equal(r.status,200);
    assert.deepEqual(await r.json(),{configured:false,model:null});
  } finally { if(key===undefined) delete process.env.AI_API_KEY; else process.env.AI_API_KEY=key; }
});

test('Netlify generate function blocks wrong method', async() => {
  const fn=await imported('generate');
  const r=await fn(new Request('https://test.netlify.app/api/generate'));
  assert.equal(r.status,405);
});

test('Netlify generate function catches invalid JSON', async() => {
  const fn=await imported('generate');
  const r=await fn(new Request('https://test.netlify.app/api/generate',{method:'POST',body:'{bad'}));
  assert.equal(r.status,400);
  assert.match((await r.json()).error,/JSON/);
});

test('Netlify generate function validates Brief and missing API key', async() => {
  const fn=await imported('generate');
  const bad=await fn(new Request('https://test.netlify.app/api/generate',{method:'POST',body:JSON.stringify({...valid,channels:[]})}));
  assert.equal(bad.status,400);
  const key=process.env.AI_API_KEY;
  try {
    delete process.env.AI_API_KEY;
    const missing=await fn(new Request('https://test.netlify.app/api/generate',{method:'POST',body:JSON.stringify(valid)}));
    assert.equal(missing.status,503);
    assert.match((await missing.json()).error,/尚未配置/);
  } finally { if(key===undefined) delete process.env.AI_API_KEY; else process.env.AI_API_KEY=key; }
});
