# External User Feedback Plan

> **Owner:** Product maintainers · **Status:** Plan defined, recruitment not yet run ·
> **Related roadmap:** T06, U01, G01

This plan closes the "feedback plan" half of T06. It defines the five journeys to
validate, the protocol for running a session, and how findings are recorded as
acceptance evidence. Recruiting and running sessions with real, consented external
users remains the open item this plan enables — see [External Blockers](ROADMAP.md#external-blockers).

## Journeys Under Test

These are the same six checkpoints already defined as acceptance criteria for U01 in
[`docs/ROADMAP.md`](ROADMAP.md#primary-journey-acceptance-matrix): Discover, Inspect,
Signal, Risk, Save, and Share. A usability session walks a participant through as many
of these as fit in one sitting, in that order, using their own choice of ticker.

## Recruitment

- Minimum 5 participants per round, drawn from outside the maintainer group (open
  source contributors, personal network, or a public call-for-testers issue using the
  `feature_request` or a dedicated announcement — see `G02`/`G01` issue templates).
- No compensation model is assumed; state clearly in the recruitment call that
  participation is voluntary and unpaid unless a maintainer decides otherwise.
- Exclude anyone who has contributed code to CrossTide in the past 90 days, to avoid
  testing familiarity rather than discoverability.

## Consent

- Before a session starts, the participant reads and accepts a short consent notice
  covering: what is recorded (screen + verbal think-aloud, optionally audio), how long
  the recording is retained, that participation can stop at any time, and that no
  personal data beyond what they volunteer verbally is collected.
- Recordings and notes are retained for 90 days after the findings are published to
  the roadmap, then deleted. This mirrors the retention discipline in
  [`docs/DATA_RETENTION.md`](DATA_RETENTION.md).
- No participant-identifying information (name, email, employer) is stored in the
  repository. Findings reference "Participant 1", "Participant 2", etc.

## Session Protocol

1. Give the participant the production URL (or a documented preview URL) and one
   open-ended task: "Find a stock you're curious about and see what CrossTide tells
   you about it."
2. Observe silently through Discover and Inspect. Only intervene if the participant is
   fully blocked for more than two minutes.
3. If not reached organically, prompt toward Signal, Risk, Save, and Share in turn,
   noting whether the participant found each entry point unaided or needed a hint.
4. Close with three questions: "What was confusing?", "What would you do next?", and
   "Would you use this again for a real decision?"

## Recording Findings

Each round produces one findings entry appended to a `## Round N — <date>` section in
this document, using this structure per participant:

```markdown
### Participant N

- Discover: unaided / hinted / blocked — notes
- Inspect: unaided / hinted / blocked — notes
- Signal: unaided / hinted / blocked — notes
- Risk: unaided / hinted / blocked — notes
- Save: unaided / hinted / blocked — notes
- Share: unaided / hinted / blocked — notes
- Confusion points:
- Would use again: yes / no / unsure
```

## Acceptance Evidence

T06 is satisfied only when **five** participants across one or more rounds have
completed findings entries covering all six journeys, following the consent and
retention rules above. A synthetic or maintainer-run walkthrough does not count as
external-user evidence — the whole point of this roadmap item is a perspective the
maintainer team does not already have.

## Rounds

_No round has been run yet. This section is appended to, never rewritten, as rounds
complete._
