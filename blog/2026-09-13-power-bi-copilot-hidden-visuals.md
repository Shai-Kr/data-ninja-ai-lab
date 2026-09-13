---
layout: post
title: "The Hidden Visual Pattern That Gives Power BI Copilot Better Context"
description: "A practical authoring and test pattern for using display-only bookmark visuals as intentional, governed context for Power BI Copilot summaries."
date: 2026-09-13
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
---

A Power BI report can contain useful analytical context that is not visible when the page first opens.

Teams already use bookmarks to reveal detail panels, alternate charts, and guided explanations without crowding the default canvas. The August 2026 Power BI update makes that pattern more relevant to Copilot: report summaries and answers can now consider visuals that are hidden by default and revealed through display-only report bookmarks.

This creates a useful design opportunity. A report author can keep the main page focused while making additional analytical views reachable to both the user and Copilot.

The important word is **intentional**. Hidden visuals should not become a place to store unexplained measures or abandoned chart experiments. They are part of the report's analytical contract now, and they need the same naming, permissions, validation, and ownership as visible visuals.

## What changed

Microsoft documents two related experiences:

1. The **Copilot report pane** can summarize visuals across the report, including visuals hidden by default behind a display-only bookmark. It reads those visuals in place without changing the current bookmark state. RLS and OLS remain enforced.
2. The **Copilot narrative visual** lets an author turn on **Show hidden bookmark visuals**, review the eligible hidden visuals, and select which ones should contribute to the narrative.

The boundary matters. Microsoft limits this behavior to display-only report bookmarks, where the bookmark changes visibility but does not save data state. The bookmark must also be reachable through a bookmark button or bookmark navigator. Personal bookmarks are not supported. Visuals on hidden pages are excluded unless a report bookmark makes them visible.

This is more than a small Copilot enhancement. It changes how I would review the report canvas.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/power-bi-copilot-hidden-visuals/01-context-surface-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/power-bi-copilot-hidden-visuals/01-context-surface.svg' | relative_url }}" alt="Power BI Copilot context surface showing visible visuals and reachable hidden bookmark visuals inside the RLS and OLS security boundary.">
</picture>

## Treat hidden visuals as a second analytical surface

A clean executive page often needs fewer visuals, not more. That does not mean every useful analytical view must disappear.

A display-only bookmark can reveal a focused detail panel when a user asks for it. Examples include:

- a regional breakdown behind a headline KPI;
- a variance bridge behind a monthly result;
- a product mix chart behind a total margin card;
- a service-level detail view behind an operations summary;
- a definition panel that explains how the KPI is calculated.

The default page remains readable. The extra context remains part of the report experience, and Copilot can use it when the documented conditions are met.

This is a better design pattern than placing twelve visuals on the opening page because each stakeholder may need one of them. It also avoids creating disconnected hidden pages that users cannot reach and authors forget to maintain.

But there is a catch: Copilot works from the report visuals and their metadata. A hidden chart called `Visual 27` with a vague axis and an unexplained measure is poor context. Hiding it does not improve its meaning.

## Use an authoring contract

I would add five rules to the report review checklist.

### 1. Make the bookmark display-only

Clear **Data** for the bookmark so it changes visibility rather than storing filter or slicer state. This keeps the hidden visual eligible under Microsoft's documented behavior and avoids coupling the context panel to an old saved selection.

### 2. Give users a real path to the visual

Use a bookmark button or bookmark navigator. A hidden visual that nobody can reach is not part of a usable report experience. Microsoft also excludes bookmarks without a user-facing affordance from this Copilot pattern.

### 3. Name the analytical view clearly

Use a title that describes the measure, comparison, and grain. `Margin variance by product category` gives Copilot and the reader more context than `Variance chart`.

Axis titles, units, date scope, and business terminology should be explicit. The hidden state is a layout choice, not permission to lower the metadata standard.

### 4. Keep one business question per hidden panel

A bookmark panel should answer a recognizable follow-up question. If it contains unrelated charts, Copilot may have more material but less coherent context.

A practical test is simple: can the author complete this sentence?

> Open this panel when you need to understand ________.

If the answer needs three paragraphs, the panel probably needs to be split.

### 5. Review security and freshness like any visible visual

RLS and OLS remain enforced, which is the right security behavior. Still, test with representative roles. Also verify that the measure logic, visual filters, and refresh expectations are current. Hidden visuals are easy to miss during ordinary visual inspection.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/power-bi-copilot-hidden-visuals/02-authoring-contract-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/power-bi-copilot-hidden-visuals/02-authoring-contract.svg' | relative_url }}" alt="Five-rule authoring contract for display-only bookmark visuals used as Power BI Copilot context.">
</picture>

## Test the experience, not the checkbox

Do not validate this feature by confirming that the bookmark opens and Copilot returns text. Use a small acceptance test with a known result.

Pick one report page and one hidden analytical panel. Create a question that can be answered from the visible page, then a second question that requires the hidden visual. Record the expected values before running Copilot.

Run at least these four cases:

| Case | Report state | What to verify |
| --- | --- | --- |
| Visible baseline | Default page | Summary cites and reconciles with visible totals |
| Hidden context | Default page, hidden panel reachable | Answer can reference the eligible hidden visual without changing bookmark state |
| Filtered context | Apply a supported filter or slicer | Answer respects the current report context and cites the expected visual |
| Restricted role | Test as a representative RLS or OLS role | Response does not reveal data or metadata outside that role |

For the narrative visual, also verify the author's selection. Turn on **Show hidden bookmark visuals**, include only the intended views, generate the narrative, and inspect the footnotes. Microsoft advises authors to read the generated summary for accuracy. That remains a required step, not a formality.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/power-bi-copilot-hidden-visuals/03-test-matrix-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/power-bi-copilot-hidden-visuals/03-test-matrix.svg' | relative_url }}" alt="Four-case acceptance test for Power BI Copilot summaries that use visible and hidden bookmark visuals.">
</picture>

## Keep the scope precise

This feature does not mean Copilot reads every hidden artifact in a report.

The documented pattern is narrower:

- display-only report bookmarks;
- a user-facing bookmark button or navigator;
- supported visuals;
- report pages and hidden visuals that meet the eligibility rules;
- the current user's permissions, including RLS and OLS.

The Copilot report pane and the Copilot narrative visual also expose different controls. The report pane can use eligible hidden visuals in summaries and answers. The narrative author explicitly chooses hidden bookmark visuals through the selection experience.

That distinction belongs in documentation and QA. Otherwise, teams will assume a hidden visual is included because it exists, or assume it is excluded because the page starts with it hidden.

## The practical payoff

This pattern lets report teams separate **attention** from **availability**.

The opening page can emphasize the few numbers that deserve immediate attention. Bookmark panels can preserve useful drill-in context. Copilot can work with those eligible views without forcing every chart onto the default canvas.

That is a better report design outcome than adding more visual density for the sake of AI. It also gives teams a concrete review artifact: a list of hidden context panels, the business question each one answers, and the four test results that prove the experience works for the intended users.

I would start with one report, one bookmark panel, and one known-answer test. If the pattern improves both human navigation and Copilot's cited answers, then standardize it.

## Sources

- [See What's New in the August 2026 Power BI Update](https://learn.microsoft.com/en-us/power-bi/fundamentals/whats-new)
- [Summarize a Report With Copilot](https://learn.microsoft.com/en-us/power-bi/explore-reports/copilot-pane-summarize-content)
- [Create a Narrative Visual With Copilot for Power BI](https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-create-narrative)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)

---

**Shai Karmani**  
Microsoft Data and AI practitioner  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
