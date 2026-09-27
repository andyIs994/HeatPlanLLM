# Cooking heat v2

The former sum of distinct cooking-method weights could not distinguish boiling
for five minutes from simmering stock for hours. The runtime now uses annotated
active heating stages, independently of serving temperature.

For stage i, let w be its method weight and t its active minutes:

    E = sum(w_i * t_i)
    H = 100 * E / (E + 60)

H is a relative product heuristic between 0 and 100, with a larger value meaning
more preparation heat burden. E is in weighted minutes, NOT joules or calories.
The denominator 60 is a tunable scale: 60 weighted minutes gives H = 50.
Neither this scale nor the weights have been empirically calibrated. The value
is not a kitchen-temperature prediction, food temperature, nutrition score,
or evidence of physiological cooling.

| Method | Relative weight |
|---|---:|
| Microwave | 0.4 |
| Simmer / low-heat saucepan | 0.7 |
| Dry toast in a pan | 0.8 |
| Boil | 1.0 |
| Steam | 1.0 |
| Pan fry / stir fry | 2.0 |
| Oven bake | 2.5 |
| Grill | 3.0 |

Microwave and grill are supported for future reviewed annotations; their support
does not imply that new candidate records have been approved.

## Ordering and interpretation

1. Apply allergy, ingredient, cuisine and explicit temperature constraints.
2. Prefer cold, then room-temperature, then hot recipes by default.
3. Within a temperature group, rank by relevance minus H. Relevance is currently
   100 unless explicitly supplied by the caller, so this usually means lower H
   first. Sort using unrounded values; display one decimal place.

A cold dessert that requires cooking stays in the cold group. It may rank below
a comparable no-cook cold dessert, but does not become a hot dish. An explicit
hot-food request still filters to hot dishes.

## Evidence and missing data

`pipeline/annotate_heat.py` contains the explicit stage annotations for the 58
existing recipes. Each stage retains canonical step indices/text, duration range,
and `source` or `assumed` timing basis. These are assistant annotations, not an
independent expert audit. Source timings are recipe instructions, not measured
appliance run times. An assumed duration is a ranking scenario and must NEVER
replace instructions about doneness or food preparation.

- Count actual repeated cycles/batches separately, with distinct stage IDs.
  Reject duplicate stage IDs instead of accidentally double-counting them.
- Record warm-up/preheat separately when applicable. Do not count the same
  interval twice. Parallel appliances each contribute active appliance minutes;
  their sum is not elapsed preparation time.
- Exclude chilling, freezing, soaking, dough rising and heat-off resting.
- Count only the listed preparation, treating ready-cooked or prepared
  ingredients as supplied. This is not a lifecycle energy assessment. No
  refrigerator energy is included.
- Do not infer active heat duration from `total_time_raw` or a missing cook time.
- For missing stage duration, use explicitly labelled assumptions. Method-only
  fallback uses a documented low/central/high prior and marks coverage incomplete.
- Missing heating-method information is an error. Zero requires an explicit
  no-active-heating annotation, not an empty or missing source field.

Apply the same formula to low/central/high scenario durations to obtain the
displayed range. It is NOT a statistical confidence interval: it captures only
annotated duration variation/assumptions, not uncertainty in method weights,
appliance power, pot size, batch volume, ventilation or room conditions.
Source-only profiles can still have a duration range; all results remain
heuristics regardless of whether a duration is marked `source`.

The current corpus has 39 profiles containing assumed durations, 3 heated
profiles using only explicit source times, and 16 no-active-heating profiles.
Historical `heat_level`, `heat_breakdown` and `heat_score_at_full_relevance`
remain in the JSON for v1 provenance only. Runtime ranking, the UI explanation
and the follow-up answer all call `cookingHeat()` and do not use these v1 scores.

## Examples

| Preparation | H, approximately | Interpretation |
|---|---:|---|
| Boil 5 minutes | 7.7 | Illustrative stage; no warm-up included |
| Boil 30 minutes | 33.3 | Longer version of the same stage |
| Grill 30 minutes | 60.0 | Greater method intensity at equal duration |
| Egg Soda | 0.0 | No active heating in its listed preparation |
| Summer Pudding | 6.5 | Six minutes of low-heat poaching; chilling excluded |
| Kulfi | 36.7 (33.3–40.9) | Assumed warm-up plus milk reduction; freezing excluded |
| Vietnamese beef noodle soup | 87.2 (81.8–90.4) | Long stock simmer, plus other annotated stages |

Before treating this as a validated ranking model, compare pairwise rankings
against independent human judgements, check sensitivity to weights and duration
assumptions, and report disagreements. Current tests validate implementation
properties and regression behaviour; they do not establish empirical accuracy.

## Rebuild and checks

    python -B pipeline/annotate_heat.py
    python -B pipeline/build_preview.py
    node --test pipeline/test_heat.mjs

The full `build_english.py --output <separate-directory>` process also reapplies
the stage annotations and preserves the current runtime and candidate manifest.
