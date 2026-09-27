"""Build a reproducible summer shortlist, NOT an approved serving dataset.

Full source content is written only to the caller's local output directory.
The shareable manifest contains source URLs and review metadata, not recipe text.
"""
import argparse
import ast
from collections import Counter, defaultdict
import csv
import hashlib
import io
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
import zipfile

DATASET='https://www.kaggle.com/datasets/thedevastator/better-recipes-for-a-better-life'
EXPECTED_SHA='96447a0bafb1d0bceccefc1e8e3ab22927cb83b0398eb281d2b9efb60f720cd5'
CUISINES={s.lower().replace(' ','_'):s for s in ['Vietnamese','Italian','English','Indian','Chinese','Malaysian','Greek',
    'Mexican','French','German','Thai','Dutch','Polish','Austrian','Moroccan','Hungarian','Irish','Filipino','Egyptian','Lebanese']}
ALCOHOL=re.compile(r'\b(?:vodka|rum|tequila|gin|whiske?y|bourbon|brandy|liqueur|schnapps|champagne|prosecco|sangria|cocktail|margarita|martini|sherry|cognac|triple sec|cointreau|kahlua|beer)\b|\b(?:red|white|sparkling) wine\b',re.I)
COLD_TITLE=re.compile(r'\b(?:ice cream|sorbet|sherbet|granita|popsicles?|slush\w*|smoothies?|milkshake|lemonade|agua fresca|iced|frozen (?:yogurt|dessert|custard)|icebox|parfait)\b',re.I)
COLD_STEP=re.compile(r'\b(?:serve(?:d)? (?:well )?(?:chilled|cold|over ice)|chill until (?:ready to serve|serving)|refrigerate until (?:ready to serve|serving)|freeze until (?:firm|set))\b',re.I)
HOT=re.compile(r'\b(?:serve(?:d)? (?:immediately (?:while )?)?(?:hot|warm)|warm (?:\w+ ){0,2}salad|hot cider|hot chocolate|hot tea)\b',re.I)
HEAT_TERMS=re.compile(r'\b(?:boil\w*|simmer\w*|steam\w*|bake\w*|grill\w*|fry|fried|frying|saute\w*|microwave\w*|roast\w*|preheat\w*)\b',re.I)


def url_key(url):
    p=urlsplit(url.strip())
    return p.netloc.lower().removeprefix('www.')+p.path.rstrip('/')


def read_source(archive):
    all_rows=[]
    with zipfile.ZipFile(archive) as z:
        for name in ['recipes.csv','test_recipes.csv']:
            for line,r in enumerate(csv.DictReader(io.StringIO(z.read(name).decode('utf-8-sig'))),2):
                test=name.startswith('test_')
                if test:
                    original_ingredients=ast.literal_eval(r['Ingredients'])
                    original_steps=ast.literal_eval(r['Directions'])
                    if not isinstance(original_ingredients,list) or not isinstance(original_steps,list):
                        raise ValueError('Unexpected structured source row')
                    ingredients=[{'text':' '.join(str(i.get(k,'') or '') for k in ['quantity','unit','name']).strip(),
                                  'source_index':j,'source_object':i} for j,i in enumerate(original_ingredients)]
                    steps=[{'text':str(s),'source_index':j} for j,s in enumerate(original_steps)]
                else:
                    # Commas inside ingredient descriptions cannot be safely split.
                    ingredients=[{'text':r['ingredients'],'source_index':0,'raw_block':True}]
                    steps=[{'text':s.strip(),'source_index':j} for j,s in enumerate(r['directions'].splitlines()) if s.strip()]
                title=r['Name' if test else 'recipe_name']
                url=r['url'];key=url_key(url)
                all_rows.append({'recipe_id':'ar-'+hashlib.sha256(key.encode()).hexdigest()[:12],
                    'title':title,'source_url':url,'source_url_key':key,
                    'source_rows':[{'file':name,'csv_line':line}],
                    'source_category_path':r.get('cuisine_path',''),
                    'ingredients':ingredients,'steps':steps,'ingredients_raw':r['Ingredients' if test else 'ingredients'],
                    'directions_raw':r['Directions' if test else 'directions'],
                    'ingredients_parse_status':'structured_source' if test else 'raw_block_needs_review',
                    'prep_time_raw':r.get('Prep Time' if test else 'prep_time') or None,
                    'cook_time_raw':r.get('Cook Time' if test else 'cook_time') or None,
                    'total_time_raw':r.get('Total Time' if test else 'total_time') or None,
                    'servings_raw':r.get('Servings' if test else 'servings') or None})
    # Keep the first main-file record; flag any conflicting duplicate content.
    merged={}
    for r in all_rows:
        key=r['source_url_key']
        if key not in merged:
            r['duplicate_content_conflict']=False;merged[key]=r
        else:
            first=merged[key];first['source_rows']+=r['source_rows']
            if r['ingredients_raw']!=first['ingredients_raw'] or r['directions_raw']!=first['directions_raw']:
                first['duplicate_content_conflict']=True
    return all_rows,list(merged.values())


