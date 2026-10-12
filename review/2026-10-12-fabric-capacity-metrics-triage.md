---
layout: post
title: "The New Fabric Capacity Metrics App Gives Admins a Faster Path from Throttling to Action"
description: "A practical triage workflow for using the new Fabric Capacity Metrics preview across health, compute, hourly heat maps, and item-level history."
date: 2026-10-12
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Microsoft has released a preview of a redesigned Fabric Capacity Metrics app, and the most useful change is the investigation path.

The new experience starts at fleet health, moves into compute behavior, narrows the problem to an hourly window, and then shows the item that had the biggest impact. Item details retain 14 days of history, while the compute page adds CU seconds, throttling context, an hourly heat map, and smoothed CU consumption by item.

That is more than a visual refresh. It gives Fabric administrators a repeatable triage workflow for three questions:

1. Which capacity needs attention?
2. When did the pressure occur?
3. Which item contributed most during that window?

The right operating model is to use those pages as an evidence funnel, not as four separate dashboards.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-capacity-metrics-triage/01-evidence-funnel-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-capacity-metrics-triage/01-evidence-funnel.svg' | relative_url }}" alt="Fabric capacity investigation narrows from fleet health to compute window, hourly pattern, and item-level impact.">
</picture>

## Start with capacity health

The new health page is designed to help an administrator compare capacities and identify the ones most in need of review.

One of the new measures is the percentage of time spent in throttling. That is more useful than a single peak because it shows duration and supports comparison across capacities and time periods.

I would use the health page to create a short investigation queue:

- capacity name and owner;
- time spent in throttling;
- recent utilization pattern;
- current service impact;
- whether the issue is active, recurring, or historical.

Do not start by opening the busiest-looking item. First confirm that the capacity has an operational symptom worth investigating. High utilization by itself can be normal. Sustained throttling, rejected work, or a missed business service target is the signal that deserves a deeper review.

## Read CU seconds in context

The redesigned compute page expresses consumption in CU seconds instead of only showing a percentage.

That matters when a capacity has been scaled. A percentage can look similar before and after a size change even though the amount of compute consumed is different. CU seconds provide an absolute unit that makes those periods easier to compare.

The utilization view also adds conditional formatting for the current throttling state. Use the two together:

- CU seconds show how much compute was consumed;
- throttling state shows whether demand crossed an operating boundary;
- capacity size explains the available compute at that point in time;
- the selected time window keeps the comparison honest.

This is where many investigations go wrong. A team sees a high CU value and assumes waste, or sees a moderate percentage and assumes health. Neither conclusion is safe without capacity size, throttling, time window, and the business workload running at that moment.

## Find the pattern before the item

The new hourly heat map shows when a capacity was most utilized or overutilized.

That changes the first useful question from "What consumed the most this week?" to "Which hour should I investigate?"

The distinction matters because Fabric consumption is time-dependent. An item can be the largest consumer across a week without causing the pressure during the specific incident. Another item can create a short, concurrent spike that matters much more operationally.

Look for patterns such as:

- the same hour showing pressure on several weekdays;
- a batch window overlapping semantic model refreshes;
- an interactive reporting peak colliding with ingestion;
- pressure appearing only after a capacity scale change;
- a quiet period with unexpected background activity.

Once the window is known, use the CU consumption table for that hour. Microsoft says the table shows smoothed CU consumption so the items with the highest impact during the reviewed period are easier to identify.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-capacity-metrics-triage/02-triage-clock-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-capacity-metrics-triage/02-triage-clock.svg' | relative_url }}" alt="Hourly Fabric capacity triage aligns utilization, throttling, workload overlap, and high-impact items in the same time window.">
</picture>

## Treat smoothing as attribution help, not billing proof

Smoothed consumption helps explain which item affected the selected window. It should not be confused with a raw execution profile or a billing statement.

Fabric capacity behavior can spread the effect of work over time. The smoothed view is useful for operational attribution because it shows the item impact in the period the capacity experienced it. The unsmoothed view still matters when the team needs to understand when execution occurred.

Use both views to answer different questions:

