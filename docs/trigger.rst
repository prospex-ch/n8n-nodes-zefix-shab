Trigger
=======

**Zefix/SHAB Trigger** polls SHAB and starts the workflow on publications it
has not emitted before. Rows carry the same fields as
:doc:`Publication → Get Many <publications>`.

Set Poll Times to once a day
----------------------------

n8n defaults every polling trigger to every minute. SHAB publishes on working
days and rate-limits by class of client, so a minute interval returns the same
rows a daily run returns.

What to watch
-------------

**Watch** offers a **UID List** (comma-separated, all three UID forms accepted,
needs Zefix credentials), a **Company Name** against the keyword index, or
**Everything**. Narrow further with **Cantons**, **Sub-Rubrics** and **Event
Types**, and under **Options** with **Language**, **Include Raw Content** and
**Lookback Days**.

**Lookback Days** defaults to 7 and sets how far back each poll reads. A window
wider than the poll interval covers a run that was missed and picks up the
revisions SHAB files against days it has already published.

The stored position
-------------------

The first run records where it got to and emits nothing, so switching a workflow
on does not replay the archive.

After that, each poll stores the newest publication date it has seen and the IDs
seen on that date. A correction SHAB files against an earlier day still comes
through, and rows already emitted are not repeated.

In manual mode the trigger returns one recent item so you can see the shape
while building, and leaves the stored position untouched. Pinning that item lets
you build the rest of the workflow without polling again.
