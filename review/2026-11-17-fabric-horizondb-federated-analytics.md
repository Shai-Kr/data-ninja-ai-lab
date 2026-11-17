---
layout: post
title: "The Fabric Pattern That Connects PostgreSQL Apps and Analytics Both Ways"
date: 2026-11-17
description: A practical architecture for using Fabric HorizonDB mirroring, federated queries, and data delivery without mixing operational and analytical responsibilities.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

<style>
@media (max-width: 760px) {
  .site-shell { width: min(100% - 24px, var(--max)); }
  .site-header { gap: 12px; margin-bottom: 18px; }
  .brand { font-size: 0.94rem; }
  .brand-mark { width: 32px; height: 32px; border-radius: 10px; }
  .nav { display: none; }
  .article { max-width: 100%; overflow-x: hidden; }
  .article-header { padding: 20px 14px; border-radius: 18px; }
  .article-header h1 { font-size: clamp(1.12rem, 5vw, 1.6rem); line-height: 1.17; }
  .article-header .dek { font-size: 0.94rem; margin-top: 14px; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; height: auto; border-radius: 16px; }
  .article-body pre { max-width: 100%; overflow-x: auto; font-size: 0.78rem; }
  .subscribe-orbit { display: none; }
}
.review-visual { width: 100%; max-width: 100%; margin: 34px 0 10px; overflow: hidden; }
.review-visual img { display: block; width: 100%; max-width: 100%; height: auto; }
</style>

**Review draft. Direct link only.**

Fabric HorizonDB puts a managed PostgreSQL database inside Microsoft Fabric. The interesting part is not that an application can use a PostgreSQL endpoint. It is how operational and analytical data can move in both directions without pretending they are the same workload.

An application can write transactions to PostgreSQL. Fabric can mirror eligible tables to OneLake for analytics. A PostgreSQL query can read supported Fabric data through a foreign data wrapper. A Copy job can return a bounded analytical result to an application table.

Those are three different data paths. Each has a different freshness model, latency profile, and failure boundary.

That separation is the useful architecture lesson behind the Ignite announcement.

Fabric HorizonDB is in public preview. The current preview has important restrictions, including a single PostgreSQL connection identity: only the Microsoft Entra identity that created the database can connect. This is a capability to test with a bounded workload, not a reason to move a production system this week.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-horizondb-federated-analytics/01-three-paths-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-horizondb-federated-analytics/01-three-paths.webp" alt="Three HorizonDB data paths cover mirroring PostgreSQL data to Fabric, querying Fabric data from PostgreSQL, and delivering analytical results back to PostgreSQL"></picture></figure>

## Start with the direction of the decision

The first question is not which connector to use. Ask where the data lives when the decision is made and where the result needs to be consumed.

### Mirror operational data for analytics

HorizonDB mirroring makes eligible PostgreSQL tables available as an asynchronous analytical copy in OneLake and through a read-only SQL analytics endpoint.

This is the right path when Power BI, notebooks, SQL analytics, or another Fabric workload needs operational data without running reporting queries against the PostgreSQL application endpoint.

The word asynchronous matters. A healthy PostgreSQL transaction does not prove that its mirrored representation is current. Every consumer that uses the analytical copy needs a stated freshness tolerance and a way to see mirror health.

### Query Fabric data without copying it into PostgreSQL

The service-managed `pg_fabric_fdw` extension exposes supported Fabric warehouses and SQL analytics endpoints as read-only PostgreSQL foreign tables.

The application remains connected to PostgreSQL. Eligible filters, joins, aggregates, sorts, and limits can be pushed to Fabric, with the result returned to PostgreSQL. `EXPLAIN (VERBOSE)` shows the generated Fabric SQL so a developer can see what is actually remote.

This path fits selective queries that need current supported Fabric data and can tolerate a runtime dependency on the remote source. It is not a license to join an operational table to an unbounded analytical scan. Keep the query bounded, inspect pushdown, and test cross-engine behavior for text, UUID ordering, averages, and other expressions where PostgreSQL and Fabric rules can differ.

### Deliver reusable analytical results to the application

Some results belong inside PostgreSQL because the application reads them repeatedly or needs local indexes, constraints, transactions, and predictable latency.

HorizonDB data delivery uses a Copy job to load a bounded Fabric result into a PostgreSQL target. Microsoft's guidance is the pattern I would use: load into a staging table, validate the batch, then publish it to the application-facing table with an idempotent PostgreSQL statement.

The current preview does not promise change data capture, source-delete propagation, automatic schema evolution, checkpoints, or conflict resolution for this path. Batch identity and replay behavior are part of the design, not optional metadata.

## Build a closed loop without creating a distributed mystery

The three paths can work together.

