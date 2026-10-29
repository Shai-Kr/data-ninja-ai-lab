---
layout: post
title: "Build Data Engineering Agents That Prove Their Work in Fabric"
date: 2026-10-29
description: Project Osmos brings persistent, data-aware agent tasks to Microsoft Fabric. This guide turns its autonomy, guardrails, and validation model into a practical production pilot.
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

Microsoft has introduced Project Osmos, a native data engineering agent experience for Fabric.

The announcement matters because it moves the discussion past code generation. A coding assistant can produce valid PySpark and still create the wrong data product. The difficult work is preserving business rules, understanding relationships, handling new data, validating incremental behavior, and proving that the output is acceptable.

Project Osmos is designed around that larger job. A user defines an outcome and operating boundaries. A purpose-built orchestrator coordinates specialized agents for knowledge, code generation, execution, validation, and evaluation. The task runs against a selected Fabric lakehouse, executes PySpark through the Fabric Livy API, preserves its state, and can continue independently after the local coding session disconnects.

That is a meaningful step toward autonomous data engineering. It also raises the right implementation question: what evidence should a team require before it trusts the result?

My answer is a task contract.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/project-osmos-trusted-autonomy/01-task-contract-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/project-osmos-trusted-autonomy/01-task-contract.webp" alt="A Project Osmos task contract moves from outcome and guardrails through Fabric execution, validation, and human acceptance"></picture></figure>

## Start with an outcome, not a request for code

A weak prompt says: convert this notebook to an incremental load.

A useful task contract says what the completed data product must do:

- read the approved source tables from a named lakehouse
- write only to a staging schema during the pilot
- preserve the documented customer and order keys
- process a repeated source batch without creating duplicates
- reconcile row counts and financial totals against the source
- identify schema changes instead of accepting them silently
- stop and ask for guidance when a business rule is ambiguous
- return the implementation, validation results, unresolved assumptions, and execution history

The second version gives the agent a finish line. It also gives the reviewer a basis for rejecting an output that runs successfully but fails the business requirement.

This is the difference between automation and accountable automation. Generated code is an intermediate artifact. The accepted outcome is the product.

## What Project Osmos actually changes

Project Osmos organizes work as a persistent task hosted in Fabric. The task keeps its context, execution history, and outputs. A user can start it from GitHub Copilot CLI, Claude Code, or Codex through the Skills for Fabric plug-in, then close the terminal without stopping the work.

That persistence fits real data engineering better than a single chat. New data arrives. Requirements are clarified. A transformation that worked last month meets a new schema or edge case. The same task can receive additional instructions and decide whether to reuse or revise its implementation.

The execution model is also concrete. Project Osmos submits PySpark through the Fabric Livy API and evaluates actual results. It can investigate data, generate code in isolated sandboxes, run the implementation, inspect failures, and iterate. Authorized teammates can inspect the same task and add guidance.

The important point is that the system does not make business acceptance automatic. The team still reviews the evidence and decides whether the result is correct.

## Separate instructions, permissions, and acceptance

These are three different controls.

**Instructions** define what the agent should do. They include the outcome, resources, write pattern, rerun behavior, schema policy, and validation rules.

**Permissions** define what the agent can do. Project Osmos operates within the user's Fabric and OneLake access. A careful prompt is not a replacement for a narrow security boundary.

**Acceptance** defines what the team will trust. It should specify the evidence, tolerances, reviewer, and final approval state.

Mixing these controls creates false confidence. A detailed prompt does not prevent access to an overly broad workspace. A successful run does not prove the output matches the source. A human review does not help if the task returns no useful evidence.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/project-osmos-trusted-autonomy/02-responsibility-split-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/project-osmos-trusted-autonomy/02-responsibility-split.webp" alt="The team defines acceptance, Project Osmos builds and validates, and Fabric enforces the access boundary"></picture></figure>

## Define the evidence before the task starts

For a production-oriented task, I would require an evidence package with five parts.

### 1. Input profile

Record the source locations, schema, row counts, key uniqueness, null distribution, relevant date range, and known data-quality exceptions. This establishes what the agent actually evaluated.

### 2. Transformation contract

List the business rules, join assumptions, deduplication logic, late-arriving data behavior, incremental watermark, and expected output grain. Ambiguous rules should be returned as questions, not converted into hidden assumptions.

### 3. Execution evidence

Preserve the code version, Spark execution result, source and target objects, write mode, changed rows, failed attempts, and material decisions made during iteration.

### 4. Validation evidence

Check more than row counts. Include key uniqueness, reconciliation totals, referential integrity, duplicate handling, null thresholds, schema drift, rejected records, rerun behavior, and a comparison against a trusted baseline where one exists.

