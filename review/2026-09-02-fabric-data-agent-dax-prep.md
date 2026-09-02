---
layout: post
title: "Fabric Data Agents Can Answer Harder DAX Questions Now. Here’s How to Make That Pay Off."
date: 2026-09-02
description: Advanced DAX generation gives Fabric data agents a better path for complex semantic model questions. The practical win comes when teams prepare the model, test the preview runtime, and treat agent answers like a governed analytics surface.
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
  .article-header h1 { font-size: clamp(1.12rem, 5vw, 1.6rem); line-height: 1.17; letter-spacing: -0.025em; overflow-wrap: normal; }
  .article-header .dek { font-size: 0.94rem; margin-top: 14px; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; border-radius: 16px; }
  .article-body p:has(> img) { max-width: 100%; width: 100%; }
  .subscribe-orbit { display: none; }
}
.review-visual { width: 100%; max-width: 100%; margin: 34px 0 10px; overflow: hidden; }
.review-visual img { display: block; width: 100%; max-width: 100%; height: auto; }
</style>

Fabric data agents are getting more interesting for one simple reason: they are moving closer to the semantic model work BI teams already trust.

Microsoft's latest Fabric updates call out advanced DAX generation for semantic models in Fabric data agents. The short version is useful. Instead of producing a DAX query in one pass, the preview runtime can reason through multiple steps, inspect model values, resolve ambiguity, refine the query, and answer harder questions more accurately.

That sounds like an AI feature.

I think the better framing is this: Fabric data agents are becoming another consumer of your semantic model quality.

If the model is clean, scoped, named well, and prepared for AI, the agent has much better material to work with. If the model is a pile of cryptic columns, duplicate measures, unclear business definitions, and report-specific shortcuts, advanced DAX does not magically turn that into governed self-service.

The upgrade makes the preparation work more valuable.

<figure class="review-visual"><img src="/data-ninja-ai-lab/assets/blog/fabric-data-agent-dax-prep/diagrams/01-answer-loop.svg" alt="Fabric data agent answer loop"></figure>

## The useful shift: from single-pass DAX to an answer loop

The standard Fabric data agent runtime is built for stable behavior. The preview runtime is where Microsoft puts newer orchestration, planning, routing, and query-generation improvements before they graduate.

Advanced DAX generation sits in that preview runtime today.

For Power BI semantic models, the data agent already uses metadata, AI instructions, Prep for AI configuration, report visual metadata, verified answers, and conversation context when it generates DAX. The advanced path adds a better reasoning loop around that process. It can inspect intermediate results, search values inside model columns to find reliable filters, and refine the approach before giving the user an answer.

That matters for the kinds of questions business users actually ask:

- "Which regions are behind target this quarter?"
- "Show me customers with rising revenue but falling margin."
- "Why did net sales change after returns last month?"
- "Which product family is driving the variance?"

Those are not always simple measure lookups. They often depend on the right metric, the right date logic, the right filter values, and the right interpretation of business language.

A better DAX generator helps. A better semantic model helps more.

## Prep for AI is no longer optional decoration

The practical mistake is treating Fabric data agent configuration as something separate from Power BI model governance.

For semantic models, Microsoft is explicit about the dependency: the DAX generation tool relies on the semantic model metadata and Prep for AI configuration. Instructions added at the data agent level do not replace proper semantic model preparation for DAX query generation.

That should change how teams roll this out.

If the agent is going to answer questions from a semantic model, the model needs an AI-ready layer:

- a focused AI data schema with the right tables, columns, and measures
- business-friendly names that match how users speak
- synonyms and descriptions where language is ambiguous
- verified answers for common or sensitive questions
- value coverage for filters the agent needs to find correctly
- a known list of questions that can be used for regression testing

<figure class="review-visual"><img src="/data-ninja-ai-lab/assets/blog/fabric-data-agent-dax-prep/diagrams/02-semantic-prep-layers.svg" alt="Semantic model preparation layers for Fabric data agents"></figure>

This is the part I like about the update.

