---
layout: post
title: "The Fabric Medallion Playbook That Keeps Warehouses Clean"
description: "A practical operating model for keeping Bronze, Silver, and Gold layers predictable in Fabric Data Warehouse."
date: 2026-09-04
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
---

Microsoft's latest Fabric Data Warehouse medallion guidance lands on the part teams usually underestimate: the operating rules.

That is the useful part.

Bronze, Silver, and Gold are easy to explain in a diagram. The hard work starts three months later, when source systems change, pipelines get patched under pressure, Power BI models need different grains, and someone asks why a Gold table is suddenly behaving like a staging table.

A medallion architecture does not stay clean because the folders are named correctly. It stays clean because every layer has a job, every transformation can be explained, and every consumer knows which output is safe to trust.

That is where Fabric Data Warehouse is becoming more interesting. The warehouse gives teams a familiar SQL operating surface, Fabric gives the platform context, and the medallion pattern gives a way to separate raw data, cleaned data, and business-ready data without turning the whole estate into a pile of report-specific tables.

The opportunity is not to copy a generic Bronze, Silver, Gold picture. The opportunity is to turn it into a runbook.

![Three Fabric Warehouse medallion layers with clear jobs for Bronze, Silver, and Gold.]({{ '/assets/blog/fabric-medallion-warehouse-playbook/01-medallion-layer-jobs.png' | relative_url }})

## The real medallion test is ownership

Most weak medallion implementations do not fail because the pattern is wrong.

They fail because ownership gets fuzzy.

Bronze starts cleaning data because a downstream team needed a quick fix. Silver starts serving reports because the first dashboard deadline was tight. Gold starts absorbing upstream quality rules because nobody wants to touch the ingestion pipeline. After enough of those choices, the labels still say Bronze, Silver, and Gold, but the system no longer behaves like a pipeline.

The first rule I would put in front of any Fabric Warehouse medallion design is simple:

**If a table starts doing another layer's job, fix the boundary before adding more features.**

That sounds obvious. In practice, it is where many analytics platforms quietly drift.

A clean operating model makes the tradeoff explicit:

- Bronze preserves source batches and makes replay possible.
- Silver applies data quality, conformance, data typing, deduplication, and rejection logic.
- Gold exposes stable, business-ready structures for Power BI, APIs, data agents, and operational consumers.

Once those jobs are clear, every new rule has somewhere to go.

## Bronze should protect traceability

Bronze is not where the team proves how clever it can be with SQL.

Bronze should make the source data traceable, reloadable, and inspectable. If a source file, table extract, or batch creates a downstream issue, Bronze should help answer basic questions quickly:

- Which source produced this row?
- When did we receive it?
- Which batch loaded it?
- Can we replay the affected batch?
- Did the issue exist at landing time, or did we create it later?

That is why the Fabric guidance around batched writes matters. Fabric Data Warehouse is built for set-based work. COPY INTO, pipelines, CTAS, INSERT SELECT, and MERGE patterns fit that model better than row-by-row habits.

If the pipeline creates a long tail of tiny writes, the fix is usually not a clever query hint. The fix is to repair the load pattern.

For a practical Bronze standard, I would keep it boring:

- Load in batches where possible.
- Add ingestion metadata.
- Keep the raw source shape close enough to support replay and audit.
- Avoid report-specific business logic.
- Keep operational logging lightweight if the warehouse is not the right high-write event store.

Boring Bronze is a feature. It gives the rest of the pipeline something stable to stand on.

## Silver is where trust gets built

Silver is the layer that usually decides whether a medallion architecture earns trust.

This is where the data becomes usable, but not yet overly tailored to a single report. It is where names become consistent, data types become deliberate, duplicate handling becomes visible, and bad records get reason codes instead of disappearing into a failed refresh.

The important word is **rerunnable**.

If a cleansing rule changes, Silver should not turn into archaeology. The team should know which tables can be rebuilt, which tables are incremental, which keys protect against duplicate loads, and where rejected records are stored for review.

A good Silver layer usually has a few habits:

- Transformations are idempotent where possible.
- Complex logic is broken into clear stages instead of one unreadable query.
- Required fields, valid formats, duplicate rules, and reference checks are explicit.
- Rejected rows keep reason codes.
- Data types and lengths are chosen intentionally.
- Late-arriving or changed records have a known pattern, often through MERGE or controlled incremental loads.

This is the layer I would test hardest. Not because Gold is less important, but because Gold inherits whatever Silver normalizes or misses.

![Five-step medallion warehouse runbook for batch writes, rerunnable Silver, quality gates, Gold consumers, and operating metrics.]({{ '/assets/blog/fabric-medallion-warehouse-playbook/02-medallion-runbook.png' | relative_url }})

## Gold should serve, not compensate

Gold is where analytics teams often lose discipline.

A Gold table should give consumers a stable business shape. It might be a dimensional model, a wide reporting table, a curated aggregate, or a domain-specific serving table. The exact shape depends on the workload.

