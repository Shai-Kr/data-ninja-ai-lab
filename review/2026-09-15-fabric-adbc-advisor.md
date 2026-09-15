---
layout: post
title: "This Fabric Notebook Turns ADBC Migration Into a Prioritized Worklist"
description: "A practical way to use pq-adbc-advisor to inventory Power BI and Fabric connections, classify cutover risk, validate the ADBC path, and prove migration progress."
date: 2026-09-15
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Connector migrations are easy to underestimate because the visible change looks small.

Power Query is moving supported connections from embedded ODBC drivers to Apache Arrow Database Connectivity drivers. For many individual items, the fix may be as simple as removing an old implementation pin or rebuilding a source step on the current connector.

The hard part is inventory.

A Fabric tenant can have the same connector referenced by semantic models, Dataflows Gen2, and Data Pipelines. Some queries explicitly pin `Implementation="1.0"`. Others rely on a tenant or workspace default. Gateway-routed refreshes follow a different path from cloud connections. A manual workspace walkthrough will miss cases hidden inside M expressions and pipeline definitions.

Microsoft has now published `pq-adbc-advisor`, a read-only Fabric notebook that scans those references and turns them into a per-item impact report.

That makes the migration much more operational. Instead of asking which workspaces might be affected, a team can start with a classified worklist, test the real ADBC path, and rescan to show what was resolved.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-adbc-advisor/01-scan-to-worklist-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-adbc-advisor/01-scan-to-worklist.svg' | relative_url }}" alt="Workflow from Fabric workspace scan to a prioritized ADBC migration worklist and verified resolution delta.">
</picture>

## The useful part is the risk classification

The advisor scans supported connector calls across semantic models, dataflows, and pipelines. It then puts each item into one of three practical groups:

- **Will fail:** the query pins the legacy ODBC implementation and has no gateway path to keep it running after service cutover.
- **Needs review:** the item may be gateway-backed, use a raw DSN string, or contain another case that needs controlled validation.
- **Ready:** the item already uses ADBC or is unpinned and can follow the applicable tenant or workspace default.

This is better than a flat dependency export. Every row includes a recommended next action, so the report can become a remediation backlog instead of another inventory file that nobody owns.

I would still treat the scan as the first pass, not the final audit. Microsoft makes the same point in the documentation. Connector coverage is expanding, and nonstandard M expressions can create corner cases. Critical production items need a real refresh test on the ADBC path before anyone closes the migration task.

## Understand which driver will actually run

There are several controls in play, and they do not all have equal priority.

An explicit implementation value in the connection wins:

- `Implementation="2.0"` selects ADBC.
- `Implementation="1.0"` selects the legacy ODBC path.
- No implementation value means the tenant and workspace settings determine the default.

The gateway creates another branch. Tenant and workspace ADBC settings apply to cloud service execution. A refresh routed through an on-premises data gateway continues to use the driver bundled with that gateway.

That gateway path is useful for temporary continuity, but it is not a permanent migration strategy. Microsoft plans to remove the affected ODBC drivers from future Desktop and gateway releases. A gateway can defer the change while the team validates ADBC. It cannot eliminate the need to validate.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-adbc-advisor/02-driver-selection-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-adbc-advisor/02-driver-selection.svg' | relative_url }}" alt="ADBC driver selection model showing explicit implementation pins, tenant and workspace defaults, and the separate gateway execution path.">
</picture>

This distinction matters during testing. If a team enables ADBC at the workspace but leaves the refresh routed through a gateway, the successful refresh does not prove the ADBC path works. The pilot must use a cloud connection when the goal is end-to-end ADBC validation.

## Build the worklist around business impact

The scanner supplies technical risk. The team still needs to add operational priority.

I would enrich each row with:

| Field | Why it matters |
| --- | --- |
| Business owner | Someone must accept the test result and migration timing |
| Refresh criticality | A daily executive model should not sit beside an unused sandbox item |
| Connector and path | Snowflake, Databricks, BigQuery, or another source, plus cloud or gateway execution |
| Current implementation | Explicit ODBC, explicit ADBC, or inherited default |
| Validation evidence | Row counts, column types, refresh duration, and downstream checks |
| Rollout status | Identified, fixed, tested, promoted, or verified after rescan |

