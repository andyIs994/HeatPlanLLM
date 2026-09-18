# NVIDIA primary with Groq backup

## Setup on either laptop

Use Node.js 22 or later. No npm dependencies are required. From the repository root, copy `.env.example` to `.env`, then fill in your keys in that local file. `.env` is ignored by Git and is not served by the application.

PowerShell:

```powershell
Copy-Item .env.example .env
notepad .env
node --env-file=.env pipeline/server.mjs
```

macOS/Linux:

```sh
cp .env.example .env
# Edit .env with your preferred text editor.
node --env-file=.env pipeline/server.mjs
```

Copy the example only when `.env` does not already exist. Existing shell environment variables take precedence over values loaded from the file. Plain `node pipeline/server.mjs` reads environment variables but does not automatically load `.env`. Open http://127.0.0.1:8880. Opening `ui/preview.html` as a file remains completely local and does not call either model service.

| Variable | Purpose | Default |
| --- | --- | --- |
| NVIDIA_API_KEY | NVIDIA-hosted API access token | Empty; service skipped |
| NVIDIA_MODEL | NVIDIA catalog model ID | qwen/qwen3-next-80b-a3b-instruct |
| GROQ_API_KEY | Groq access token | Empty; service skipped |
| GROQ_MODEL | Groq model supporting strict JSON schema | openai/gpt-oss-20b |
| LLM_TIMEOUT_MS | Maximum time per API attempt, including response body | 12000 |
| LLM_BUDGET_MS | Total time budget for model calls in one chat turn | 45000 |
| PORT | Local server port | 8880 |

Get the NVIDIA key from your account on [NVIDIA Build](https://build.nvidia.com/qwen/qwen3-next-80b-a3b-instruct), and the Groq key from [Groq Console](https://console.groq.com/keys). Confirm the model is accessible to your account. Quotas and access depend on the provider/account; this project does not assume unlimited free requests. Keys must be configured separately on each laptop and must not be pasted into chat, source files or commits.

The default NVIDIA model is a Qwen model hosted by NVIDIA, not a model trained by this project or developed by NVIDIA. Change `NVIDIA_MODEL` to another compatible chat model in your account if needed, then validate it. Models with different reasoning or structured-output requirements may require adapter changes.

## How failover works

1. For intent extraction, try configured NVIDIA first, then configured Groq. No key means that provider is skipped.
2. Transport errors, timeouts, non-success HTTP statuses (including authentication, quota and service errors), malformed/truncated responses and invalid intent schemas fail that attempt.
3. Apply one validated intent through the existing rule engine. Explicit locally parsed preferences retain precedence; model-added allergy terms accumulate through existing checks.
4. For an ordinary successful recommendation, generate the short introduction with the first service that has not failed during this turn. If NVIDIA fails here, Groq receives the already selected facts; intent extraction and recipe selection are not repeated.
5. If reply generation fails on both services, retain the canonical local reply and all valid intent information already extracted. If intent extraction fails on both, use the original local parser and recommendation rules.
6. Clarification, no-match, explanation and unsupported-adaptation responses retain canonical local wording instead of replacing it with a generated introduction.

There are no same-provider retries within a turn and no persistent circuit breaker. A fresh turn tries NVIDIA again. Both stages share the total time budget; after it expires, further model requests are skipped. At most four API calls are made for one turn. Local fallback supports the existing limited phrase set; it does not guarantee understanding of arbitrary multilingual input.

The adapter sends the user's message and current constraints to the active provider for parsing, and selected recipe summary facts for the introduction. If failover occurs, Groq receives the relevant request data too. Keys go only to their own fixed HTTPS endpoints; redirects are rejected. Full recipes, ingredient quantities, source links, rankings and mandatory allergy notices remain application-controlled. The introduction remains model-generated text: prompt restrictions and basic validation are not a formal guarantee of factual accuracy.

## Inspecting configuration and results

`GET /api/status` reports configured services and their priority. Configuration does not prove the key works or the provider is online. It never returns keys. The UI reports the actual reply provider after a request, including Groq backup or a standard local reply with AI-assisted preferences.

`POST /api/chat` keeps the existing response fields and adds:

```json
{
  "mode": "groq",
  "fallback": true,
  "llm": {
    "intent_provider": "nvidia",
    "reply_provider": "groq",
    "attempts": [
      {"stage": "intent", "provider": "nvidia", "status": "ok"},
      {"stage": "reply", "provider": "nvidia", "status": "failed", "reason": "http_503"},
      {"stage": "reply", "provider": "groq", "status": "ok"}
    ]
  }
}
```

`mode` is the introduction/reply provider, not necessarily the intent provider. `fallback` means at least one configured provider attempt failed or exhausted the budget; absent keys are not errors. Only safe reason codes are returned, never upstream error bodies, credentials or request contents.

## Verification

```sh
node pipeline/test_v4.mjs
node pipeline/check_english.mjs .
node --test pipeline/test_providers.mjs
```

Provider tests inject fake network responses and never call paid/live APIs. They verify primary routing, isolated credentials, quota/server/authentication errors, timeouts including stalled bodies, invalid output, reply-only failover, unchanged restrictions, per-turn recovery and all-local operation.

After keys are configured, send `Chinese food, mango allergy, cold`, followed by `Another one`, then `Make it room temperature`. Inspect `/api/chat` metadata in browser developer tools for actual providers and preserved restrictions. To exercise a real Groq-only request, temporarily leave NVIDIA_API_KEY blank and restart. This is a Groq smoke check, not proof of real outage failover; controlled tests cover failure routing. Record live results separately from mocked tests.

At implementation time, no keys were configured and no live NVIDIA or Groq calls were made. API routing correctness does not establish multilingual model quality. The interface and canonical recipes remain English in this change; free-form recipe rewriting is still unsupported.

## References

- [NVIDIA hosted LLM API catalog](https://docs.api.nvidia.com/nim/re/reference/llm-apis)
- [NVIDIA Qwen3-Next Instruct model card](https://docs.api.nvidia.com/nim/reference/qwen-qwen3-next-80b-a3b-instruct)
- [Groq structured outputs](https://console.groq.com/docs/structured-outputs)
