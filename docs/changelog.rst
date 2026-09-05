Changelog
=========

0.1.2
-----

- Node and credential icons now ship a light and a dark variant, so they read on
  either n8n theme.
- The node codex files carry the package's own node identifiers, which is what
  points the editor's help links at this documentation.
- Errors raised while an item is processed are wrapped so the HTTP status and
  the item index both reach the n8n UI.

0.1.1
-----

- Documentation site.

0.1.0
-----

First release.

- Company → Lookup by UID or EHRA ID, against the Zefix PublicREST API.
- Company → Search by name, with canton, legal form and active-only filters.
- Publication → Get Many from SHAB, with UID, name, date, canton, sub-rubric,
  language and event-type filters.
- A polling trigger with a watermark that survives the revisions SHAB files
  against days it has already read.
- Ten event types classified from the structured publication content.
