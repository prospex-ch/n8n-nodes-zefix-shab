n8n-nodes-zefix-shab
====================

Read the Swiss commercial register from n8n.

The register is federal, and it faces the public through two interfaces.
`Zefix <https://www.zefix.admin.ch>`_ holds the current entry for every company.
`SHAB <https://www.shab.ch>`_, the official gazette, publishes every change to
an entry, and a change takes effect for third parties on the day it appears
there. This package reads both through one node, and adds a polling trigger
that starts a workflow when the register publishes something about a company
you watch.

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
