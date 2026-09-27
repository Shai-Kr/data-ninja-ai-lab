---
layout: post
title: "The Power BI Scale-Out Pattern That Keeps Reports Responsive During Refresh"
description: "A practical guide to read-only replicas, synchronization, refresh paths, and evidence for Power BI semantic model scale-out."
date: 2026-09-27
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

A large Power BI audience creates two different workloads on the same semantic model.

Users need fast, concurrent reads. Data and model operations need a safe place to write, process, and refresh.

Power BI semantic model scale-out separates those jobs. A read-write replica handles writes and refreshes. One or more read-only replicas serve report and dashboard queries. While the primary is being refreshed, the read-only side can continue answering user queries.

That is a useful architecture. It is also easy to explain badly.

Scale-out does not make every query faster, remove capacity limits, or eliminate synchronization decisions. The real benefit is workload separation, with a measurable contract for freshness and availability.

Here is the operating pattern I would use.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/power-bi-semantic-model-scale-out/01-workload-separation-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/power-bi-semantic-model-scale-out/01-workload-separation.svg' | relative_url }}" alt="Power BI semantic model scale-out separates read-write refresh work from read-only report queries.">
</picture>

## Start with the problem scale-out actually solves

Semantic model scale-out is designed for models serving a large number of concurrent queries. Power BI can create read-only replicas and distribute report queries across them while directing writes and refreshes to the read-write replica.

The separation matters most when these workloads overlap:

- a scheduled or API-driven refresh is processing data;
- many users are opening reports at the same time;
- live-connection reports are sending interactive queries;
- XMLA tools or automation are changing the model;
- the business expects report availability during the refresh window.

Without a clear workload map, enabling a feature can become the entire plan. I would first capture three baselines:

1. **Concurrency:** how many interactive queries arrive during peak periods?
2. **Refresh overlap:** which refresh or write windows collide with user demand?
3. **Capacity pressure:** does the model have enough available compute for another replica without driving the capacity into throttling?

That third question is easy to miss. Microsoft states that all replicas combined remain subject to the compute available to the semantic model on the capacity. If capacity load is already high enough to cause throttling, Power BI might not create another read-only replica.

Scale-out uses capacity more effectively. It does not create free compute.

## Understand the connection paths

The routing behavior is specific.

Power BI Desktop and live-connection reports normally connect to a read-only replica when scale-out is enabled. Refreshes in the Power BI service and Enhanced Refresh REST API use the read-write replica. XMLA client applications connect to the read-write replica by default unless the connection explicitly requests read-only access.

For supported client tools, the connection can target a mode by appending a parameter to the semantic model URL:

```text
?readonly
?readwrite
```

This detail should be part of the test plan. A heavy analytical process accidentally targeting the read-write replica cannot be distributed across read-only replicas. It can create interactive CPU pressure exactly where refresh and write operations are running.

I would document every connection as one of four types:

| Connection | Intended replica | Why |
| --- | --- | --- |
| Power BI report query | Read-only | Interactive consumption |
| DAX validation tool | Read-only unless a write is required | Avoid unnecessary load on the primary |
| Refresh or processing job | Read-write | Changes model data |
| Metadata deployment | Read-write | Changes model definition |

That one inventory often reveals that the capacity problem is partly a routing problem.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/power-bi-semantic-model-scale-out/02-routing-contract-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/power-bi-semantic-model-scale-out/02-routing-contract.svg' | relative_url }}" alt="Routing contract for Power BI report queries, validation tools, refresh jobs, and metadata deployments.">
</picture>

## Treat synchronization as a freshness contract

By default, Power BI automatically synchronizes read-only replicas with the read-write model.

That is the safer default because consumers receive the latest processed version without an extra operational step. Manual synchronization can be useful when a team wants tighter control over when a refreshed version becomes visible, but it creates a new responsibility.

The refresh method matters when automatic synchronization is disabled:

