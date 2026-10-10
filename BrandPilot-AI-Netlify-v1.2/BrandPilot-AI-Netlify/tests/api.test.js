'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { _test } = require('../api/generate');
const fixture = {brand:'测试品牌',industry:'消费电子',product:'99元日用品',sellingPoints:'方便',audience:'20到30岁消费者',objective:'新品上市与品牌认知',budget:'1万元',channels:['小红书','抖音']};
const sampleJson = {meta:{title:'测试报告'},overview:{challenge:'挑战'},audience:{primary:{name:'核心'}},strategy:{positioning:'定位'},creative:{xiaohongshu:{title:'标题'}},execution:{days:[]},measurement:{northStar:'有效访问'}};

test('validates required fields and channels',()=>{
  const result=_test.validateBrief(fixture);
  assert.equal(result.brand, '测试品牌');
  assert.deepEqual(result.channels,['小红书','抖音']);
  assert.throws(()=>_test.validateBrief({...fixture,brand:''}),/请填写品牌/);
  assert.throws(()=>_test.validateBrief({...fixture,channels:[]}),/请至少/);
  assert.throws(()=>_test.validateBrief({...fixture,channels:['未知平台']}),/请至少/);
});

test('strips untrusted channels and caps fields',()=>{
  const result=_test.validateBrief({...fixture,notes:'a'.repeat(1000),channels:['抖音','抖音','外部',17]});
  assert.equal(result.notes.length,500);
  assert.deepEqual(result.channels,['抖音']);
});

test('extracts a complete JSON report and rejects incomplete content',()=>{
  assert.equal(_test.parseAiJson('```json\n'+JSON.stringify(sampleJson)+'\n```').meta.title,'测试报告');
  assert.throws(()=>_test.parseAiJson('{}'),/缺少必要模块/);
  assert.throws(()=>_test.parseAiJson('{invalid'),/不是有效 JSON|不完整/);
});

test('requires real server-side API configuration',async()=>{
  await assert.rejects(()=>_test.runGeneration(fixture,{key:'替换成你的_API_Key'}),/尚未配置/);
});

test('calls an OpenAI-compatible API and parses output (local stub only)', async()=>{
  let received;
  const server=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;
    received={path:req.url,headers:req.headers,body:JSON.parse(raw)};
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(sampleJson)},finish_reason:'stop'}]}));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const port=server.address().port;
    const out=await _test.runGeneration(fixture,{key:'test-placeholder',baseUrl:`http://127.0.0.1:${port}/v1`,model:'test-model'});
    assert.equal(out.meta.title,'测试报告');
    assert.equal(received.path,'/v1/chat/completions');
    assert.equal(received.headers.authorization,'Bearer test-placeholder');
    assert.equal(received.body.model,'test-model');
    assert.equal(received.body.response_format.type,'json_object');
    assert.match(received.body.messages[1].content,/测试品牌/);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
