# Phase 8B: AI Provider Grounded Answers

Phase 8B adds an optional backend-only AI provider layer for Ask JainWorld while preserving the existing extractive fallback.

## What Phase 8B added

- A backend-only AI provider adapter in [functions/_lib/ai-provider.js](../functions/_lib/ai-provider.js).
- Safer Ask prompt building and answer validation in [functions/_lib/ask.js](../functions/_lib/ask.js).
- Upgraded `/api/ask` flow with:
  - language detection
  - optional grounded AI answer mode
  - extractive fallback
  - confidence and safety scoring
  - citations
  - review queue insertion for weak or high-risk answers
- Upgraded `/api/ask-feedback` handling for:
  - `unsafe_or_wrong`
  - `missing_source`
  - answer mode tracking
  - source helpful flags
- Ask UI improvements on [ask.html](../public/ask.html) and [ask-page.js](../public/js/ask-page.js).

## AI is optional

Ask JainWorld still works safely without any AI provider configured.

If no provider environment variables are available:

- `/api/ask` stays in extractive mode
- answers are built from JainWorld source summaries
- the user still receives a safe `ok: true` response

## Required environment variables for later activation

The adapter looks only at backend environment variables:

- `AI_PROVIDER`
- `AI_MODEL`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- `CLOUDFLARE_AI_ENABLED`

Do not put any of these values into frontend code.

## How fallback works

`/api/ask` now follows this order:

1. Validate the question.
2. Detect language and safety level.
3. Retrieve top approved public JainWorld sources from `search_index`.
4. Build an extractive fallback answer.
5. If a provider is configured and source coverage is strong enough, attempt grounded AI generation.
6. Validate the AI answer.
7. If AI fails or validation is weak, return the extractive fallback instead.

## How sources are selected

Ask JainWorld uses the same public-safe search layer already used by JainWorld Search:

- only approved public content
- no private review or community data
- strong preference for `search_index`
- source cards and citations are built from returned search sources

## Safety rules

- Answer only from JainWorld sources.
- Do not use outside knowledge.
- If sources are weak, say JainWorld does not have enough verified information yet.
- High-risk topics should include a verification disclaimer.
- No religious, legal, medical, government, scholarship, or temple timing claims beyond the available sources.

## Apply the Phase 8B schema

Run:

```powershell
npx wrangler d1 execute jainworld-db --remote --file .\db\ask-phase8b.sql
```

## Test without an AI provider

```powershell
$body = @{
  question = "Why do Jains follow Ahimsa?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask" -Method Post -ContentType "application/json" -Body $body
```

## Test after an AI provider is configured

Use the same endpoint and verify:

- `answer_mode` becomes `ai_grounded` only when source coverage is strong enough
- citations and sources are still returned
- the answer stays cautious on high-risk topics

## How to disable AI

Remove or unset the provider environment variables in Cloudflare. Ask JainWorld will automatically fall back to extractive mode.
