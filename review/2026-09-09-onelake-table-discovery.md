---
layout: post
title: "Find the Right Fabric Table Faster With OneLake Catalog Search"
description: "Prepare for September's table-discovery preview with useful metadata, clear access boundaries, and a small acceptance test."
date: 2026-09-09
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Finding a useful table should start with what you know about the data, not a tour of workspaces.

Sometimes you know the business term. Sometimes you have a column name from a query someone sent you. You still need to locate the parent item before you can decide whether its table is useful.

Microsoft's September 9 announcement describes a practical improvement: OneLake Catalog will begin returning tables as standalone search results in late September. The first supported parent item types are semantic models, lakehouses, and mirrored databases.

This is a **preview rollout announcement**, not a claim that table search is available in every tenant today. The related tenant setting is already available for administrators to review.

My recommendation is to use that preparation window for a small discovery exercise. Pick a few tables, make their purpose clear, and define what different users should be able to find. That's a more useful adoption plan than simply waiting for a new search result type.

## Start with a question a developer actually asks

Consider a hypothetical analyst looking for order-line data. They know the column name `OrderLineId`, but they don't know the workspace or lakehouse containing the table.

The announced experience supports searching by table name or description, or by an exact column-name match to find the containing table. The table becomes the result. The column does not become a separate result object.

That difference is worth explaining in a team demo. Search helps locate a candidate table. It doesn't return a business answer or prove that the table has the right grain.

Once found, the table still needs a qualification check: what does one row represent, how current is it, and which team owns it? Those are proposed review questions, not automatic catalog guarantees.

![Start with a name, description, or exact column name; find the containing table; then validate its context.]({{ '/assets/blog/onelake-table-discovery/01-discovery.svg' | relative_url }})

## Give search better material to work with

Table descriptions become more useful as entry points. A description such as “order data” doesn't help someone choose between five similar tables.

For a small pilot, I'd ask each owner to write a description that identifies the business purpose and grain. For example:

> Order-line records for operational reporting. One row per order line. Includes cancelled lines; use the status field when calculating open demand.

This is an illustrative description, not a statement about a real customer dataset. Adapt it to the actual table and validate it with the owner.

Keep confidential details out of names and descriptions. Metadata is information too. A table name can reveal a business process even when the user cannot query its rows.

Start with frequently requested tables rather than a tenant-wide naming project. Record the search terms people naturally use. Once rollout reaches your tenant, test those terms against the actual results before promising discoverability to the wider team.

## Treat discovery and data access as separate checks

The announcement is explicit about the permission boundary. Table discovery requires **Read control-plane permission or higher on the parent item**. Read All or Read Data is not required just to find the table.

Data-plane permissions, including OneLake security, do not determine whether the table appears in catalog search. The workload continues enforcing data access when someone opens, queries, or otherwise uses the table.

That gives a team two different acceptance questions:

- Can this person discover the table's metadata?
- Can this person perform the intended operation on its data?

A search result is not evidence that the user can read rows. A failed query is not evidence that the table should have been invisible in search.

There is also a specific exclusion: Microsoft says tables in semantic models protected by object-level security are excluded from search. Don't turn that into a broader claim about every form of row-level or data-plane security.

![Metadata discovery follows parent-item permissions and the object-search setting; data use follows workload permissions. OLS-protected semantic models are excluded from table search.]({{ '/assets/blog/onelake-table-discovery/02-access.svg' | relative_url }})

## Review the setting before rollout

The tenant setting is called **Users can find objects in search**. Microsoft says it is enabled by default.

When enabled, supported contained objects can appear for users with the required access to the parent item. When disabled, search stays at the top-level Fabric item, such as a lakehouse or report. Disabling it does not revoke underlying item or data access.

I'd have the Fabric administrator record the current setting and the intended metadata-discovery policy. If that policy is unclear, resolve it with the data owners before announcing the feature internally.

This is a configuration review, not a recommendation to disable discovery by default. Better discovery has real value when people understand what it exposes and what it doesn't authorize.

## Run a small acceptance test

Use test identities with known permissions. Avoid doing the entire demo as a workspace administrator, because that hides the differences you need to validate.

A useful test record contains the identity, parent item, table, search term, expected discovery result, actual result, and a separate query-access outcome.

Try these cases once the preview is available in your tenant:

1. A supported table whose parent item the user can Read. Search by table name, then by an exact column name.
2. A supported table whose parent item the user cannot Read. Confirm that it does not appear.
3. A discoverable table where the user's data permissions differ. Test the intended data operation separately.
4. An OLS-protected semantic model. Confirm the documented table-search exclusion.

Record rollout availability with the result. If the new result type has not reached the tenant, mark the test pending instead of diagnosing a permissions defect.

## Bring automation in after the discovery contract is clear

Microsoft says table discovery will be available through global search and the OneLake Catalog Search API. It also describes access through the Fabric Core remote MCP server, local MCP server, and the search skill in the Fabric Skills library.

That's a useful path for developers and AI-assisted workflows. An agent can begin with a known column or business description instead of requiring a hard-coded workspace path.

I'd still start with the same acceptance tests. Finding a candidate table doesn't establish that it answers the question, and it doesn't grant permission to query it. Before adding automation, decide how the consumer will inspect parent context and handle missing access without treating search as authorization.

The practical opportunity is straightforward: make the right tables easier to find, while keeping the next decision explicit. Search gets you to a candidate. Ownership, grain, and data permissions determine what you can safely do with it.

## Sources

- [Get ready for table discovery in OneLake Catalog search (Preview), Microsoft Fabric, September 9, 2026](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Get-ready-for-table-discovery-in-OneLake-Catalog-search-Preview/ba-p/5365764). Primary source for rollout timing, supported objects, permissions, exclusions, and the tenant setting. Complete announcement verified through the [official Fabric Updates RSS feed](https://community.fabric.microsoft.com/rss/board?board.id=fbc_fabricupdatesblogs).
- [OneLake Catalog Search API](https://learn.microsoft.com/rest/api/fabric/core/catalog/search). Validate the available object-search contract as the preview rolls out.
- [Fabric object-level security](https://learn.microsoft.com/fabric/security/service-admin-object-level-security).
- [Fabric Core remote MCP server overview](https://learn.microsoft.com/rest/api/fabric/articles/mcp-servers/core-remote/overview-core-mcp-server).

**Shai Karmani**  
Practical data engineering, Microsoft Fabric, Power BI, and AI.  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