def classify(r):
    title=r['title'];path=r['source_category_path'];directions='\n'.join(s['text'] for s in r['steps'])
    ingredients='\n'.join(s['text'] for s in r['ingredients'])
    # Conservative shortlist policy: alcoholic entries are outside this first batch.
    if ALCOHOL.search(title+' '+path+' '+ingredients):return None,'alcohol_signal'
    # A cold sauce halfway through a grilled-fish recipe is not cold fish.
    cold_title=bool(COLD_TITLE.search(title));cold_step=bool(COLD_STEP.search(directions[-300:]))
    if HOT.search(title+' '+directions) and not (cold_title or cold_step):return None,'hot_serving_signal'
    if '/Salad/' in path or re.search(r'\b(?:salad|slaw)\b',title,re.I):bucket='salad'
    elif '/Drinks Recipes/' in path or re.search(r'\b(?:smoothie|juice|lemonade|milkshake|agua fresca)\b',title,re.I):bucket='beverage'
    elif '/Desserts/' in path or re.search(r'\b(?:sorbet|ice cream|pudding|parfait)\b',title,re.I):bucket='dessert'
    else:bucket='other'
    if bucket=='other':return None,'outside_first_batch_dish_types'
    summer=bool(re.search(r'\b(?:summer|refreshing)\b',title,re.I))
    no_bake=bool(re.search(r'\bno.bake\b',title,re.I))
    if bucket not in ['salad','beverage'] and not(cold_title or cold_step or summer or no_bake):return None,'no_summer_selection_signal'
    if bucket=='beverage' and re.search(r'\b(?:hrs?|hours?)\b',r['cook_time_raw'] or '',re.I) and not(cold_title or cold_step):return None,'long_cooked_drink_without_cold_signal'
    if not title or not ingredients.strip() or not directions.strip():return None,'missing_content'
    segments=path.strip('/').split('/')
    cuisine=next((id for id,label in CUISINES.items() if label in segments),'unclassified')
    signals=[]
    for yes,label in [(cold_title,'cold_style_title'),(cold_step,'cold_serving_step'),(summer,'summer_title'),(no_bake,'no_bake_title'),
                      (bucket in ['salad','beverage'],'salad_or_drink_category')]:
        if yes:signals.append(label)
    score=40*cold_step+30*cold_title+15*summer+10*(bucket in ['salad','beverage'])
    signals_heat=sorted(set(m.group().lower() for m in HEAT_TERMS.finditer(directions)))
    return {**r,'dish_type':bucket,'cuisine_id':cuisine,
        'cuisine_basis':'explicit_source_path' if cuisine!='unclassified' else 'not_established',
        'selection_score':score,'selection_signals':signals,
        'temperature_candidate':'cold' if cold_title or cold_step else 'unknown',
        'product_temperature':None,'cooking_heat_profile':None,'heat_method_text_signals':signals_heat,
        'allergen_ids':None,'eligible_for_product_prototype':False,
        'review_status':'candidate_not_approved',
        'review_required':['source_rights','ingredients_and_quantities','allergens_and_compounds','serving_temperature',
                           'active_heating_stages','cuisine','semantic_duplicates'],
        'licence':{'dataset_declared':'CC0-1.0','original_content_status':'unverified','original_domain':'allrecipes.com',
                   'dataset_url':DATASET,'note':'Do not inherit the Wikibooks CC BY-SA licence or infer permission for source text/images.'}},None


