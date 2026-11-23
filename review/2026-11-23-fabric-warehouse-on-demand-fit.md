---
layout: post
title: "The Fabric Warehouse Billing Option That Fits Bursty Workloads"
date: 2026-11-23
description: A practical guide to deciding when on-demand billing fits a Fabric Data Warehouse workload, setting its guardrails, and proving the choice with a controlled pilot.
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

Fabric Data Warehouse now has a useful third operating choice for variable workloads.

Shared Fabric capacity still fits steady demand. A larger F SKU still fits sustained growth across several workloads. On-demand billing, now in preview, creates a separate compute lane for Warehouse and SQL analytics endpoint activity when demand is intermittent, bursty, or difficult to size.

The value is flexibility. The trade-off is a different cost and control model.

On-demand Warehouse compute is charged at 1.3 times the standard pay-as-you-go rate for the same CU-hour. It does not use bursting or smoothing. Capacity administrators set a rolling 24-hour compute limit for the Data Warehouse billing category, then a concurrent compute ceiling for each workspace.

That can be a good trade when isolation and peak performance are worth more than keeping every query inside the shared capacity. The decision should come from workload evidence, not from the promise of automatic scale.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-on-demand-fit/01-model-choice-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-on-demand-fit/01-model-choice.webp" alt="Comparison of shared Fabric capacity and on-demand Fabric Warehouse compute for steady and bursty workloads"></picture></figure>

## Start with the workload shape

On-demand billing is strongest when Warehouse demand has a clear peak and a quieter baseline. Month-end processing, seasonal reporting, intermittent development, and isolated production bursts are the examples Microsoft highlights.

Before enabling it, measure four things for the candidate workload:

| Evidence | Decision it supports |
| --- | --- |
| Concurrent query pattern | The workspace compute ceiling |
| P50 and P95 duration | The service level the pilot must protect |
| Pool pressure and queueing | Whether shared capacity is the real constraint |
| CU-hour consumption by window | The likely cost of separating the workload |

This avoids a common capacity mistake: treating every slow query as a scaling problem. A poor query plan can remain poor with more compute. An oversized string column, a remote scan, or an overloaded custom SQL pool needs a different fix.

Use `queryinsights.sql_pool_insights` to confirm the current capacity mode and pool pressure. Combine that with the Capacity Metrics app and a representative query set. The baseline needs both performance and consumption evidence.

## Know the scope before the switch

The Data Warehouse setting is enabled at the capacity level, not one workspace at a time. Every workspace on that capacity with a Warehouse, SQL analytics endpoint, or Warehouse snapshot starts consuming Warehouse compute separately from the base capacity.

Other Fabric workloads continue on the shared F SKU. That separation is useful, but it also means the impact assessment must cover every eligible workspace on the capacity.

Enabling or disabling the setting is an online operation and Microsoft says it can take 5 to 15 minutes. Active queries are not disrupted by that switch. Moving a workspace between capacities is a different operation and can cancel in-flight work, so do not treat capacity reassignment as the pilot toggle.

## The two guardrails solve different problems

The workspace compute ceiling and the 24-hour compute limit use different units and produce different behavior.

### Workspace compute ceiling

The ceiling is measured in concurrent CUs. It limits how much compute one workspace can use at a moment in time.

When demand reaches the ceiling, Fabric can queue incoming queries. If a query plan asks for more resources than the ceiling, Fabric attempts to shrink-fit it. A query that still cannot fit can be rejected.

Unused headroom under the ceiling is not billed. A higher ceiling creates room for more concurrent compute, but it can also consume the shared 24-hour limit faster.

### Data Warehouse 24-hour compute limit

The category limit is measured in CU-hours over a rolling 24-hour window. Actual consumption from all Data Warehouse workspaces on the capacity contributes to it.

When the limit is reached, new Warehouse operations are rejected until enough earlier usage ages out of the rolling window. In-flight operations continue and are billed through completion.

This is a consumption safety rail, not a guaranteed currency cap. Microsoft notes that evaluation is periodic and in-progress work can carry actual charges above a simple limit-based projection.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-on-demand-fit/02-guardrails-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-on-demand-fit/02-guardrails.webp" alt="Workspace compute ceiling controls concurrency while the rolling 24-hour compute limit controls total Data Warehouse consumption"></picture></figure>

