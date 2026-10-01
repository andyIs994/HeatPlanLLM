import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {FOOD_TERMS,extractTerms,ingredientOptions,foodLabel} from './recommendation.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rows=JSON.parse(fs.readFileSync(path.join(root,'data/recipes.json'),'utf8'));
const standard=Object.keys(FOOD_TERMS).slice(0,Object.keys(FOOD_TERMS).indexOf('mango'));
for(const r of rows){
  const found=extractTerms(r.ingredients.map(b=>b.text).join('\n')).filter(id=>!standard.includes(id));
  r.ingredient_ids=[...new Set([...r.allergen_ids,...found])].sort();
  r.ingredient_index_basis='ingredient_list_and_curated_allergen_annotations_only';
}
const options=ingredientOptions(rows);
const unsupported=Object.keys(FOOD_TERMS).filter(id=>!options.some(x=>x.id===id));
const report={generated_on:'2026-10-01',active_recipes:rows.length,recognized_terms:Object.keys(FOOD_TERMS).length,selectable_ingredients:options.length,zero_recipe_selectable_ingredients:0,recognition_only_terms:unsupported,ingredients:options.map(o=>({...o,aliases:FOOD_TERMS[o.id],recipe_count:o.recipe_ids.length,no_active_heat_recipe_ids:o.recipe_ids.filter(id=>rows.find(r=>r.recipe_id===id).cooking_heat_profile?.no_active_heat_confirmed)}))};
fs.writeFileSync(path.join(root,'data/recipes.json'),JSON.stringify(rows,null,2)+'\n');
fs.writeFileSync(path.join(root,'data/ingredient_catalog.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(root,'docs/INGREDIENT_COVERAGE.md'),'# Ingredient coverage\n\n'+`${rows.length} active recipes; ${options.length} selectable ingredients; ${Object.keys(FOOD_TERMS).length} recognised food identifiers.\n\n`+'Every selectable ingredient has at least one standalone active recipe. This does not guarantee a match after additional allergies or preferences. Recognition-only terms remain available for allergy/exclusion handling and are not offered as choices.\n\nRecognition only: '+unsupported.map(foodLabel).join(', ')+'.\n\n| Ingredient | Recipe count | Example |\n|---|---:|---|\n'+options.map(o=>`| ${o.label} | ${o.recipe_ids.length} | ${rows.find(r=>r.recipe_id===o.recipe_ids[0]).title} |`).join('\n')+'\n');
console.log(JSON.stringify({recipes:rows.length,recognized:report.recognized_terms,selectable:options.length,recognition_only:unsupported}));
