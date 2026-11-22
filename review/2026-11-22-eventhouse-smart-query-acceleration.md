---
layout: post
title: "The Smart Eventhouse Setting That Balances Query Speed and Cost"
date: 2026-11-22
description: A practical guide to using Smart Query Acceleration guardrails for OneLake shortcuts in Microsoft Fabric Eventhouse.
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
  .article-body pre code { white-space: pre-wrap; overflow-wrap: anywhere; }
  .article-body table { display: block; max-width: 100%; overflow-x: auto; }
  .subscribe-orbit { display: none; }
}
.review-visual { width: 100%; max-width: 100%; margin: 34px 0 10px; overflow: hidden; }
.review-visual img { display: block; width: 100%; max-width: 100%; height: auto; }
</style>

**Review draft. Direct link only.**

Query acceleration lets Fabric Eventhouse speed up queries over external Delta tables reached through OneLake shortcuts. The data stays in OneLake, while Eventhouse caches and indexes the useful portion for faster access.

The difficult setting has always been the hot period. Keep too little data accelerated and common queries still reach cold history. Keep too much and the capacity cost can outrun the value.

Smart Query Acceleration, now in preview, changes that decision. Eventhouse can observe query activity and adapt the hot-cache period between a minimum and maximum that the team defines. You still own the boundaries. The service adjusts inside them.

That is the useful part of the release. It turns one fixed tuning guess into a bounded operating policy.

{% include yt-embed.html id="-dYfZbnaf30" title="Fabric Eventhouse and KQL for Beginners: Step by Step" duration="13:14" kicker="Related PBI 101 walkthrough" %}

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/eventhouse-smart-query-acceleration/01-adaptive-window-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/eventhouse-smart-query-acceleration/01-adaptive-window.webp" alt="OneLake shortcut data flows through adaptive Smart Query Acceleration into faster Eventhouse queries"></picture></figure>

## What Smart Query Acceleration controls

Standard query acceleration uses a fixed hot period for an external Delta table. Smart Query Acceleration adds two guardrails:

- `MinHot`, the minimum recent period allowed to remain accelerated;
- `MaxHot`, the maximum recent period the service may accelerate.

Inside that range, Eventhouse analyzes query activity and adjusts the hot-cache period as patterns change. Microsoft documents two profiles:

- **Performance**, which prioritizes query speed;
- **Cost**, which prioritizes savings with a possible performance trade-off.

The Fabric November 2026 feature summary gives this example:

```kusto
.alter external table MyExternalTable policy query_acceleration
'{"IsEnabled":true,"MinHot":"1.00:00:00","MaxHot":"30.00:00:00","Profile":"Performance"}'
```

This does not mean every table should start with a 1-to-30-day range. The command shows the shape of the policy. The correct bounds come from the workload.

## Start with the query window, not the cache window

The first design question is not "How much should we accelerate?" It is "Which time ranges do users and applications repeatedly query, and what latency do those paths require?"

Use actual workload evidence:

| Evidence | What it tells you |
| --- | --- |
| Query time filters | The recent period repeatedly requested |
| Query frequency | Which paths justify acceleration |
| P50 and P95 duration | The normal and slow experience |
| User or application | Whether the path is interactive or background |
| Capacity pattern | The resource effect during comparable windows |
| Data arrival pattern | Whether the useful recent window changes by hour, day, or season |

If most interactive queries inspect the last three days, a 30-day minimum is hard to justify. If investigators routinely compare the last 21 days, a one-day maximum will never satisfy the service objective.

I would start with one external table and a small representative query set. Capture a baseline before changing the policy. Otherwise, the team may see a faster query after the change and still have no idea whether the improvement came from acceleration, a quieter capacity window, a different filter, or warmer unrelated caches.

## Treat MinHot and MaxHot as cost boundaries

`MinHot` is a floor. It protects the smallest recent window the workload should keep accelerated.

`MaxHot` is a ceiling. It limits how far the adaptive policy may expand.

Those values should have owners because they encode a business trade-off. The floor says, "This recent history is important enough to keep ready." The ceiling says, "Do not spend beyond this boundary without another decision."

A practical first policy might use:

- a minimum that covers the normal interactive window;
- a maximum that covers the longest recurring operational investigation;
- a profile selected from the service objective;
- a review date after one or two representative workload cycles.

