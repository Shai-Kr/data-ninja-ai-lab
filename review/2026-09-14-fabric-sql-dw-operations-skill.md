---
layout: post
title: "The Fabric Skill That Turns Warehouse Slowdowns Into an Evidence Trail"
description: "A practical incident workflow for using the SQL DW operations skill to connect Fabric Capacity Metrics, Query Insights, pool pressure, and lakehouse health without confusing correlation with proof."
date: 2026-09-14
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

A slow warehouse usually produces five browser tabs and one weak conclusion.

Someone sees a Fabric capacity spike. Another person finds a long-running query. A third person notices SQL pool pressure. The team lines up the timestamps and decides the query caused the incident.

That conclusion may be right. It may also be a coincidence.

Microsoft's SQL DW operations skill gives Fabric teams a better starting point. It accepts an operational question in natural language, runs bounded read-only diagnostics, and returns a structured package with the diagnosis, evidence, ruled-out causes, recommendations, and follow-up checks.

The September 14 announcement labels the skill generally available. The supporting Microsoft Learn page still displays a preview notice as of this review. I would verify the current tenant experience and documentation before making it part of a production runbook.

The useful change is not that an AI tool can write diagnostic SQL. The useful change is that a warehouse investigation can start from one scoped question and preserve the evidence behind the answer.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-sql-dw-operations-skill/01-incident-workflow-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-sql-dw-operations-skill/01-incident-workflow.svg' | relative_url }}" alt="Fabric warehouse incident workflow from a scoped operational question through read-only diagnostics to an evidence packet and human-approved action.">
</picture>

## Start with an incident contract

Natural language makes it easy to ask a broad question. Operations work still needs a precise scope.

A useful request includes:

- the Fabric workspace;
- the warehouse or lakehouse SQL analytics endpoint;
- the time window, preferably in UTC;
- the symptom, such as failures, latency, capacity consumption, or pool pressure;
- the comparison period when a regression is suspected;
- the users, applications, or query patterns that need to be separated.

Compare these two prompts:

> Why was the warehouse slow yesterday?

> Explain why `FinanceWarehouse` was slow between 09:00 and 11:00 UTC. Separate failed queries from cancellations, identify overlapping SQL pool pressure, and compare recurring query shapes with the previous seven days.

The second prompt gives the investigation a boundary. It also makes the output easier to review because the team knows which question the evidence is supposed to answer.

This is the first operational standard I would adopt: save the prompt with the incident record. A diagnosis without its scope is difficult to reproduce.

## Use the skill as a diagnostic router

The SQL DW operations capability is part of Microsoft's open-source Skills for Fabric collection. It can work through compatible AI coding tools and uses the caller's existing Fabric permissions.

Microsoft documents several diagnostic areas:

- **Failure analysis** separates failed requests from cancellations and resolves engine error codes.
- **Resource consumers** finds recurring expensive query shapes and distinguishes more executions from higher cost per execution.
- **Capacity correlation** connects a costly warehouse or SQL analytics endpoint with Query Insights activity in the same time window.
- **Pool pressure** compares pressure intervals with overlapping requests and workload measures.
- **Lakehouse health** checks file count, deleted rows, and checkpoint conditions.
- **Query reference and scenarios** select supported system views and combine checks for common incidents.

That is a useful routing layer. The operator describes the incident. The skill selects the relevant checks, reruns them for the request, and cites the source of each measurement.

It does not change data, schema, or configuration. It also treats zero returned rows as evidence instead of inventing a cause to fill the gap. Both behaviors belong in an enterprise operations workflow.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-sql-dw-operations-skill/02-diagnostic-map-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-sql-dw-operations-skill/02-diagnostic-map.svg' | relative_url }}" alt="Diagnostic map for the Fabric SQL DW operations skill covering failures, resource consumers, capacity correlation, pool pressure, and lakehouse health.">
</picture>

## Keep three measurements separate

The fastest way to weaken an incident report is to combine measurements that look related but mean different things.

Microsoft calls out two important boundaries.

First, a Capacity Metrics operation identifier is not the same as a Query Insights `distributed_statement_id`. The skill does not join those values. It identifies the warehouse or SQL analytics endpoint and compares activity across an overlapping time range.

Second, capacity unit seconds and Query Insights CPU milliseconds are different measurements. One cannot be converted into the other to produce a made-up attribution percentage.

