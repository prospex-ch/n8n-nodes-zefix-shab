n8n-nodes-zefix-shab
====================

Read the Swiss commercial register from n8n. Two nodes: one that looks companies
up in `Zefix <https://www.zefix.admin.ch>`_ and reads publications from
`SHAB <https://www.shab.ch>`_, and a polling trigger that starts a workflow when
the register publishes something about a company you watch.

Ten event types are classified out of each publication's structured content, so
a workflow can branch on a board change without reading the German, French or
Italian text under it.

The package ships no runtime dependencies. Every request goes through n8n's own
HTTP helpers.

Built and maintained by `Prospex <https://prospex.ch>`_, a Swiss B2B sales
intelligence platform.

.. toctree::
   :maxdepth: 2

   install
   company
   publications
   trigger
   events
   examples
   access
   changelog
