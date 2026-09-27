# First Kaggle summer recipe review batch

Selected 150 unique source-URL candidates from the downloaded version 2 archive:
67 salads, 66 drinks and 17 desserts. They are NOT approved recipes and are not
loaded into chat. The active catalogue still contains 58 existing recipes.

Source: https://www.kaggle.com/datasets/thedevastator/better-recipes-for-a-better-life

Public download: https://www.kaggle.com/api/v1/datasets/download/thedevastator/better-recipes-for-a-better-life

The 1,149 original rows become 1,018 unique URLs. Selection flags summer/cold
style names, final cold-serving instructions, salads and drinks; it excludes
alcohol signals, explicit hot-serving entries and other dish types from this
initial batch. A frozen ingredient is not a cold-serving signal, and no-bake
does not establish serving temperature. Selection is heuristic, not a complete
culinary, nutritional or safety review. Original titles are retained for traceability;
any health language in a source title is not endorsed by HeatPlan.

147 entries lack explicit national-cuisine paths and retain `unclassified`.
Three have explicit Mexican paths. There are 68 tentative cold signals and 82
unknown serving temperatures. None are promoted to verified product temperature.
This batch expands recipe variety but does not demonstrate coverage of all
seven existing cuisines. Cuisine/type labels are review metadata, not new
runtime filter options.

## Files and reconstruction

- `data/candidates/kaggle_summer_manifest.json`: IDs, source URLs/CSV line
  references, selection signals, category/cuisine provenance and review status.
- `data/candidates/kaggle_summer_manifest.md`: readable list of 150 candidates.
- `pipeline/prepare_kaggle.py`: deterministic deduplication and selection.
- `.local-data/kaggle_summer_v1/candidates.json`: locally generated full source
  content and tentative normalized fields; intentionally Git-ignored.
- `.local-data/kaggle_summer_v1/selection_report.json`: local selection counts.

Download the source archive on another laptop, then run from the repository:

    python -B pipeline/prepare_kaggle.py --archive <path-to-kaggle.zip> --output .local-data/kaggle_summer_v1 --manifest data/candidates/kaggle_summer_manifest.json --count 150
    python -B pipeline/test_kaggle.py

The importer verifies the audited archive SHA-256 and fails if the source has
changed. This prevents a newer download from silently changing the evidence.
Full source text is not copied into Git while original-source rights remain
unverified. Kaggle's CC0 declaration is recorded separately; it does not replace
the source review or turn these recipes into Wikibooks CC BY-SA content.

## Required work before activation

1. Check original text/image rights and attribution for the intended use.
2. Verify ingredients and quantities. Main-file comma-joined ingredients remain
   a single lossless raw block because internal commas prevent reliable splitting.
   The test file's structured ingredients use literal parsing, never `eval`.
3. Verify cuisine, dish role, serving temperature, active heating stages and
   durations; capture evidence and flag assumptions using the v2 heat schema.
4. Review allergens, compound ingredients and supported aliases. `null` allergen
   data means unreviewed, not allergen-free. Never default it to an empty list.
5. Review semantic duplicates across URLs and the existing collection. URL
   deduplication alone does not establish unique dishes.
6. Only after review, add approved data and update runtime cuisine/ID validation
   where needed. The candidate manifest always has eligibility false and cannot
   be recommended even if accidentally passed to the current recommender.
