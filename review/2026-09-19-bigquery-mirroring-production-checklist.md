---
layout: post
title: "Google BigQuery Mirroring Is GA. Here’s the Fabric Production Checklist"
description: "A practical architecture and acceptance checklist for bringing Google BigQuery data into OneLake with Fabric Mirroring."
date: 2026-09-19
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Microsoft Fabric Mirroring for Google BigQuery is now generally available.

That changes the conversation. The feature now has production support and an enterprise SLA, so teams can evaluate it as a supported path for bringing BigQuery data into OneLake without building and operating a separate ingestion pipeline.

The architecture is attractive: Fabric continuously replicates selected BigQuery tables, writes an analytics-ready copy into OneLake, and creates a read-only SQL analytics endpoint. The same data can then support Power BI, Spark, notebooks, data science, and cross-database SQL queries inside Fabric.

But GA is not the same as automatic production readiness.

BigQuery permissions, change history, staging, source security, keys, reseeding behavior, replication lag, and costs still need explicit decisions. I would treat this as a production architecture review, not a connector setup task.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-bigquery-mirroring-ga/01-architecture-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-bigquery-mirroring-ga/01-architecture.svg' | relative_url }}" alt="Architecture flow from Google BigQuery through Fabric Mirroring into OneLake and Fabric analytics experiences.">
</picture>

## What the GA release gives you

Fabric Mirroring creates and maintains a copy of BigQuery data in OneLake. It is database mirroring, not metadata-only access through a shortcut.

The Fabric side includes:

- replicated data stored as Delta tables in OneLake;
- a read-only SQL analytics endpoint;
- access from supported Fabric engines such as Power BI, Spark, and notebooks;
- cross-database SQL queries with warehouses and lakehouse SQL endpoints in the same workspace;
- managed replication instead of a custom copy pipeline.

Microsoft states that the Fabric compute used for replication does not consume capacity and that mirrored storage is free up to a capacity-based limit. Querying the mirrored data through SQL, Power BI, Spark, or other Fabric workloads consumes capacity normally.

The source side still has costs. BigQuery CDC uses BigQuery compute, change history, the Storage Write API, BigQuery storage, and Google Cloud Storage staging. "No pipeline to maintain" does not mean "no source bill to measure."

The best fit is a team that wants BigQuery data available across Fabric analytics experiences and is comfortable maintaining an analytical replica in OneLake.

## Gate 1: define the mirror as a product

Do not start with **Mirror all data** just because the setup wizard offers it.

Start with a small inventory:

| Decision | What to record |
| --- | --- |
| Business purpose | The reports, models, notebooks, or data products that will use the mirror |
| Scope | Selected projects, datasets, tables, and expected growth |
| Owner | One owner for the BigQuery source and one for the Fabric mirror |
| Freshness target | The lag the consuming workload can tolerate |
| Critical checks | Row counts, totals, keys, and business rules that must match |
| Cost boundary | BigQuery activity, staging, Fabric storage, and consuming workload capacity |

This turns the mirror into an owned data product. It also prevents a pilot from quietly becoming a second unmanaged copy of an entire warehouse.

## Gate 2: design the source access deliberately

The setup requires broad capabilities because the replication process must inspect metadata, read tables and change history, create jobs, and use Google Cloud Storage for staging.

Microsoft documents required BigQuery, storage, and service-account permissions. A team can allow the system to create the staging bucket or create it manually using the required naming convention. The bucket must be in the same region as the BigQuery dataset.

I would use a dedicated service account for the mirror, record every granted role, and review whether the documented minimum can be implemented with custom roles in the organization. The access review should include:

- who owns and rotates the service-account key;
- who can modify the connection in Fabric;
- which BigQuery projects and datasets the identity can reach;
- who can access the resulting mirrored database and SQL endpoint;
- how the team will review permissions after the pilot.

One detail matters more than it first appears: source-level granular security is not automatically carried into the mirrored database. Microsoft explicitly says that granular security configured in BigQuery must be reconfigured in Fabric.

That means the security design needs two reviews, one for source access and one for consumer access to the replicated data.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-bigquery-mirroring-ga/02-production-gates-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-bigquery-mirroring-ga/02-production-gates.svg' | relative_url }}" alt="Production gates for scope, access, replication behavior, and validation evidence in Fabric Mirroring for BigQuery.">
</picture>

## Gate 3: understand how table design changes replication behavior

Primary keys and change history are not implementation trivia. They affect how reliably and efficiently changes can be applied.

Microsoft documents these behaviors:

