---
layout: post
title: "See the Whole Fabric Incident in One Shared Timeline"
description: "A practical operating model for unified workspace monitoring, shared Eventhouse telemetry, and cross-workspace incident investigation in Microsoft Fabric."
date: 2026-10-11
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

A production incident rarely respects workspace boundaries.

A pipeline can fail in one workspace, a semantic model can refresh with old data in another, and capacity pressure can slow a third. Each symptom looks local when the telemetry is split across separate monitoring stores.

Microsoft's new unified workspace monitoring preview changes that operating model. Fabric can route telemetry from multiple workspaces into a shared Eventhouse, with centralized retention and caching policies. A custom endpoint on the monitoring Eventstream can also copy the data to external destinations, while public APIs support integration with other observability tools.

The useful outcome is not another dashboard. It is one incident timeline that lets an operator follow a failure across jobs, workspaces, items, and capacity signals.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-shared-incident-timeline/01-shared-timeline-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-shared-incident-timeline/01-shared-timeline.svg' | relative_url }}" alt="Multiple Fabric workspaces send telemetry to a shared Eventhouse, creating one correlated incident timeline for operations.">
</picture>

## What unified workspace monitoring changes

Workspace monitoring already gives teams item-level telemetry for supported Fabric workloads. The new model adds a tenant-scale option: choose the Eventhouse that receives the telemetry and consolidate related workspaces into that shared store.

That matters when a solution spans several workspaces by design. A common pattern separates ingestion, transformation, semantic models, and production reporting. The business sees one service. The platform team often sees four monitoring boundaries.

With a shared Eventhouse, the team can query a common evidence store instead of opening each workspace separately and reconstructing the sequence by hand.

Microsoft's announcement also adds two useful paths beyond the built-in experience:

- a custom endpoint on the monitoring Eventstream for forwarding telemetry to another destination;
- public APIs for connecting Fabric telemetry to external observability tools.

The announcement says most Fabric items will be available at launch, with more workloads added over time. Coverage must therefore be tested for the actual items in the solution. A shared store is valuable only when the team knows which signals are present and which still require another source.

## Start with a service boundary

Do not connect every workspace in the tenant to one Eventhouse on day one.

Start with one business service that already crosses workspace boundaries. For example:

1. an ingestion workspace receives source data;
2. a transformation workspace prepares curated tables;
3. an analytics workspace hosts the semantic model;
4. a reporting workspace distributes the final experience.

Treat those four workspaces as one operational unit. Route their supported telemetry to a shared Eventhouse and define the service owner before building any dashboard.

This keeps the first implementation small enough to validate. It also makes the questions concrete:

- Which item started the incident?
- Which downstream jobs ran after the first failure?
- Did capacity pressure appear before or after the job slowdown?
- Which user-facing assets were affected?
- Who owns the next action?

If the shared monitoring design cannot answer those questions for one service, adding more workspaces will only create a larger telemetry lake.

## Build a correlation contract

Centralized telemetry is not the same as correlated telemetry.

Every team needs a small contract that explains how events from separate workloads are joined into one incident. I would include these fields where the source exposes them:

| Field | Operational purpose |
| --- | --- |
| Event timestamp | Order signals on the same timeline |
| Workspace and item ID | Locate the affected Fabric object |
| Job or activity run ID | Follow one execution across its steps |
| Parent or trigger ID | Connect downstream work to the event that started it |
| Environment | Separate development, test, and production evidence |
| Business service | Group technical items by the service users experience |
| Severity and state | Prioritize and track the incident |
| Owner | Route the next action without another lookup |

Fabric will supply many platform identifiers. Business service, environment, and owner usually need a maintained mapping.

That mapping is small but important. Workspace names change. Items move. A service identifier gives the incident a stable business boundary even when the technical layout evolves.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-shared-incident-timeline/02-correlation-contract-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-shared-incident-timeline/02-correlation-contract.svg' | relative_url }}" alt="Correlation contract linking time, technical identity, execution identity, business service, and operational ownership.">
</picture>

## Design the Eventhouse as an evidence store

The shared Eventhouse needs an operating contract of its own.

Define:

- which workspaces and item types are in scope;
- the expected telemetry volume and growth rate;
- hot-cache duration for active investigations;
- retention duration for trend analysis and incident review;
- who can query raw telemetry;
- which fields require restricted access;
- how schema changes are detected;
- where external copies are allowed to go;
- who owns failed ingestion or missing signals.

