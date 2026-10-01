import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {createServer} from './server.mjs';
import {createTurnRouter} from './provider-router.mjs';
import {extractIntent,composeReply} from './llm.mjs';
import {newConversation,handleTurn} from './chat-engine.mjs';

const rows=JSON.parse(fs.readFileSync(new URL('../data/recipes.json',import.meta.url),'utf8'));
const good={cuisine:'chinese',temperature:'cold',dishType:null,allergy_terms:['mango'],exclude_terms:[],prefer_terms:[],wants_another:false};
const answer=(content,finish_reason='stop')=>new Response(JSON.stringify({choices:[{message:{content:typeof content==='string'?content:JSON.stringify(content)},finish_reason}]}));
const getProvider=url=>url.includes('nvidia.com')?'nvidia':'groq';
const getStage=options=>JSON.parse(options.body).messages[0].content.startsWith('Extract')?'intent':'reply';
const success=async(url,options)=>answer(getStage(options)==='intent'?good:'Here is a standard recipe matching your preferences.');
test('help preserves constraints and ignores incidental model recipe preferences',()=>{
 const state={...newConversation(),allergens:['milk'],preferredIngredients:['oats'],turn:3};
 for(const text of ['我该怎么使用这个功能？','How do I use this?']){
  const r=handleTurn(text,state,rows);assert.equal(r.status,'help');assert.deepEqual(r.state,state);assert.equal(r.selected,null);
 }
 const r=handleTurn('Could you walk me through getting started?',state,rows,{...good,wants_help:true});
 assert.equal(r.status,'help');assert.deepEqual(r.state,state);assert.match(r.reply,/reviewed recipes/);
});
test('model help intent returns maintained guide without a generated recipe reply',()=>withServer({fetcher:async(url,o)=>{
 assert.equal(getStage(o),'intent');return answer({...good,wants_help:true});
}},async({send})=>{const r=await send('Could you walk me through getting started?');assert.equal(r.status,'help');assert.equal(r.llm.intent_provider,'nvidia');assert.equal(r.llm.attempts.length,1);assert.match(r.reply,/reviewed recipes/);}));
async function withServer(options,fn){
  const server=createServer({records:rows,nvidiaKey:'test-nvidia',groqKey:'test-groq',timeoutMs:100,budgetMs:1000,...options});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const send=async(message='Chinese food, cold',state=newConversation())=>{
    const r=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,state})});
    assert.equal(r.status,200);return r.json();
  };
  try{return await fn({send,base});}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}