Avoid using the maximum as a wish list. If users query two years of history once per quarter, that does not make two years a sensible adaptive ceiling for the daily workload.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/eventhouse-smart-query-acceleration/02-guardrails-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/eventhouse-smart-query-acceleration/02-guardrails.webp" alt="Performance and Cost profiles apply different priorities inside the same MinHot and MaxHot guardrails"></picture></figure>

## Choose Performance or Cost from the service objective

The profile is not a label for production versus development. It should follow the consequence of a slow query.

### Performance profile

Use the Performance profile when latency directly affects an interactive operational path. Examples include a Real-Time Dashboard used during an incident, repeated investigations over recent telemetry, or an application whose response depends on the external table.

Record the target before enabling it. "Fast" is not testable. "P95 under five seconds for these six queries during the morning workload window" is testable.

### Cost profile

Use the Cost profile when the workload can accept a slower response in exchange for tighter resource use. This can fit occasional exploration, broad historical analysis, or a secondary path where the result matters more than the response time.

Cost mode still needs a latency boundary. A cheaper policy that makes a required query unusable has not met the service objective.

The useful decision record is short:

| Field | Example question |
| --- | --- |
| Workload | Which queries and users are covered? |
| Service objective | What latency and availability matter? |
| MinHot | What recent period should always be accelerated? |
| MaxHot | What is the largest justified accelerated period? |
| Profile | Is query speed or savings the priority? |
| Owner | Who reviews performance and capacity evidence? |
| Review trigger | When should the bounds or profile change? |

## Run a controlled acceptance cycle

Preview features deserve measured adoption. Start with a workload that is important enough to learn from but narrow enough to compare.

### 1. Baseline

Run the representative query set across normal and busy windows. Record filters, duration, result shape, capacity context, and whether the query hit recent or older data.

### 2. Bound

Set `MinHot` and `MaxHot` from the observed query ranges. Keep the first interval conservative. A wide range makes it harder to understand the cost effect.

### 3. Select the profile

Choose Performance or Cost from the documented service objective. Record the reason. Do not let the default become the architecture decision.

### 4. Observe comparable periods

Repeat the same queries during comparable workload windows. Compare P50, P95, failures, capacity behavior, and the ranges users actually request.

### 5. Review and decide

Keep, narrow, widen, change the profile, or disable the policy. Preserve the evidence and the next review date.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/eventhouse-smart-query-acceleration/03-acceptance-loop-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/eventhouse-smart-query-acceleration/03-acceptance-loop.webp" alt="Five-step acceptance cycle for baselining, bounding, profiling, observing, and reviewing Smart Query Acceleration"></picture></figure>

## Watch for workload drift

An adaptive policy reduces manual tuning. It does not remove operational ownership.

Query behavior can change after a new dashboard, a retention change, a seasonal event, or a new application release. The policy may remain within its guardrails and still stop matching the business need.

Review the policy when:

- P95 latency moves outside the service objective;
- query ranges repeatedly press against `MaxHot`;
- the minimum covers data nobody uses;
- capacity cost changes without a matching workload change;
- a release adds a new query path;
- the external table's data-arrival pattern changes.

This is also why one global setting is a poor goal. Different external tables can have different access patterns, business consequences, and cost boundaries.

## Where this pattern fits

Smart Query Acceleration is most useful when three conditions are true:

1. Data remains in OneLake and is queried through an Eventhouse shortcut.
2. Recent history receives repeated queries that benefit from caching and indexing.
3. The team can define both a latency objective and a capacity boundary.

If the workload scans unpredictable time ranges, rarely repeats queries, or has no owner for the trade-off, adaptive acceleration may not be the first problem to solve. Start with workload visibility and query design.

## The practical takeaway

The best part of Smart Query Acceleration is not automatic tuning by itself. It is automatic tuning inside limits the team can explain.

Use workload evidence to set `MinHot` and `MaxHot`. Choose Performance or Cost from the service objective. Test one external table with comparable queries. Keep an owner and a review trigger attached to the policy.

That gives Eventhouse room to adapt without turning query speed or capacity cost into an uncontrolled variable.

## Sources

- [Fabric November 2026 Feature Summary](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Fabric-November-2026-Feature-Summary/ba-p/5414311)
- [Query acceleration for OneLake shortcuts: overview](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/query-acceleration-overview)
- [Configure query acceleration over OneLake shortcuts](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/query-acceleration)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
