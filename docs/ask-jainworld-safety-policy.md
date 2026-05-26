# Ask JainWorld Safety Policy

Ask JainWorld is a source-grounded knowledge assistant, not an unrestricted chatbot.

## Core policy

- No hallucinated religious guidance.
- No fake government scheme claims.
- No unsupported scholarship promises.
- No direct medical, legal, or financial advice.
- No private community or correction data used in public answers.
- No outside knowledge when an AI provider is enabled.

## Required behavior

Ask JainWorld should answer only from available JainWorld sources when source coverage is strong enough.

If JainWorld does not have enough verified source coverage, the assistant should say:

- it does not have enough verified information yet
- the user should review related JainWorld sources
- important decisions should be verified with trusted authorities

## Grounded AI rules

If an AI provider is enabled later:

- retrieval from approved JainWorld sources must come first
- the model must be constrained to those sources
- the provider must not add outside facts
- if coverage is weak, the answer must stay limited or insufficient
- provider keys must remain backend-only

## High-risk categories

These categories require extra caution and usually a disclaimer:

- government schemes
- scholarships
- eligibility
- deadlines
- required documents
- medical or health questions
- legal or rights questions
- temple timings and travel-sensitive details
- doctrinal comparison across traditions
- donations, money, or business decisions

## Source and citation expectations

- Source-backed summaries are preferred.
- Public answers should point users toward related source links.
- Weak-source answers should be shorter and more cautious.
- If source coverage is weak, refusal or limited-answer mode is acceptable.
- Citation cards should be shown whenever source coverage exists.

## Review queue policy

Questions should be queued for review when:

- source coverage is weak
- the topic is high-risk
- answer confidence is low
- a user flags the answer as needing correction
- a user flags the answer as unsafe or wrong

## Hindi response safety

- Hindi answers must remain valid UTF-8 Devanagari.
- If strong Hindi phrasing is not available, use a simple safe Hindi fallback.
- Do not ship garbled or mojibake Hindi text.

## Privacy

- Never expose private community, correction, or review data.
- Public Ask answers must use only approved public content.
