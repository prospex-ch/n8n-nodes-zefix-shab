Example workflows
=================

Two workflows ship in `examples/
<https://github.com/prospex-ch/n8n-nodes-zefix-shab/tree/main/examples>`_,
importable as they are through **Workflows → Import from File**.

Slack alert on a board change
-----------------------------

``slack-alert-on-board-change.json``. The trigger polls at 08:00 every day for
two UIDs, keeps ``HR02`` mutations carrying ``OFFICERS_CHANGED``,
``SEAT_MOVED`` or ``NAME_CHANGED``, and posts the company name, the UID, the
events and the publication link to ``#sales-signals``.

To adapt it: put your own UIDs in the trigger, add the Zefix credential the UID
mode needs, and pick your channel in the Slack node.

Enrich HubSpot from a UID
-------------------------

``hubspot-enrich-from-uid.json``. Reads 25 companies out of HubSpot, looks each
``uid`` property up in Zefix, drops the rows that came back empty with a Filter
node, and writes the legal name, city, ZIP and purpose back onto the record.

The Filter step catches a UID the register has no record of: the lookup returns
an empty item, so the row stops there.

Both workflows need the credentials of the third-party node they end in. Delete
that last step and the Zefix/SHAB nodes still run on their own.