- change history must be enabled for source tables;
- tables without primary keys support insert-only changes cleanly;
- a non-insert change on a table without a primary key can trigger a full reseed;
- repeated non-insert changes can move replication into a backoff state;
- the BigQuery `CHANGES` function is constrained by the configured time-travel window and a maximum one-day query range;
- multi-statement transactions can create additional change-history limitations.

For tables without primary keys, classify the write pattern before adding them to the production scope:

1. **Append-only:** a reasonable candidate if inserts are the real operating pattern.
2. **Occasional updates or deletes:** test reseed behavior and cost with realistic volumes.
3. **Large, update-heavy tables:** do not assume continuous mirroring will be efficient. Microsoft notes that stopping and restarting can be more efficient when most of a large table changes.

This is where a table-level pilot is better than a database-level demo. Pick examples from each write pattern and observe what actually happens.

## Gate 4: test freshness as a range, not a promise

Fabric describes the experience as near real-time, but actual replication depends on source and destination region, volume, change frequency, network latency, and gateway capacity when a gateway is involved.

The BigQuery tutorial adds two practical details. After the initial snapshot, the mirror waits before fetching changes because BigQuery has a delay before new changes appear in its change-history function. When there is no activity, the replication engine can back off and poll as slowly as once per hour.

That behavior is reasonable for cost control. It also means a freshness SLO should distinguish:

- active-table replication lag;
- first-change latency after an idle period;
- initial snapshot duration;
- recovery time after an error or reseed.

Measure those four conditions. A single screenshot showing a **Running** status does not establish the data freshness users will experience.

## Gate 5: validate the consumption path

The acceptance test should continue past replication status and into the tool that will make the decision.

For one representative table set:

1. Record stable source row counts and business totals.
2. Complete the initial snapshot.
3. Insert, update, and delete known test records where the table design supports them.
4. Observe replication status and timestamps.
5. Query the SQL analytics endpoint.
6. Test the actual Power BI semantic model, Spark notebook, or downstream SQL view.
7. Confirm that Fabric permissions reproduce the intended consumer boundary.
8. Compare source-side cost and Fabric capacity consumption with the agreed budget.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-bigquery-mirroring-ga/03-acceptance-loop-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-bigquery-mirroring-ga/03-acceptance-loop.svg' | relative_url }}" alt="Acceptance loop covering baseline, mirrored replication, Fabric consumption, and owner review.">
</picture>

The evidence packet should be small enough to review:

- source and mirrored row counts;
- two or three business totals;
- observed lag for active and idle cases;
- replication errors or reseeds;
- source-side cost during the test window;
- Fabric capacity consumed by the downstream workload;
- security test results for an allowed user and a restricted user;
- owner approval for the selected scope.

## Gateway and network choices

Microsoft supports both virtual network connectivity and an on-premises data gateway path for BigQuery Mirroring. The documented minimum on-premises gateway version is `3000.286.6`.

If a gateway is part of the design, treat it as production infrastructure:

- record the installed version;
- verify outbound connectivity and firewall rules;
- size it for the expected change volume;
- monitor node health and capacity;
- define ownership and recovery procedures.

A gateway can solve a network constraint, but it also adds another dependency to the freshness path. Include it in the same lag and recovery tests.

## My recommended first production candidate

Choose three to five tables with these characteristics:

- clear ownership;
- stable primary keys;
- enabled change history;
- moderate, observable change volume;
- one real downstream Power BI or engineering use case;
- totals that can be reconciled easily;
- a source-side cost baseline.

Run that scope for at least one normal business cycle. Capture active and idle replication behavior, validate source security and Fabric security separately, and inspect both Google Cloud costs and Fabric workload consumption.

If the evidence is clean, expand by data product. Do not expand by database convenience.

BigQuery Mirroring reaching GA is useful because it makes a managed cross-cloud replication path a supported production option. The teams that get the most value will be the ones that keep the setup simple and make the operating contract explicit.

The connector is managed. The ownership, security, cost, and trust still belong to the architecture.

## Sources

- [Mirroring for Google BigQuery in Microsoft Fabric is generally available](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Mirroring-for-Google-BigQuery-in-Microsoft-Fabric-Generally/ba-p/5364851)
- [Microsoft Fabric mirrored databases from Google BigQuery](https://learn.microsoft.com/en-us/fabric/mirroring/google-bigquery)
- [Set up Mirroring for Google BigQuery](https://learn.microsoft.com/en-us/fabric/mirroring/google-bigquery-tutorial)
- [Limitations in mirrored databases from Google BigQuery](https://learn.microsoft.com/en-us/fabric/mirroring/google-bigquery-limitations)
- [Mirroring in Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/mirroring/overview)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Microsoft Data and AI practitioner<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
