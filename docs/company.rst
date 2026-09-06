Company operations
==================

Lookup
------

Give it a UID or an EHRA ID. **Look Up By** switches between the two. All three
UID forms are accepted:

.. code-block:: text

   CHE-123.456.789
   CHE123456789
   123456789

The node emits the dotted form for display and sends the compact form to the
API, which is the only one ``/company/uid/{uid}`` matches. A UID the register
has no record of returns an empty item, so a workflow can branch on it with an
IF node, and the node attaches a hint saying so. Zefix covers the commercial
register alone, while `uid.admin.ch <https://www.uid.admin.ch>`_ covers every
UID unit, so a UID issued for VAT alone, an association or a public body is
valid there and empty here. ``CHE-116.320.238``, the VAT group of Banque
Cantonale Vaudoise, is one: the bank itself is ``CHE-105.934.376``. A malformed
UID is rejected before any request goes out.
`Checking a Swiss company <https://prospex.ch/guides/check-swiss-company/>`_
covers where each format shows up and what the check digit does.

Output fields
~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 42 58

   * - Field
     - Notes
   * - ``name``, ``uid``, ``uidCompact``, ``ehraid``, ``chid``
     - Identifiers. ``uid`` is the dotted form, the same form the publication
       rows carry, so the two join directly.
   * - ``canton``, ``legalSeat``, ``legalSeatId``
     - Registered office
   * - ``legalFormId``, ``legalFormUid``, ``legalForm``
     - The internal ID, the four-character eCH-0097 code, and the localised
       names
   * - ``status``
     - ``ACTIVE``, ``CANCELLED`` or ``BEING_CANCELLED``
   * - ``purpose``
     - The statutory purpose, in the language of the register of entry
   * - ``capitalNominal``, ``capitalCurrency``
     - Nominal capital as a string, and its currency
   * - ``deletionDate``, ``sogcDate``
     - Dates
   * - ``address``
     - Street, house number, PO box, ZIP, town
   * - ``oldNames``, ``translation``
     - Former names, and registered translations
   * - ``headOffices``, ``furtherHeadOffices``, ``branchOffices``
     - Company relations
   * - ``hasTakenOver``, ``wasTakenOverBy``, ``auditCompanies``
     - Company relations
   * - ``cantonalExcerptWeb``
     - Link to the cantonal extract
   * - ``zefixDetailWeb``
     - Zefix detail pages, one per language

The hosts behind ``cantonalExcerptWeb`` are per-canton (``zg.chregister.ch``,
``rc.zh.ch``, ``prestations.vd.ch``), so use the link the API returns and do not
build one.

Search
------

A **Name** of at least three characters, with ``*`` as a wildcard. Under
**Options**: **Canton**, **Legal Form** (a dropdown fed by ``/legalForm``),
**Active Only** to drop struck companies, and the two identifiers below. Each
row is the Zefix search record, with ``uid`` in the dotted form and
``uidCompact`` alongside it.

Canton, **Legal Seat ID** and **Registry of Commerce ID** are mutually exclusive
in the API. Setting two of them raises an error naming both, before the request
is sent.

The search endpoint returns everything it has in a single response, so
**Limit** is applied by the node after the answer arrives.

.. code-block:: text

   Name: Migros*
   Options → Canton: ZH
   Options → Active Only: on
