Publications
============

**Publication → Get Many** reads HR publications from the Amtsblattportal and
returns one item per publication.

Filters
-------

**Filter By** offers three modes:

* **UID**: resolve the UID to a legal name through Zefix, search on that name,
  then keep the rows whose content block carries the same UID. Needs Zefix
  credentials.
* **Company Name**: search the SHAB keyword index directly, which holds company
  names.
* **Date Range Only**: every HR publication in the window.

**Start Date** is required. **End Date** defaults to today. Under **Options**:
**Cantons**, **Sub-Rubrics**, **Event Types**, **Language**, **Include
Cancelled** and **Include Raw Content**.

Filtering by UID needs credentials
----------------------------------

SHAB has no UID filter: every parameter that looks like one is accepted and
silently ignored, and UIDs are absent from the keyword index, which holds
company names.

The node resolves the UID through Zefix first, which is why that mode asks for
credentials. Without an account, filter by company name and canton.

``cantons``, ``subRubrics`` and ``languages`` are accepted and ignored in the
same way, so the node applies those three itself once the response arrives.
`The SHAB API guide <https://prospex.ch/guides/shab-api/>`_ has the
parameter-by-parameter version.

Output fields
-------------

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - Field
     - Notes
   * - ``id``, ``publicationNumber``
     - The publication's own identifiers
   * - ``publicationDate``, ``publicationState``
     - The day, and ``PUBLISHED`` or ``CANCELLED``
   * - ``subRubric``
     - ``HR01`` new registrations, ``HR02`` mutations, ``HR03`` deletions
   * - ``language``, ``cantons``, ``title``
     - The title comes in all four languages
   * - ``uid``, ``companyName``
     - Read out of the publication's own content block. ``uid`` is dotted, the
       form the company operations emit.
   * - ``eventTypes``
     - See :doc:`events`
   * - ``sourceUrl``
     - The public page for that publication
   * - ``content``
     - The full structured block, when **Include Raw Content** is on

Cancelled publications
----------------------

SHAB revises what it has published. With **Include Cancelled** on, a
publication that exists in both states arrives once, in its ``CANCELLED``
state, matching how ``shab-parser`` collapses the pair.

How a date range is read
------------------------

The endpoint answers at most 2,000 publications per request and refuses a
search offset above 10,000. Its index also reorders while a result set is being
read, which costs roughly 1% of the rows on any range paged from front to back.

So the node never pages a range. It asks for the count, and while the count is
above 2,000 it halves the range and asks again, until every half fits in one
request. A whole-country month costs a few dozen requests and returns every
publication in the range.
