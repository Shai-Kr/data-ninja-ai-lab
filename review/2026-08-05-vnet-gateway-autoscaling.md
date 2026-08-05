---
layout: post
title: Let Your Fabric Gateway Scale With the Workload
date: 2026-08-05
description: VNet data gateway autoscaling gives Fabric and Power BI teams a cleaner way to handle private data access spikes. The value is not only scale. It is the operating model around it.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
---

![VNet gateway autoscaling operating model]({{ '/assets/blog/vnet-gateway-autoscaling/01-autoscaling-operating-model.svg' | relative_url }})

Private data access is one of those platform details that only becomes interesting when it fails.

A semantic model misses its refresh window. A Dataflow Gen2 job slows down. A pipeline that usually runs fine suddenly competes with every other workload in the same evening batch window. The business sees a report that is late. The platform team sees a connectivity layer that was treated as plumbing until it became the bottleneck.

That is why the new VNet data gateway autoscaling preview in Microsoft Fabric is worth paying attention to.

The feature itself is straightforward: Microsoft describes autoscaling as the ability to automatically adjust the number of active gateway nodes within admin-defined minimum and maximum limits based on workload demand. In plain English, the gateway can absorb spikes and scale back down when demand falls.

Useful feature. But the real opportunity is bigger than adding more gateway nodes.

It is a chance to treat private data access as an operating model.

## Why this matters in Fabric and Power BI

The VNet data gateway sits in a sensitive part of the architecture. Microsoft documents it as a managed way to connect Microsoft Fabric and Power Platform services to Azure and other data services inside a virtual network, without using an on-premises data gateway. It can support Fabric Dataflow Gen2, Fabric data pipelines, Copy Job, Mirroring, Power BI semantic models, and Power BI paginated reports.

That means one gateway can sit behind a lot of important work.

A platform team might use it for:

- Power BI semantic model refreshes against private Azure SQL or storage;
- Dataflow Gen2 ingestion into a Lakehouse;
- Fabric pipelines and Copy Job activity;
- Mirroring patterns;
- paginated reports that still depend on secured source systems.

When demand grows, the gateway becomes more than a network object. It becomes shared platform capacity.

Autoscaling helps with that. But it should not be enabled as a blind performance switch.

## The wrong way to think about autoscaling

The weak version of the story is simple:

"Refresh is slow, turn on autoscaling."

That misses the point.

Autoscaling can reduce pressure during spikes, but it will not fix every bad design around the gateway. It will not clean up duplicate refresh schedules. It will not decide which workloads deserve priority. It will not turn an overloaded semantic model into a clean one. It will not make weak ownership disappear.

If the gateway has become a mystery box, scaling it may only make the mystery box more expensive.

The better approach is to use autoscaling as a forcing function for platform review.

## The review I would run first

Before changing gateway scale settings, I would build a simple inventory.

Not a six-month governance program. Just enough information to make the decision responsibly.

![Gateway autoscaling readiness checklist]({{ '/assets/blog/vnet-gateway-autoscaling/02-gateway-decision-checklist.svg' | relative_url }})

### 1. Map the workloads

List every important workload using the gateway:

- semantic models;
- Dataflow Gen2 items;
- Fabric pipelines;
- Copy Jobs;
- Mirroring flows;
- paginated reports.

For each one, capture the owner, business criticality, schedule, expected runtime, and source system.

This is not busywork. Without it, you cannot tell the difference between a real scaling need and a messy batch window.

### 2. Baseline the demand pattern

Autoscaling is useful when demand changes. So measure demand first.

Look for:

- refresh windows where many semantic models start together;
- pipelines that overlap with executive reporting deadlines;
- repeated gateway-related failures;
- latency spikes that match predictable business cycles;
- low-usage periods where scaled-down capacity would make sense.

The goal is not perfect telemetry. The goal is enough evidence to avoid guessing.

### 3. Define the scale policy

Autoscaling still needs boundaries.

At minimum, I would document:

- minimum gateway node count;
- maximum gateway node count;
- who owns the setting;
- what cost guardrails apply;
- when the maximum should be revisited;
- what incident pattern justifies a temporary change.

This is where the feature becomes an admin policy instead of a one-time UI change.

### 4. Clean the workload before scaling the gateway

If ten semantic models refresh at the same minute because nobody reviewed the schedule, the gateway is not the root problem.

Fix the obvious scheduling and ownership issues first:

- stagger refreshes;
- remove abandoned reports and models;
- separate critical workloads from noisy ones where possible;
- check whether a dataflow, warehouse, or semantic model is doing work in the wrong layer;
- make owners accountable for refresh design.

Then use autoscaling for the demand that remains.

## A better mental model

I would frame the gateway like this:

The VNet data gateway is not only the path to private data. It is the shared access layer between Fabric workloads and protected systems.

That access layer needs capacity, policy, monitoring, and ownership.

![Private data access flow through the VNet gateway]({{ '/assets/blog/vnet-gateway-autoscaling/03-private-data-flow.svg' | relative_url }})

Autoscaling makes that layer more elastic. Good. But elastic does not mean unmanaged.

A healthy setup should be able to answer four questions:

1. Which workloads depend on this gateway?
2. What is normal demand?
3. What happens during a spike?
4. Who changes the limits when the pattern changes?

If those answers are clear, autoscaling becomes a useful production feature.

If those answers are vague, autoscaling becomes another place where platform cost and reliability drift quietly.

## Where this fits in the Fabric architecture story

A lot of Fabric updates are pointing in the same direction: more managed platform capabilities, more API surface, more private connectivity, more operational responsibility inside the analytics estate.

That is the right direction.

But every managed capability still needs an owner.

For BI and data teams, the practical takeaway is simple:

Do not wait until the gateway becomes a refresh incident before you treat it as part of the platform.

Use autoscaling as the trigger to build a cleaner gateway operating model:

- inventory the workloads;
- baseline the peaks;
- set guardrails;
- review the batch window;
- document the runbook.

That is not glamorous. It is the kind of work that makes Fabric and Power BI estates reliable enough for real business use.

## Sources

- [Microsoft Fabric What's New](https://learn.microsoft.com/en-us/fabric/fundamentals/whats-new)
- [VNET Data Gateway Autoscaling Preview announcement](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/VNET-Data-Gateway-Autoscaling-Preview/ba-p/5281553)
- [What is a virtual network data gateway](https://learn.microsoft.com/en-us/data-integration/vnet/overview)

---

Written by **Shai Karmani**. If you work with Microsoft Fabric, Power BI, data platforms, or practical AI systems, [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
