Install and credentials
=======================

Install
-------

In n8n: **Settings → Community nodes → Install**, then type
``n8n-nodes-zefix-shab``.

Self-hosted, from the command line:

.. code-block:: bash

   npm install n8n-nodes-zefix-shab

Restart n8n, and both nodes appear in the node panel under **Zefix/SHAB**
and **Zefix/SHAB Trigger**.

What needs an account
---------------------

.. list-table::
   :header-rows: 1
   :widths: 34 30 18 18

   * - Node
     - Operation
     - Source
     - Credentials
   * - Zefix/SHAB
     - Company → Lookup
     - Zefix PublicREST
     - required
   * - Zefix/SHAB
     - Company → Search
     - Zefix PublicREST
     - required
   * - Zefix/SHAB
     - Publication → Get Many
     - SHAB
     - only to filter by UID
   * - Zefix/SHAB Trigger
     - poll
     - SHAB
     - only to watch a UID list

SHAB is open, so filter by company name or canton and no account is needed.

Zefix credentials
-----------------

Every Zefix PublicREST endpoint refuses an unauthenticated call, the company
lookup and the legal-form list included. Accounts are issued by the Federal
Office of Justice: write to ``zefix@bj.admin.ch`` and say what you plan to use
the API for. There is no self-service signup and no key in a dashboard.

Once you have the username and password, add them in n8n under **Credentials →
Zefix API**. The credential test calls ``GET /legalForm``, so a wrong password
fails inside the dialog, while you are still setting it up.

`The Zefix REST API guide <https://prospex.ch/guides/zefix-rest-api/>`_
documents all ten endpoints and the two UID formats they disagree about.

Both nodes declare the credential optional, so you can drop either one on the
canvas and run it before an account arrives. An operation that needs Zefix and
finds no credential stops with an error naming what to do.