Retention and cache are different decisions. A team may need 30 or 90 days of retained evidence while keeping only the latest few days in the fastest cache. Size both from real query patterns, not from a generic compliance number.

The custom Eventstream endpoint also creates a governance boundary. If telemetry is copied to Azure Monitor, a SIEM, or another operational platform, confirm that identifiers, error text, query details, and user context are permitted at the destination. Operational logs can expose more business context than teams expect.

## Investigate in one sequence

A shared evidence store is most useful when the incident workflow is consistent.

I would use this sequence:

### 1. Detect

Start from the first health change, failed job, alert, or capacity anomaly. Record its timestamp, item, workspace, and run ID.

### 2. Correlate

Query a bounded time window around the first signal. Follow parent and child run identifiers, dependent items, and matching business-service mappings.

### 3. Assess impact

Identify which downstream refreshes, reports, apps, or operational processes used the affected output. Distinguish a technical failure from a user-facing incident.

### 4. Choose the response

Retry, pause, reroute, scale, or correct data only after the evidence supports the action. Capacity pressure and a failed pipeline can happen at the same time without one causing the other.

### 5. Prove recovery

Confirm that the failed step recovered, dependent items completed, expected data arrived, and the user-facing result is correct.

### 6. Preserve the record

Keep the incident query, decisive evidence, owner, action, and recovery proof. This becomes the starting point for the next similar investigation.

The refreshed Monitor hub can help operators spot health, job, alert, agent, application, and capacity signals from one surface. The shared Eventhouse provides the queryable evidence behind the investigation.

## Test the missing-signal cases

Monitoring rollouts usually test the happy path: a job fails, a record appears, and the dashboard turns red.

The harder failures are silent.

Run these acceptance tests before calling the shared model production-ready:

1. **Cross-workspace chain:** Trigger a controlled failure in an upstream workspace and prove the timeline shows the downstream effect.
2. **Clock and ordering:** Confirm that events from different workloads can be ordered consistently around the same incident.
3. **Coverage gap:** Use an item type that is not yet supported and verify that the team can see and document the missing telemetry.
4. **Permission boundary:** Prove that an operator can investigate the service without receiving unnecessary access to business data.
5. **Retention boundary:** Query an event near the end of the retention window and confirm the documented policy matches reality.
6. **External forwarding:** Send a controlled event through the custom endpoint and verify delivery, field handling, and duplicate behavior.
7. **Shared-store outage:** Simulate an unavailable destination or failed monitoring path and confirm that the gap becomes visible.
8. **Recovery proof:** Restore the controlled failure and prove that the incident timeline includes both technical recovery and downstream validation.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-shared-incident-timeline/03-acceptance-loop-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-shared-incident-timeline/03-acceptance-loop.svg' | relative_url }}" alt="Six-stage Fabric incident loop covering detection, correlation, impact, response, recovery proof, and retained evidence.">
</picture>

## A practical first rollout

Choose one service with three to five related workspaces and a recent incident that was difficult to reconstruct.

Route supported workspace telemetry into one Eventhouse. Add a mapping table for business service, environment, criticality, and owner. Rebuild the old incident from the shared evidence and measure two things:

- time required to identify the first failing item;
- time required to prove that the user-facing service recovered.

Then run one controlled failure and one missing-signal test.

If the shared timeline reduces investigation time and exposes its own coverage gaps, the design is useful. Expand to the next service only after retention, access, ownership, and recovery evidence are working.

## My recommendation

Use unified workspace monitoring to organize Fabric operations around business services, not workspace borders.

Bring related telemetry into a shared Eventhouse. Add a correlation contract that connects technical runs to service ownership. Keep retention and external forwarding explicit. Test unsupported items and missing signals as carefully as visible failures.

The strongest result is simple: one operator can see the whole incident, choose the right response, and prove recovery from one shared timeline.

## Sources

- [Build, deploy, and govern Microsoft Fabric at scale](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Build-deploy-and-govern-Microsoft-Fabric-at-scale/ba-p/5369145)
- [What is workspace monitoring (preview)?](https://learn.microsoft.com/en-us/fabric/fundamentals/workspace-monitoring-overview)
- [What is the Monitor hub?](https://learn.microsoft.com/en-us/fabric/admin/monitoring-hub)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Data, Microsoft Fabric, Power BI, Analytics Engineering, and AI<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