The operating rule is more important than the shape:

**Gold should not become another staging layer.**

If Gold is full of source cleanup, duplicate handling, emergency type conversions, and one-off fixes for individual reports, the system is telling you the upstream layers are not doing their jobs.

That does not mean Gold has no logic. Gold absolutely has logic. It owns business-ready meaning:

- which entities matter to the business;
- which measures and grains are safe for reporting;
- which tables support Power BI semantic models;
- which outputs can be used by APIs, data products, or Fabric data agents;
- which historical or aggregated structures improve performance and usability.

The difference is that Gold logic should serve consumers, not hide pipeline debt.

This becomes even more important as Fabric data agents and Copilot-style experiences sit closer to trusted analytical data. If the Gold layer is vague, inconsistent, or report-specific, an AI experience will inherit that mess. It may answer confidently, but confidence is not the same as trustworthy context.

## The placement question that prevents drift

When a new rule appears, the team should not ask, "Where is it easiest to put this?"

That question rewards shortcuts.

Ask a better question:

**Who should own this rule when something breaks?**

That gives a much cleaner placement test.

![Decision table for deciding whether a rule belongs in Bronze, Silver, Gold, the report layer, or platform governance.]({{ '/assets/blog/fabric-medallion-warehouse-playbook/03-rule-placement-test.png' | relative_url }})

A few examples:

If the rule preserves source traceability, it belongs near Bronze.

If the rule validates, dedupes, types, conforms, or rejects records, it belongs in Silver.

If the rule defines business-ready meaning for consumers, it probably belongs in Gold.

If the rule only changes how one visual should look, it belongs in the report layer.

If the rule affects access, privacy, auditability, or network policy, it belongs in platform governance, not inside a random transformation query.

That last point matters. Fabric is adding more platform-level controls around networking, outbound access, workspace policy, auditability, and connections. Those controls should not be treated as separate from medallion design. They are part of the operating model.

## What I would put in the first runbook

If I were helping a team turn this guidance into practice, I would not start with a huge governance document.

I would start with a one-page runbook and make it real.

For each medallion pipeline, define:

1. **Batch contract**
   - source name;
   - load frequency;
   - expected volume;
   - batch identifier;
   - replay path;
   - failure owner.

2. **Silver quality contract**
   - required fields;
   - duplicate rules;
   - type conversion rules;
   - rejected-row handling;
   - late-arriving data pattern;
   - rebuild procedure.

3. **Gold consumer contract**
   - target semantic models;
   - target reports;
   - refresh expectations;
   - grains and keys;
   - data agent or API use;
   - owner for business definitions.

4. **Operating metrics**
   - row counts by batch;
   - rejected-row percentage;
   - refresh duration;
   - query cost or consumption signals;
   - failed loads;
   - top consumer impact.

5. **Change rule**
   - how schema changes are reviewed;
   - how transformations are tested;
   - how downstream consumers are notified;
   - how rollback or rebuild works.

That is enough to catch most drift early.

The goal is not ceremony. The goal is to make the pipeline predictable enough that a production incident does not require everyone to rediscover the architecture from scratch.

## The Fabric angle

Fabric Data Warehouse makes this discussion more practical because the medallion pattern can sit inside the same platform story as pipelines, SQL development, deployment workflows, Power BI semantic models, Real-Time Intelligence, data agents, and governance controls.

That can be a strength, but only if teams resist the temptation to treat every Fabric feature as another place to put logic.

The question is not whether Fabric can do the work. The better question is where the work should live so the platform remains understandable.

A medallion design should help a team answer that question before the pressure hits.

## My take

The best part of Microsoft's new guidance is not that it explains Bronze, Silver, and Gold again.

The useful part is the reminder that medallion architecture is an operating discipline.

If Bronze protects traceability, Silver builds trust, and Gold serves stable business outputs, the pattern can stay clean as the platform grows.

If those boundaries blur, the architecture may still look right on a slide, but it will feel fragile in production.

That is the difference I care about.

## Sources

- [Fabric Data Warehouse best practices for medallion architectures](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Fabric-Data-Warehouse-best-practices-for-medallion-architectures/ba-p/5364080)
- [Choosing your medallion pattern in Fabric Data Warehouse](https://community.fabric.microsoft.com/blog/fbc_fabricupdatesblogs/choosing-your-medallion-pattern-in-fabric-data-warehouse/5328670)
- [Building the Bronze, Silver, Gold layers](https://community.fabric.microsoft.com/blog/fbc_fabricupdatesblogs/building-the-bronze-%E2%86%92-silver-%E2%86%92-gold-layers/5360201)
- [Microsoft Fabric Data Warehouse documentation](https://learn.microsoft.com/en-us/fabric/data-warehouse/)

---

Written by **Shai Karmani**.  
Connect with me on LinkedIn: [linkedin.com/in/shai-kr](https://www.linkedin.com/in/shai-kr)
