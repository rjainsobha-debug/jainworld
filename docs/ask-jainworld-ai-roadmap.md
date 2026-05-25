# Ask JainWorld AI Roadmap

## Product direction

Public language should stay:

- Ask JainWorld
- JainWorld Knowledge Assistant
- JainWorld Search

Do not publicly describe the product as a generic external chatbot.

## Future answer principles

Any future answer engine should:

- use approved content only
- cite sources clearly
- refuse or soften answers when sources are missing
- separate religious guidance from general explanatory content
- avoid fake government scheme claims
- avoid medical or legal guarantees
- flag high-risk topics for additional review

## Safety model

- Search first
- Retrieval second
- Answer generation only after trusted retrieval
- Admin review for high-risk answer templates

## Content boundaries

Future AI responses should not improvise:

- religious rulings
- government eligibility outcomes
- medical advice
- legal interpretations
- time-sensitive temple or event data without source confirmation

## Platform direction

Possible later integrations:

- Cloudflare Vectorize or similar vector search layer
- backend-only model calls through OpenAI, OpenRouter, Gemini, or another provider
- search log analysis for content gap detection

## Security rule

Never expose AI provider API keys in frontend code.
