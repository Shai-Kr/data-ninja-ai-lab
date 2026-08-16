---
layout: default
title: Make Private Fabric Refreshes Faster Without Rebuilding the Network
date: 2026-08-16
description: The modern evaluation engine preview for VNet data gateways gives Fabric teams a controlled way to test faster private refresh and DirectQuery scenarios without redesigning their network model.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
---

<style>
@media (max-width: 760px) {
  .site-shell { width: min(var(--max), calc(100% - 18px)); }
  .site-header { gap: 12px; margin-bottom: 22px; }
  .brand { font-size: 0.95rem; }
  .nav { display: none; }
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
    <h1>Make Private Fabric Refreshes Faster Without Rebuilding the Network</h1>
    <p class="byline"><img class="avatar avatar-small" src="{{ '/assets/img/shai-karmani-profile.png' | relative_url }}" alt="Shai Karmani"> by <a href="https://www.linkedin.com/in/shai-kr">Shai Karmani</a> · Aug 16, 2026</p>
    <p class="dek">The modern evaluation engine preview for VNet data gateways gives Fabric teams a controlled way to test faster private refresh and DirectQuery scenarios without redesigning their network model.</p>
  </header>

  <div class="article-body" markdown="1">
![Modern evaluation engine path for VNet data gateways]({{ '/assets/blog/vnet-gateway-modern-evaluation-engine/01-private-refresh-path.svg' | relative_url }})

Private connectivity is one of those platform decisions that looks boring until it starts slowing everything else down.

A semantic model refresh takes longer than expected. A Dataflow Gen2 job behaves differently through a gateway than it did during development. A DirectQuery report has a painful first interaction. The business sees a slow report, but the platform team sees a chain of moving parts: source system, connector, gateway, query folding, network boundary, capacity, and workload design.

That is why the modern evaluation engine preview for VNet data gateways is worth paying attention to.

Microsoft is making the modern evaluation engine available as an opt-in setting for VNet data gateways. The important part is the shape of the change: teams can evaluate a newer execution path for supported Mashup workloads while keeping the same private network gateway model.

That is the right kind of platform improvement. It does not ask every team to redraw the architecture first. It gives admins a controlled way to test whether selected private workloads run better.

## The useful promise is not magic speed

The feature is in preview, so I would not treat it as a blanket performance fix.

The useful promise is more practical:

- keep private connectivity through the VNet data gateway
- enable the modern evaluation engine on selected gateways
- test representative semantic model refreshes and Dataflow Gen2 workloads
- compare DirectQuery cold-start behavior where it matters
- expand only when the evidence is good

That is a much healthier rollout pattern than turning on a preview feature everywhere and hoping the angry refresh failures do not start at 8:00 AM.

VNet data gateways already matter because they let Fabric and Power BI workloads connect to protected data sources without exposing traffic through public endpoints. They can support Fabric Dataflow Gen2, pipelines, Copy Job, Mirroring, Power BI semantic models, and paginated reports.

When that gateway path gets a better execution option, the real question is not "is it faster?"

The real question is "which of our private workloads benefit, and how do we prove it safely?"

## Start with the workloads that feel the gateway

The preview is most interesting for teams that already use VNet data gateways heavily.

That usually means protected source systems, private endpoints, strict network isolation, and analytical workloads that cannot simply connect over the public internet. In those environments, performance testing needs to respect the security model. You are not just optimizing a query. You are validating the path that query takes through the platform.

![Evaluation scorecard for modern VNet gateway engine]({{ '/assets/blog/vnet-gateway-modern-evaluation-engine/02-evaluation-scorecard.svg' | relative_url }})

I would start with four workload groups.

### 1. Large semantic model refreshes

These are easy to measure and easy for the business to feel. Capture normal refresh duration, failure rate, source-system timing, and gateway timing before changing anything.

### 2. Dataflow Gen2 jobs through private sources

Dataflow jobs often contain transformation logic that can hide where the real delay lives. Test with known representative flows, not a toy data source.

### 3. DirectQuery cold-start scenarios

The first interaction in a DirectQuery report can shape user trust quickly. If the modern evaluation engine improves cold-start behavior for a key protected source, that is worth knowing.

### 4. High-friction private connectivity cases

Some workloads are not slow because of one big query. They are slow because every layer adds a little friction. Those are good candidates for controlled evaluation.

## Build a scorecard before you build an opinion

The fastest way to waste a performance preview is to test it casually.

One person tries one refresh, sees it complete faster, and declares success. Another person tests a different workload, sees no change, and declares it hype. Neither answer is useful.

A proper evaluation needs a short scorecard.

For each candidate workload, record:

- current refresh or query timing
- source system and connector
- gateway used
- workload owner
- normal concurrency window
- before and after duration across multiple runs
- failures or new errors
- source-system pressure during the run
- rollback decision

This does not need to become a six-week project. It does need enough structure that the team can defend the decision later.

Performance changes are easy to oversell. Evidence travels better.

## The rollout should be boring on purpose

Preview features are useful when the rollout is controlled.

![Rollout lanes for modern evaluation engine preview]({{ '/assets/blog/vnet-gateway-modern-evaluation-engine/03-rollout-lanes.svg' | relative_url }})

The rollout path I would use is simple.

### Inventory

List the private workloads that run through VNet data gateways today. Include semantic models, Dataflow Gen2 items, DirectQuery reports, source systems, owners, and business criticality.

### Pilot

Pick a small set of workloads that are painful enough to matter and stable enough to measure. Avoid changing five other things at the same time.

### Compare

Run before and after tests. Look at duration, failure behavior, source pressure, and user impact. If a workload improves but creates pressure somewhere else, that is not a clean win.

### Expand

Move only the workloads with clear evidence. Keep notes on what was tested, what changed, and why the team expanded or stopped.

This is not glamorous work. It is the work that prevents platform features from becoming platform folklore.

## The bigger point: private connectivity needs performance ownership

Private connectivity is often treated as a security checkbox.

It should not be.

If reports, refreshes, and dataflows depend on private gateway paths, then those paths need owners, baselines, monitoring, and review habits. A VNet data gateway is not only a network component. It is part of the analytics experience users judge every day.

The modern evaluation engine preview is a good reminder of that.

It gives Fabric teams a chance to improve selected private workloads without replacing the gateway architecture. The smart move is to use that chance as a platform exercise: measure the right workloads, document the results, and turn gateway performance into something the team can reason about.

That is how private Fabric architecture gets better without becoming a guessing game.

## Sources

- [Evaluate Fabric workload performance with the modern evaluation engine for VNet data gateways (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Evaluate-Fabric-workload-performance-with-the-modern-evaluation/ba-p/5330293)
- [What is a virtual network (VNet) data gateway](https://learn.microsoft.com/en-us/data-integration/vnet/overview)
- [Overview of virtual network (VNet), private links, and Power BI](https://learn.microsoft.com/en-us/data-integration/vnet/what-is)
- [Microsoft Fabric What's New](https://learn.microsoft.com/en-us/fabric/fundamentals/whats-new)

---

Written by **Shai Karmani**. Connect with me on [LinkedIn](https://www.linkedin.com/in/shai-kr).

  </div>
</article>
