# Operations Rehearsal Record

Use one copy of this record for each fresh-machine rehearsal. Record commands,
outputs, timestamps, and target environments in the change or incident record.
Never include secrets, tokens, `.env` contents, or personal access data.

## Run Metadata

| Field | Value |
| --- | --- |
| Operator | |
| Date and time (UTC) | |
| Commit or image digest | |
| Host OS and version | |
| Target environment | |
| Change or incident reference | |

## Acceptance Checklist

| Operation | Command or evidence | Result | Evidence reference |
| --- | --- | --- | --- |
| Rollback | Last-known-good deployment restored through the normal workflow | Pending | |
| D1 backup | Authenticated backup created and listed for the intended database | Pending | |
| D1 restore | Writes paused, selected backup restored, reads verified | Pending | |
| Migration | Disposable or staging migration applied and status verified | Pending | |
| Incident | Scope, owner, mitigation, recovery, timeline, and follow-up recorded | Pending | |
| Provider outage | Upstream failure confirmed, fallback and freshness state verified | Pending | |

## Self-Hosted Smoke Evidence

| Check | Result | Evidence reference |
| --- | --- | --- |
| `docker compose config` | Pending | |
| `docker compose build` | Pending | |
| `docker compose up -d` | Pending | |
| `/api/health` | Pending | |
| `docker compose restart` | Pending | |
| `/api/migrations/status` | Pending | |
| `docker compose down` | Pending | |
| Data volume identity and persistence | Pending | |

## Review

- [ ] No secrets or credentials are present in the record.
- [ ] Every operation has command output or an external evidence reference.
- [ ] Failed checks have an incident or follow-up issue.
- [ ] The operator and reviewer agree whether the rehearsal passed.

**Rehearsal decision:** Pending

**Reviewer:**

**Review date (UTC):**