It pushes BI teams toward better semantic model discipline without pretending that AI removes the need for a semantic layer. The semantic model is still where business definitions live. The agent is another interface over that model.

That is a healthier architecture than letting every conversational tool invent its own metric logic.

## The preview runtime deserves a controlled pilot

There is another detail teams should not skip.

The runtime selected when a Fabric data agent is published matters. If you publish while the agent is configured for the preview runtime, that published version continues to use the preview runtime until you republish with a different runtime selection.

That is not scary. It just means runtime choice belongs in the release checklist.

I would not turn this on casually for every agent and hope the answers are better. I would pick one high-value semantic model and build a small pilot around it.

A good pilot looks like this:

1. Choose a model with real business ownership. Do not start with the messiest model in the tenant.
2. Define the top 20 to 40 questions users ask or should be able to ask.
3. Prepare the model for AI before testing the agent.
4. Run the same question set against the standard and preview runtime where possible.
5. Compare answers, DAX shape, filter values, latency, and failure modes.
6. Document questions that need verified answers instead of free-form generation.
7. Decide which users should see the agent and what escalation path exists when the answer is unclear.

That gives the team evidence instead of vibes.

<figure class="review-visual"><img src="/data-ninja-ai-lab/assets/blog/fabric-data-agent-dax-prep/diagrams/03-agent-rollout-checklist.svg" alt="Production checklist for Fabric data agents with semantic models"></figure>

## Where this can pay off quickly

The strongest use case is not "ask anything about everything."

That sounds exciting in demos and painful in production.

The better use case is narrower: let users ask natural-language questions against a trusted semantic model where the measures, filters, and definitions are already governed.

That can help in a few places:

**Executive metric explanation.**  
Users ask why a KPI moved. The agent needs to use the right approved measures, not invent a calculation.

**Operational triage.**  
Teams ask which region, product, vendor, or customer group needs attention. Correct filter value selection matters here.

**Self-service discovery.**  
Analysts ask follow-up questions before deciding whether a full report page is needed.

**Consistent semantic answers across experiences.**  
Microsoft is connecting this work across Fabric data agent, Fabric skills, Power BI, Microsoft 365 Copilot, and Fabric IQ. That makes semantic model preparation more valuable than a one-feature setup task.

The common thread is simple: the agent should sit on top of trusted definitions, not beside them.

## What I would tell a BI team

I would not sell this internally as "AI can now write better DAX."

That is true, but it is too shallow.

I would say this instead:

> Fabric data agents are becoming a real conversational interface over Power BI semantic models. If we prepare the model properly, advanced DAX generation can make harder business questions answerable without pushing users into raw DAX or new report requests.

Then I would assign the work like a normal BI platform task:

- model owner defines trusted questions
- BI developer prepares the semantic model for AI
- platform owner controls preview runtime use
- business stakeholder validates expected answers
- admin reviews permissions and Purview constraints
- support owner tracks failures and confusing answers

That is not heavy process. It is the minimum needed if people are going to trust the output.

## The practical takeaway

Advanced DAX generation is a good sign for Fabric data agents. It means the agent can do more than translate a simple sentence into one query and hope for the best.

But the teams that benefit first will not be the teams with the most enthusiastic chatbot launch.

They will be the teams with the clearest semantic models, the best AI prep, and a small regression set of questions they can use every time the agent runtime changes.

That is the real opportunity here: governed conversational analytics, built on the semantic layer instead of replacing it.

## Sources

- [Advanced DAX generation for semantic models in Fabric data agents (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Advanced-DAX-generation-for-semantic-models-in-Fabric-data/ba-p/5363136)
- [Fabric data agent runtime](https://learn.microsoft.com/en-us/fabric/data-science/data-agent-runtime)
- [Semantic model best practices for data agent](https://learn.microsoft.com/en-us/fabric/data-science/semantic-model-best-practices)
- [Fabric data agent creation](https://learn.microsoft.com/en-us/fabric/data-science/concept-data-agent)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.  
If you work on Microsoft Fabric, Power BI, SQL Server, or analytics engineering, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