def build(archive,count):
    raw,unique=read_source(archive)
    qualified=[];excluded=Counter()
    for r in unique:
        row,reason=classify(r)
        if row:qualified.append(row)
        else:excluded[reason]+=1
    groups=defaultdict(list)
    for r in sorted(qualified,key=lambda r:(-r['selection_score'],r['source_url_key'])):groups[r['dish_type']].append(r)
    # Balanced review queue, not a runtime recommendation score.
    selected=[]
    while len(selected)<count and any(groups.values()):
        for bucket in ['salad','beverage','dessert','other']:
            if groups[bucket] and len(selected)<count:selected.append(groups[bucket].pop(0))
    if len(selected)!=count:raise ValueError(f'Only {len(selected)} eligible shortlist candidates, requested {count}')
    metadata={'dataset_url':DATASET,'dataset_version':2,'source_archive_sha256':hashlib.sha256(Path(archive).read_bytes()).hexdigest(),
        'pipeline_version':'kaggle-summer-candidates-v1','selection_is_heuristic':True,
        'raw_rows':len(raw),'unique_source_urls':len(unique),'qualified_pool':len(qualified),'selected_count':len(selected),
        'excluded_counts':dict(excluded),'selected_dish_types':dict(Counter(r['dish_type'] for r in selected)),
        'selected_cuisines':dict(Counter(r['cuisine_id'] for r in selected)),
        'selected_temperature_candidates':dict(Counter(r['temperature_candidate'] for r in selected)),
        'active_recipe_count_added':0,'status':'Pending content, rights and annotation review; NOT available to chat.'}
    return selected,metadata


def main():
    p=argparse.ArgumentParser();p.add_argument('--archive',required=True,type=Path);p.add_argument('--output',required=True,type=Path)
    p.add_argument('--manifest',required=True,type=Path);p.add_argument('--count',type=int,default=150);a=p.parse_args()
    if not 100<=a.count<=200:raise ValueError('Initial review batch must contain 100–200 candidates')
    if hashlib.sha256(a.archive.read_bytes()).hexdigest()!=EXPECTED_SHA:raise ValueError('Dataset version/hash changed; audit the new archive before use')
    rows,meta=build(a.archive,a.count)
    a.output.mkdir(parents=True,exist_ok=True);a.manifest.parent.mkdir(parents=True,exist_ok=True)
    def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    write(a.output/'candidates.json',rows);write(a.output/'selection_report.json',meta)
    # No full ingredients, directions, nutrition, images or extracted text in Git.
    fields=['recipe_id','title','source_url','source_rows','source_category_path','dish_type','cuisine_id','cuisine_basis',
            'selection_score','selection_signals','temperature_candidate','ingredients_parse_status','duplicate_content_conflict',
            'eligible_for_product_prototype','review_status','review_required','licence']
    write(a.manifest,{'summary':meta,'candidates':[{k:r[k] for k in fields} for r in rows]})
    review=['# Kaggle summer shortlist — 150 candidates' if len(rows)==150 else '# Kaggle summer shortlist',
            '', 'Candidate selection only. Every entry requires review before serving. Full source text stays in local candidates.json.',
            '', '| # | Candidate | Type | Source cuisine | Cold signal |', '|---|---|---|---|---|']
    for i,r in enumerate(rows,1):
        title=r['title'].replace('|','\\|').replace('[','\\[').replace(']','\\]')
        review.append(f"| {i} | [{title}]({r['source_url']}) | {r['dish_type']} | {r['cuisine_id']} | {r['temperature_candidate']} |")
    a.manifest.with_suffix('.md').write_text('\n'.join(review)+'\n',encoding='utf-8',newline='\n')
    print(json.dumps(meta,indent=2))


if __name__=='__main__':main()
