/** Food-name screening and transparent ranking, not allergy certification. */
export const HEAT_WEIGHTS={boil:1,steam:1,pan_fry:2,bake:3,grill:3};
export const TEMPERATURE_ORDER={cold:0,room:1,hot:2};
export const RETIRED=['wb-002','wb-019','wb-027'];
export const norm=v=>String(v||'').normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/g,'d').toLowerCase();
export const CUISINES={
  vietnamese:['越南','vietnamese','vietnam','viet nam'],italian:['意大利','意式','italian','italiana','italiano'],
  english:['英格兰','英格蘭','英国菜','english'],indian:['印度','indian'],chinese:['中国菜','中國菜','中餐','中式','chinese'],
  malaysian:['马来西亚','馬來西亞','malaysian'],greek:['希腊','希臘','greek'],international:['国际菜','國際菜','international']
};
export const FOOD_TERMS={
  peanut:['花生','peanut','peanuts','arachidi','đậu phộng','lạc'],
  milk:['奶','牛奶','乳制品','milk','dairy','latte','sữa'],egg:['蛋','鸡蛋','egg','eggs','yolk','uova','trứng'],
  wheat:['小麦','麵粉','面粉','wheat','grano','semolina'],soy:['大豆','黄豆','豆腐','soy','soya','tofu','soia'],
  sesame:['芝麻','sesame','sesamo'],fish:['鱼','魚','fish','pesce','anchovy','salmon','catfish'],
  crustacean:['虾蟹','虾','蝦','蟹','虾米','shrimp','shrimps','prawn','prawns','crab','gamberi','crustaceans'],
  mollusc:['软体贝类','贝类','貝類','鱿鱼','squid','clam','mussel','mollusc','mollusk','molluscs'],
  almond:['杏仁','almond','almonds','mandorle'],cashew:['腰果','cashew','cashews'],
  walnut:['核桃','walnut','walnuts'],pine_nut:['松子','pine nut','pine nuts','pinoli'],
  hazelnut:['榛子','hazelnut','hazelnuts'],pistachio:['开心果','開心果','pistachio','pistachios'],
  macadamia:['夏威夷果','macadamia','macadamias'],brazil_nut:['巴西坚果','brazil nut','brazil nuts'],
  pecan:['碧根果','pecan','pecans'],oats:['燕麦','燕麥','oat','oats'],barley:['大麦','大麥','barley'],
  rye:['黑麦','黑麥','rye'],lupin:['羽扇豆','lupin'],sulphites:['亚硫酸盐','亞硫酸鹽','sulphite','sulphites','sulfite','sulfites'],
  mango:['芒果','mango','mangos','mangoes','xoài'],cucumber:['黄瓜','黃瓜','青瓜','cucumber','cucumbers','cetriolo','dưa chuột'],
  tomato:['番茄','西红柿','西紅柿','tomato','tomatoes','pomodoro','pomodori'],
  coconut:['椰子','椰奶','椰浆','椰漿','椰蓉','coconut','coconuts','cocco'],
  strawberry:['草莓','strawberry','strawberries','fragola','fragole'],kiwi:['猕猴桃','獼猴桃','奇异果','奇異果','kiwi','kiwifruit'],
  pineapple:['菠萝','菠蘿','凤梨','鳳梨','pineapple','ananas'],banana:['香蕉','banana','bananas'],
  lychee:['荔枝','lychee','lychees','litchi'],peach:['桃子','peach','peaches'],apple:['苹果','蘋果','apple','apples'],
  avocado:['牛油果','鳄梨','avocado','avocados'],dragon_fruit:['火龙果','火龍果','dragon fruit','pitaya'],
  garlic:['大蒜','蒜','garlic','aglio'],onion:['洋葱','洋蔥','onion','onions','cipolla'],
  chili:['辣椒','chilli','chili','chile','jalapeno','jalapeño','jalapenos','cayenne','red pepper flakes'],coriander:['香菜','芫荽','coriander','cilantro','coriandolo'],
  chicken:['鸡肉','雞肉','chicken','pollo'],pork:['猪肉','豬肉','pork','maiale','sausage'],beef:['牛肉','beef','manzo'],
  rice:['米饭','米飯','大米','糯米','rice','riso'],mung_bean:['绿豆','綠豆','mung bean','mung beans'],
  lotus_seed:['莲子','蓮子','lotus seed','lotus seeds'],lily:['百合','lily'],goji:['枸杞','goji','wolfberry'],
  sugar:['糖','砂糖','冰糖','sugar','zucchero'],
  yogurt:['酸奶','酸乳','yogurt','yoghurt'],watermelon:['西瓜','watermelon'],
  blueberry:['蓝莓','藍莓','blueberry','blueberries'],cherry:['樱桃','櫻桃','cherry','cherries'],
  fig:['无花果','無花果','fig','figs'],papaya:['木瓜','papaya','papayas','pawpaw'],
  cantaloupe:['哈密瓜','cantaloupe'],honeydew:['蜜瓜','honeydew'],
  nectarine:['油桃','nectarine','nectarines'],pear:['梨','pear','pears'],
  plum:['李子','plum','plums'],grape:['葡萄','grape','grapes'],
  pomegranate:['石榴','pomegranate'],cranberry:['蔓越莓','cranberry','cranberries'],
  raisin:['葡萄干','葡萄乾','raisin','raisins'],orange:['橙子','橙','orange','oranges'],
  lemon:['柠檬','檸檬','lemon','lemons'],lime:['青柠','青檸','lime','limes'],
  spinach:['菠菜','spinach'],kale:['羽衣甘蓝','羽衣甘藍','kale'],
  lettuce:['生菜','lettuce','romaine'],celery:['芹菜','celery'],
  carrot:['胡萝卜','胡蘿蔔','carrot','carrots'],cabbage:['卷心菜','包菜','cabbage'],
  bell_pepper:['甜椒','彩椒','bell pepper','bell peppers'],
  ginger:['生姜','生薑','ginger'],mint:['薄荷','mint'],basil:['罗勒','羅勒','basil'],
  parsley:['欧芹','歐芹','parsley'],thyme:['百里香','thyme'],shallot:['红葱头','紅蔥頭','shallot','shallots'],
  potato:['土豆','马铃薯','potato','potatoes'],chickpea:['鹰嘴豆','鷹嘴豆','chickpea','chickpeas','garbanzo'],
  lentil:['扁豆','lentil','lentils'],corn:['玉米','corn'],
  chia:['奇亚籽','奇亞籽','chia'],maca:['玛卡','瑪卡','maca'],
  honey:['蜂蜜','honey'],agave:['龙舌兰糖浆','agave'],
  cinnamon:['肉桂','cinnamon'],nutmeg:['肉豆蔻','nutmeg'],cumin:['孜然','cumin'],
  vanilla:['香草精','vanilla'],olive_oil:['橄榄油','橄欖油','olive oil'],
  cheese:['奶酪','芝士','cheese','feta','burrata','mozzarella','parmesan'],
  cream:['奶油','cream'],bread:['面包','麵包','bread','baguette'],
  pasta:['意面','意大利面','pasta','spaghetti','orzo'],vinegar:['醋','vinegar'],
  tofu:['豆腐','tofu'],soy_milk:['豆奶','豆浆','豆漿','soy milk','soya milk'],
  almond_milk:['杏仁奶','almond milk','almondmilk'],coconut_milk:['椰奶','椰浆','椰漿','coconut milk'],
  coconut_water:['椰子水','coconut water'],peanut_butter:['花生酱','花生醬','peanut butter'],
  mustard:['芥末','mustard'],black_pepper:['黑胡椒','black pepper'],salt:['盐','鹽','salt'],
  cooked_chicken:['熟鸡肉','熟雞肉','cooked chicken'],canned_chickpea:['罐装鹰嘴豆','罐裝鷹嘴豆','canned chickpeas'],
  arugula:['芝麻菜','火箭菜','arugula','rocket'],broccoli:['西兰花','西蘭花','broccoli'],
  quinoa:['藜麦','藜麥','quinoa'],freekeh:['青麦','freekeh'],persimmon:['柿子','persimmon'],
  passion_fruit:['百香果','passion fruit','passion fruits'],apricot:['杏子','apricot'],
  raspberry:['树莓','覆盆子','raspberry'],lemon_balm:['柠檬香蜂草','lemon balm','melissa'],
  poppy_seed:['罂粟籽','罌粟籽','poppy seed','poppy seeds'],cocoa:['可可粉','可可','cocoa'],
  pinto_bean:['斑豆','pinto bean','pinto beans'],kidney_bean:['红腰豆','紅腰豆','kidney bean','kidney beans'],
  black_bean:['黑豆','black bean','black beans'],white_bean:['白豆','white bean','white beans'],
  halloumi:['哈罗米','halloumi'],cream_cheese:['奶油奶酪','cream cheese'],
  gelatin:['明胶','明膠','gelatin','gelatine','jell-o'],marshmallow:['棉花糖','marshmallow','marshmallows'],
  mayonnaise:['蛋黄酱','蛋黃醬','mayonnaise'],ice_cream:['冰淇淋','ice cream'],
  maple_syrup:['枫糖浆','楓糖漿','maple syrup'],bacon:['培根','bacon'],
  hard_boiled_egg:['水煮蛋','熟鸡蛋','hard boiled egg','hard-boiled egg','hard-boiled eggs','hard boiled eggs'],
  cooked_rice:['熟米饭','熟米飯','cooked rice','cooked brown rice'],
  smoked_salmon:['烟熏三文鱼','煙燻鮭魚','smoked salmon'],
  condensed_milk:['炼乳','煉乳','condensed milk'],evaporated_milk:['淡奶','evaporated milk'],
  tahini:['芝麻酱','芝麻醬','tahini'],cornstarch:['玉米淀粉','玉米澱粉','cornstarch'],
  corn_chips:['玉米片','corn chips'],pickles:['腌黄瓜','醃黃瓜','pickles']
};
export function contains(text,word){
  text=norm(text);word=norm(word);
  return /[\u3400-\u9fff]/u.test(word)?text.includes(word):new RegExp('(^|[^a-z])'+word+'($|[^a-z])','u').test(text);
}
export const foodLabel=id=>({mung_bean:'mung beans',lotus_seed:'lotus seeds',lily:'lily bulbs',goji:'goji berries',crustacean:'crustaceans',mollusc:'molluscs'}[id]||id.replaceAll('_',' '));
export const extractTerms=text=>{
  // Plant milks must not accidentally introduce the dairy constraint.
  const withoutPlantMilk=norm(text).replace(/coconut milk|almond ?milk|soy milk|soya milk|椰奶|椰浆|椰漿|杏仁奶|豆奶|豆浆|豆漿/gu,'');
  const scoped={milk:withoutPlantMilk,grape:norm(text).replace(/grape tomatoes/gu,''),cherry:norm(text).replace(/cherry tomatoes/gu,''),cream:norm(text).replace(/cream of tartar|cream of coconut/gu,'')};
  return Object.entries(FOOD_TERMS).filter(([id,a])=>a.some(w=>contains(scoped[id]??text,w))).map(([id])=>id);
};
export function heatLevel(methods){return [...new Set(methods)].reduce((n,m)=>{if(!(m in HEAT_WEIGHTS))throw Error('Unknown heat method');return n+HEAT_WEIGHTS[m];},0);}
// v1 heatLevel is retained only for historical data compatibility.
// These are tunable product weights, not watts, calories or clinical evidence.
export const COOKING_HEAT_POLICY=Object.freeze({version:'cooking-heat-v2',scale:60,
  weights:Object.freeze({boil:1,simmer:0.7,steam:1,pan_fry:2,dry_toast:0.8,bake:2.5,grill:3,microwave:0.4}),
  // [minimum, central, maximum] minutes, used ONLY when the duration is unknown.
  defaults:Object.freeze({boil:[5,20,60],simmer:[5,20,60],steam:[5,20,60],pan_fry:[2,10,30],dry_toast:[1,3,8],bake:[10,25,60],grill:[5,15,45],microwave:[1,3,10]})});
