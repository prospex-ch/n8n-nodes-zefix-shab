# Changelog

## 0.1.0

First release.

- Company → Lookup by UID or EHRA ID, against the Zefix PublicREST API.
- Company → Search by name, with canton, legal form and active-only filters.
- Publication → Get Many from SHAB, with UID, name, date, canton, sub-rubric,
  language and event-type filters.
- A polling trigger, daily by default, with a watermark that survives the
  revisions SHAB files against days it has already read.
- Ten event types classified from the structured publication content.
