# Recipe response contract

Use the supplied ranked standard recipe as the default. Return one recipe, in the user's response language. Keep its cuisine, ingredients, steps and serving form consistent.

Apply explicit cuisine, temperature and allergy constraints before ranking. Without a temperature request prefer cold/iced, then room temperature, then hot. Heating grades are a product heuristic. Show a short explanation from the actual temperature tier and method weights; do not invent model reasoning.

Do not proactively create a diet variant. A declared allergy is already an explicit restriction and must affect selection; do not return the conflicting standard recipe unchanged. Only modify ingredients when the user asks, and record each change, recheck allergens and recalculate the heating grade. Do not claim a substitute is allergy-safe without composition support. Ask a focused question or report no supported match when needed.

Always include an allergen reminder, including source ingredients and uncertain compound products. Use current standard-recipe allergen data rather than optional ingredients from unrelated source variations. Mention recipe-specific food notes briefly when applicable.

Cold drinks and frozen desserts may be described as refreshing; do not claim medical efficacy. Do not interrupt for ordinary rice/noodle/prepared-ingredient state. Preserve the source link, Wikibooks attribution, CC BY-SA licence and modification notice.

This contract does not itself implement or evaluate an LLM, verify every commercial product, or authorize a claim of clinical safety.