The evidence may support a statement such as:

> FinanceWarehouse consumed capacity during the 14:00 to 15:00 window. Query Insights shows a recurring query shape with high CPU and storage scans overlapping that period.

That is a grounded correlation. It is not the same as saying the query caused 63 percent of the capacity spike.

The same discipline applies to SQL pool pressure. An overlap supports investigation. It does not prove causation by itself. Compare CPU, elapsed time, storage scans, execution count, application name, and the baseline period before naming a likely contributor.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-sql-dw-operations-skill/03-correlation-guardrails-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-sql-dw-operations-skill/03-correlation-guardrails.svg' | relative_url }}" alt="Correlation guardrails showing that Fabric capacity unit seconds and Query Insights CPU milliseconds are complementary signals connected by asset and time window, not interchangeable values.">
</picture>

## Review the five-part evidence packet

The documented response structure is more useful than a paragraph of AI explanation:

1. **Diagnosis:** the conclusion supported by the checks.
2. **Evidence:** measurements and their source views or procedures.
3. **Ruled out:** explanations that were tested, plus causes that were not evaluated.
4. **Recommendations:** actions tied to observed evidence.
5. **Follow-ups:** validation steps and measurements to run again.

I would add a sixth section to the team template: **scope and data gaps**.

Query Insights retains 30 days of history and can lag by up to 15 minutes. Capacity Metrics may expose a fixed window rather than the exact interval requested. SQL pool event logging can pause when a warehouse is inactive. The usable correlation period is the overlap between the sources.

Those are not footnotes. They define how strong the conclusion can be.

A good incident packet should make these fields visible:

| Field | What to record |
| --- | --- |
| Scope | Workspace, item, UTC interval, symptom |
| Sources | Capacity Metrics, Query Insights views, pool diagnostics, table health |
| Evidence | Values, query shapes, users, applications, timestamps |
| Limits | Lag, retention, missing interval, unavailable measurement |
| Decision | Tune, isolate, test a custom SQL pool, monitor, or take no action |
| Validation | Same measures to compare after the change |

## Turn recommendations into controlled pilots

The skill can identify a stable application classifier and recommend testing a recurring workload in a custom SQL pool. It does not configure the pool.

That separation is useful. The diagnosis should produce a pilot, not an automatic infrastructure change.

For a custom SQL pool candidate, define the comparison before changing anything:

- pressure intervals;
- query latency;
- allocated CPU time;
- storage scans;
- failures and cancellations;
- execution count and application name.

Run the workload under the current configuration, isolate it in the pilot, then compare the same measures. If the result is inconclusive, keep the original operating model. An AI recommendation is not a substitute for a controlled before-and-after test.

The same rule applies to query tuning and lakehouse maintenance. Review any proposed T-SQL, check object and data scope, prepare a rollback path for changes, execute through the normal approval process, and validate with a separate read-only query.

## A practical first run

I would test the skill on one resolved incident before adding it to the live support process.

Choose an incident where the team already knows the final cause. Give the skill the same workspace, warehouse, and UTC interval. Then compare its evidence packet with the human investigation:

- Did it separate failures from cancellations?
- Did it identify the same recurring query shapes?
- Did it preserve the distinction between capacity and query measurements?
- Did it report missing data instead of filling the gap?
- Were the recommendations tied to evidence that an operator could verify?

If it passes that replay, use it in one live incident with a human reviewer. Record the prompt, output, accepted conclusion, rejected conclusion, and follow-up measurement.

The goal is not to remove the warehouse operator. It is to reduce the tab switching and make the reasoning reviewable.

That is where this skill can earn a place in the runbook: one incident question, bounded diagnostics, an evidence trail, and a human decision at the end.

## Sources

- [Diagnose Fabric Data Warehouse workloads with the SQL DW operations skill](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Diagnose-Fabric-Data-Warehouse-workloads-with-the-SQL-DW/ba-p/5366102)
- [Data Warehouse operations skill for Fabric](https://learn.microsoft.com/en-us/fabric/data-warehouse/skills-for-data-warehouse-operations)
- [Query Insights in Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/data-warehouse/query-insights)
- [Microsoft Skills for Fabric repository](https://github.com/microsoft/skills-for-fabric)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Microsoft Data and AI practitioner<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
