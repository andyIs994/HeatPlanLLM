import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const pkg=path.resolve(process.argv[2]);
const {handleTurn,newConversation}=await import(pathToFileURL(path.join(pkg,'pipeline/chat-engine.mjs')));
const rows=JSON.parse(fs.readFileSync(path.join(pkg,'data/recipes.json'),'utf8'));
let state=newConversation();
for(const message of ['Chinese food, mango allergy, cold','Another one','Make it room temperature','I have cucumber','Why this recipe?']){
  const r=handleTurn(message,state,rows);state=r.state;
  assert.ok(['ok','explanation'].includes(r.status),message+': '+r.status);
  assert.deepEqual(state.allergens,['mango']);assert.equal(state.cuisine,'chinese');
  assert.doesNotMatch([r.reply,r.allergyNote,...r.conditions].join(' '),/[\u3400-\u9fff]/u);
}
assert.equal(state.temperature,'room');
const weather=handleTurn('Vietnamese food, the weather is hot',newConversation(),rows);
assert.equal(weather.state.temperature,null);
const hot=handleTurn('Make it hot',state,rows);
assert.equal(hot.state.temperature,'hot');
for(const r of rows){
  const display=[r.title,r.standard_recipe_label,r.cuisine_label,r.temperature_label,r.dish_type_label,r.allergen_reminder,...r.allergen_labels,...r.food_notes,...r.heat_breakdown.map(h=>h.label),...r.ingredients.concat(r.steps).flatMap(b=>[b.text,b.source_group||''])];
  assert.doesNotMatch(display.join('\n'),/[\u3400-\u9fff]/u,r.recipe_id);
}
console.log('PASS English multi-turn flow, allergy retention, hot-weather distinction and all 58 English recipe displays');