### 5. Acceptance record

Capture the final result, unresolved risks, reviewer, approval decision, and any condition attached to promotion. If a test is skipped, record why.

This package makes the task reviewable without forcing the reviewer to reconstruct the entire agent conversation.

## Use the write pattern as a safety control

Microsoft lets users define whether changes use copies, staging tables, or in-place updates. That choice should follow the risk of the task.

For a first pilot, use staged writes in a separate output area. The agent can inspect the source and build the result without changing a production table. The team can compare the staged output, review the generated logic, and promote it through the normal release process.

In-place updates should need stronger evidence. At minimum, define the affected objects, expected changed-row count, idempotency behavior, recovery path, and conditions that force the task to stop.

Schema changes deserve their own rule. Allowing an agent to add, remove, or change columns can be reasonable in a sandbox. In a shared production contract, it can break downstream semantic models, notebooks, and pipelines. Make the policy explicit rather than letting the task infer it.

## Test reruns as a first-class requirement

Incremental processing is one of the clearest use cases for Project Osmos. It is also where a successful first run can hide a serious defect.

The acceptance test should run the same input twice and confirm the expected behavior. Depending on the design, that may mean zero new target rows, deterministic updates, or a stable reconciliation total. Then add a late-arriving record, an updated business key, and a changed source schema.

The task should explain what happened in each case. If duplicates appear or the watermark skips a valid change, the implementation is not finished.

This kind of validation is where a persistent agent task can be more useful than a one-time code assistant. It can retain the context, revise the implementation, and rerun the evidence suite against the same acceptance contract.

## A practical first pilot

Choose a transformation with enough complexity to test the model but a bounded blast radius.

A good candidate is an existing batch pipeline that:

- has a trusted output for comparison
- uses two to four source tables
- includes one real business-rule edge case
- can write to a staging target
- has a known rerun or incremental-load requirement
- can be reviewed by both a data engineer and a domain owner

Avoid starting with the most business-critical pipeline or a task whose requirements exist only in one person's memory.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/project-osmos-trusted-autonomy/03-pilot-gates-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/project-osmos-trusted-autonomy/03-pilot-gates.webp" alt="Five pilot gates cover a known baseline, staged writes, explicit tests, evidence review, and measured expansion"></picture></figure>

Run the pilot in five steps:

1. Document the current transformation and trusted baseline.
2. Create a Project Osmos task with narrow resources and staged writes.
3. Provide the outcome, business rules, failure conditions, and validation suite.
4. Review the generated implementation and evidence with the domain owner.
5. Expand the scope only after the task passes the same contract on new data and a rerun.

Measure accepted outcomes, not agent activity. Useful measures include reconciliation pass rate, defect escape, reviewer corrections, rerun stability, time to accepted result, and compute consumed per accepted task.

## Where the boundary still matters

Project Osmos is in preview. Microsoft lists prerequisites that include Contributor or higher workspace permissions, required tenant settings, and an eligible Fabric capacity. Trial capacities are not supported. The task consumes Fabric capacity units while it runs.

More reasoning can help with a difficult problem, but it also increases time and compute. That tradeoff should be part of the task plan, especially for long-running investigations.

The system can validate extensively, but it cannot invent missing business truth. If two source systems disagree about the same customer or transaction, the task needs a rule or a domain decision. A good agent pauses on that ambiguity. A good operating model makes the pause cheap to resolve.

## The practical takeaway

Project Osmos brings an important capability into Fabric: persistent, data-aware agents that can investigate, implement, execute, validate, and refine real data engineering work.

The production opportunity is larger than faster Spark development. Teams can define a complete outcome, let the agent carry the implementation work, and review a repeatable evidence package before accepting the result.

Start with one bounded pipeline. Give the task narrow permissions, staged writes, explicit failure conditions, and a validation contract. If the agent can prove the result on a rerun and explain what remains uncertain, then expand the scope.

That is how autonomous data engineering becomes useful without making trust implicit.

## Sources

- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [Introducing the data engineering agent for Fabric (Project Osmos)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Introducing-the-data-engineering-agent-for-Fabric-Project-Osmos/ba-p/5377944)
- [Project Osmos overview](https://learn.microsoft.com/en-us/fabric/data-engineering/data-engineering-agent-overview)
- [Project Osmos quickstart](https://learn.microsoft.com/en-us/fabric/data-engineering/data-engineering-agent-get-started)
- [Project Osmos best practices](https://learn.microsoft.com/en-us/fabric/data-engineering/data-engineering-agent-best-practices)
- [Skills for Fabric overview](https://learn.microsoft.com/en-us/fabric/fundamentals/skills-for-fabric-overview)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
