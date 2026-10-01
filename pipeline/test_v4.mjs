import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const pkg=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const mod=async name=>import(pathToFileURL(path.join(pkg,'pipeline',name)));
const {handleTurn,newConversation}=await mod('chat-engine.mjs');
const {recommend,heatLevel,recipeContains}=await mod('recommendation.mjs');
const {createServer,validateState}=await mod('server.mjs');
const {validateIntent,extractIntent,composeReply}=await mod('groq.mjs');
const rows=JSON.parse(fs.readFileSync(path.join(pkg,'data/recipes.json'),'utf8'));
const get=id=>rows.find(r=>r.recipe_id===id);
let passed=0;const failures=[];
async function test(name,fn){try{await fn();passed++;console.log('PASS '+name);}catch(e){failures.push({name,message:e.message});console.error('FAIL '+name+': '+e.message);}}
let first,second,third;
await test('both requested deletions plus Banh chung absent from active data',()=>{assert.equal(rows.filter(r=>r.recipe_id.startsWith('wb-')).length,58);for(const id of ['wb-002','wb-019','wb-027'])assert.equal(get(id),undefined);});
await test('no outstanding calibration questions',()=>assert.deepEqual(JSON.parse(fs.readFileSync(path.join(pkg,'data/calibration_questions.json'),'utf8')),[]));
await test('screenshot request resolves directly to a cold Chinese recipe',()=>{
  first=handleTurn('中国菜，芒果过敏，冷',newConversation(),rows);
  assert.equal(first.status,'ok');assert.equal(first.state.cuisine,'chinese');assert.equal(first.state.temperature,'cold');assert.deepEqual(first.state.allergens,['mango']);assert.equal(first.selected.recipe.cuisine_id,'chinese');assert.equal(first.selected.recipe.product_temperature,'cold');
});
await test('next recipe keeps allergy cuisine and temperature',()=>{
  second=handleTurn('换一道',first.state,rows);assert.equal(second.status,'ok');assert.deepEqual(second.state.allergens,['mango']);assert.equal(second.state.cuisine,'chinese');assert.equal(second.state.temperature,'cold');assert.notEqual(second.selected.recipe.recipe_id,first.selected.recipe.recipe_id);
});
await test('changing to room temperature retains mango restriction',()=>{
  third=handleTurn('改成常温',second.state,rows);assert.equal(third.status,'ok');assert.deepEqual(third.state.allergens,['mango']);assert.equal(third.selected.recipe.product_temperature,'room');
});
await test('ingredient preference in follow-up uses prior constraints',()=>{
  const r=handleTurn('我有黄瓜',third.state,rows);assert.equal(r.status,'ok');assert.ok(recipeContains(r.selected.recipe,'cucumber'));assert.deepEqual(r.state.allergens,['mango']);
});
await test('Chinese custom mango allergy excludes English mango recipe',()=>{
  assert.ok(recipeContains(get('wb-049'),'mango'));const r=recommend(rows,{recipeId:'wb-049',allergens:['mango']});assert.equal(r.status,'no_match');assert.ok(r.excluded.some(x=>x.recipe_id==='wb-049'&&x.reason==='allergen_conflict'));
});
await test('multiple known and custom allergies accumulate across turns',()=>{
  const r=handleTurn('我还对花生过敏',first.state,rows);assert.deepEqual(r.state.allergens.sort(),['mango','peanut']);
});
await test('switching cuisines never clears allergy history',()=>{
  const r=handleTurn('改成印度菜',first.state,rows);assert.equal(r.state.cuisine,'indian');assert.ok(r.state.allergens.includes('mango'));assert.notEqual(r.selected?.recipe.recipe_id,'wb-049');
});
await test('explicit allergy correction removes only that term',()=>{
  const a=handleTurn('花生过敏',first.state,rows);const r=handleTurn('我对芒果不过敏',a.state,rows);assert.deepEqual(r.state.allergens,['peanut']);
});
await test('unknown ingredient remains pending through ordinary follow-ups',()=>{
  const a=handleTurn('中国菜，神秘果过敏，冷',newConversation(),rows);assert.equal(a.status,'needs_clarification');const r=handleTurn('换一道',a.state,rows);assert.equal(r.status,'needs_clarification');assert.ok(r.state.unrecognizedAllergens.length);
});
await test('allergen clarification is completed in same conversation',()=>{
  const a=handleTurn('中国菜，那种水果过敏，冷',newConversation(),rows);const r=handleTurn('芒果',a.state,rows);assert.equal(r.status,'ok');assert.deepEqual(r.state.allergens,['mango']);assert.equal(r.state.cuisine,'chinese');
});
await test('mixed recognized and unknown allergy is not silently ignored',()=>{
  const r=handleTurn('中国菜，芒果和神秘果过敏，冷',newConversation(),rows);assert.equal(r.status,'needs_clarification');assert.ok(r.state.allergens.includes('mango'));
});
await test('hot weather alone does not request a hot meal',()=>{
  const r=handleTurn('越南菜，天气很热',newConversation(),rows);assert.equal(r.state.temperature,null);assert.equal(r.selected.recipe.product_temperature,'cold');
});
await test('single hot token and explicit Cao lau work',()=>{
  const r=handleTurn('Cao lầu，热',newConversation(),rows);assert.equal(r.status,'ok');assert.equal(r.selected.recipe.recipe_id,'wb-005');assert.equal(r.state.temperature,'hot');
});
await test('do not want hot food is a negative temperature constraint',()=>{
  const r=handleTurn('越南菜，不要热的',newConversation(),rows);assert.ok(r.candidates.every(c=>c.recipe.product_temperature!=='hot'));
});
await test('no peanut is recognized as an exclusion in chat',()=>{
  const r=handleTurn('越南菜，不要花生',newConversation(),rows);assert.ok(r.state.excludedIngredients.includes('peanut'));assert.ok(r.candidates.every(c=>!recipeContains(c.recipe,'peanut')));
});
await test('more recipes exhausted does not relax existing allergies',()=>{
  let s=first.state,r;
  for(let i=0;i<15;i++){r=handleTurn('换一道',s,rows);s=r.state;}
  assert.equal(r.status,'no_match');assert.ok(r.state.allergens.includes('mango'));
});
await test('three retired titles never return a different silent recommendation',()=>{
  for(const title of ['Bánh chưng','Pasta Marinata','Minestrone alla Capucina'])assert.equal(handleTurn(title,newConversation(),rows).status,'retired');
});
await test('new conversation explicitly clears state',()=>{
  const r=handleTurn('新对话',first.state,rows);assert.equal(r.status,'reset');assert.deepEqual(r.state,newConversation());
});
await test('why follow-up explains the actual previous recipe',()=>{
  const r=handleTurn('为什么推荐这个',first.state,rows);assert.equal(r.status,'explanation');assert.ok(r.reply.includes(first.selected.recipe.standard_recipe_label));
});
await test('unsupported reformulation is acknowledged, not silently faked',()=>{
  const r=handleTurn('少糖一点',first.state,rows);assert.equal(r.status,'reformulation');assert.equal(r.selected,null);assert.ok(r.state.allergens.includes('mango'));
});
await test('all replies carry an allergen reminder',()=>{
  for(const text of ['中国菜，冷','你好','中国菜，神秘果过敏','Pasta Marinata','少糖','新对话'])assert.ok(handleTurn(text,newConversation(),rows).allergyNote);
});
await test('English mango allergy parsed without a separate field',()=>{
  const r=handleTurn('Chinese food, allergic to mango, cold',newConversation(),rows);assert.equal(r.status,'ok');assert.deepEqual(r.state.allergens,['mango']);
});
await test('blank and overlong messages rejected',()=>{assert.throws(()=>handleTurn('  ',null,rows));assert.throws(()=>handleTurn('a'.repeat(4001),null,rows));});
await test('strict temperature tier precedes heat score',()=>{
  const cold={...get('wb-007'),recipe_id:'cold',heating_methods:['grill']},room={...get('wb-001'),recipe_id:'room',heating_methods:[]},hot={...get('wb-005'),recipe_id:'hot',heating_methods:[]};
  assert.deepEqual(recommend([hot,room,cold],{relevanceById:{cold:0}}).candidates.map(c=>c.recipe.recipe_id),['cold','room','hot']);
});
await test('boil and grill weights aggregate without duplicate counting',()=>{assert.equal(heatLevel(['boil','grill','boil']),4);});
await test('fish sauce source wording is still unchanged',()=>{
  const original=fs.readFileSync(path.join(pkg,'input/recipes_v2.jsonl'),'utf8').trim().split('\n').map(JSON.parse).find(r=>r.recipe_id==='wb-014');
  for(const section of ['ingredients','steps'])assert.deepEqual(get('wb-014')[section].map(x=>x.text),original[section].map(x=>x.text));
});
await test('chat preview has a single composer and no select elements',()=>{
  const html=fs.readFileSync(path.join(pkg,'ui/preview.html'),'utf8');assert.doesNotMatch(html,/<select\b/);assert.ok(html.includes('Tell me which ingredients you have, hot or cold, and any allergies'));assert.ok(html.includes("node('textarea')"));assert.ok(!/__RULES__|__ENGINE__|__UI__|__RECIPES__/.test(html));
});
const goodIntent={cuisine:'chinese',temperature:'cold',dishType:null,allergy_terms:['mango'],exclude_terms:[],prefer_terms:[],wants_another:false};
await test('malformed Groq structured intents rejected',()=>{assert.throws(()=>validateIntent({...goodIntent,cuisine:'random'}));assert.throws(()=>validateIntent({...goodIntent,allergy_terms:'mango'}));assert.throws(()=>validateIntent({...goodIntent,unsafe_extra:true}));});
await test('Groq adapter sends structured request and validates returned data',async()=>{
  const fake=async(url,options)=>{assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');const b=JSON.parse(options.body);assert.equal(b.response_format.json_schema.strict,true);return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(goodIntent)}}]}));};
  assert.deepEqual(await extractIntent('test',newConversation(),{key:'test-only'},fake),goodIntent);
});
await test('Groq reply uses canonical selected facts',async()=>{
  const fake=async(url,options)=>{assert.ok(JSON.parse(options.body).messages[1].content.includes(first.selected.recipe.standard_recipe_label));return new Response(JSON.stringify({choices:[{message:{content:'Here is your recipe.'}}]}));};
  assert.equal(await composeReply('test',first,{key:'test-only'},fake),'Here is your recipe.');
});
await test('model-added allergy and local allergy both survive merge',()=>{
  const r=handleTurn('中国菜，花生过敏，冷',newConversation(),rows,goodIntent);assert.deepEqual(r.state.allergens.sort(),['mango','peanut']);
});
await test('conversation state validation rejects unknown food identifiers',()=>{assert.throws(()=>validateState({...newConversation(),allergens:['__proto__']}));});
async function withServer(key,fetcher,fn){
  const server=createServer({root:pkg,records:rows,key,nvidiaKey:'',fetcher});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{await fn(base);}finally{await new Promise(resolve=>server.close(resolve));}
}
await test('real local HTTP chat endpoint carries a multi-turn conversation',()=>withServer('',fetch,async base=>{
  const status=await(await fetch(base+'/api/status')).json();assert.equal(status.groq_configured,false);
  const send=async(message,state)=>{const r=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,state})});assert.equal(r.status,200);return r.json();};
  const a=await send('中国菜，芒果过敏，冷',newConversation());const b=await send('改成常温',a.state);assert.equal(b.selected.recipe.product_temperature,'room');assert.deepEqual(b.state.allergens,['mango']);assert.equal(b.mode,'local');
  assert.equal((await fetch(base+'/input/recipes_v2.jsonl')).status,404);
  assert.equal((await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.com'},body:'{}'})).status,403);
}));
await test('Groq failure falls back to local processing without dropping constraints',()=>withServer('test-only',async()=>new Response('{}',{status:429}),async base=>{
  const r=await(await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'中国菜，芒果过敏，冷',state:newConversation()})})).json();
  assert.equal(r.mode,'local');assert.equal(r.fallback,true);assert.equal(r.status,'ok');assert.deepEqual(r.state.allergens,['mango']);
}));
await test('configured Groq path executes both intent and reply adapters with mocks',()=>withServer('test-only',async(url,options)=>{
  const b=JSON.parse(options.body);return new Response(JSON.stringify({choices:[{message:{content:b.response_format?JSON.stringify(goodIntent):'先给你一份符合条件的常规配方。'}}]}));
},async base=>{
  const r=await(await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'中国菜，冷',state:newConversation()})})).json();
  assert.equal(r.mode,'groq');assert.equal(r.status,'ok');assert.ok(r.state.allergens.includes('mango'));assert.ok(r.selected.recipe.ingredients.length);assert.ok(r.allergyNote);
}));
console.log(JSON.stringify({passed,failed:failures.length,failures},null,2));if(failures.length)process.exitCode=1;