Then order the backlog in this sequence:

1. `Will fail` items with high business impact.
2. `Needs review` items with unusual M or DSN logic.
3. High-usage items that are technically ready but have not been validated on ADBC.
4. Lower-impact items and clean-up candidates.

That ordering prevents a common migration mistake: spending the first week fixing easy low-value items while a critical refresh remains pinned to the legacy driver.

## Validate behavior, not only connectivity

A green connection test is not enough.

For each pilot item, compare the old and new paths using the same source, credentials, parameters, and expected output. The minimum test packet should include:

- refresh success or failure;
- row counts by a stable business grain;
- column names and data types;
- null behavior and precision for sensitive fields;
- refresh duration under comparable conditions;
- DirectQuery interaction when the model uses it;
- downstream report totals and scheduled refresh behavior.

Use a copied item or pilot workspace for high-value production content. Keep the existing path available until the evidence is reviewed.

Power BI Desktop needs special attention. Microsoft documents that existing Desktop queries stay on the driver they were authored against. There is no per-file switch that silently converts every query. To validate an existing query through ADBC, the source may need to be deleted and added again in the current Desktop release, then the fields reselected.

That behavior should be part of the test script. Otherwise, a developer may believe a Desktop refresh tested ADBC when it actually exercised the old connection definition.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-adbc-advisor/03-pilot-loop-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-adbc-advisor/03-pilot-loop.svg' | relative_url }}" alt="Controlled ADBC pilot loop covering baseline, cloud-path test, output comparison, owner review, promotion, and rescan evidence.">
</picture>

## Use the rescan as migration evidence

The advisor keeps a first-run baseline and a current counter. After the team fixes items, rerunning the notebook shows the resolution delta.

That is more useful than a manually maintained percentage because the progress number comes from the same technical scan that produced the original backlog.

A simple review cadence could be:

- scan the workspace or tenant;
- export the impact report;
- assign owners and due dates;
- validate the highest-risk items;
- promote approved changes;
- rescan;
- review any remaining `Will fail` and `Needs review` rows.

For tenant-wide coverage, administrators can use `scan_tenant()` through the Fabric admin Scanner API. Microsoft notes that a mid-sized tenant scan can take 15 to 30 minutes. That is a reasonable scheduled control, not something I would run continuously.

The notebook also emits anonymous usage counts by default using hashed tenant and user identifiers. It does not send M code, item names, endpoint URLs, credentials, or refresh error bodies. Teams with stricter telemetry requirements should review that behavior and use the documented opt-out before running the accelerator.

## My recommended first move

Run the advisor in one representative workspace that contains at least one semantic model, one dataflow, and one pipeline using an affected connector.

Do not start by changing the tenant default.

First, verify that the inventory matches what the team knows about the workspace. Pick one `Will fail` or `Needs review` item, copy it into a pilot workspace, and test it through a cloud connection. Compare row counts, types, refresh duration, and downstream totals. Record the result, fix the source definition, and rescan.

If the report correctly tracks that item from risk to resolution, expand to the next workspace or a tenant scan.

The migration still needs engineering judgment. The notebook removes the weakest part of the process: guessing where the legacy driver is hiding.

That is the real value of `pq-adbc-advisor`. It turns a connector deadline into a visible worklist, a controlled validation loop, and evidence that the remaining risk is getting smaller.

## Sources

- [Moving off ODBC: A self-serve scanner for your ADBC migration](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Moving-off-ODBC-A-self-serve-scanner-for-your-ADBC-migration/ba-p/5365622)
- [Transition from ODBC to ADBC drivers in Power BI and Microsoft Fabric](https://learn.microsoft.com/en-us/power-query/transition-to-adbc)
- [pq-adbc-advisor in the Microsoft Fabric Toolbox](https://github.com/microsoft/fabric-toolbox/tree/main/accelerators/pq-adbc-advisor)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Microsoft Data and AI practitioner<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
