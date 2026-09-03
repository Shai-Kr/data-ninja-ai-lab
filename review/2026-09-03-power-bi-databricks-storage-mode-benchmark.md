---
layout: post
title: "The Power BI Databricks Benchmark That Makes Storage Mode Decisions Easier"
date: 2026-09-03
description: Microsoft published a benchmark for Power BI reporting on Azure Databricks. The useful part is not picking a winner. It is giving teams a better way to choose between Direct Lake, DirectQuery, and composite models with real workload evidence.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
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
  .article-header h1 { font-size: clamp(1.12rem, 5vw, 1.58rem); line-height: 1.17; letter-spacing: -0.025em; }
  .article-header .dek { font-size: 0.94rem; margin-top: 14px; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; border-radius: 16px; }
  .article-body p:has(> img) { max-width: 100%; width: 100%; }
  .subscribe-orbit { display: none; }
}
.review-visual { width: 100%; max-width: 100%; margin: 34px 0 10px; overflow: hidden; }
.review-visual img { display: block; width: 100%; max-width: 100%; height: auto; }
.article-body .source-list li { margin-bottom: 0.4rem; }
</style>

Many enterprise Power BI teams eventually hit the same architecture question:

If the data is in Azure Databricks, what is the right way to serve it to Power BI?

For a long time, that decision was made with a mix of habit, opinion, and whatever pattern the team already knew best. DirectQuery if they wanted live data. Import if they wanted speed. Composite models if someone had time to design aggregations. Direct Lake if the organization was already moving into Fabric and OneLake.

That is not a terrible starting point, but it is not enough for serious reporting estates.

Microsoft has now published a Power BI white paper benchmarking four architecture choices for reporting on Azure Databricks data sources. The useful part is not that it hands every team a single answer. It does not. The useful part is that it gives BI architects a more concrete decision model.

The benchmark compares:

- Direct Lake on OneLake
- Direct Lake on mirrored Unity Catalog tables
- DirectQuery on a Databricks SQL warehouse
- Composite models on Databricks with Import-mode aggregations

That is exactly the kind of comparison teams need before they standardize a pattern across dozens of semantic models.

<figure class="review-visual"><picture><source media="(max-width: 760px)" srcset="/data-ninja-ai-lab/assets/blog/power-bi-databricks-storage-mode-benchmark/diagrams/01-storage-mode-decision-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/power-bi-databricks-storage-mode-benchmark/diagrams/01-storage-mode-decision.svg" alt="Four Power BI storage mode choices for Azure Databricks reporting"></picture></figure>

## The headline is useful, but the tradeoffs matter more

The Power BI update post summarizes the benchmark this way: Direct Lake on OneLake performed well across the widest range of situations in the benchmark, especially for smaller and mid-size volumes and repeated interactive reporting. At the very large end, composite models with well-designed aggregations could be fastest and most consistent when queries hit the aggregation tables.

That is a strong signal, but it is not a universal rule.

The second half of the sentence matters. Composite models win when the aggregation design matches real usage. If the report falls through to the underlying DirectQuery source for common interactions, the user experience can change quickly. The pattern is powerful, but it asks for modeling discipline.

DirectQuery is still the simplest mental model for live queries, but simple architecture does not always mean simple operations. Every slicer, visual, and drill path has to be paid for by the source. That cost may be acceptable. It may even be the right choice. But it should be measured, not assumed.

Direct Lake is interesting because it changes the usual compromise. It gives Power BI a faster path over Delta data without turning every interaction into a live source query. For teams already standardizing on Fabric and OneLake, that can simplify the reporting layer. For teams still deeply centered on Databricks ownership, governance, and Unity Catalog, the mirrored table path deserves a closer look.

The real takeaway: storage mode is an operating decision, not only a modeling setting.

## What I would test before choosing a standard

A benchmark is most useful when it changes how the team evaluates its own estate.

I would not read the white paper and immediately declare one storage mode the enterprise default. I would use it to design a small internal test that reflects actual report behavior.

There are four things I would measure before making the call.

<figure class="review-visual"><picture><source media="(max-width: 760px)" srcset="/data-ninja-ai-lab/assets/blog/power-bi-databricks-storage-mode-benchmark/diagrams/02-storage-mode-decision-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/power-bi-databricks-storage-mode-benchmark/diagrams/02-storage-mode-decision.svg" alt="Power BI and Databricks benchmark testing checklist"></picture></figure>

### 1. Data volume

A model with 20 million rows and a model with 4 billion rows are not the same architecture problem.

At smaller and mid-size volumes, the fastest practical choice may be the one that gives good interactive performance with the least operational complexity. At very large volumes, aggregation design, cache behavior, and source pressure become much more important.

If your test only uses a friendly demo dataset, it will lie politely.

### 2. Cache state

Warm reports can hide bad decisions.

A dashboard that feels excellent after several users have already opened it may still be painful for the first user in the morning, a regional manager hitting a different filter path, or an executive opening it after a refresh. Test cold and warm behavior. Test common and uncommon slicers. Test drill paths, not only the landing page.

