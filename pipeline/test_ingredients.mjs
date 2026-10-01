import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ingredientOptions,recipeContains,extractTerms,recommend,cookingHeat} from './recommendation.mjs';
import {handleTurn,newConversation} from './chat-engine.mjs';
import {validateState,createServer} from './server.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../data/recipes.json',import.meta.url)));
const catalog=JSON.parse(fs.readFileSync(new URL('../data/ingredient_catalog.json',import.meta.url)));

test('oats and dairy allergy retain both constraints and explain label blockers',()=>{
 for(const text of ['我有燕麦，对牛奶过敏','I have oats and I am allergic to milk']){
  const r=handleTurn(text,newConversation(),rows);
  assert.deepEqual(r.state.preferredIngredients,['oats']);
  assert.deepEqual(r.state.allergens,['milk']);
  assert.equal(r.selected,null);
  assert.match(r.reply,/Strawberry soy oat smoothie/);
  assert.match(r.reply,/not cleared for recommendation/);
  assert.match(r.reply,/soy milk/);
 }
 const r=handleTurn('I have oats, allergic to milk and soy',newConversation(),rows);
 assert.doesNotMatch(r.reply,/A relevant recipe is Strawberry/);
});
test('every displayed ingredient retrieves a standalone dish and index agrees with runtime',()=>{
 const options=ingredientOptions(rows);assert.equal(options.length,catalog.selectable_ingredients);
 for(const o of options){const r=recommend(rows,{preferredIngredients:[o.id]});assert.equal(r.status,'ok',o.id);assert.ok(recipeContains(r.selected.recipe,o.id));assert.deepEqual(o.recipe_ids,catalog.ingredients.find(x=>x.id===o.id).recipe_ids);}
});
test('every ingredient button label is understood by the actual chat parser',()=>{
 for(const o of ingredientOptions(rows)){const r=handleTurn('I have '+o.label,newConversation(),rows);assert.ok(r.state.preferredIngredients.includes(o.id),o.label);assert.equal(r.status,'ok',o.label);}
});
test('long Chinese ingredient aliases do not leave short fragments in allergy parsing',()=>{
 const r=handleTurn('我对酸奶过敏',newConversation(),rows);assert.deepEqual(r.state.unrecognizedAllergens,[]);assert.ok(r.state.allergens.includes('yogurt'));
});
test('new recipe ids survive server validation and second-turn requests',async()=>{
 const server=createServer({records:rows,nvidiaKey:'',groqKey:''});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const send=async(message,state)=>{const r=await fetch(`http://127.0.0.1:${server.address().port}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,state})});assert.equal(r.status,200);return r.json();};const a=await send('I have blueberries and yogurt, cold',newConversation());assert.equal(a.status,'ok');assert.match(a.selected.recipe.recipe_id,/^ar-/);assert.doesNotThrow(()=>validateState(a.state));const b=await send('Why this recipe?',a.state);assert.equal(b.status,'explanation');}finally{await new Promise(r=>server.close(r));}
});
test('comma-separated pantry inputs and Chinese food aliases are retained',()=>{
 const r=handleTurn('I have blueberries, yogurt, cold',newConversation(),rows);assert.deepEqual(r.state.preferredIngredients.sort(),['blueberry','yogurt']);assert.equal(r.status,'ok');
 assert.ok(extractTerms('我有蓝莓和酸奶').includes('blueberry'));
});
test('plant milks do not introduce dairy but dairy remains an exclusion',()=>{
 assert.ok(!extractTerms('almond milk and coconut milk').includes('milk'));assert.ok(extractTerms('almond milk and milk').includes('milk'));
 const r=handleTurn('I have blueberries, allergic to milk',newConversation(),rows);assert.ok(r.candidates.every(c=>!recipeContains(c.recipe,'milk')));
});
test('ingredient lookup never matches instructions alone',()=>{
 const r={allergen_ids:[],ingredients:[{text:'Water'}],steps:[{text:'Do not add mango.'}]};assert.equal(recipeContains(r,'mango'),false);
});
test('no-cooking request persists and excludes recipes with active heat',()=>{
 const a=handleTurn('I have banana, no cooking',newConversation(),rows);assert.equal(a.status,'ok');assert.equal(a.state.noActiveHeat,true);assert.ok(a.candidates.every(c=>cookingHeat(c.recipe).value===0));
 const b=handleTurn('Another one',a.state,rows);assert.equal(b.state.noActiveHeat,true);assert.equal(validateState(b.state).noActiveHeat,true);
});
test('allergy clarification never becomes a positive ingredient preference',()=>{
 const a=handleTurn('Chinese food, allergic to mysteryfruit',newConversation(),rows);const b=handleTurn('mango',a.state,rows);assert.equal(b.status,'ok');assert.deepEqual(b.state.preferredIngredients,[]);assert.ok(b.state.allergens.includes('mango'));
});
test('released candidates have provenance, unique ids, full fields and explicit heat review',()=>{
 assert.equal(new Set(rows.map(r=>r.recipe_id)).size,rows.length);
 const ledger=JSON.parse(fs.readFileSync(new URL('../data/candidate_release_review.json',import.meta.url)));
 const released=rows.filter(r=>r.recipe_id.startsWith('ar-'));assert.equal(released.length,ledger.filter(r=>r.status==='added_reviewed_preparation').length);
 for(const r of released){assert.ok(r.source.source_rows.length);assert.ok(r.ingredients.every(i=>i.text.trim()));assert.ok(r.steps.length>=2);assert.equal(r.cooking_heat_profile.no_active_heat_confirmed,r.cooking_heat_profile.stages.length===0);assert.equal(r.licence.id,'source-rights-not-relicensed');assert.equal(r.review.not_claimed.includes('kitchen_test'),true);assert.ok(Number.isFinite(cookingHeat(r).value));}
});