test('NVIDIA request uses its own key, endpoint, model and token parameter',async()=>{
  const intent=await extractIntent('Chinese food',newConversation(),{provider:'nvidia',key:'test-nvidia',model:'custom/model'},async(url,o)=>{
    assert.equal(url,'https://integrate.api.nvidia.com/v1/chat/completions');
    assert.equal(o.headers.Authorization,'Bearer test-nvidia');assert.equal(o.redirect,'error');
    const b=JSON.parse(o.body);assert.equal(b.model,'custom/model');assert.equal(b.max_tokens,1800);
    assert.equal(b.max_completion_tokens,undefined);assert.equal(b.response_format,undefined);
    assert.ok(b.messages[0].content.includes('allergy_terms'));return answer(good);
  });assert.deepEqual(intent,good);
});
test('NVIDIA success never calls Groq',()=>withServer({fetcher:async(url,o)=>{
  assert.equal(getProvider(url),'nvidia');return success(url,o);
}},async({send})=>{
  const r=await send();assert.equal(r.mode,'nvidia');assert.equal(r.fallback,false);
  assert.equal(r.llm.attempts.length,2);assert.deepEqual(r.state.allergens,['mango']);
}));
for(const status of [401,429,503])test(`NVIDIA HTTP ${status} switches to Groq and does not retry NVIDIA for the reply`,()=>{
  const calls=[];
  return withServer({fetcher:async(url,o)=>{calls.push(getProvider(url));return getProvider(url)==='nvidia'?new Response('upstream details',{status}):success(url,o);}},async({send})=>{
    const r=await send();assert.deepEqual(calls,['nvidia','groq','groq']);assert.equal(r.mode,'groq');assert.equal(r.fallback,true);
    assert.equal(r.llm.attempts[0].reason,'http_'+status);assert.deepEqual(r.state.allergens,['mango']);
  });
});
test('transport failure switches to Groq without exposing upstream exception text',()=>withServer({fetcher:async(url,o)=>{
  if(getProvider(url)==='nvidia')throw Error('secret upstream detail test-nvidia');return success(url,o);
}},async({send})=>{const r=await send();assert.equal(r.mode,'groq');assert.doesNotMatch(JSON.stringify(r),/secret upstream|test-nvidia/);}));
test('timeout aborts NVIDIA and activates Groq',()=>{
  let signal;
  return withServer({timeoutMs:20,fetcher:async(url,o)=>{
    if(getProvider(url)==='nvidia'){signal=o.signal;return new Promise(()=>{});}return success(url,o);
  }},async({send})=>{const r=await send();assert.equal(r.mode,'groq');assert.equal(signal.aborted,true);assert.equal(r.llm.attempts[0].reason,'timeout');});
});
test('timeout also covers reading an incomplete response body',async()=>{
  await assert.rejects(extractIntent('test',newConversation(),{provider:'nvidia',key:'test',timeoutMs:10},async()=>({ok:true,json:()=>new Promise(()=>{})})),e=>e.code==='timeout');
});
for(const content of ['not JSON',{...good,allergy_terms:'mango'},{...good,extra:true}])test('invalid NVIDIA intent falls back with local schema validation',()=>withServer({fetcher:async(url,o)=>getProvider(url)==='nvidia'?answer(content):success(url,o)},async({send})=>{
  const r=await send();assert.equal(r.mode,'groq');assert.equal(r.llm.attempts[0].reason,'invalid_output');
}));
test('truncated model completion is rejected',async()=>{
  await assert.rejects(extractIntent('test',newConversation(),{provider:'nvidia',key:'test'},async()=>answer(good,'length')),e=>e.code==='incomplete_response');
});
test('reply failure switches to Groq without repeating extraction or changing selected facts',()=>{
  const calls=[];
  return withServer({fetcher:async(url,o)=>{
    const provider=getProvider(url),stage=getStage(o);calls.push(provider+':'+stage);
    if(provider==='nvidia'&&stage==='reply')return new Response('{}',{status:503});return success(url,o);
  }},async({send})=>{
    const r=await send('Chinese food, cold');assert.equal(r.mode,'groq');assert.equal(r.llm.intent_provider,'nvidia');
    assert.deepEqual(calls,['nvidia:intent','nvidia:reply','groq:reply']);assert.deepEqual(r.state.allergens,['mango']);
    assert.equal(r.state.turn,1);assert.deepEqual(r.selected,handleTurn('Chinese food, cold',newConversation(),rows,good).selected);
  });
});
test('both providers failing returns local recipe and preserves existing and newly stated allergies',()=>withServer({fetcher:async()=>new Response('{}',{status:503})},async({send})=>{
  const state={...newConversation(),allergens:['mango']};
  const r=await send('Chinese food, peanut allergy, cold',state);
  assert.equal(r.mode,'local');assert.equal(r.fallback,true);assert.deepEqual(r.state.allergens.sort(),['mango','peanut']);assert.ok(r.allergyNote);
}));
test('both reply failures retain valid model-extracted restrictions and canonical reply',()=>withServer({fetcher:async(url,o)=>getStage(o)==='intent'?answer(good):answer('')},async({send})=>{
  const r=await send();assert.equal(r.mode,'local');assert.equal(r.llm.intent_provider,'nvidia');assert.equal(r.fallback,true);
  assert.deepEqual(r.state.allergens,['mango']);assert.equal(r.reply,handleTurn('Chinese food, cold',newConversation(),rows,good).reply);
}));
test('Groq alone works when NVIDIA is not configured',()=>withServer({nvidiaKey:'',fetcher:async(url,o)=>{
  assert.equal(getProvider(url),'groq');assert.equal(o.headers.Authorization,'Bearer test-groq');return success(url,o);
}},async({send})=>{const r=await send();assert.equal(r.mode,'groq');assert.equal(r.fallback,false);}));
test('NVIDIA alone falls back locally if unavailable',()=>withServer({groqKey:'',fetcher:async()=>new Response('{}',{status:429})},async({send})=>{
  const r=await send('Chinese food, mango allergy, cold');assert.equal(r.mode,'local');assert.equal(r.llm.attempts.length,1);
}));
test('no keys makes no external requests and status never reveals credentials',()=>withServer({nvidiaKey:'',groqKey:'',fetcher:async()=>{throw Error('Unexpected call');}},async({send,base})=>{
  const r=await send('Chinese food, mango allergy, cold');assert.equal(r.mode,'local');assert.equal(r.fallback,false);assert.deepEqual(r.llm.attempts,[]);
  const status=await(await fetch(base+'/api/status')).json();assert.deepEqual(status.provider_order,[]);
  assert.equal((await fetch(base+'/.env')).status,404);
}));
test('configured status reports priority without claiming live availability or exposing keys',()=>withServer({fetcher:success},async({base})=>{
  const status=await(await fetch(base+'/api/status')).json();assert.deepEqual(status.provider_order,['nvidia','groq']);assert.equal(status.primary_provider,'nvidia');
  assert.doesNotMatch(JSON.stringify(status),/test-nvidia|test-groq/);
}));
test('pending unknown allergies keep the canonical clarification rather than generating an introduction',()=>{
  const calls=[];
  return withServer({fetcher:async(url,o)=>{calls.push(getStage(o));return answer({...good,allergy_terms:['unidentified ingredient']});}},async({send})=>{
    const r=await send();assert.equal(r.selected,null);assert.ok(r.state.unrecognizedAllergens.length);assert.deepEqual(calls,['intent']);
    assert.equal(r.llm.reply_provider,'local');
  });
});
test('each new turn retries the primary service after a prior turn failed',async()=>{
  let fail=true;const calls=[];
  await withServer({fetcher:async(url,o)=>{calls.push(getProvider(url));if(fail)return new Response('{}',{status:503});return success(url,o);}},async({send})=>{
    const a=await send('Chinese food, mango allergy, cold');assert.equal(a.mode,'local');fail=false;
    const b=await send('Another one',a.state);assert.equal(b.mode,'nvidia');assert.deepEqual(b.state.allergens,['mango']);
  });assert.deepEqual(calls,['nvidia','groq','nvidia','nvidia']);
});
test('total budget bounds all model calls across stages',async()=>{
  let count=0;
  const router=createTurnRouter({nvidiaKey:'test',groqKey:'test',timeoutMs:100,budgetMs:10,fetcher:async()=>{count++;return new Promise(()=>{});}});
  const r=await router.run('intent','test',newConversation());assert.equal(r.provider,'local');assert.equal(count,1);
  assert.ok(router.attempts.some(a=>a.reason==='budget_exhausted'));
});
test('invalid timeout configuration is rejected at startup',()=>{
  assert.throws(()=>createServer({records:rows,timeoutMs:'invalid'}));
});