Take an order application. The application writes orders and status changes to the PostgreSQL endpoint. Mirroring makes eligible transactions available in OneLake. A Fabric workload calculates a customer-risk score. A Copy job loads the bounded score set into a staging table. PostgreSQL validates and publishes the accepted batch to the table the application serves.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-horizondb-federated-analytics/02-operational-loop-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-horizondb-federated-analytics/02-operational-loop.webp" alt="An operational loop moves PostgreSQL transactions to OneLake analytics and returns a bounded analytical result through staging and controlled publication"></picture></figure>

The application does not call a large analytical query for every screen load. The analytical process does not write directly into a serving table. The batch has an identity, a validation step, and a known freshness boundary.

That is much easier to support than a vague promise of real-time integration.

I would record at least:

| Evidence | Why it matters |
| --- | --- |
| Source watermark | Shows what analytical input the result covers |
| Batch identifier | Connects loading, validation, and publication |
| Row counts | Detects partial or unexpected deliveries |
| Published timestamp | Gives the application an explicit freshness value |
| Rejected-row count | Prevents silent data loss |
| Previous accepted batch | Supports safe rollback or comparison |

## Treat every integration path as independently unhealthy

Fabric HorizonDB separates durable storage from customer-usable compute. The service can adjust compute, and an idle database can pause where scale to zero is enabled. A connection through the same endpoint starts resume, so the application needs bounded retry and must tolerate startup latency.

Sessions, temporary state, and volatile caches are not guaranteed to survive pause, scaling, maintenance, or another disruptive transition. Retrying an idempotent read is different from automatically replaying a PostgreSQL transaction after a dropped connection.

The integration paths also fail independently:

- PostgreSQL can be healthy while mirroring is behind.
- A federated query can fail because of remote permissions, schema, capacity, or connectivity while local queries still work.
- A Copy job can fail or partially load staging data without affecting the serving table.
- Compute can pause independently of the last known integration status.

One green database icon is not an operating model.

## Use a five-gate preview acceptance pack

The preview boundary is substantial. Only the database creator can connect to PostgreSQL today. Other users, groups, service principals, and managed identities cannot. Customers do not receive PostgreSQL superuser, host, filesystem, arbitrary native-library, or unrestricted server-configuration access. Sharing the Fabric item does not remove those restrictions.

That does not make the preview unhelpful. It tells you what a useful test must prove.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-horizondb-federated-analytics/03-production-gates-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-horizondb-federated-analytics/03-production-gates.webp" alt="Five acceptance gates cover identity, PostgreSQL compatibility, freshness, recovery, and independent operational evidence"></picture></figure>

My acceptance pack would include:

1. **Identity:** prove the creator-only connection model fits the experiment and document what prevents production adoption.
2. **Compatibility:** run the application's required SQL, types, extensions, connection pooling, transactions, and error handling inside the managed compatibility boundary.
3. **Freshness:** measure mirror delay, federated-query latency, and the age of the last successfully published delivery batch.
4. **Recovery:** test pause and resume, safe reconnect, remote-source failure, partial staging loads, and idempotent batch replay.
5. **Evidence:** monitor database state, mirroring, federation, and Copy jobs as separate components with separate owners.

Use synthetic, nonsensitive data in a dedicated workspace. Confirm that the preview is enabled for the tenant, region, workspace, and capacity. Do not infer production recovery guarantees from another Fabric database item.

## Where HorizonDB becomes interesting

The strongest HorizonDB story is not "PostgreSQL is now in Fabric."

It is a managed operational database that understands three deliberate relationships with the analytical estate:

- send eligible operational data out for analytics;
- read selected analytical data in place when a query needs it;
- return controlled analytical results to the application when they belong in local operational state.

That gives data teams a cleaner way to discuss translytical systems. Data direction, freshness, ownership, and failure behavior become explicit architecture choices.

The preview still has real limits. But the model is worth learning now because it turns the operational-to-analytical boundary into something teams can design and test instead of hiding behind a connector.

## Sources

- [Fabric November 2026 Feature Summary](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Fabric-November-2026-Feature-Summary/ba-p/5414311)
- [What is Microsoft Fabric HorizonDB (preview)?](https://learn.microsoft.com/en-us/fabric/database/horizondb/overview)
- [Federated Analytics in Microsoft Fabric HorizonDB](https://learn.microsoft.com/en-us/fabric/database/horizondb/federated-analytics-overview)
- [Limitations for Microsoft Fabric HorizonDB](https://learn.microsoft.com/en-us/fabric/database/horizondb/limitations)
- [Control Fabric HorizonDB compute usage](https://learn.microsoft.com/en-us/fabric/database/horizondb/control-compute-usage)
- [Connect a Python application to Fabric HorizonDB](https://learn.microsoft.com/en-us/fabric/database/horizondb/connect-python)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
