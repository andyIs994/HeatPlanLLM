"""Reproducible English presentation of the frozen v0.4 chat prototype."""
import argparse,copy,json,re,shutil,sys
from pathlib import Path
from translations_en import TEXT,STRINGS
ROOT=Path(__file__).resolve().parent
CJK=re.compile(r'[\u3400-\u9fff]')
CUISINE={'vietnamese':'Vietnamese','italian':'Italian','english':'English','indian':'Indian','chinese':'Chinese','malaysian':'Malaysian','greek':'Greek'}
TEMP={'cold':'Cold / chilled','room':'Room temperature','hot':'Hot'}
ROLE={'main':'Main dish','side':'Side dish','salad':'Salad','dessert':'Dessert','beverage':'Drink','sauce':'Sauce','base':'Base ingredient'}
HEAT={'boil':'Boiling / simmering / poaching','steam':'Steaming','pan_fry':'Pan-frying / stir-frying / dry-toasting','bake':'Oven baking','grill':'Grilling'}
def translated(text):
    if not text or not CJK.search(text):return text
    if text not in TEXT:raise ValueError('Missing English translation: '+text)
    return TEXT[text]
def dump(p,obj):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def localize_code(code):
    for zh,en in sorted(STRINGS.items(),key=lambda item:-len(item[0])):
        code=code.replace("'"+zh+"'",json.dumps(en,ensure_ascii=False))
    code=code.replace(".join('、')",".join(', ')").replace(".join('；')",".join('; ')").replace(".join('，')",".join(', ')").replace("'。'","'.'")
    return code
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--source',type=Path);ap.add_argument('--output',required=True,type=Path);args=ap.parse_args()
    out=args.output.resolve()
    if out==ROOT.parent.resolve():raise ValueError('Rebuild into a separate directory, not the current project.')
    out.mkdir(parents=True,exist_ok=True)
    inputs=ROOT/'input' if (ROOT/'input').exists() or args.source else ROOT.parent/'input'
    files=['data/recipes.json','templates/preview.html','ui/chat.css','ui/RecipeChatbox.vue','pipeline/LICENSE','pipeline/test_v4.mjs',
           'pipeline/chat-engine.mjs','pipeline/chat-ui.mjs','pipeline/recommendation.mjs','pipeline/groq.mjs','pipeline/server.mjs',
           'input/recipes_v2.jsonl','ATTRIBUTION_AND_LICENSE.md','RESPONSE_CONTRACT.md']
    if args.source:
        for rel in files:
            target=inputs/'base_v4'/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(args.source/rel,target)
    base=inputs/'base_v4'
    original=json.loads((base/'data/recipes.json').read_text(encoding='utf-8'))
    rows=copy.deepcopy(original)
    for r in rows:
        r['original_title']=r['title'];r['title']=translated(r['title']);r['display_language']='en'
        title={ 'wb-001':'Pork Bánh Mì','wb-003':'Bò bía Rolls with Peanut–Hoisin Dipping Sauce'}.get(r['recipe_id'],r['title'])
        r['standard_recipe_label']=title+' · Standard recipe'
        r['cuisine_label']=CUISINE[r['cuisine_id']];r['temperature_label']=TEMP[r['product_temperature']];r['dish_type_label']=ROLE[r['dish_type']]
        for group in ['ingredients','steps']:
            for b in r[group]:
                english=translated(b['text'])
                if english!=b['text']:b['source_text']=b['text']
                b['text']=english
                if b.get('source_group'):b['source_group']=translated(b['source_group'])
        for h in r['heat_breakdown']:h['label']=HEAT[h['method']]
        r['allergen_labels']=[k.replace('_',' ') for k in r['allergen_ids']]
        r['allergen_reminder']=('Allergen reminder: this recipe contains or may contain '+', '.join(r['allergen_labels'])+'. ' if r['allergen_labels'] else 'Allergen reminder: no common allergens were identified in the listed ingredients; this does not mean there is no allergy risk. ')
        r['allergen_reminder']+='Check ingredient and compound-seasoning labels and possible cross-contact. Tell us about any allergies.'
        r['food_notes']=[translated(n) for n in r['food_notes']]
        r['localization']={'language':'en','method':'assistant_translation_of_existing_standard_recipe','source_recipe_id':r['recipe_id'],'recipe_reformulated':False,'review_status':'English presentation checked; not a new food-safety review'}
        r['licence']['changes']+=' English display labels, Chinese recipe text and notes translated; quantities, preparation, provenance and screening annotations retained.'
    if (ROOT/'annotate_heat.py').exists():
        from annotate_heat import annotate
        annotate(rows)
    for folder in ['data','ui','pipeline','templates']: (out/folder).mkdir(exist_ok=True)
    dump(out/'data/recipes.json',rows);dump(out/'ui/recipes.json',rows)
    (out/'data/recipes.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in rows),encoding='utf-8')
    dump(out/'data/retired_recipes.json',{'recipe_ids':['wb-002','wb-019','wb-027'],'pending':[]})
    dump(out/'data/calibration_questions.json',[])
    modules={}
    for name in ['chat-engine.mjs','chat-ui.mjs','recommendation.mjs','groq.mjs','server.mjs']:
        code=localize_code((base/'pipeline'/name).read_text(encoding='utf-8'))
        if name=='recommendation.mjs':
            aliases=re.search(r'export const CUISINES=\{.*?\n\};',(base/'pipeline'/name).read_text(encoding='utf-8'),re.S).group()
            code=re.sub(r'export const CUISINES=\{.*?\n\};',lambda _:aliases,code,flags=re.S)
            code=code.replace("export const foodLabel=id=>FOOD_TERMS[id]?.[0]||id;","export const foodLabel=id=>({mung_bean:'mung beans',lotus_seed:'lotus seeds',lily:'lily bulbs',goji:'goji berries',crustacean:'crustaceans',mollusc:'molluscs'}[id]||id.replaceAll('_',' '));")
        if name=='chat-engine.mjs':
            code=code.replace(r"allergens?|allergies|i am",r"allergens?|\ballergy\b|allergies|i am")
            code=code.replace(r"\banother\b|un altro",r"\banother\b|something else|different (?:recipe|dish)|un altro")
            code=code.replace(r"|not hot/u",r"|not hot|(?:do not|don't) want (?:anything )?hot/u")
            code=code.replace(r"|hot food|hot meal|hot dish|",r"|(?:^|[,;]\s*)hot$|make it hot|serve it hot|something hot|hot food|hot meal|hot dish|")
            code=code.replace(r"|with|using/u",r"|\bhave\b|\binclude\b|with|using/u")
            code=code.replace(r"|without|senza/u",r"|without|\bavoid\b|\bno\s+(?:mango|peanuts?|milk|eggs?|sesame|soy)\b|senza/u")
            code=code.replace(r"不要限制类型/u",r"不要限制类型|any dish type/u")
            code=code.replace(r"食材不限/u",r"食材不限|any ingredients|no ingredient preference/u")
        if name=='groq.mjs':
            code=code.replace('Write a brief friendly introduction in the language of the latest user message','Write a brief friendly introduction in English')
        if name=='server.mjs':code=code.replace("PORT||8874","PORT||8880")
        if name in ['server.mjs','chat-ui.mjs']:code=code.replace("'heatplan-chat'","'heatplan-chat-en'")
        modules[name]=code;(out/'pipeline'/name).write_text(code,encoding='utf-8')
        if name in ['chat-engine.mjs','chat-ui.mjs','recommendation.mjs']:(out/'ui'/name).write_text(code,encoding='utf-8')
    for filename in ['chat.css','RecipeChatbox.vue']:
        content=(base/'ui'/filename).read_text(encoding='utf-8').replace('HeatPlan 菜谱聊天','HeatPlan recipe chat')
        (out/'ui'/filename).write_text(content,encoding='utf-8')
    template=(base/'templates/preview.html').read_text(encoding='utf-8').replace('lang="zh-CN"','lang="en"')
    for zh,en in {'HeatPlan · 菜谱对话':'HeatPlan · Recipe chat','SUMMER TABLE · v0.4':'SUMMER TABLE · v0.4 EN',
                  '今天，想吃点什么？':'What would you like to eat?',
                  '把想法写下来，我们从一道合适的菜开始。':'Tell me what you have in mind. We will start with one recipe.',
                  '菜谱建议以现有数据为依据。食材和步骤保留来源语言；本地预览支持常见表达。完整自由表达可通过配置的 Groq 服务理解.':'',
                  '菜谱建议以现有数据为依据。食材和步骤保留来源语言；本地预览支持常见表达。完整自由表达可通过配置的 Groq 服务理解。':'Suggestions use our recipe collection. This local preview understands common requests; optional Groq support handles broader phrasing.'}.items():
        template=template.replace(zh,en)
    (out/'templates/preview.html').write_text(template,encoding='utf-8')
    html=template.replace('__STYLES__',(out/'ui/chat.css').read_text(encoding='utf-8'))
    for token,name in [('__RULES__','recommendation.mjs'),('__ENGINE__','chat-engine.mjs'),('__UI__','chat-ui.mjs')]:
        html=html.replace(token,re.sub(r'^import .*?;\s*$','',modules[name],flags=re.M))
    html=html.replace('__RECIPES__',json.dumps(rows,ensure_ascii=False,separators=(',',':')).replace('</','<\\/'))
    (out/'ui/preview.html').write_text(html,encoding='utf-8')
    if inputs.resolve()!=(out/'input').resolve():shutil.copytree(inputs,out/'input',dirs_exist_ok=True)
    # Original regression fixtures also check that fish-sauce text was not changed.
    shutil.copy2(base/'input/recipes_v2.jsonl',out/'input/recipes_v2.jsonl')
    for file in ['build_english.py','translations_en.py']:
        if (ROOT/file).resolve()!=(out/'pipeline'/file).resolve():shutil.copy2(ROOT/file,out/'pipeline'/file)
    shutil.copy2(base/'pipeline/LICENSE',out/'pipeline/LICENSE')
    tests=(base/'pipeline/test_v4.mjs').read_text(encoding='utf-8').replace('请选择您想要的菜系，冷热，另注明过敏原','Tell me your preferred cuisine, hot or cold, and any allergies')
    (out/'pipeline/test_v4.mjs').write_text(tests,encoding='utf-8')
    shutil.copy2(base/'ATTRIBUTION_AND_LICENSE.md',out/'ATTRIBUTION_AND_LICENSE.md')
    with (out/'ATTRIBUTION_AND_LICENSE.md').open('a',encoding='utf-8') as f:f.write('\nEnglish edition: Chinese recipe display text and notes translated, alongside interface and conversation text. Recipe composition and source attribution retained. Translations also use CC BY-SA 4.0.\n')
    (out/'RESPONSE_CONTRACT.md').write_text((base/'RESPONSE_CONTRACT.md').read_text(encoding='utf-8').replace("in the user's response language","in English"),encoding='utf-8')
    catalogue=['# Standard recipes · English edition','','English display translations of the v0.4 collection. Ingredient amounts and methods have not been reformulated.','']
    for r in rows:
        catalogue += ['## '+r['standard_recipe_label'],'',r['cuisine_label']+' · '+r['temperature_label'],'','### Ingredients','']+['- '+b['text'] for b in r['ingredients']]
        catalogue += ['','### Method','']+[str(i)+'. '+b['text'] for i,b in enumerate(r['steps'],1)]+['',r['allergen_reminder']]+r['food_notes']+['','[Source recipe]('+r['source']['revision_url']+') · Wikibooks contributors · CC BY-SA 4.0 · Adapted and translated.','']
    (out/'STANDARD_RECIPES.md').write_text('\n'.join(catalogue),encoding='utf-8')
    (out/'README.md').write_text("""# HeatPlan · English chat edition

An English version of the v0.4 prototype. The interface, conversation replies, preference labels, allergen reminders and all 58 recipe displays are in English. Traditional Vietnamese and Italian recipe names remain unchanged. The five Chinese recipe titles, ingredients and methods have English translations; source text and attribution are retained.

Open ui/preview.html directly for the offline version, or run:

    node pipeline/server.mjs

Then visit http://127.0.0.1:8880.

Try:

1. Chinese food, mango allergy, cold
2. Another one
3. Make it room temperature
4. I have cucumber
5. Why this recipe?

The chat keeps allergy restrictions when changing dishes or temperature. Use New chat to start over.

The 58 records, recipe quantities, heat weights and removed recipes match v0.4. Cold dishes rank before room-temperature dishes and hot dishes unless a temperature is explicitly requested. Within each group, more cooking heat lowers the score.

This is still a local rule-based prototype, with optional Groq intent parsing and a short generated introduction. Set GROQ_API_KEY on the server to enable that adapter. Free-form recipe rewriting is not implemented. No real Groq request was needed for this language edition. The English package is separate from the original Chinese version and has not been integrated into the Desktop HeatPlan project.

Files:

- ui/preview.html: standalone English chat.
- ui/RecipeChatbox.vue: Vue 3 / Vite component and supporting modules.
- data/recipes.json and recipes.jsonl: English recipe displays with unchanged screening annotations and provenance.
- STANDARD_RECIPES.md: readable English catalogue.
- input/base_v4: frozen source material for this translation; not the live recommendation data.
- pipeline/build_english.py and translations_en.py: reproducible localization.

To rebuild, with Python 3.10+:

    python -B pipeline/build_english.py --output ../heatplan_recipe_data_v4_en_rebuilt

Code uses MIT. Recipe text, translations and annotations use CC BY-SA 4.0; see ATTRIBUTION_AND_LICENSE.md.
""",encoding='utf-8')
    # Dataset localization still uses frozen v0.4 inputs. Preserve the current
    # application adapters and UI instead of silently restoring the old server.
    if (ROOT/'llm.mjs').exists():
        from build_preview import build_preview
        current=ROOT.parent
        for file in ROOT.glob('*.mjs'):shutil.copy2(file,out/'pipeline'/file.name)
        for file in ROOT.glob('*.py'):shutil.copy2(file,out/'pipeline'/file.name)
        shutil.copy2(ROOT/'build_preview.py',out/'pipeline/build_preview.py')
        for name in ['README.md','RESPONSE_CONTRACT.md','ATTRIBUTION_AND_LICENSE.md','.env.example','.gitignore','templates/preview.html']:
            shutil.copy2(current/name,out/name)
        if (current/'docs').exists():shutil.copytree(current/'docs',out/'docs',dirs_exist_ok=True)
        if (current/'data/candidates').exists():shutil.copytree(current/'data/candidates',out/'data/candidates',dirs_exist_ok=True)
        build_preview(out)
    print(json.dumps({'recipes':len(rows),'display_language':'en','output':str(out)},ensure_ascii=False))
if __name__=='__main__':main()
