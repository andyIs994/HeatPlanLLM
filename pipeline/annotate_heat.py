"""Explicit stage annotations for the 58 existing recipes; no automatic time guessing.

Source timings refer to the current English standard recipe, not measured kitchen
times. Assumptions are scenario inputs for ranking, NEVER cooking instructions.
Only active heating is counted. Prepared ingredients stay outside this scope.
"""
import json
from pathlib import Path

VERSION = 'cooking-heat-v2'


def source(method, low, high, indices, note=''):
    return dict(method=method, minutes=[low, (low+high)/2, high], basis='source', indices=indices, note=note)


def assumed(method, low, central, high, indices, note):
    return dict(method=method, minutes=[low, central, high], basis='assumed', indices=indices, note=note)


def warm(indices, method='boil'):
    return assumed(method, 2, 5, 10, indices, 'Warm-up duration is absent; scenario assumption, not a cooking instruction.')


# Indices are zero-based indices into the existing canonical recipe steps.
STAGES = {
 'wb-001':[warm([1])],
 'wb-003':[source('dry_toast',2,3,[0]), warm([1]),
   assumed('boil',5,10,20,[1],'Sausage cooking duration not supplied.'),
   assumed('pan_fry',3,6,12,[3],'Two omelette batches; combined duration not supplied.'),
   assumed('pan_fry',1,3,6,[5,7],'Combined garlic frying stages; duration not supplied.'),
   source('pan_fry',10,15,[6]),source('simmer',1,2,[8])],
 'wb-004':[warm([1]),source('boil',15,15,[1,2],'Five minutes before fish, then ten minutes with fish.')],
 'wb-005':[assumed('pan_fry',5,10,20,[0,1,2],'Includes the stated final two minutes; initial cooking duration absent.'),
   warm([4]),source('boil',1,2,[4]),assumed('boil',3,6,12,[5],'Noodle packet duration unavailable.')],
 'wb-006':[assumed('pan_fry',5,10,20,[0,1,2,3],'Only initial garlic time is given; remaining frying unspecified.')],
 'wb-008':[assumed('bake',5,10,15,[4],'Preheated oven: warm-up duration assumed.'),source('bake',20,20,[4])],
 'wb-010':[assumed('simmer',5,12,25,[0,1,3],'Low-heat caramel preparation; two heating periods, duration unspecified.')],
 'wb-011':[warm([1]),assumed('simmer',30,60,120,[1,2],'Chicken broth cooking and additional simmering have no durations.'),
   warm([3]),assumed('boil',3,6,12,[3],'Separate noodle cooking has no duration.')],
 'wb-012':[assumed('pan_fry',3,5,10,[0],'Onion frying time absent.'),warm([1]),source('simmer',10,15,[1]),
   source('simmer',360,720,[2]),assumed('boil',3,8,20,[3,4],'Reheating and finishing beef; duration absent.')],
 'wb-015':[assumed('pan_fry',5,10,20,[1,8],'Onion and seasoning-oil stages combined; durations absent.'),warm([2]),
   source('simmer',40,40,[5,6]),assumed('boil',2,5,10,[10],'Heating water for noodles; packet/soaking time excluded.')],
 'wb-017':[assumed('bake',3,6,12,[0],'Toaster oven operation, including warm-up; no stated duration.')],
 'wb-018':[assumed('bake',5,10,20,[1],'Oven toast including warm-up; duration absent.')],
 'wb-021':[assumed('bake',5,10,15,[0],'Oven warm-up unspecified.'),source('bake',10,15,[1]),source('pan_fry',2,3,[3])],
 'wb-023':[assumed('pan_fry',2,4,8,[0,1],'Oil/garlic stage duration absent.'),source('simmer',17,17,[2,3])],
 'wb-024':[assumed('pan_fry',2,4,8,[0,1],'Garlic/anchovy initial heating unspecified.'),source('simmer',15,20,[2]),
   warm([3]),assumed('boil',6,10,15,[3],'Pasta duration not specified.')],
 'wb-025':[warm([0]),assumed('boil',6,10,15,[1,3],'Packet cooking duration unavailable.'),
   assumed('simmer',3,7,15,[2,4],'Separate sauce pan heating duration absent.')],
 'wb-026':[source('pan_fry',1,1,[1]),assumed('pan_fry',1,3,6,[0,2],'Oil warm-up and vegetables duration absent.'),
   warm([3]),source('boil',1,2,[5])],
 'wb-028':[source('pan_fry',13,15,[4,6]),warm([8]),source('simmer',60,70,[11])],
 'wb-029':[warm([0]),assumed('simmer',10,25,60,[1,2],'Reduction and holding time not specified.'),
   assumed('bake',3,6,12,[3],'Toaster oven operation duration absent.'),source('simmer',5,5,[4])],
 'wb-030':[assumed('boil',5,10,20,[0,1],'Combined blanching/warm-up; tomato blanching duration not supplied.'),
   assumed('pan_fry',20,35,60,[0,2,3],'Includes celery, onion, tomato, aubergine batches and final reduction; batch count absent.')],
 'wb-031':[warm([0]),source('simmer',45,45,[2])],
 'wb-032':[warm([1])],
 'wb-034':[warm([0]),source('simmer',20,20,[1]),warm([3]),source('simmer',45,45,[4])],
 'wb-035':[assumed('boil',15,25,45,[0,1],'Rice and pea pots, including warm-up; packet durations unavailable.')],
 'wb-036':[assumed('pan_fry',3,6,12,[0,1,2],'Onion/rice/wine stages before stock; unspecified duration.'),source('simmer',15,20,[3])],
 'wb-037':[warm([15]),source('boil',5,10,[15])],
 'wb-038':[assumed('bake',5,10,15,[5],'Oven preheat only; dough rising is excluded.'),source('bake',20,25,[5])],
 'wb-040':[assumed('pan_fry',5,10,20,[1,4],'Garlic and two salmon batches, duration absent.'),
   assumed('simmer',5,10,20,[2,5],'Sauce warming/poaching duration absent.')],
 'wb-042':[assumed('boil',5,12,25,[3,4],'Jelly water and custard preparation; packet durations unknown. Chilling excluded.')],
 'wb-043':[source('simmer',6,6,[1],'Five minutes plus one further minute. Refrigeration excluded.')],
 'wb-044':[source('pan_fry',3,3,[2]),source('simmer',10,10,[3])],
 'wb-051':[warm([0]),source('simmer',40,45,[1],'Six hours of freezing excluded.')],
 'wb-052':[warm([0]),source('simmer',25,25,[1,2])],
 'wb-053':[source('dry_toast',2,3,[0])],
 'wb-054':[assumed('simmer',10,20,30,[0,1],'Melting and thickening duration unknown; total 30-minute cooking label is not per-stage evidence.')],
 'wb-055':[warm([7]),assumed('boil',5,12,25,[8],'Batch count and time until floating are not specified.')],
 'wb-056':[warm([1]),assumed('steam',15,25,45,[3],'Initial rice steaming has no duration; 6–12 hour soaking excluded.'),
   source('steam',5,5,[7]),source('steam',15,20,[10])],
 'wb-057':[assumed('steam',3,6,12,[0],'Steamer/pan preheat duration absent.'),
   assumed('steam',12,24,36,[3,4,5],'Three minutes per layer; assumed 4/8/12 layers because layer count is absent.')],
 'wb-059':[assumed('boil',4,10,20,[2,3,4],'Two bring-to-boil cycles; both 30-minute heat-off rests excluded.')],
 'wb-060':[assumed('pan_fry',4,8,15,[3],'Chicken frying duration unspecified; food preparation instructions unchanged.')],
 'wb-061':[warm([0]),source('boil',15,15,[0]),source('simmer',35,35,[0],'Thirty minutes plus five minutes; soaking excluded.')],
 'wb-062':[assumed('boil',2,4,8,[0],'Hot-water preparation only; ten-minute standing and refrigeration excluded.')]
}


