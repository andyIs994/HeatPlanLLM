import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CUISINES,FOOD_TERMS,cookingHeat,recommend,recipeContains} from './recommendation.mjs';
import {validateState} from './server.mjs';
import {newConversation} from './chat-engine.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../data/'+p,import.meta.url)));
const rows=read('recipes.json'),ledger=read('candidate_release_review.json'),summary=read('review_round2_summary.json');
const byNumber=n=>rows.find(r=>r.review?.candidate_number===n);
test('all remaining candidates have a disposition, with no duplicate or silently dropped records',()=>{
 assert.equal(summary.reviewed_remaining,123);assert.equal(summary.added,109);assert.equal(summary.held,14);assert.equal(rows.length,194);
 assert.equal(ledger.length,150);assert.equal(new Set(ledger.map(r=>r.recipe_id)).size,150);
 for(const r of ledger){assert.ok(['added_reviewed_preparation','held_after_review'].includes(r.status));assert.equal(rows.some(x=>x.recipe_id===r.recipe_id),r.status==='added_reviewed_preparation');}
});
test('new recipe labels use supported vocabulary and all indexed ingredients exist',()=>{
 for(const r of rows){assert.ok(Object.hasOwn(CUISINES,r.cuisine_id),r.recipe_id);assert.ok(['cold','room','hot'].includes(r.product_temperature));assert.ok(r.ingredient_ids.every(id=>Object.hasOwn(FOOD_TERMS,id)));}
});
test('cold dishes with preparation heat are rejected by no-cooking preference',()=>{
 for(const n of [2,12,18,24,33,36,37,48,50,52,60,72,75,76,108,146]){
  const r=byNumber(n);assert.equal(r.product_temperature,'cold');assert.ok(cookingHeat(r).value>0,n);assert.equal(recommend([r],{noActiveHeat:true}).status,'no_match');
 }
});
test('explicit user temperatures and warm detail survive review',()=>{
 for(const n of [49,78,130,134,142])assert.equal(byNumber(n).product_temperature,'room');
 assert.equal(byNumber(66).serving_temperature_detail,'warm');assert.equal(byNumber(66).product_temperature,'hot');
});
test('duration evidence remains aligned and off-heat egg resting is not counted as boiling',()=>{
 for(const r of rows)for(const s of r.cooking_heat_profile.stages){assert.ok(['source','assumed'].includes(s.basis));assert.ok(s.minutes[0]>0);for(const e of s.evidence)assert.equal(e.text,r.steps[e.step_index].text);}
 const heat=cookingHeat(byNumber(49));assert.equal(heat.breakdown.filter(x=>x.method==='boil').length,1);assert.equal(heat.breakdown.find(x=>x.method==='boil').basis,'assumed');
});
test('plant creams, tomatoes and prepared states do not create false ingredient matches',()=>{
 assert.ok(!recipeContains(byNumber(61),'milk'));assert.ok(!recipeContains(byNumber(82),'grape'));
 assert.ok(recipeContains(byNumber(62),'cooked_chicken'));assert.ok(recipeContains(byNumber(68),'hard_boiled_egg'));assert.ok(recipeContains(byNumber(142),'cooked_rice'));
});
test('allergen families and compound uncertainty remain enforced',()=>{
 for(const [n,id] of [[134,'brazil_nut'],[146,'wheat'],[146,'sesame'],[142,'fish'],[142,'soy'],[58,'walnut'],[68,'egg'],[95,'milk']])assert.equal(recommend([byNumber(n)],{allergens:[id]}).status,'no_match',n+':'+id);
 assert.equal(recommend([byNumber(35)],{allergens:['soy']}).status,'no_match');
});
test('serving cups are equipment, frozen desserts disclose waiting and prepared foods are explicit',()=>{
 assert.ok(byNumber(21).equipment.some(x=>x.includes('cups')));assert.ok(byNumber(21).ingredients.every(x=>!x.text.includes('plastic')));
 assert.ok(byNumber(6).minimum_listed_wait_minutes>=240);assert.equal(cookingHeat(byNumber(6)).value,0);
 assert.ok(byNumber(140).ingredients.some(x=>x.text.includes('cooked or canned')));
});
test('conversation state accepts more than 100 distinct shown recipes',()=>{
 assert.doesNotThrow(()=>validateState({...newConversation(),shownIds:rows.slice(0,130).map(r=>r.recipe_id)}));
});
