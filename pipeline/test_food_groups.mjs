import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractTerms,recipeContains,recommend} from './recommendation.mjs';
import {handleTurn,newConversation} from './chat-engine.mjs';
import {validateState} from './server.mjs';
const make=(id,allergens)=>({recipe_id:id,eligible_for_product_prototype:true,standalone_dish:true,allergen_ids:allergens,
  unresolved_compound_ingredients:[],ingredients:[],steps:[],product_temperature:'cold',
  cooking_heat_profile:{version:'cooking-heat-v2',stages:[],no_active_heat_confirmed:true}});
const rows=[make('wb-901',['crustacean']),make('wb-902',['mollusc']),make('wb-903',['fish'])];
test('shellfish includes either group, seafood also includes fish',()=>{
  assert.deepEqual(rows.map(r=>recipeContains(r,'shellfish')),[true,true,false]);
  assert.ok(rows.every(r=>recipeContains(r,'seafood')));
  assert.equal(recommend(rows,{allergens:['shellfish']}).selected.recipe.recipe_id,'wb-903');
  assert.equal(recommend(rows,{allergens:['seafood']}).status,'no_match');
  assert.equal(recommend(rows,{preferredIngredients:['shellfish']}).candidates.length,2);
});
test('spelling variants and narrower shellfish phrases retain their meaning',()=>{
  for(const s of ['shellfish','shell fish','shell-fish'])assert.deepEqual(extractTerms(s),['shellfish']);
  for(const s of ['mollusc','mollusk','mollusks','molluscs','oysters'])assert.deepEqual(extractTerms(s),['mollusc']);
  assert.deepEqual(extractTerms('crustacean shellfish'),['crustacean']);
  assert.deepEqual(extractTerms('molluscan shellfish'),['mollusc']);
});
test('allergy, exclusion, model intent, persistence and correction use group semantics',()=>{
  const first=handleTurn('I am allergic to shellfish',newConversation(),[]);
  assert.deepEqual(first.state.allergens,['shellfish']);
  assert.deepEqual(first.state.unrecognizedAllergens,[]);
  const next=handleTurn('another one',first.state,[]);
  assert.deepEqual(validateState(next.state).allergens,['shellfish']);
  assert.deepEqual(handleTurn('not allergic to shellfish',next.state,[]).state.allergens,[]);
  assert.deepEqual(handleTurn('no shellfish',newConversation(),[]).state.excludedIngredients,['shellfish']);
  assert.deepEqual(handleTurn('海鲜过敏',newConversation(),[]).state.allergens,['seafood']);
  assert.deepEqual(handleTurn('hello',newConversation(),[],{allergy_terms:['shellfish']}).state.allergens,['shellfish']);
});
