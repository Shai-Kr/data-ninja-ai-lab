---
layout: post
title: "Give Fabric Planning a Guardrail That Moves With the Business"
date: 2026-11-07
description: Fabric IQ planning sheets can enforce fixed or measure-based min-max rules. Here is a practical way to turn them into governed planning controls.
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
  .subscribe-orbit { display: none; }
}
.review-visual { width: 100%; max-width: 100%; margin: 34px 0 10px; overflow: hidden; }
.review-visual img { display: block; width: 100%; max-width: 100%; height: auto; }
</style>

**Review draft. Direct link only.**

Planning input needs more than an editable cell.

Someone has to define what is allowed, where the rule applies, how the boundary changes, and what happens when a value falls outside it. Without that contract, writeback can turn a polished planning sheet into another place where business assumptions drift.

Microsoft Fabric IQ now documents min-max rules for planning sheets. A rule can use fixed numeric limits or measures that provide a different minimum and maximum for each planning context. It can also target selected measures, visual columns, rows, and periods.

The capability is useful because it puts a business boundary at the point of entry. The stronger pattern is to treat that boundary as a governed planning control, not just a validation setting.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-iq-planning-guardrails/01-policy-path-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-iq-planning-guardrails/01-policy-path.webp" alt="A four-stage flow turns a business boundary into a scoped min-max rule with release evidence"></picture></figure>

## What the min-max rule controls

The rule defines an allowed range for planning input.

The lower and upper boundaries can be:

- **Static values**, such as allowing a quantity from 0 through 4,000,000
- **Measures**, such as using Forecast as the minimum and Sales Target as the maximum

Each boundary can be inclusive or exclusive. A value equal to the limit is accepted when the boundary is inclusive and rejected when it is exclusive.

The rule scope can cover all measures, selected measures, all visual columns, or selected visual columns. It can then be narrowed by rows and by columns or periods, including the open period, a period range, or a custom selection.

That scope is part of the policy. A technically correct boundary applied to the wrong rows or periods is still a bad control.

## Use static limits for fixed policy

Static boundaries fit rules that do not depend on the current row or period.

Examples include:

- headcount cannot be negative
- a discount percentage must remain between approved limits
- a capital request has a fixed ceiling for one workflow
- a planning input must use a known operational range

Static rules are easier to test and explain. The release evidence can show one value below the range, both boundary values, one valid internal value, and one value above the range.

They still need ownership. If the business ceiling changes, someone must update the rule, test it, and record the effective date.

## Use measures when the boundary changes with context

A measure-based rule is more interesting because the allowed range can change by row and period.

Microsoft's documented example uses Forecast as the minimum and Sales Target as the maximum. The user can enter a value only when it falls inside the range produced by those measures for the relevant planning cell.

That creates a dynamic guardrail. It also makes the rule dependent on the quality of the two source measures.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-iq-planning-guardrails/02-static-dynamic-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-iq-planning-guardrails/02-static-dynamic.webp" alt="A comparison shows fixed static boundaries beside measure-based boundaries that change by planning context"></picture></figure>

Before using measures as limits, verify:

1. The minimum measure cannot exceed the maximum measure for an accepted cell.
2. Blank or missing boundary values have a defined outcome.
3. The measures use the intended scenario, currency, calendar, and aggregation.
4. Changes to either measure trigger a rule regression test.
5. The rule owner knows who owns each boundary measure.

The validation rule should not make a broken measure look like a user-entry problem.

## Scope the rule like a data access policy

The broad options, such as All Measures or All Visual Columns, can automatically cover items added later. That can be useful when the policy truly applies to the whole planning surface.

It can also create accidental coverage.

Use a simple decision record for every rule:

| Decision | Record |
|---|---|
| Business meaning | What risk or policy the range represents |
| Boundary source | Static values or named measures |
| Inclusivity | Whether each edge is allowed |
| Measure scope | All or selected measures and visual columns |
| Row scope | All rows or a controlled selection |
| Time scope | Open period, period range, or custom columns |
| Ownership | Business owner and technical owner |
| Effective date | When the rule becomes the accepted control |

If a rule uses All Measures or All Visual Columns, test what happens when a new measure or column is introduced. Automatic coverage is only safe when the new item shares the same business boundary.

## Test the boundary, not only the happy path

A release test should cover more than one accepted value.

For each applicable planning slice, test:

- one value below the minimum
- the exact minimum
- one value inside the range
- the exact maximum
- one value above the maximum
- a blank boundary measure, if measure-based limits are used
- a row and period that should not be covered
- a new measure or visual column when broad scope is enabled

Expected results must distinguish accepted input, rejected input, and cells outside the rule scope.

That makes the rule reproducible. It also catches off-by-one policy errors caused by an incorrectly selected exclusive boundary.

## Build a small operating model around the rule

Start with one high-value planning input where an invalid value creates a real review or reconciliation cost.

Use this release sequence:

1. Write the policy in business language.
2. Choose static or measure-based limits.
3. Limit the rule to the intended measures, rows, columns, and periods.
4. Test below, at, inside, and above both boundaries.
5. Test scope changes and source-measure changes.
6. Record the rule owner, evidence, and effective date.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-iq-planning-guardrails/03-release-gates-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-iq-planning-guardrails/03-release-gates.webp" alt="A six-check release model covers policy, boundaries, scope, edge tests, change tests, and evidence"></picture></figure>

The planning sheet should also make the rejected value understandable to the user. A control is easier to follow when the valid range and business reason are clear.

## The practical takeaway

Fabric IQ min-max rules can move planning validation closer to the business decision.

Static values work well for fixed policy. Measure-based limits support context-aware guardrails that change by row and period. In both cases, the boundary, scope, ownership, and test evidence matter more than the checkbox that created the rule.

Start with one planning input and one explicit range. Prove the edges, prove the scope, and make the owner visible. That is enough to turn cell validation into a real planning control.

## Sources

- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [Use a min-max rule in Fabric planning](https://learn.microsoft.com/en-us/fabric/iq/plan/planning-allocation-rules-controls/how-to-use-min-max-rule)
- [Documentation update: add min-max rules](https://github.com/MicrosoftDocs/fabric-docs/commit/4f7535308d698301eb76950f0c5558252b83dd10)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
