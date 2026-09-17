import {recommend,norm,CUISINES,FOOD_TERMS,extractTerms,contains,foodLabel,RETIRED} from './recommendation.mjs';
export const newConversation=()=>({cuisine:null,temperature:null,dishType:null,allergens:[],excludedIngredients:[],preferredIngredients:[],unrecognizedAllergens:[],shownIds:[],recipeId:null,lastRecipeId:null,avoidHot:false,turn:0});
const uniq=a=>[...new Set(a)];
const TEMP={cold:'冰食 / 冷食',room:'常温',hot:'热食'};
const CUISINE_LABEL={vietnamese:'越南菜',italian:'意大利菜',english:'英格兰菜',indian:'印度菜',chinese:'中国菜',malaysian:'马来西亚菜',greek:'希腊菜'};
const TYPE_LABEL={main:'主菜',side:'配菜',salad:'凉菜 / 沙拉',dessert:'甜点',beverage:'饮品',sauce:'酱汁',base:'基础配料'};
const TREE_NUTS=['almond','brazil_nut','cashew','hazelnut','macadamia','pecan','pistachio','pine_nut','walnut'];
function parseFoodList(text){
  let value=norm(text).trim();
  const broadNuts=/坚果|堅果|\bnuts?\b/u.test(value)&&!/\b(pine|brazil) nuts?\b/u.test(value);
  const ids=extractTerms(value);
  if(broadNuts){ids.push(...TREE_NUTS,'peanut');value=value.replace(/坚果|堅果|\bnuts?\b/gu,'');}
  for(const id of ids)for(const alias of [...FOOD_TERMS[id]].sort((a,b)=>b.length-a.length)){
    const a=norm(alias);
    if(/[\u3400-\u9fff]/u.test(a))value=value.replaceAll(a,'');
    else value=value.replace(new RegExp('(^|[^a-z])'+a+'(?=$|[^a-z])','gu'),'$1');
  }
  const unknown=value.replace(/我|本人|有|对|對|过敏原|過敏原|过敏|過敏|是|严重|嚴重|只有|还有|還有|以及|和|或者|也|都|的|一点|一點|allergic to|allergy to|allergens?|allergies|i am|i'm|sono allergico a|sono allergica a|di ung|\band\b|\bor\b/gu,'')
    .replace(/[\s,，;；、：:。.?!！？()（）/+&]/gu,'').trim();
  return {ids:uniq(ids),unknown:unknown?[unknown]:[]};
}
export function parseTurn(text,previous=newConversation(),records=[]){
  const value=norm(text),patch={allergensAdd:[],allergensRemove:[],excludedAdd:[],preferred:[],unknown:[]};
  patch.reset=/^(重新开始|重新开始对话|新对话|新话题|清空对话|reset|new chat)$/u.test(value.trim());
  patch.another=/换一道|换一个|再来一道|还有别的|另一道|\banother\b|un altro/u.test(value);
  patch.why=/为什么|為什麼|怎么推荐|why|perche/u.test(value);
  for(const [id,aliases] of Object.entries(CUISINES))if(aliases.some(a=>contains(value,a)))patch.cuisine=id;
  if(/菜系不限|不限菜系|什么菜系都行|any cuisine/u.test(value))patch.cuisine=null;
  if(/冷热不限|冷熱不限|冷热都行|都可以|any temperature/u.test(value))patch.temperature=null;
  else if(/常温|常溫|room temperature|temperatura ambiente/u.test(value))patch.temperature='room';
  else if(/不要热|不要熱|不吃热|不吃熱|not hot/u.test(value))patch.avoidHot=true;
  else if(/(?:^|[，,;；\s])(?:热|熱)(?:$|[，,;；\s])|热食|热菜|熱食|熱菜|热的|熱的|hot food|hot meal|hot dish|cibo caldo|mon nong/u.test(value))patch.temperature='hot';
  else if(/(?:^|[，,;；\s])(?:冷|冰)(?:$|[，,;；\s])|冰食|冰饮|冰飲|冷食|冷菜|凉菜|涼菜|冷的|冰的|凉的|涼的|\bcold\b|\biced\b|cibo freddo|mon lanh/u.test(value))patch.temperature='cold';
  if(/甜点|甜品|甜點|dessert|dolce/u.test(value))patch.dishType='dessert';
  else if(/饮品|飲品|饮料|飲料|冰饮|冰飲|\bdrink\b|beverage/u.test(value))patch.dishType='beverage';
  else if(/沙拉|salad|insalata/u.test(value))patch.dishType='salad';
  else if(/主菜|main dish/u.test(value))patch.dishType='main';
  else if(/酱汁|醬汁|\bsauce\b/u.test(value))patch.dishType='sauce';
  if(/类型不限|類型不限|不要限制类型/u.test(value))patch.dishType=null;
  for(const clause of value.split(/[，,;；。!?！？]/u)){
    const allergy=/过敏|過敏|allerg|di ung/u.test(clause);
    if(allergy){
      const isRemoval=/不过敏|不過敏|没有.*过敏|沒有.*過敏|去掉.*过敏限制|取消.*过敏限制|not allergic/u.test(clause);
      const found=clause.match(/(?:对|對)(.+?)(?:不?过敏|不?過敏)/u)||clause.match(/(?:allergic to|allergy to|di ung|allergico a|allergica a)\s*(.+)/u);
      let food=found?.[1]||clause.replace(/(?:我|本人)?(?:的)?过敏原(?:是|有|为|為|:|：)?/u,'').replace(/(?:不?过敏|不?過敏).*$/u,'').replace(/^.*(?:只有|还有|還有)/u,'');
      const p=parseFoodList(food);
      if(isRemoval)patch.allergensRemove.push(...p.ids);
      else {patch.allergensAdd.push(...p.ids);patch.unknown.push(...p.unknown);if(!p.ids.length&&!p.unknown.length)patch.unknown.push('未注明名称的过敏原');}
      continue;
    }
    if(/不要|不吃|不加|去掉|without|senza/u.test(clause)){
      const terms=extractTerms(clause);
      patch.excludedAdd.push(...terms);
      if(/不要辣|不吃辣/u.test(clause))patch.excludedAdd.push('chili');
    }else if(/有|用|加入|加点|加點|想吃|with|using/u.test(clause)){
      patch.preferred.push(...extractTerms(clause));
    }
  }
  if(previous.unrecognizedAllergens?.length&&!/过敏|過敏|allerg|di ung/u.test(value)){
    const p=parseFoodList(value);
    if(p.ids.length&&!p.unknown.length){patch.allergensAdd.push(...p.ids);patch.resolvePending=true;}
  }
  if(/不限制食材|食材不限/u.test(value)){patch.preferred=[];patch.clearPreferred=true;}
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
  out.push(state.temperature?TEMP[state.temperature]:(state.avoidHot?'冷食 / 常温':'默认冰食优先'));
  if(state.dishType)out.push(TYPE_LABEL[state.dishType]);
  if(state.allergens.length)out.push('过敏：'+state.allergens.map(foodLabel).join('、'));
  if(state.excludedIngredients.length)out.push('不加：'+state.excludedIngredients.map(foodLabel).join('、'));
  if(state.preferredIngredients.length)out.push('包含：'+state.preferredIngredients.map(foodLabel).join('、'));
  return out;
}
export function handleTurn(text,previous,records,modelPatch=null){
  if(typeof text!=='string'||!text.trim()||text.length>4000)throw Error('请发送 1–4000 字的消息。');
  let state=structuredClone(previous||newConversation());
  const p=parseTurn(text,state,records);
  if(p.reset)return {state:newConversation(),status:'reset',reply:'新对话已开始。直接告诉我想吃什么、冷热偏好和过敏原即可。',selected:null,conditions:[],allergyNote:'如有过敏，请在聊天中注明。'};
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
  const allergyNote=(state.allergens.length?'已按 '+state.allergens.map(foodLabel).join('、')+' 筛除明确冲突的配方。':'如有过敏，请继续在聊天里注明。')+'请核对实际食材和调料包装及交叉接触；未检出不代表保证无过敏风险。';
  const base={state,conditions,allergyNote,selected:null,excluded:[],candidates:[]};
  if(p.reformulation)return {...base,status:'reformulation',reply:'已记下你的改配方要求。当前这版先提供来源明确的常规配方，尚未验证自由改写。你可以继续说“换一道”或指定想用的食材，我会保留过敏条件重新找菜。'};
  if(p.why&&state.lastRecipeId){
    const r=records.find(r=>r.recipe_id===state.lastRecipeId);
    if(r)return {...base,status:'explanation',reply:'上次按 '+conditions.join('；')+' 筛选，再按冷热档和热力排序。'+r.standard_recipe_label+' 属于 '+r.temperature_label+'，热力 '+r.heat_level+'，同档分数为 '+r.heat_score_at_full_relevance+'。'};
  }
  if(state.turn===1&&!p.cuisine&&!p.temperature&&!p.dishType&&!p.recipeId&&!p.allergensAdd.length&&!p.preferred.length&&!p.unknown.length&&!p.excludedAdd.length&&!modelPatch){
    return {...base,status:'clarification',reply:'可以直接告诉我你想吃什么，例如“中国菜，芒果过敏，冷”。想换菜或补充条件也直接在这里说。'};
  }
  const result=recommend(records,{...state,excludeIds:p.another?state.shownIds:[]});
  if(!result.selected){
    const reply=result.message||(p.another?'当前条件下没有更多常规配方了。可以直接说“改成常温”或“菜系不限”；我会保留你的过敏条件。':'当前库没有同时满足这些条件的常规配方。可以直接在这里调整冷热、菜系或类型，我会保留过敏条件。');
    return {...base,...result,reply,state,conditions,allergyNote};
  }
  const r=result.selected.recipe;
  state.lastRecipeId=r.recipe_id;state.shownIds=uniq([...state.shownIds,r.recipe_id]);
  const intro='按你目前的条件，'+(p.another?'换成':'先给你一份')+'「'+r.standard_recipe_label+'」。';
  return {...result,state,conditions,allergyNote,reply:intro,selected:result.selected};
}