- on-demand refresh in the user interface synchronizes;
- scheduled refresh synchronizes;
- Basic REST API refresh requires manual synchronization;
- Enhanced Refresh REST API requires manual synchronization;
- XMLA processing requires manual synchronization.

A successful refresh response is therefore not always proof that report users can see the new data.

The deployment record should contain two separate results:

1. **Primary updated:** the read-write replica completed the intended refresh or write.
2. **Consumer version published:** the read-only replicas were synchronized and a known-value query returned the new version.

I would use a small release marker in the model, such as the expected business date or batch identifier, and validate it through a read-only connection. That produces evidence from the same path used by reports.

## Use five acceptance tests

The feature is ready when the operating behavior is proven, not when the setting is enabled.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/power-bi-semantic-model-scale-out/03-acceptance-tests-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/power-bi-semantic-model-scale-out/03-acceptance-tests.svg' | relative_url }}" alt="Five acceptance tests for Power BI semantic model scale-out covering routing, overlap, freshness, capacity, and rollback.">
</picture>

### 1. Routing test

Run a known query through the normal report path and through an XMLA client using explicit read-only and read-write modes. Confirm that the tools reach the intended replica type.

### 2. Refresh-overlap test

Run a representative refresh while a controlled query workload is active. Compare report latency and failures with the baseline. The goal is not to claim zero impact. It is to prove the user path remains within an agreed service level.

### 3. Freshness test

After refresh, query a known batch marker through the read-only path. If automatic synchronization is disabled, include the sync operation and its result in the run record.

### 4. Capacity test

Inspect capacity behavior during the overlap window. Record semantic model CPU, throttling signals, refresh duration, and interactive query latency. Another replica is useful only when the capacity can sustain it.

### 5. Rollback test

Document how to return to the previous operating mode. Include the owner, API or configuration action, validation query, and communication path. Microsoft notes that disabling the large semantic model storage format also disables scale-out and loses synchronization information, so storage-format changes deserve deliberate review.

## Know the prerequisites and boundaries

Scale-out is not enabled for each semantic model automatically. The tenant setting can allow it, while a specific semantic model still needs configuration through the Power BI REST API.

The documented prerequisites include:

- a supported Premium, Embedded, PPU, or Fabric capacity;
- the tenant scale-out setting enabled;
- large semantic model storage format enabled for the model;
- supported client versions when tools connect to read-only replicas.

There are also boundaries around manual synchronization. When automatic synchronization is off, changes to roles, role membership, data sources, object-level security, or dynamic row-level security expressions are not supported. Microsoft advises disabling scale-out, allowing the change to take effect, and then enabling it again for those scenarios.

That should become a release gate for security and source changes, not a footnote discovered during deployment.

## The practical decision rule

I would enable semantic model scale-out when all four statements are true:

- the model serves meaningful concurrent query demand;
- refresh or write work overlaps with consumption;
- the capacity has room to support the replica behavior;
- the team can prove routing, synchronization, freshness, and rollback.

If the model is slow because of inefficient DAX, poor relationships, excessive visual queries, or overloaded capacity, scale-out should not be used to hide the cause. Fix the model and report path first.

The architecture is valuable because it gives reads and writes different jobs. The operating model makes that separation trustworthy.

## Sources

- [Power BI semantic model scale-out](https://learn.microsoft.com/en-us/fabric/enterprise/powerbi/service-premium-scale-out)
- [Large semantic models in Power BI Premium](https://learn.microsoft.com/en-us/fabric/enterprise/powerbi/service-premium-large-models)
- [Semantic model connectivity and management with the XMLA endpoint](https://learn.microsoft.com/en-us/fabric/enterprise/powerbi/service-premium-connect-tools)
- [See What's New in the August 2026 Power BI Update](https://learn.microsoft.com/en-us/power-bi/fundamentals/whats-new)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, Analytics Engineering, and AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