export function cookingHeat(recipe){
  const p=recipe.cooking_heat_profile;
  let stages,coverage;
  if(p){
    if(p.version!==COOKING_HEAT_POLICY.version||!Array.isArray(p.stages))throw Error('Invalid cooking heat profile');
    if(!p.stages.length&&p.no_active_heat_confirmed!==true)throw Error('Unconfirmed no-heat recipe');
    if(p.stages.length&&p.no_active_heat_confirmed===true)throw Error('Contradictory no-heat annotation');
    stages=p.stages;coverage=p.coverage||'annotated';
  }else{
    // Missing data is never silently interpreted as zero heat.
    if(!Array.isArray(recipe.heating_methods))throw Error('Missing heating methods');
    if(!recipe.heating_methods.length)throw Error('No-heat recipes require an explicit profile');
    stages=[...new Set(recipe.heating_methods)].map((method,i)=>({id:'legacy-'+i,method,basis:'assumed',note:'Method-only fallback; duration and stage coverage are unverified.'}));
    coverage='method_only';
  }
  let energy=0,low=0,high=0;
  const seen=new Set(),breakdown=[];
  for(const s of stages){
    if(typeof s.id!=='string'||!s.id||seen.has(s.id))throw Error('Missing or duplicate heat stage ID');
    seen.add(s.id);
    if(!Object.hasOwn(COOKING_HEAT_POLICY.weights,s.method))throw Error('Unknown cooking heat method');
    if(!['source','assumed'].includes(s.basis))throw Error('Unknown heat duration basis');
    let minutes=s.minutes;
    if(minutes===undefined&&s.basis==='assumed')minutes=COOKING_HEAT_POLICY.defaults[s.method];
    if(!Array.isArray(minutes)||minutes.length!==3||minutes.some(t=>!Number.isFinite(t)||t<=0)||minutes[0]>minutes[1]||minutes[1]>minutes[2])throw Error('Invalid active heating duration');
    if(s.basis==='source'&&(!Array.isArray(s.evidence)||!s.evidence.length))throw Error('Source duration requires evidence');
    const w=COOKING_HEAT_POLICY.weights[s.method];
    low+=w*minutes[0];energy+=w*minutes[1];high+=w*minutes[2];
    breakdown.push({...s,minutes:[...minutes],weight:w,weighted_minutes:w*minutes[1]});
  }
  const transform=e=>100*e/(e+COOKING_HEAT_POLICY.scale),round=n=>Math.round(n*10)/10;
  const estimated=coverage==='method_only'||breakdown.some(s=>s.basis==='assumed');
  return {version:COOKING_HEAT_POLICY.version,value:round(transform(energy)),
    ranking_value:transform(energy),range:[round(transform(low)),round(transform(high))],
    weighted_minutes:round(energy),estimated,coverage,breakdown,
    scope:'Active heating in the listed preparation, including annotated warm-up; excludes chilling, resting and manufacture of prepared ingredients.'};
}
export function heatExplanation(h){
  return 'Cooking heat '+h.value+'/100'+(h.estimated?' (estimated; scenario range '+h.range[0]+'–'+h.range[1]+')':h.range[0]!==h.range[1]?' (recipe duration range '+h.range[0]+'–'+h.range[1]+')':'')+
    '. '+(h.breakdown.length?'Based on '+h.breakdown.map(s=>s.method.replaceAll('_',' ')+' '+s.minutes[1]+' min'+(s.basis==='assumed'?' (assumed)':'')+' × '+s.weight).join('; ')+'.':'No active heating in the listed preparation.')+
    ' This is a relative preparation score, not a measured temperature or health rating.';
}
const STANDARD=Object.keys(FOOD_TERMS).slice(0,Object.keys(FOOD_TERMS).indexOf('mango'));
export function recipeContains(recipe,id){
  if(recipe.allergen_ids.includes(id))return true;
  if(recipe.ingredient_ids)return recipe.ingredient_ids.includes(id);
  // Preserve annotations that distinguish coconut milk from dairy, for example.
  if(STANDARD.includes(id)||!FOOD_TERMS[id])return false;
  const text=recipe.ingredients.map(b=>b.text).join('\n');
  return FOOD_TERMS[id].some(a=>contains(text,a));
}
/** Only expose ingredients that can actually retrieve a standalone active dish. */
export function ingredientOptions(records){
  return Object.keys(FOOD_TERMS).map(id=>({id,label:foodLabel(id),recipe_ids:records.filter(r=>r.eligible_for_product_prototype&&r.standalone_dish&&!RETIRED.includes(r.recipe_id)&&recipeContains(r,id)).map(r=>r.recipe_id)})).filter(x=>x.recipe_ids.length).sort((a,b)=>a.label.localeCompare(b.label));
}
export function recommend(records,request={}){
  const out={selected:null,candidates:[],excluded:[],status:'no_match'};
  if(request.retiredRequested||RETIRED.includes(request.recipeId))return {...out,status:'retired',message:"This recipe has been removed from the collection."};
  const invalid=[...(request.unrecognizedAllergens||[]),...(request.allergens||[]).filter(id=>!FOOD_TERMS[id])];
  if(invalid.length)return {...out,status:'needs_clarification',message:"Please clarify the ingredient name or English alias for \""+invalid.join(', ')+"\" here in the chat. I will keep your other preferences."};
  for(const recipe of records){
    let reason;
    if(!recipe.eligible_for_product_prototype||RETIRED.includes(recipe.recipe_id))reason='retired';
    else if(request.recipeId&&recipe.recipe_id!==request.recipeId)reason='different_recipe';
    else if(request.cuisine&&recipe.cuisine_id!==request.cuisine)reason='different_cuisine';
    else if(request.dishType&&recipe.dish_type!==request.dishType)reason='different_dish_type';
    else if(!request.recipeId&&!request.dishType&&!recipe.standalone_dish)reason='component_not_requested';
    else if((request.allergens||[]).some(id=>recipeContains(recipe,id)))reason='allergen_conflict';
    else if((request.excludedIngredients||[]).some(id=>recipeContains(recipe,id)))reason='excluded_ingredient';
    else if(request.allergens?.length&&recipe.unresolved_compound_ingredients.length)reason='compound_label_unverified';
    else if(request.temperature&&recipe.product_temperature!==request.temperature)reason='different_temperature';
    else if(request.avoidHot&&recipe.product_temperature==='hot')reason='avoid_hot';
    else if(request.noActiveHeat&&!recipe.cooking_heat_profile?.no_active_heat_confirmed)reason='requires_active_heat';
    else if((request.preferredIngredients||[]).some(id=>!recipeContains(recipe,id)))reason='missing_requested_ingredient';
    else if((request.excludeIds||[]).includes(recipe.recipe_id))reason='already_shown';
    if(reason){out.excluded.push({recipe_id:recipe.recipe_id,reason});continue;}
    const relevance=request.relevanceById?.[recipe.recipe_id]??100;
    if(!Number.isFinite(relevance))throw Error('Invalid relevance');
    const heatAssessment=cookingHeat(recipe),heat=heatAssessment.value;
    out.candidates.push({recipe,relevance,heat,heatAssessment,score:Math.round((relevance-heat)*10)/10,
      rankingScore:relevance-heatAssessment.ranking_value,temperatureRank:TEMPERATURE_ORDER[recipe.product_temperature]});
  }
  out.candidates.sort((a,b)=>a.temperatureRank-b.temperatureRank||b.rankingScore-a.rankingScore||a.heat-b.heat||a.recipe.recipe_id.localeCompare(b.recipe.recipe_id));
  out.selected=out.candidates[0]||null;out.status=out.selected?'ok':'no_match';return out;
}
