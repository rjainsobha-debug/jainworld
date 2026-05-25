# Phase 8A: Ask JainWorld Framework

Phase 8A adds a safe framework for `Ask JainWorld` without turning the site into a freeform AI chatbot.

## What was added

- A public [ask.html](../public/ask.html) page with a warm Ask JainWorld interface.
- Frontend logic in [ask-page.js](../public/js/ask-page.js).
- A new backend endpoint: `/api/ask`.
- A feedback endpoint: `/api/ask-feedback`.
- D1 tables for ask query logging, feedback capture, and ask review queue items.
- A source-only answer helper in [functions/_lib/ask.js](../functions/_lib/ask.js).
- A light Ask review queue section in the admin review prototype.

## Why this is not a full AI chatbot yet

Ask JainWorld currently builds answers only from JainWorld's own approved search results.

It does **not**:

- call an external LLM provider by default
- invent answers beyond available summaries and indexed public content
- claim certainty when source coverage is weak

If verified source coverage is weak, Ask JainWorld should say so clearly.

## Source-only answer logic

`/api/ask`:

1. Validates the user question.
2. Searches the `search_index` table for public verified content.
3. Builds a short extractive answer from the top source summaries.
4. Adds safety language for higher-risk topics.
5. Logs the ask query in `ask_queries`.
6. Queues weak or sensitive questions into `ask_review_queue`.

## Safety rules

- No hallucinated religious, legal, medical, or government advice.
- No fake scholarship or scheme claims.
- No private community or review data is used in public answers.
- High-risk topics receive verification disclaimers.
- Weak-source questions are allowed to fail gracefully.

## Ask query logging

Questions are recorded in `ask_queries` with:

- normalized question
- answer mode
- source count
- confidence
- safety level
- created_at

## Feedback capture

`/api/ask-feedback` stores:

- feedback type
- question or ask query id
- optional notes later

`needs_correction` feedback also creates a review queue item in `ask_review_queue`.

## Apply the Phase 8A schema

Run:

```powershell
npx wrangler d1 execute jainworld-db --remote --file .\db\ask-phase8a.sql
```

## Test `/api/ask`

Example:

```powershell
$body = @{
  question = "Why do Jains follow Ahimsa?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask" -Method Post -ContentType "application/json" -Body $body
```

## Future provider integration

Later phases can add a backend-only provider adapter for:

- OpenAI
- Gemini
- Anthropic
- other approved providers

That future layer should still:

- use JainWorld source retrieval first
- attach citations
- apply safety rules before returning final answers
- never expose API keys in frontend code
