# Phase 9 AI Provider Activation

## What Phase 9 Added

Phase 9 adds a safer activation path for real AI-assisted answers in Ask JainWorld without removing the existing extractive fallback.

New capabilities include:

- Optional backend-only AI provider adapter
- Grounded prompt building from JainWorld search sources only
- Stronger source coverage checks before answer generation
- Answer quality scoring
- Content gap tracking for unanswered or weakly answered questions
- Admin visibility for content gaps and Ask review items
- Stronger citation and source presentation in the Ask UI

## AI Provider Is Optional

Ask JainWorld still works when no provider is configured.

If no valid provider environment variables are present:

- `/api/ask` continues to use extractive source-based answers
- weak-coverage questions return a safe insufficient-information response
- logging, feedback, and review queue behavior still work

## Backend-Only Environment Variables

Supported optional backend-only variables:

- `AI_PROVIDER`
- `AI_MODEL`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- `CLOUDFLARE_AI_ENABLED`

Recommended values for `AI_PROVIDER`:

- `openai`
- `gemini`
- `openrouter`
- `cloudflare`
- `none`

Do not expose any of these values in frontend code.

## Safety Model

Ask JainWorld must answer only from approved JainWorld sources.

The grounded AI path is instructed to:

- use only provided JainWorld sources
- avoid outside knowledge
- refuse to invent eligibility, deadlines, benefits, timings, quotes, or rules
- clearly state when JainWorld does not have enough verified information
- include disclaimers for higher-risk categories

If AI generation fails, times out, or returns a weak answer:

- the response falls back to extractive mode
- provider details are not shown to the user

## How Sources Are Selected

`/api/ask`:

1. normalizes the user question
2. searches `search_index`
3. filters for public safe statuses only
4. estimates source coverage
5. builds an extractive fallback answer
6. optionally calls the configured provider using only the selected sources

## Content Gaps

When JainWorld does not have enough verified source coverage:

- the response stays safe and source-limited
- the question is logged to `content_gaps`
- repeated questions increment `frequency_count`
- higher-risk questions can also be added to `ask_review_queue`

This creates a content-planning signal for future articles, resources, or temple/resource updates.

## How To Test Without A Provider

Keep `AI_PROVIDER` unset or set it to `none`.

Then test:

- `/api/ask` with a common Jain question
- `/api/ask` with a scholarship or temple question
- `/api/ask` with a Hindi question
- `/api/ask-feedback`
- `/api/content-gaps`

In this mode, Ask JainWorld should still return:

- `extractive`
- or `insufficient`

and never fail hard for a valid question.

## How To Test After Provider Configuration

After adding backend environment variables in Cloudflare:

1. keep extractive fallback enabled
2. deploy with provider env vars
3. test low-risk and high-risk questions
4. confirm `answer_mode` becomes `ai_grounded` only when source coverage is strong enough
5. confirm risky questions still include disclaimers and review queue handling where needed

## How To Disable AI

You can disable AI safely by:

- removing the provider API key from Cloudflare, or
- setting `AI_PROVIDER=none`

Ask JainWorld will continue using extractive fallback.

## Safety Warnings

- Never put AI keys in frontend code.
- Never allow the provider to answer from outside JainWorld sources.
- Never auto-publish Ask answers as site content.
- Never rely on AI answers alone for religious, legal, medical, government, scholarship, financial, or temple timing decisions.