### 3. Query shape

A storage mode can look great for simple totals and struggle when the report mixes high-cardinality dimensions, detail pages, security filters, and interactive exploration.

This is where Power BI teams need to stop benchmarking the model in isolation. Benchmark the report experience. Users do not care that the model is elegant if the page they use every Monday takes 12 seconds to respond.

### 4. User behavior

Composite models with aggregations are only as good as the aggregation strategy.

If the aggregation tables match the questions people actually ask, the payoff can be excellent. If they only match the questions the development team expected, users will fall through to the source more often than planned.

That means usage telemetry belongs in the design loop. Performance architecture should follow user behavior, not a diagram from six months ago.

## A practical decision loop

The best way to use this benchmark is to turn it into a short architecture exercise.

Pick one important report connected to Databricks data. Not the easiest report. Not the worst report. Choose something with enough usage and pain that the result matters.

Then run a controlled comparison.

<figure class="review-visual"><picture><source media="(max-width: 760px)" srcset="/data-ninja-ai-lab/assets/blog/power-bi-databricks-storage-mode-benchmark/diagrams/03-storage-mode-decision-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/power-bi-databricks-storage-mode-benchmark/diagrams/03-storage-mode-decision.svg" alt="A practical Power BI storage mode decision loop for Databricks"></picture></figure>

I would keep the loop simple:

1. Shortlist two realistic storage modes for the report. If the organization is already using Fabric heavily, Direct Lake on OneLake should be in the mix. If the Databricks estate is the core source-of-truth layer, include the path that respects that ownership.
2. Rebuild the model path with the same report intent. Do not compare a carefully optimized design to a neglected one.
3. Measure cold load, warm load, slicer response, drillthrough, high-cardinality filtering, refresh behavior, and source load.
4. Review the operational cost. Who owns the pipeline, aggregation tables, refresh policy, security, and troubleshooting path?
5. Choose the pattern the team can operate repeatedly.

That last point is where a lot of architecture conversations get too clean.

The fastest option in a benchmark is not always the best option for a team with limited modeling capacity, unclear ownership, or weak deployment discipline. The right answer has to survive production, not only a proof of concept.

## Where this helps Shai's kind of audience

For BI developers, this is a way to move storage mode discussions out of opinion mode.

For data engineers, it clarifies that Power BI performance is partly a data-serving architecture question. Table layout, Delta access, mirroring, source query pressure, and aggregation strategy all affect the front-end experience.

For analytics managers, it gives a better question to ask:

"Which pattern gives us fast reports, clear ownership, and a support model we can maintain?"

That is much better than asking whether Direct Lake, DirectQuery, or composite models are "best" in the abstract.

My bias: Direct Lake deserves serious default consideration when Fabric and OneLake are already part of the architecture. It reduces a lot of the friction that used to sit between open Delta data and fast Power BI reporting.

But I would not standardize it blindly.

If the report is massive, usage is predictable, and aggregations can be designed around real user behavior, composite models can still be the right answer. If the business requires live access and accepts the source pressure, DirectQuery may still be defensible. If Unity Catalog ownership is central to the platform, mirrored tables need to be evaluated carefully rather than waved away.

The benchmark gives teams a better starting point. The local test still decides.

## A small checklist I would use

Before choosing the storage mode for a Databricks-backed Power BI model, I would ask:

- What freshness does the business actually need?
- What is the row count now, and what will it be in 12 months?
- Which report interactions drive most usage?
- Which filters create expensive queries?
- Does the team have the skill and time to maintain aggregations?
- Where should security be enforced?
- Who owns performance when the report slows down?
- Can this design be deployed and tested consistently?
- What telemetry will prove the decision is still working after launch?

That is the value of this white paper. It gives teams a better conversation before they lock in a pattern.

Not "which storage mode is best?"

A better question:

"Which storage mode fits this workload, this team, and this operating model?"

That is the decision that actually survives production.

## Sources

<ul class="source-list">
<li><a href="https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Modern-Power-BI-architecture-choices-for-reporting-on-Azure/ba-p/5364286">Modern Power BI architecture choices for reporting on Azure Databricks: A performance benchmark for Power BI storage modes</a></li>
<li><a href="https://learn.microsoft.com/en-us/power-bi/guidance/whitepapers">Power BI white papers, Microsoft Learn</a></li>
<li><a href="https://github.com/microsoft/FabricCAT/blob/main/Direct%20Lake_DirectQuery/Modern%20Power%20BI%20Architecture%20Choices.pdf">Modern Power BI Architecture Choices white paper, FabricCAT GitHub</a></li>
<li><a href="https://learn.microsoft.com/en-us/power-bi/fundamentals/whats-new">See What's New in the August 2026 Power BI Update</a></li>
</ul>

<p><strong>Written by Shai Karmani</strong><br>
Practical notes on Microsoft Fabric, Power BI, analytics engineering, and AI systems.<br>
<a href="https://www.linkedin.com/in/shai-kr">Connect with me on LinkedIn</a>.</p>
