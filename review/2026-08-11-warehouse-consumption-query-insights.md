---
layout: default
title: Make Fabric Warehouse Spend Easier to Explain
date: 2026-08-11
description: Fabric Warehouse consumption is much easier to discuss when Capacity Metrics and Query Insights are used together. The win is not perfect chargeback. It is better evidence for tuning, ownership, and capacity decisions.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
---

<style>
@media (max-width: 760px) {
  .site-shell { width: min(var(--max), calc(100% - 18px)); }
  .site-header { gap: 12px; margin-bottom: 22px; }
  .brand { font-size: 0.95rem; }
  .nav { gap: 10px; font-size: 0.86rem; }
  .article { max-width: 100%; }
  .article-header { padding: 22px 14px; border-radius: 18px; }
  .article-header h1 { font-size: clamp(1.32rem, 6vw, 1.74rem); line-height: 1.17; letter-spacing: -0.035em; overflow-wrap: anywhere; }
  .article-header .dek { font-size: 0.93rem; line-height: 1.55; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; border-radius: 16px; }
  .subscribe-orbit { display: none; }
}
</style>

<article class="article" markdown="1">
  <header class="article-header">
    <p class="eyebrow">Data Ninja AI Lab</p>
    <h1>Make Fabric Warehouse Spend Easier to Explain</h1>
    <p class="byline"><img class="avatar avatar-small" src="{{ '/assets/img/shai-karmani-profile.png' | relative_url }}" alt="Shai Karmani"> by <a href="https://www.linkedin.com/in/shai-kr">Shai Karmani</a> · Aug 11, 2026</p>
    <p class="dek">Fabric Warehouse consumption is much easier to discuss when Capacity Metrics and Query Insights are used together. The win is not perfect chargeback. It is better evidence for tuning, ownership, and capacity decisions.</p>
  </header>

  <div class="article-body" markdown="1">
![Capacity Metrics and Query Insights attribution flow]({{ '/assets/blog/warehouse-consumption-query-insights/01-consumption-attribution.svg' | relative_url }})

The useful question in Fabric Warehouse operations is not just **how much capacity did we use?**

That number matters, but it is not enough to run a platform.

The better question is:

**which workloads were most likely driving that consumption, and what should we do next?**

Microsoft's new Fabric Warehouse post on using **Capacity Metrics** with **Query Insights** is a good step toward that answer. Capacity Metrics shows warehouse-level CU consumption over time. Query Insights shows query-level activity, including users, SQL pools, distributed statement identifiers, and allocated CPU time.

Neither view is enough by itself.

Together, they give a team a practical way to move from “the warehouse was expensive yesterday” to “these workloads deserve tuning, scheduling, ownership review, or a different design.”

That is a much better conversation.

## Capacity Metrics answers when and where

The Fabric Capacity Metrics app is still the starting point for capacity health.

It tells you which capacities and items are consuming compute, when spikes happened, and how usage patterns changed over time. For warehouse work, the key value is that it gives the shared capacity picture, not a single query's narrow view of the world.

That matters because Fabric teams usually argue about warehouse consumption after the bill or the throttle has already arrived.

Capacity Metrics gives the platform owner the time window:

- which warehouse consumed the most CUs
- when the spike happened
- whether the pattern looks normal or unusual
- whether the consumption was mostly user initiated or system initiated

But it does not fully explain the workload story.

A warehouse can be busy because one expensive query ran badly, because many normal queries ran at the same time, because a deployment changed a pattern, or because a recurring process moved into a peak business window.

Those are different problems.

They should not produce the same action.

## Query Insights answers what was running

Query Insights gets closer to the operating cause.

The Microsoft post points to `queryinsights.exec_requests_history`, where teams can inspect request history and allocated CPU time for queries during the same time window found in Capacity Metrics.

That gives you the raw material for a better triage process:

- which users were active
- which query groups showed up repeatedly
- which SQL pools or warehouses were involved
- which requests consumed meaningful CPU time
- which deployment or workload pattern may have changed

The important part is not that this becomes mathematically perfect chargeback.

It does not.

Microsoft describes this as weighted attribution. Capacity Metrics reports consumption at the warehouse level. Query Insights reports activity at the query level. When you combine them, you can allocate the warehouse consumption proportionally across the queries or workload groups active in that period.

That is still an estimate.

But for operational decision making, a good estimate is much better than a vague complaint.

![Warehouse consumption triage loop]({{ '/assets/blog/warehouse-consumption-query-insights/02-triage-loop.svg' | relative_url }})

## The point is not blame. The point is ownership.

This is where BI and data platform teams often go wrong.

They find an expensive query and turn the review into a blame session.

That misses the bigger value.

The right output from this analysis is an action backlog:

- tune this query
- move this workload out of the peak window
- split this warehouse pattern
- review this model or report design
- rewrite this transformation path
- assign an owner to this recurring cost driver
- check whether a recent release changed behavior

That is how capacity management becomes engineering work instead of dashboard watching.

A senior Fabric team should be able to explain its warehouse consumption the same way it explains data quality or refresh reliability. Not perfectly, but with enough evidence to make a decision.

## A lightweight operating rhythm

I would turn this into a monthly warehouse review, especially for teams with shared Fabric capacity.

The review does not need to be heavy.

It needs four artifacts:

1. **Consumption window**
   The warehouse, date range, and CU pattern from Capacity Metrics.

2. **Workload attribution**
   The query, user, pool, or workload grouping from Query Insights.

3. **Decision record**
   What the team thinks caused the pattern and what uncertainty remains.

4. **Action backlog**
   The tuning, scheduling, ownership, or architecture action that follows.

That last point is the difference between observability and operations.

If the review does not create an action, it is just another report.

![Monthly Fabric Warehouse consumption review]({{ '/assets/blog/warehouse-consumption-query-insights/03-monthly-review.svg' | relative_url }})

## What I would pilot first

If I were piloting this in a Fabric environment, I would start small.

Pick one warehouse with visible consumption and one known peak window.

Then run a simple review:

- identify the spike in Capacity Metrics
- pull Query Insights for the same window
- group query activity by user, SQL pool, and query pattern
- estimate weighted contribution
- pick the top two workload drivers
- decide whether each driver needs tuning, scheduling, ownership, or no action

Do not try to build the perfect internal chargeback model on day one.

Start with explainability.

Once the team trusts the method, the same pattern can support deeper FinOps conversations, workload optimization, and capacity planning.

## The real value

The best part of this update is not the SQL query.

The best part is the operating model it encourages.

Fabric Warehouse teams now have a clearer path to connect capacity usage with the workloads that probably drove it. That helps platform owners explain spend, helps developers tune the right things, and helps managers make capacity decisions with more evidence.

That is the kind of small operational improvement that compounds.

It makes Fabric feel less like a shared black box and more like a platform your team can actually run.

## Sources

- [Understanding Warehouse Consumption with Capacity Metrics and Query Insights](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Understanding-Warehouse-Consumption-with-Capacity-Metrics-and/ba-p/5357458)
- [What is the Microsoft Fabric Capacity Metrics app?](https://learn.microsoft.com/en-us/fabric/enterprise/metrics-app)

---

Written by [Shai Karmani](https://www.linkedin.com/in/shai-kr). Connect with me on LinkedIn if you are building practical data platforms with Microsoft Fabric, Power BI, analytics engineering, or AI.

  </div>
</article>
