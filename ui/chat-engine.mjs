import {recommend,norm,CUISINES,FOOD_TERMS,extractTerms,contains,foodLabel,RETIRED,cookingHeat,heatExplanation} from './recommendation.mjs';
export const newConversation=()=>({cuisine:null,temperature:null,dishType:null,allergens:[],excludedIngredients:[],preferredIngredients:[],unrecognizedAllergens:[],shownIds:[],recipeId:null,lastRecipeId:null,avoidHot:false,noActiveHeat:false,turn:0});
export function usageHelp(chinese=false){
  return chinese
    ? '告诉我你有什么食材、想吃冷食还是热食，以及过敏或不吃的食材。例如：“我有燕麦，对牛奶过敏，想要不开火的食物。” 我会从已审核菜谱中筛选，默认优先冷食，并考虑制作时的用火量。你可以继续说“换一道”或修改偏好；点击 New chat 开始新对话。包装成分不确定时会提示核对，不会保证菜谱无过敏风险。目前提供常规菜谱，尚不支持自由改写配方。'
    : 'Tell me which ingredients you have, whether you want cold or hot food, and any allergies or ingredients to avoid. Try: “I have oats, I am allergic to milk, and I want no cooking.” I search reviewed recipes, favour cold food by default, and consider cooking heat. Say “Another one” or change your preferences to continue. Use New chat to start over. Unverified package ingredients need checking; a match is not a guarantee of allergy safety. This version provides standard recipes, not free-form recipe adaptations.';
}
export function isHelpRequest(text){return /怎么用|如何使用|怎么使用|使用方法|使用说明|how (?:do i|can i|to) use|how does (?:this|it) work|what can (?:you|this) do|^(?:help|帮助)[?？!！\s]*$/iu.test(text);}
const uniq=a=>[...new Set(a)];
const TEMP={cold:"Cold / chilled",room:"Room temperature",hot:"Hot"};
const CUISINE_LABEL={vietnamese:"Vietnamese",italian:"Italian",english:"English",indian:"Indian",chinese:"Chinese",malaysian:"Malaysian",greek:"Greek",international:"International"};
const TYPE_LABEL={main:"Main dish",side:"Side dish",salad:"Salad",dessert:"Dessert",beverage:"Drink",sauce:"Sauce",base:"Base ingredient"};
const TREE_NUTS=['almond','brazil_nut','cashew','hazelnut','macadamia','pecan','pistachio','pine_nut','walnut'];
function parseFoodList(text){
  let value=norm(text).trim();
  const broadNuts=/坚果|堅果|\bnuts?\b/u.test(value)&&!/\b(pine|brazil) nuts?\b/u.test(value);
  const ids=extractTerms(value);
  if(broadNuts){ids.push(...TREE_NUTS,'peanut');value=value.replace(/坚果|堅果|\bnuts?\b/gu,'');}
  for(const alias of ids.flatMap(id=>FOOD_TERMS[id]).sort((a,b)=>b.length-a.length)){
    const a=norm(alias);
    if(/[\u3400-\u9fff]/u.test(a))value=value.replaceAll(a,'');
    else value=value.replace(new RegExp('(^|[^a-z])'+a+'(?=$|[^a-z])','gu'),'$1');
  }
  const unknown=value.replace(/我|本人|有|对|對|过敏原|過敏原|过敏|過敏|是|严重|嚴重|只有|还有|還有|以及|和|或者|也|都|的|一点|一點|allergic to|allergy to|allergens?|\ballergy\b|allergies|i am|i'm|sono allergico a|sono allergica a|di ung|\band\b|\bor\b/gu,'')
    .replace(/[\s,，;；、：:。.?!！？()（）/+&]/gu,'').trim();
  return {ids:uniq(ids),unknown:unknown?[unknown]:[]};
}
export function parseTurn(text,previous=newConversation(),records=[]){
  const value=norm(text),patch={allergensAdd:[],allergensRemove:[],excludedAdd:[],preferred:[],unknown:[]};
  if(/不用开火|不開火|不开火|免开火|无需加热|無需加熱|no cooking|no heat|no stove|without cooking|no oven/u.test(value))patch.noActiveHeat=true;
  if(/允许开火|可以开火|cooking is okay|heating is okay/u.test(value))patch.noActiveHeat=false;
  patch.reset=/^(重新开始|重新开始对话|新对话|新话题|清空对话|reset|new chat)$/u.test(value.trim());
  patch.another=/换一道|换一个|再来一道|还有别的|另一道|\banother\b|something else|different (?:recipe|dish)|un altro/u.test(value);
  patch.why=/为什么|為什麼|怎么推荐|why|perche/u.test(value);
  for(const [id,aliases] of Object.entries(CUISINES))if(aliases.some(a=>contains(value,a)))patch.cuisine=id;
  if(/菜系不限|不限菜系|什么菜系都行|any cuisine/u.test(value))patch.cuisine=null;
  if(/冷热不限|冷熱不限|冷热都行|都可以|any temperature/u.test(value))patch.temperature=null;
  else if(/常温|常溫|room temperature|temperatura ambiente/u.test(value))patch.temperature='room';
  else if(/不要热|不要熱|不吃热|不吃熱|not hot|(?:do not|don't) want (?:anything )?hot/u.test(value))patch.avoidHot=true;
  else if(/(?:^|[，,;；\s])(?:热|熱)(?:$|[，,;；\s])|热食|热菜|熱食|熱菜|热的|熱的|(?:^|[,;]\s*)hot$|make it hot|serve it hot|something hot|hot food|hot meal|hot dish|cibo caldo|mon nong/u.test(value))patch.temperature='hot';
  else if(/(?:^|[，,;；\s])(?:冷|冰)(?:$|[，,;；\s])|冰食|冰饮|冰飲|冷食|冷菜|凉菜|涼菜|冷的|冰的|凉的|涼的|\bcold\b|\biced\b|cibo freddo|mon lanh/u.test(value))patch.temperature='cold';
  if(/甜点|甜品|甜點|dessert|dolce/u.test(value))patch.dishType='dessert';
  else if(/饮品|飲品|饮料|飲料|冰饮|冰飲|\bdrink\b|beverage/u.test(value))patch.dishType='beverage';
  else if(/沙拉|salad|insalata/u.test(value))patch.dishType='salad';
  else if(/主菜|main dish/u.test(value))patch.dishType='main';
  else if(/酱汁|醬汁|\bsauce\b/u.test(value))patch.dishType='sauce';
  if(/类型不限|類型不限|不要限制类型|any dish type/u.test(value))patch.dishType=null;
  const clauses=value.replace(/\s+(?:and|but)\s+(?=(?:i\s+(?:am|'m)\s+)?(?:not\s+)?allergic\b)/gu,',');
  for(const clause of clauses.split(/[，,;；。!?！？]/u)){
    const allergy=/过敏|過敏|allerg|di ung/u.test(clause);
    if(allergy){
      const isRemoval=/不过敏|不過敏|没有.*过敏|沒有.*過敏|去掉.*过敏限制|取消.*过敏限制|not allergic/u.test(clause);
      const found=clause.match(/(?:对|對)(.+?)(?:不?过敏|不?過敏)/u)||clause.match(/(?:allergic to|allergy to|di ung|allergico a|allergica a)\s*(.+)/u);
      let food=found?.[1]||clause.replace(/(?:我|本人)?(?:的)?过敏原(?:是|有|为|為|:|：)?/u,'').replace(/(?:不?过敏|不?過敏).*$/u,'').replace(/^.*(?:只有|还有|還有)/u,'');
      const p=parseFoodList(food);
      if(isRemoval)patch.allergensRemove.push(...p.ids);
      else {patch.allergensAdd.push(...p.ids);patch.unknown.push(...p.unknown);if(!p.ids.length&&!p.unknown.length)patch.unknown.push("an unnamed allergen");}
      continue;
    }
    if(/不要|不吃|不加|去掉|without|\bavoid\b|\bno\s+|senza/u.test(clause)){
      const terms=extractTerms(clause);
      patch.excludedAdd.push(...terms);
      if(/不要辣|不吃辣/u.test(clause))patch.excludedAdd.push('chili');
    }else if(/有|用|加入|加点|加點|想吃|\bhave\b|\binclude\b|with|using/u.test(clause)||extractTerms(clause).length&&parseFoodList(clause).unknown.length===0){
      patch.preferred.push(...extractTerms(clause));
    }
  }
  if(previous.unrecognizedAllergens?.length&&!/过敏|過敏|allerg|di ung/u.test(value)){
    const p=parseFoodList(value);
      if(p.ids.length&&!p.unknown.length){patch.allergensAdd.push(...p.ids);patch.resolvePending=true;patch.preferred=[];}
  }
  if(/不限制食材|食材不限|any ingredients|no ingredient preference/u.test(value)){patch.preferred=[];patch.clearPreferred=true;}
  if(/不限制忌口|取消忌口/u.test(value))patch.clearExclusions=true;
  for(const r of records){
    const name=norm(r.title.replace(/\s*\([^)]*\)/gu,'').trim());
    if(name.length>2&&value.includes(name))patch.recipeId=r.recipe_id;
  }
  for(const [alias,id] of Object.entries({'nuoc mam':'wb-014','egg soda':'wb-007','cao lau':'wb-005','bo bia':'wb-003','banh mi':'wb-001','banh chung':'wb-002','minestrone alla capucina':'wb-027','pasta marinata':'wb-019'})){
    if(value.includes(alias))patch.recipeId=id;
  }
  // Intents requiring a real reformulation must not silently return an unchanged recipe.
  patch.reformulation=/少糖|减糖|減糖|无糖|無糖|换成.*奶|替换|替換|改成.*烤|改成.*煮|less sugar|sugar.free|replace|vegan|纯素|純素/u.test(value);
  return patch;
}
export function conditionLabels(state){
  const out=[];
  if(state.cuisine)out.push(CUISINE_LABEL[state.cuisine]);
  out.push(state.temperature?TEMP[state.temperature]:(state.avoidHot?"Cold / room temperature":"Cold dishes first"));
  if(state.dishType)out.push(TYPE_LABEL[state.dishType]);
  if(state.noActiveHeat)out.push('No active heating in listed preparation');
  if(state.allergens.length)out.push("Allergies: "+state.allergens.map(foodLabel).join(', '));
  if(state.excludedIngredients.length)out.push("Avoid: "+state.excludedIngredients.map(foodLabel).join(', '));
  if(state.preferredIngredients.length)out.push("Include: "+state.preferredIngredients.map(foodLabel).join(', '));
  return out;
}
export function handleTurn(text,previous,records,modelPatch=null){
  if(typeof text!=='string'||!text.trim()||text.length>4000)throw Error("Please send a message between 1 and 4,000 characters.");
  let state=structuredClone(previous||newConversation());
  if(isHelpRequest(text)||modelPatch?.wants_help===true)return {state,status:'help',reply:usageHelp(/[\u3400-\u9fff]/u.test(text)),selected:null,conditions:conditionLabels(state),allergyNote:'',candidates:[],excluded:[]};
  const p=parseTurn(text,state,records);
  if(p.reset)return {state:newConversation(),status:'reset',reply:"A new chat has started. Tell me what you would like to eat, your serving-temperature preference and any allergies.",selected:null,conditions:[],allergyNote:"Please mention any allergies in the chat."};
  // Model fills interpreted preferences; local explicit preferences win. Allergy terms only accumulate.
  if(modelPatch){
    for(const k of ['cuisine','temperature','dishType'])if(p[k]===undefined&&modelPatch[k])p[k]=modelPatch[k];
    for(const term of modelPatch.allergy_terms||[]){
      const parsed=parseFoodList(term);p.allergensAdd.push(...parsed.ids);p.unknown.push(...parsed.unknown);
    }
    for(const term of modelPatch.exclude_terms||[])p.excludedAdd.push(...extractTerms(term));
    for(const term of modelPatch.prefer_terms||[])p.preferred.push(...extractTerms(term));
    p.another ||= modelPatch.wants_another===true;
  }
  const hasChangedPreferences=['cuisine','temperature','dishType'].some(k=>p[k]!==undefined&&p[k]!==state[k])||p.preferred.length>0;
  if(hasChangedPreferences){state.shownIds=[];state.recipeId=null;}
  for(const k of ['cuisine','temperature','dishType'])if(p[k]!==undefined)state[k]=p[k];
  if(p.temperature!==undefined)state.avoidHot=false;
  if(p.avoidHot){state.avoidHot=true;if(state.temperature==='hot')state.temperature=null;}
  if(p.noActiveHeat!==undefined)state.noActiveHeat=p.noActiveHeat;
  state.allergens=uniq([...state.allergens,...p.allergensAdd]).filter(id=>!p.allergensRemove.includes(id));
  state.excludedIngredients=p.clearExclusions?[]:uniq([...state.excludedIngredients,...p.excludedAdd]);
  if(p.clearPreferred)state.preferredIngredients=[];
  else if(p.preferred.length)state.preferredIngredients=uniq(p.preferred);
  if(p.resolvePending)state.unrecognizedAllergens=[];
  state.unrecognizedAllergens=uniq([...state.unrecognizedAllergens,...p.unknown]);
  if(p.recipeId)state.recipeId=p.recipeId;
  if(p.another)state.recipeId=null;
  state.turn++;
  const conditions=conditionLabels(state);
  const allergyNote=(state.allergens.length?"Recipes with identified conflicts have been excluded for: "+state.allergens.map(foodLabel).join(', ')+". ":"Please mention any allergies as we chat. ")+"Check ingredient and seasoning labels and possible cross-contact; no detected conflict is not a guarantee of allergy safety.";
  const base={state,conditions,allergyNote,selected:null,excluded:[],candidates:[]};
  if(p.reformulation)return {...base,status:'reformulation',reply:"I have noted your request to adapt the recipe. This preview uses standard recipes from the source collection; free-form adaptations have not been validated. Say \"Another one\" or name an ingredient to find a different recipe while keeping your allergy restrictions."};
  if(p.why&&state.lastRecipeId){
    const r=records.find(r=>r.recipe_id===state.lastRecipeId);
    if(r)return {...base,status:'explanation',reply:"The previous recommendation used "+conditions.join('; ')+", then serving temperature and cooking heat. "+r.standard_recipe_label+" is served "+r.temperature_label+'. '+heatExplanation(cookingHeat(r))};
  }
  if(state.turn===1&&!p.cuisine&&!p.temperature&&!p.dishType&&!p.recipeId&&!p.allergensAdd.length&&!p.preferred.length&&!p.unknown.length&&!p.excludedAdd.length&&!modelPatch){
    return {...base,status:'clarification',reply:"Tell me what you would like, for example: \"Chinese food, mango allergy, cold.\" You can ask for another recipe or add preferences here."};
  }
  const result=recommend(records,{...state,excludeIds:p.another?state.shownIds:[]});
  if(!result.selected){
    // Explain viable label-check candidates without treating unknown labels as safe.
    if(result.status==='no_match'&&state.allergens.length){
      const blocked=new Set(result.excluded.filter(x=>x.reason==='compound_label_unverified').map(x=>x.recipe_id));
      const preview=recommend(records.filter(r=>blocked.has(r.recipe_id)).map(r=>({...r,unresolved_compound_ingredients:[]})),{...state,excludeIds:p.another?state.shownIds:[]});
      if(preview.selected){
        const original=records.find(r=>r.recipe_id===preview.selected.recipe.recipe_id);
        const reply='A relevant recipe is '+original.standard_recipe_label+'. Its listed ingredients are: '+original.ingredients.map(i=>i.text).join('; ')+'. No declared '+state.allergens.map(foodLabel).join(', ')+' conflict was found, but it is not cleared for recommendation. Check these package/preparation details first: '+original.unresolved_compound_ingredients.join('; ')+'. Check for your allergens and cross-contact warnings; follow any cooking instructions on frozen produce. The recipe remains unverified until these details are checked.';
        return {...base,...result,reply,state,conditions,allergyNote};
      }
    }
    const reply=result.message||(p.another?"There are no more standard recipes matching these preferences. Try \"Make it room temperature\" or \"Any cuisine\"; I will keep your allergy restrictions.":"The collection has no standard recipe matching all these preferences. Change the temperature, cuisine or dish type here; I will keep your allergy restrictions.");
    return {...base,...result,reply,state,conditions,allergyNote};
  }
  const r=result.selected.recipe;
  state.lastRecipeId=r.recipe_id;state.shownIds=uniq([...state.shownIds,r.recipe_id]);
  const intro="Based on your current preferences, "+(p.another?"here is another option: ":"here is a standard recipe: ")+""+r.standard_recipe_label+".";
  return {...result,state,conditions,allergyNote,reply:intro,selected:result.selected};
}
