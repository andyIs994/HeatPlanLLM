import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {cookingHeat,recommend,heatExplanation} from './recommendation.mjs';
import {handleTurn,newConversation} from './chat-engine.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../data/recipes.json',import.meta.url),'utf8'));
const get=id=>rows.find(r=>r.recipe_id===id);
const stage=(method,t,id='one')=>({id,method,minutes:[t,t,t],basis:'source',evidence:[{text:'Test duration'}]});
const fixture=stages=>({cooking_heat_profile:{version:'cooking-heat-v2',stages,no_active_heat_confirmed:!stages.length}});
test('longer active heating always increases burden, independent of serving temperature',()=>{
  for(const method of ['boil','simmer','steam','pan_fry','bake','grill']){
    const scores=[1,5,10,30,90,360].map(t=>cookingHeat(fixture([stage(method,t)])).ranking_value);
    assert.ok(scores.every((n,i)=>i===0||n>scores[i-1]));
    assert.ok(scores.every(n=>n>0&&n<100));
  }
  assert.ok(cookingHeat(fixture([stage('grill',30)])).value>cookingHeat(fixture([stage('boil',30)])).value);
});
test('two separate heat cycles count; duplicate stage IDs are rejected',()=>{
  const one=cookingHeat(fixture([stage('boil',5)]));
  const two=cookingHeat(fixture([stage('boil',5),stage('boil',5,'two')]));
  assert.ok(two.value>one.value);
  assert.throws(()=>cookingHeat(fixture([stage('boil',5),stage('boil',5)])),/duplicate/);
});
test('unknown timing remains nonzero and visibly uncertain; unknown method fails',()=>{
  const h=cookingHeat({heating_methods:['boil','boil']});
  assert.ok(h.estimated);assert.ok(h.value>0);assert.ok(h.range[0]<h.value&&h.value<h.range[1]);
  assert.equal(h.breakdown.length,1);
  assert.throws(()=>cookingHeat({}),/Missing/);
  assert.throws(()=>cookingHeat({heating_methods:[]}),/explicit/);
  assert.throws(()=>cookingHeat({heating_methods:['unknown']}),/Unknown/);
});
test('invalid, negative and inverted durations cannot produce plausible scores',()=>{
  for(const minutes of [[-1,2,3],[0,0,0],[10,5,20],[1,2,Infinity],['1',2,3],null])
    assert.throws(()=>cookingHeat(fixture([{...stage('boil',5),minutes}])),/duration/);
  assert.throws(()=>cookingHeat(fixture([{...stage('boil',5),evidence:[]}])),/evidence/);
});
test('chilling, proofing, resting and total elapsed time never inflate active cooking',()=>{
  for(const id of ['wb-051','wb-038','wb-059','wb-037']){
    assert.deepEqual(cookingHeat(get(id)),cookingHeat({...get(id),total_time_raw:'999 hours',prep_time_raw:'500 hours'}));
  }
  assert.ok(cookingHeat(get('wb-051')).weighted_minutes<50); // not six hours freezing
  assert.equal(cookingHeat(get('wb-059')).weighted_minutes,10); // excludes two heat-off rests
  assert.ok(cookingHeat(get('wb-012')).value>85); // explicit 6–12 hour stock
  assert.ok(cookingHeat(get('wb-043')).value<cookingHeat(get('wb-051')).value);
});
test('all current records have traceable profiles and valid finite scores',()=>{
  assert.equal(rows.filter(r=>r.recipe_id.startsWith('wb-')).length,58);
  assert.equal(rows.filter(r=>r.recipe_id.startsWith('ar-')).length,27);
  for(const r of rows){
    const h=cookingHeat(r);
    assert.ok(Number.isFinite(h.value)&&h.value>=0&&h.value<100);
    assert.ok(h.range[0]<=h.value&&h.value<=h.range[1]);
    for(const s of h.breakdown)for(const e of s.evidence)assert.equal(e.text,r.steps[e.step_index].text);
    if(r.heating_methods.length)assert.ok(h.value>0);else assert.equal(h.value,0);
  }
});
test('allergies and strict serving-temperature groups take priority over heat',()=>{
  const cold={...get('wb-007'),recipe_id:'cold',cooking_heat_profile:fixture([stage('grill',100)]).cooking_heat_profile};
  const room={...get('wb-016'),recipe_id:'room'};
  const hot={...get('wb-004'),recipe_id:'hot',cooking_heat_profile:fixture([stage('boil',1)]).cooking_heat_profile};
  assert.deepEqual(recommend([hot,room,cold]).candidates.map(c=>c.recipe.recipe_id),['cold','room','hot']);
  assert.equal(recommend([hot,room,cold],{temperature:'hot'}).selected.recipe.recipe_id,'hot');
  assert.equal(recommend(rows,{recipeId:'wb-049',allergens:['mango']}).status,'no_match');
});
test('runtime ranking, displayed explanation and follow-up use the same v2 calculation',()=>{
  const a=handleTurn('Chinese food, mango allergy, cold',newConversation(),rows);
  const b=handleTurn('Why this recipe?',a.state,rows);
  assert.equal(a.selected.heat,cookingHeat(a.selected.recipe).value);
  assert.ok(b.reply.includes(heatExplanation(a.selected.heatAssessment)));
  const p=fs.readFileSync(new URL('../ui/preview.html',import.meta.url),'utf8');
  assert.ok(p.includes('Cooking heat '));assert.ok(!p.includes('with cooking heat "+r.heat_level'));
});
test('candidate shortlist cannot be selected, even if passed into the runtime',()=>{
  const candidates=JSON.parse(fs.readFileSync(new URL('../data/candidates/kaggle_summer_manifest.json',import.meta.url),'utf8')).candidates;
  assert.equal(candidates.length,150);
  assert.equal(recommend(candidates).status,'no_match');
  assert.ok(candidates.every(r=>r.eligible_for_product_prototype===false));
});
