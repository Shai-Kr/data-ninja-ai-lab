---
layout: post
title: "Power BI's New Gantt Visual Can Become Your Delivery Control Panel"
date: 2026-10-18
description: Power BI now has a native Gantt visual in preview. Here is a practical model for turning task dates, progress, milestones, ownership, and schedule variance into a governed delivery view.
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
  .article-header h1 { font-size: clamp(1.12rem, 5vw, 1.6rem); line-height: 1.17; letter-spacing: -0.025em; }
  .article-header .dek { font-size: 0.94rem; margin-top: 14px; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; height: auto; border-radius: 16px; }
  .article-body p:has(> img) { max-width: 100%; width: 100%; }
  .subscribe-orbit { display: none; }
}
.review-visual { width: 100%; max-width: 100%; margin: 34px 0 10px; overflow: hidden; }
.review-visual img { display: block; width: 100%; max-width: 100%; height: auto; }
</style>

**Review draft. Direct link only.**

Power BI now has a native Gantt visual in preview.

That sounds like a reporting feature. I think the more useful opportunity is operational: teams can build a delivery control panel on top of the same governed semantic model they already use for cost, capacity, risk, and outcome reporting.

The visual supports duration bars, progress, milestones, up to three category levels, extra task columns, tooltips, configurable date scales, day shading, and timeline zoom. Those are enough ingredients for a serious portfolio view.

