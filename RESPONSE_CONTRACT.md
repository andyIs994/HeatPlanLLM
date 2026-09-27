# Recipe response contract

Use the supplied ranked standard recipe as the default. Return one recipe, in English. Keep its cuisine, ingredients, steps and serving form consistent.

Apply explicit cuisine, temperature and allergy constraints before ranking. Without a temperature request prefer cold/iced, then room temperature, then hot. Cooking heat v2 is a product heuristic based on annotated active heating stages and durations. Use the runtime heat assessment, including assumed timings and scenario ranges, for explanations; do not use the archival v1 heat_level or invent model reasoning. Do not equate the score to measured energy, serving temperature or physiological cooling. See docs/COOKING_HEAT.md.

Do not proactively create a diet variant. A declared allergy is already an explicit restriction and must affect selection; do not return the conflicting standard recipe unchanged. Only modify ingredients when the user asks, and record each change, recheck allergens and recalculate the heating grade. Do not claim a substitute is allergy-safe without composition support. Ask a focused question or report no supported match when needed.

Always include an allergen reminder, including source ingredients and uncertain compound products. Use current standard-recipe allergen data rather than optional ingredients from unrelated source variations. Mention recipe-specific food notes briefly when applicable.

Cold drinks and frozen desserts may be described as refreshing; do not claim medical efficacy. Do not interrupt for ordinary rice/noodle/prepared-ingredient state. Preserve the source link, Wikibooks attribution, CC BY-SA licence and modification notice.

This contract does not itself implement or evaluate an LLM, verify every commercial product, or authorize a claim of clinical safety.

The current implementation supports NVIDIA as the primary provider and Groq as backup. Model requests interpret preferences and generate a short introduction; application code still selects and displays the canonical recipe. Failed reply generation cannot discard previously validated intent or alter selected recipe facts. Clarification and unsupported-adaptation responses retain local wording. See docs/LLM_PROVIDERS.md for configuration and per-stage response metadata. Requested recipe modifications remain unimplemented; the modification rules above describe requirements for future work.
