# Design

## Context

See proposal.md. The recovery service currently maps provider errors to public error keys. The per-address email cooldown therefore reveals a registered account while an absent account remains pending.

## Goals / Non-Goals

Close the public result discrepancy at the identity use-case boundary. Preserve existing validation, provider invocation, session handling and recovery links. ADR impact: NONE; ADR-0003 boundaries remain intact.

## Decisions

For syntactically valid input, invoke the provider exactly once and return only pending, regardless of returned provider errors or thrown failures. Keep invalid input as validation failure before contacting the provider. Do not reuse or change the common error mapper: login and other actions retain their existing feedback.

Masking only the email cooldown was rejected because address-dependent SMTP failures could reveal the same distinction. No retries, fallback mail, privileged lookup or bypass of provider limits is added. Deterministic tests compare repeated known/unknown requests and cover success, account absence, both rate-limit codes, delivery errors and thrown failures through the public service API.

## Risks / Trade-offs

- Pending does not prove mail delivery, including during outages. Existing localized conditional recovery text remains accurate; operators must use provider monitoring for delivery health, without exposing it through address-dependent user responses.
- Provider-direct behavior and response timing are outside this application-result fix; no claim of constant-time or provider-wide enumeration prevention is made.
- Real provider cooldown depends on local configuration. A controlled regression proves the application mapping independently; the existing real Auth/Mailpit gate still verifies working delivery/reset.

## Migration Plan

No migration or configuration change. Verify the focused cycle, full local acceptance and independent review. Preserve all prior archives. No commit, push or deployment.