## A higher rate can still be the cheaper architecture

The 1.3 multiplier makes the unit-rate comparison clear. On-demand is not the discount option for a CU-hour.

The business case appears when a variable Warehouse workload would otherwise force a larger provisioned capacity, compete with Power BI and pipelines, or need a dedicated capacity that sits idle outside its peak window.

Compare complete operating choices:

1. Keep the workload on shared capacity and improve the query or schedule.
2. Increase the shared F SKU for sustained demand.
3. Move the Warehouse category to on-demand billing and set explicit limits.

The third choice wins only when consumed CU-hours, workload isolation, and the service-level result justify the premium. Calculate with the regional CU-hour rate. Do not use the configured workspace ceiling as if it were consumed compute.

## Run one controlled seven-day pilot

Start with one representative bursty workload and a week that includes at least one real peak. A month-end workload needs a month-end window, even if that makes the pilot longer.

### 1. Preserve the shared-capacity baseline

Capture the query set, time window, concurrency, P50 and P95 duration, pool pressure, failures, and CU-hour pattern. Record whether first-run cache effects distort the comparison.

### 2. Set conservative starting bounds

Use the documented smart default as a starting point, then set a 24-hour limit that matches the pilot budget. The preview minimum workspace ceiling is 25 CU and the current default for new or migrated workspaces is 64 CU.

### 3. Repeat the same workload pattern

Keep query shapes and business windows comparable. Record queueing, shrink-fit or rejection evidence, completed duration, pool pressure, and actual consumption.

### 4. Compare service and cost together

A faster P95 with uncontrolled CU-hour growth is incomplete. Lower consumption with rejected business-critical queries is also incomplete. Require both sides of the result.

### 5. Make an explicit decision

Keep the workload on-demand, tune the ceiling, change the category limit, or return it to shared capacity. Assign an owner and review date. Preview behavior and workload shape can both change.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-on-demand-fit/03-pilot-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-on-demand-fit/03-pilot.webp" alt="Five-step pilot for baselining, bounding, observing, comparing, and deciding on Fabric Warehouse on-demand billing"></picture></figure>

## Monitoring is part of the design

The Capacity Metrics app now has an On-demand compute view for category-level consumption. Warehouse teams can also query `queryinsights.sql_pool_insights`:

```sql
SELECT TOP (100)
    sql_pool_name,
    timestamp,
    current_workspace_capacity,
    is_pool_under_pressure
FROM [your-warehouse-name].[queryinsights].[sql_pool_insights]
ORDER BY timestamp DESC;
```

`current_workspace_capacity` shows values such as `F64` or `On-demand 620 CUs`. That creates useful evidence for the pilot and later reviews.

One preview limitation matters: Microsoft documents no alerting when consumption approaches the spend limit or workspace ceiling. There is no supported workaround today. The operating runbook therefore needs a named review cadence in the Capacity Metrics app instead of pretending the limit is a complete monitoring system.

## The practical takeaway

On-demand billing gives Fabric Warehouse teams a controlled lane for variable compute. It works best when the workload is measurable, the peak has business value, and the team owns both guardrails.

Start with one workload. Compare P95 performance and consumed CU-hours. Treat the workspace ceiling as a concurrency control and the 24-hour limit as a shared consumption control. Keep the choice only when the evidence supports the rate premium.

That is a better capacity decision than sizing the entire Fabric estate around one short peak.

## Sources

- [On-demand billing for Fabric Data Warehouse (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/On-demand-billing-for-Fabric-Data-Warehouse-Preview/ba-p/5376329)
- [Fabric on-demand billing and Zero-provisioned F0 Capacity (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Fabric-on-demand-billing-and-Zero-provisioned-F0-Capacity/ba-p/5377585)
- [On-Demand Billing for Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/on-demand-billing)
- [Configure on-demand billing for Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/configure-on-demand-billing)
- [On-Demand Billing FAQ for Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/on-demand-billing-faq)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