| Question | Better evidence |
| --- | --- |
| Which item affected this throttling window? | Smoothed CU consumption |
| When did the workload actually execute? | Unsmoothed activity and item history |
| Did capacity size change the interpretation? | CU seconds plus capacity size |
| Did users experience an issue? | Throttling, rejection, latency, and service evidence |

The app can point to the likely contributor. It cannot replace workload-specific evidence such as Query Insights, pipeline run history, semantic model refresh history, Spark monitoring, or application logs.

## Move to the 14-day item story

The new item details page provides 14 days of history and shows how the selected item affected the capacity.

This is where the investigation moves from capacity operations to workload ownership.

For the identified item, capture:

1. item type, workspace, and owner;
2. recurrence pattern across the 14-day window;
3. users or processes associated with consumption;
4. whether the workload was expected in that time window;
5. downstream reports, jobs, or applications affected;
6. the workload-specific evidence needed for root cause;
7. the mitigation owner and validation plan.

An item can be expensive and still be correct. The operational question is whether its timing, concurrency, design, and business value justify the impact.

For a warehouse query, continue into Query Insights. For a pipeline, inspect activity duration, retries, and overlap. For a semantic model, review refresh history and query behavior. The Capacity Metrics app tells you where to look next.

## Use a six-step capacity incident loop

I would standardize the new experience into one runbook:

### 1. Detect

Use the health page to identify a capacity with meaningful throttling, rejection, or service risk.

### 2. Bound the window

Use the compute page and hourly heat map to isolate the smallest useful incident period.

### 3. Rank contributors

Use the CU consumption table for that period, not a broad weekly total.

### 4. Inspect the item

Review the 14-day pattern, owner, users, and effect on the capacity.

### 5. Validate in the workload

Move to Query Insights, refresh history, pipeline monitoring, Spark monitoring, or another workload-specific source.

### 6. Prove the change

After tuning, rescheduling, scaling, or correcting the workload, compare the same hour, service target, and throttling measure.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-capacity-metrics-triage/03-incident-loop-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-capacity-metrics-triage/03-incident-loop.svg' | relative_url }}" alt="Six-step Fabric capacity incident loop covering detection, time window, contributors, item history, workload evidence, and validation.">
</picture>

## Run the preview beside the current app

Microsoft is releasing the new experience in preview alongside the existing generally available reports. That is the right time to build a comparison baseline.

For two weeks, run a small validation log:

- issue detected;
- page and measure used;
- time required to identify the capacity;
- time required to isolate the hour;
- item identified;
- workload evidence that confirmed or rejected the hypothesis;
- action taken;
- result in the next comparable window.

This tests the new measures against real incidents while the existing app remains available. It also gives the platform team a chance to update runbooks and explain CU seconds, smoothing, and the 14-day item view before the preview becomes the default working surface.

## My recommendation

Use the new Capacity Metrics preview as an investigation funnel.

Start with fleet health, isolate the hour, rank item impact, inspect the 14-day pattern, and then move into the workload-specific evidence. Read CU seconds beside capacity size and throttling state. Use smoothed consumption for operational attribution, not as a substitute for execution or billing detail.

The useful outcome is faster and more defensible triage: the team can move from "the capacity was slow" to a bounded time window, an accountable workload, and a measurable recovery check.

## Sources

- [A new look and new capabilities in the Capacity Metrics App (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/A-new-look-and-new-capabilities-in-the-Capacity-Metrics-App/ba-p/5374114)
- [Capacity Metrics preview health page](https://learn.microsoft.com/fabric/enterprise/metrics-app-preview-health-page)
- [Capacity Metrics preview compute page](https://learn.microsoft.com/fabric/enterprise/metrics-app-preview-compute-page)
- [Capacity Metrics preview item details page](https://learn.microsoft.com/fabric/enterprise/metrics-app-preview-item-details-page)
- [Monitor capacity throttling](https://learn.microsoft.com/fabric/enterprise/metrics-app-monitor-capacity-throttling)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Data, Microsoft Fabric, Power BI, Analytics Engineering, and AI<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