The value will not come from dragging \`Start Date\` and \`End Date\` onto a canvas. It will come from defining what the dates mean, how progress is measured, and which exceptions require action.

## Start with a task contract, not the visual

A Gantt chart can make weak delivery data look convincing. Before building the page, define one row of the task model.

I would start with these fields:

- a stable task or milestone key
- portfolio, program, project, and workstream identifiers
- task name and accountable owner
- baseline start and finish dates
- current forecast start and finish dates
- actual start and finish dates
- percent complete with a documented calculation
- status, dependency, and risk indicators
- last update timestamp and source system

The distinction between baseline and forecast matters. If the model keeps only the latest planned date, the report can show the current schedule but cannot explain movement. A delivery review needs both.

The same applies to progress. A manually entered \`80%\` may be useful, but it is not the same evidence as completed work items, approved deliverables, or actual effort. Label the method in the model so the reader knows what the bar represents.

<figure class="review-visual"><img src="/data-ninja-ai-lab/assets/blog/power-bi-gantt-delivery-control-panel/01-task-contract.svg" alt="A governed Power BI Gantt task contract covering identity, dates, progress, ownership, risk, and source evidence"></figure>

## Use the Gantt as the middle layer of the decision page

The timeline is best when it connects three levels of information.

At the top, show a small set of portfolio signals: active projects, milestones due soon, late tasks, forecast movement, and stale updates.

In the middle, use the Gantt to explain when the work is expected to happen. Power BI can group tasks through as many as three category levels. A practical hierarchy might be portfolio, project, and workstream. Extra columns can expose owner, status, or duration without forcing the reader to open another page.

At the bottom or in a drill-through page, show the evidence behind the exception: dependency, risk statement, source record, latest update, and owner comment.

That layout turns the chart into a route from signal to schedule to action.

The Gantt visual also allows \`Start\` and \`End\` to use measures. That makes it possible to switch between baseline, forecast, and actual dates through a controlled reporting pattern. I would avoid creating a single overloaded view that shows every timeline at once. Give the reader a clear mode and label it visibly.

## Make milestones explicit

Microsoft's implementation draws a milestone when \`Start\` has a value and \`End\` is blank. That is useful, but it means the semantic contract has to protect the difference between a true milestone and a task with a missing finish date.

Do not let bad source data silently become a milestone.

Create an explicit task type or milestone flag, then derive the visual's end value from that rule. A simple pattern is:

\`\`\`dax
Gantt End Date =
IF (
    SELECTEDVALUE ( DeliveryTask[Task Type] ) = "Milestone",
    BLANK (),
    MAX ( DeliveryTask[Forecast Finish] )
)
\`\`\`

The exact DAX depends on the model grain and filter context. The important decision is that a milestone is a business state, not an accidental blank.

Use milestones for decisions and commitments that deserve separate attention: design approval, data freeze, user acceptance, production release, contract date, or regulatory submission.

## Schedule variance should drive the conversation

A polished timeline is useful. A timeline that reveals movement is much better.

I would add three measures beside the visual:

\`\`\`dax
Finish Variance Days =
DATEDIFF (
    MAX ( DeliveryTask[Baseline Finish] ),
    MAX ( DeliveryTask[Forecast Finish] ),
    DAY
)

Days Since Update =
DATEDIFF (
    MAX ( DeliveryTask[Last Updated At] ),
    TODAY (),
    DAY
)

Late Task Count =
CALCULATE (
    DISTINCTCOUNT ( DeliveryTask[Task Key] ),
    DeliveryTask[Forecast Finish] < TODAY (),
    DeliveryTask[Percent Complete] < 1
)
\`\`\`

These measures answer three different questions:

- Did the commitment move?
- Is the evidence current?
- Is unfinished work already past its forecast finish?

That is enough to keep a delivery review focused on exceptions instead of reading every task row.

<figure class="review-visual"><img src="/data-ninja-ai-lab/assets/blog/power-bi-gantt-delivery-control-panel/02-decision-page.svg" alt="A Power BI delivery decision page with portfolio signals, a governed Gantt timeline, and evidence for schedule exceptions"></figure>

## Design the page around questions

The visual includes useful controls, but each one should answer a known question.

Use the zoom axis when a portfolio lead needs to move between the full program and the next few weeks. Use day shading to separate weekends or another non-working pattern. Use a fixed date scale when multiple pages must support a consistent review period. Use auto-scale when readers move between projects with very different durations.

Add visible columns only when they change the decision. Owner and status often qualify. A long description usually belongs in a tooltip or drill-through page.

Color needs the same restraint. The visual can cascade a color through category levels or use more granular colors and conditional formatting. I would reserve strong color for exception states such as late, blocked, or at risk. Coloring every workstream differently can make a busy schedule harder to read.

## Build an acceptance test for the report

The native visual removes a custom-visual dependency, but it does not remove the need for validation.

Before using the page in a delivery review, I would test five things.

1. **Date meaning:** Confirm baseline, forecast, and actual fields are not mixed.
2. **Milestone logic:** Prove that only explicit milestone records produce blank end dates.
3. **Progress logic:** Reconcile percent complete to its source and aggregation rule.
4. **Filter behavior:** Test project, owner, status, and date filters against known records.
5. **Scale and density:** Check performance and readability near the documented 1,000-row visual limit.

That last point is important. A portfolio may contain tens of thousands of tasks, while the visual supports up to 1,000 rows. The answer is not to force every task onto one page. Use a portfolio summary, sensible filters, and drill-through to keep each view bounded.

The visual is also in preview. Treat the page as a controlled release: document the Desktop version, test after monthly updates, and keep a simple fallback table for critical reviews until the feature is ready for your production standard.

<figure class="review-visual"><img src="/data-ninja-ai-lab/assets/blog/power-bi-gantt-delivery-control-panel/03-release-gates.svg" alt="Five release gates for a Power BI Gantt delivery control panel covering dates, milestones, progress, filters, and scale"></figure>

## Where this pattern fits

This approach works best when Power BI already receives governed delivery data from systems such as Azure DevOps, Jira, Planner, Project, a portfolio database, or a controlled SharePoint list.

Power BI should not become the task-entry system. It should become the governed review surface that connects delivery dates to cost, capacity, quality, risk, and business outcomes.

That distinction keeps the architecture clean:

- operational systems own task updates
- the data platform standardizes history and business rules
- the semantic model defines measures and access
- the report exposes the current decision and its evidence

## The practical takeaway

The new Gantt visual makes schedule reporting easier to keep inside the Power BI platform. Its real value is bigger than a native timeline.

Build it on a task contract that preserves baseline, forecast, actuals, progress method, ownership, and update evidence. Then use the visual to connect portfolio signals to schedule detail and accountable action.

That gives delivery teams a control panel they can use in a real review, not another chart that looks complete because every bar has a color.

## Sources

- [Power BI October 2026 Feature Summary](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Power-BI-October-2026-Feature-Summary/ba-p/5374650)
- [Gantt visual in Power BI (preview)](https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-gantt)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.  
If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
