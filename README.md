# n8n-nodes-zefix-shab

Read the Swiss commercial register from n8n.

The register is federal, and it faces the public through two interfaces.
[Zefix](https://www.zefix.admin.ch) holds the current entry for every company.
[SHAB](https://www.shab.ch), the official gazette, publishes every change to an
entry, and a change takes effect for third parties on the day it appears there.
This package reads both through one node, and adds a polling trigger that starts
a workflow when the register publishes something about a company you watch.

Built and maintained by [Prospex](https://prospex.ch), a Swiss B2B sales
intelligence platform.

Full documentation:
[n8n-nodes-zefix-shab.readthedocs.io](https://n8n-nodes-zefix-shab.readthedocs.io).

## Installation

In n8n: **Settings → Community nodes → Install**, then `n8n-nodes-zefix-shab`.

Self-hosted, from the command line:

```bash
npm install n8n-nodes-zefix-shab
```

## Operations

| Node | Operation | Reads | Credentials |
|---|---|---|---|
| Zefix and SHAB | Company → Lookup | the register entry | required |
| Zefix and SHAB | Company → Search | the register entry | required |
| Zefix and SHAB | Publication → Get Many | the gazette | only to filter by UID |
| Zefix and SHAB Trigger | poll | the gazette | only to watch a UID list |

The gazette is open, so the node runs with no account at all as long as you
filter by company name or canton.

## Credentials

Every Zefix PublicREST endpoint refuses an unauthenticated call, including the
company lookup and the legal-form list. Accounts are issued by the Federal
Office of Justice: write to zefix@bj.admin.ch and say what you plan to use the
API for. There is no self-service signup and no key in a dashboard.

Once you have the username and password, add them in n8n under **Credentials →
Zefix API**. The credential test calls `GET /legalForm`, so a wrong password
fails in the dialog itself.

[The Zefix REST API guide](https://prospex.ch/guides/zefix-rest-api/) documents
all ten endpoints and the two UID formats they disagree about.

## Compatibility

Requires Node.js 20.15 or newer and an n8n instance with community nodes
enabled. The package targets community node API version 1.

Every request goes through n8n's own HTTP helpers, so the package ships no
runtime dependencies.

## Usage

### Company → Lookup

Give it a UID or an EHRA ID. All three UID forms are accepted:

```
CHE-123.456.789
CHE123456789
123456789
```

The node emits the dotted form for display and sends the compact form to the
API, which is the only one `/company/uid/{uid}` matches. A UID that is not in
the register returns an empty item, so a workflow can branch on it. A malformed
UID is rejected before any request goes out. [Checking a Swiss
company](https://prospex.ch/guides/check-swiss-company/) covers where each
format shows up and what the check digit does.

Output:

| Field | Notes |
|---|---|
| `name`, `uid`, `uidCompact`, `ehraid`, `chid` | identifiers. `uid` is the dotted form, the same form Publications emit. |
| `canton`, `legalSeat`, `legalSeatId` | registered office |
| `legalFormId`, `legalFormUid`, `legalForm` | the internal ID, the four-character eCH-0097 code, and the localised names |
| `status` | `ACTIVE`, `CANCELLED` or `BEING_CANCELLED` |
| `purpose` | the statutory purpose, in the language of the cantonal register it is entered in |
| `capitalNominal`, `capitalCurrency` | nominal capital as a string, and its currency |
| `deletionDate`, `sogcDate` | dates |
| `address` | street, house number, PO box, ZIP, town |
| `oldNames`, `translation` | former names, and registered translations |
| `headOffices`, `furtherHeadOffices`, `branchOffices` | company relations |
| `hasTakenOver`, `wasTakenOverBy`, `auditCompanies` | company relations |
| `cantonalExcerptWeb` | link to the cantonal extract |
| `zefixDetailWeb` | Zefix detail pages, one per language |

`cantonalExcerptWeb` comes from the API. The hosts are per-canton
(`zg.chregister.ch`, `rc.zh.ch`, `prestations.vd.ch`), so use the returned link
and do not build one.

### Company → Search

A name of at least 3 characters, with `*` as a wildcard. Optional: canton, legal
form (a dropdown fed by `/legalForm`), and a switch to drop struck companies.
Each row is the Zefix search record, with `uid` in the dotted form and
`uidCompact` alongside it, in the same form Lookup emits.

Canton, Legal Seat ID and Registry of Commerce ID are mutually exclusive in the
API. Setting two raises an error naming both, before the request is sent. The
search endpoint returns everything it has in one response, so the limit is
applied by the node.

### Publication → Get Many

Reads HR publications from the gazette, one row per publication:

| Field | Notes |
|---|---|
| `id`, `publicationNumber` | the publication's own identifiers |
| `publicationDate`, `publicationState` | the day, and `PUBLISHED` or `CANCELLED` |
| `subRubric` | `HR01` new registrations, `HR02` mutations, `HR03` deletions |
| `language`, `cantons`, `title` | the title comes in all four languages |
| `uid`, `companyName` | read out of the publication's own content block |
| `eventTypes` | see the table below |
| `sourceUrl` | the public page for that publication |
| `content` | the full structured block, when **Include Raw Content** is on |

**Filtering by UID needs Zefix credentials.** The gazette has no UID filter:
`uid`, `hr.uid`, `companyUid` and `hr.uidFormatted` are all accepted and
silently ignored, and the keyword index holds company names only, so
`keyword=CHE-116.281.710` returns nothing. The node resolves the UID to a legal
name through Zefix, searches on that name, then keeps the rows whose
`content.commonsActual.company.uid` matches. Without credentials, filter by
company name and canton instead.

`cantons`, `subRubrics` and `languages` are accepted by the API and ignored by
it in the same way, so the node applies those three itself, after the response
arrives. [The SHAB API guide](https://prospex.ch/guides/shab-api/) has the
parameter-by-parameter version.

### Trigger

Watch a UID list, a company name, or everything. Narrow by canton, sub-rubric
and event type.

**Set Poll Times to once a day.** n8n defaults every polling trigger to every
minute. The gazette publishes on working days and rate-limits by class of
client, so polling every minute adds nothing to a daily run.

The first run records where it got to and emits nothing, so switching a workflow
on does not replay the archive. After that each poll stores the newest
publication date and the IDs seen on that date, so a correction filed against a
day the trigger has already read still comes through, and the rows already
emitted are not repeated.

In manual mode the trigger returns one recent item so you can see the shape
while building, and leaves the stored position untouched.

### Event types

`eventTypes` is derived from the publication's structured content, and the
identifiers match the taxonomy in
[`shab-parser`](https://pypi.org/project/shab-parser/).

| Event | Derived from |
|---|---|
| `INCORPORATION` | sub-rubric `HR01` |
| `BRANCH_CREATED` | `HR01` with legal form 0111 or 0151 |
| `SEAT_MOVED` | the seat in `commonsNew` differs from `commonsActual` |
| `ADDRESS_CHANGED` | the `addressChanged` flag, confirmed by an address that really differs |
| `NAME_CHANGED` | the name differs by more than a liquidation qualifier |
| `PURPOSE_CHANGED` | the `purposeChanged` flag, or a purpose that differs |
| `CAPITAL_INCREASED` | a nominal amount in `commonsNew` above the one in `commonsActual` ([what a capital increase means](https://prospex.ch/guides/what-capital-increase-means/)) |
| `OFFICERS_CHANGED` | a labelled person block in the publication text |
| `LIQUIDATION` | a dissolution flag, or a legal name acquiring a liquidation qualifier |
| `DELETED` | sub-rubric `HR03` |

A publication carrying several events emits them in the table's order, which
follows a company's life cycle.

Three of the register's own change flags are unreliable, so the node checks each
one against the data behind it.

| Flag | How it misleads | What the node compares |
|---|---|---|
| `seatChanged` | fires when a company moves down the street inside the same commune | the seat in `commonsActual` against the one in `commonsNew` |
| `addressChanged` | fires when the register re-parses an address, splitting a PO box out of the street line | the two addresses, token by token |
| `nameChanged` | stays false on most renames the register publishes | the two legal names |

#### Limits of the classifier

`MERGER` needs free-text extraction in three languages and is absent here.

`OFFICERS_CHANGED` detects that officers changed, without saying who: the names,
roles and signature rights live only in the publication text. Geneva, Vaud and
Neuchâtel write those mutations as running prose with no labelled block, so an
officer change in those three cantons is missed altogether: over a
400-publication sample, 61 rows produced no event at all, and 40 of them came
from those cantons. A publication that swaps only the auditor uses the same
labelled block as a board change, so the node emits `OFFICERS_CHANGED` for it
too.

Against `shab-parser` on a 60-publication sample stratified across the three
sub-rubrics, the two agree on 57. The three differences are one `MERGER`, one
officer change in Vaud, and one auditor swap in Zug.
[`shab-parser`](https://pypi.org/project/shab-parser/) parses the prose form
and returns the person list, with the auditor marked as such.

### Example workflows

Two workflows in [`examples/`](examples), importable as they are:

- `slack-alert-on-board-change.json`: watch two UIDs daily, post board, seat and
  name changes to Slack.
- `hubspot-enrich-from-uid.json`: read companies out of HubSpot, look each UID
  up in Zefix, write the name, address and purpose back.

### Access and terms

The gazette is open. Its API answers at most 2,000 publications per request,
refuses a search offset above 10,000, and reorders its index while a result set
is read. The node splits a date range in half until each half fits in a single
request, so a whole-country month costs a few dozen of them. It sends one
request per second at most and backs off exponentially on failure. Its
`User-Agent` carries this repository's URL.

Zefix PublicREST needs the Basic credentials described above. The node paces it
at one request every 0.5 seconds and retries a 429 or a 5xx three times. A run
of failed retries throws, so an empty result always means the company is absent
from the register.

The register data is also published as linked data through LINDAS, under terms
the Federal Office of Justice states on
[the Zefix site](https://www.zefix.admin.ch/en/search/entity/welcome). Read
those before redistributing bulk extracts.

## Watching the whole register

The trigger on a daily schedule covers a UID list you already have.
[Prospex](https://prospex.ch) watches the whole register and joins it to hiring,
funding and web signals, then says which of those changes is worth a call.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Zefix](https://www.zefix.admin.ch) and [the Zefix REST API guide](https://prospex.ch/guides/zefix-rest-api/)
- [SHAB](https://www.shab.ch) and [the SHAB API guide](https://prospex.ch/guides/shab-api/)

The register is also reachable outside n8n:

| Package | Does |
|---|---|
| [`shab-parser`](https://pypi.org/project/shab-parser/) | the gazette: discovery, fetch, parse, eleven-type event classification |
| [`zefix-parser`](https://pypi.org/project/zefix-parser/) | the register entry: LINDAS SPARQL, PublicREST, UID validation |
| [`swissco`](https://github.com/prospex-ch/swissco-cli) | the same register from a command line, plus simap, FINMA, GLEIF and ARAMIS |

## Development

```bash
npm install
npm run dev     # starts n8n with the node linked
npm run lint
npm run build
npm test
```

## License

MIT