def annotate(rows):
    for r in rows:
        specs = STAGES.get(r['recipe_id'], [])
        if bool(specs) != bool(r['heating_methods']):
            raise ValueError('Heat annotation coverage mismatch: '+r['recipe_id'])
        stages=[]
        for i, spec in enumerate(specs):
            s={k:v for k,v in spec.items() if k!='indices'}
            s['id']=r['recipe_id']+'-heat-'+str(i+1)
            s['evidence']=[{'step_index':j,'text':r['steps'][j]['text']} for j in spec['indices']]
            stages.append(s)
        r['cooking_heat_profile']={'version':VERSION,'coverage':'listed_preparation',
            'annotation_method':'assistant_source_reading_with_explicit_scenario_assumptions',
            'no_active_heat_confirmed':not stages,'stages':stages,
            'scope_note':'Prepared ingredients are accepted as supplied. No upstream manufacturing heat, chilling or resting time is counted.',
            'legacy_fields':'heat_level, heat_breakdown and heat_score_at_full_relevance retain v1 archival values; runtime uses cookingHeat().'}
    return rows


if __name__=='__main__':
    root=Path(__file__).resolve().parents[1]
    rows=annotate(json.loads((root/'data/recipes.json').read_text(encoding='utf-8')))
    for rel in ['data/recipes.json','ui/recipes.json']:
        (root/rel).write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (root/'data/recipes.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in rows),encoding='utf-8')
    print('Annotated',len(rows),'existing recipes; ingredients and preparation unchanged.')
