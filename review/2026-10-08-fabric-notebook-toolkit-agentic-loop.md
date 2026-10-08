---
layout: post
title: "Fabric Notebook Toolkit Can Turn AI Code Into Validated Notebook Work"
description: "A practical control and acceptance model for using Fabric Notebook Toolkit with coding agents safely."
date: 2026-10-08
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Microsoft's Fabric Notebook Toolkit preview closes a gap that has limited AI-assisted notebook development.

A coding agent could already generate PySpark or Python. It usually could not prove that it had selected the intended workspace, opened the correct notebook, edited the right cell, used the attached Lakehouse and runtime context, executed the change, or diagnosed the remote Spark result.

That gap matters. Generated code is only the first part of notebook work.

Fabric Notebook Toolkit, or FNTK, gives supported coding agents a notebook-aware command surface for discovery, content and cell operations, remote execution, session management, Spark monitoring, diagnostics, and logs. Microsoft's September 2026 Fabric summary describes support for GitHub Copilot CLI, OpenAI Codex, and Claude Code. The public package currently identifies itself as an alpha release, so I would treat this as a controlled engineering pilot, not a production-autonomy switch.

The opportunity is useful: move from **AI that suggests notebook code** to **AI that can complete a bounded notebook task and return evidence**.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-notebook-toolkit-agentic-loop/01-development-loop-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-notebook-toolkit-agentic-loop/01-development-loop.svg' | relative_url }}" alt="Fabric Notebook Toolkit development loop from intent through discovery, targeted edit, remote execution, diagnostics, and human review.">
</picture>

## The real improvement is a closed development loop

Without notebook-aware tooling, the common flow is incomplete:

```text
request -> generated code -> manual copy and paste -> manual run -> manual troubleshooting
```

FNTK can provide the missing operational steps:

```text
request -> discover target -> inspect notebook -> edit intended cell
        -> run remotely -> inspect result -> diagnose failure -> review evidence
```

That does not make the agent the owner of the notebook. It makes the agent capable of working inside a controlled development loop instead of stopping at a code block.

The distinction is important. A syntactically valid transformation can still be wrong because it ran against the wrong Lakehouse, used an unexpected runtime, changed a parameter cell, ignored an existing output contract, or produced a different row count.

Context is part of correctness.

## Treat target identity as the first gate

The first agent action should not be an edit. It should be discovery.

FNTK exposes commands for identifying the current principal, listing workspaces and notebooks, inspecting Lakehouses and Spark settings, and retrieving notebook content. A safe workflow should capture the selected identifiers before mutation:

- authenticated principal;
- workspace ID and name;
- notebook artifact ID and name;
- attached Lakehouse;
- environment and runtime;
- selected cell or insertion point;
- Git branch, ticket, or change reference when applicable.

Do not rely on a notebook name alone. Names can be duplicated across development, test, and production workspaces. The evidence should make the target unambiguous.

I would require the agent to return a short target card before any persistent change. If the workspace, notebook, or attached resource differs from the approved scope, the run stops.

## Make the mutation narrow and reviewable

FNTK includes notebook content and cell operations, including list, get, update, append, insert, delete, output inspection, language selection, and parameter handling.

That is powerful enough to create avoidable damage when the task is vague.

A useful change contract should answer five questions:

1. Which cell may change?
2. What outcome should the cell produce?
3. Which cells or notebook properties must remain untouched?
4. What destructive operations are prohibited?
5. What result proves the change worked?

For an early pilot, allow an agent to update one named or indexed code cell in a non-production notebook. Keep delete operations, full-content replacement, attached-resource changes, and production edits outside the allowed scope.

The smallest safe mutation is usually better than rewriting the notebook.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-notebook-toolkit-agentic-loop/02-change-contract-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-notebook-toolkit-agentic-loop/02-change-contract.svg' | relative_url }}" alt="Notebook agent change contract separating approved target, allowed action, protected state, and required proof.">
</picture>

## Execution evidence matters more than a successful tool call

A successful API or CLI response proves that the command was accepted. It does not prove that the notebook produced the correct result.

The toolkit provides structured JSON output, trace identifiers, progress, errors, next actions, and commands for Spark monitoring and logs. Use those as an evidence chain, then add data-level checks.

For a transformation notebook, I would record:

- session and execution identifiers;
- completed or failed state;
- elapsed time;
- driver or executor diagnostics when relevant;
- input and output row counts;
- schema comparison;
- expected partition or table writes;
- known-value assertions;
- duplicate and null checks;
- evidence that an unrelated cell or target table did not change.

A green execution state is necessary. It is not sufficient.

The same rule applies when an agent diagnoses a failure. A proposed fix should point to the error, stage, log, or resource signal that supports it. "Try increasing compute" is not a diagnosis unless the evidence shows a resource problem.

## Separate agent capability from agent authority

FNTK can discover, edit, execute, monitor, and diagnose. The fact that a tool supports an operation does not mean every agent session should be authorized to use it.

I would separate the pilot into four authority levels:

| Level | Allowed work | Promotion rule |
|---|---|---|
| Observe | Discover resources, inspect notebook content and diagnostics | No mutation |
| Draft | Generate a proposed cell change or patch | Human reviews before application |
| Execute in development | Apply a narrow change and run a non-production notebook | Acceptance checks must pass |
| Promote | Merge, deploy, or apply production changes | Separate human approval and existing CI/CD path |

This keeps the first use case practical. The agent can remove manual friction without becoming an invisible production change path.

The package documentation also describes authentication through the current Fabric CLI identity and optional supplied tokens. Identity should be deliberate and attributable. Avoid broad personal access for unattended workflows. Use the narrowest supported identity and scope for the task, then verify the effective target permissions before the run.

## A six-gate acceptance harness

I would put every agent-assisted notebook change through the same six gates.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-notebook-toolkit-agentic-loop/03-acceptance-harness-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-notebook-toolkit-agentic-loop/03-acceptance-harness.svg' | relative_url }}" alt="Six acceptance gates for an agent-assisted Fabric Notebook change: identity, target, diff, execution, data proof, and human promotion.">
</picture>

### 1. Identity gate

Confirm the principal and expected permissions. Stop if the session uses a different identity or has broader access than the pilot requires.

### 2. Target gate

Verify workspace, notebook, attached Lakehouse, environment, runtime, language, and intended cell.

### 3. Diff gate

Show exactly what changed. Reject unrelated cell edits, metadata drift, deleted content, or output-field changes that were not part of the request.

### 4. Execution gate

Run in the approved non-production context. Capture status, elapsed time, trace ID, Spark application details, and errors.

### 5. Data gate

Compare schema, row counts, known values, duplicates, null behavior, and destination writes against an expected result.

### 6. Promotion gate

A person reviews the diff and evidence. Promotion uses the team's normal source-control and deployment path. The agent does not approve its own work.

## A practical first pilot

Pick one notebook with a deterministic result and a cheap failure mode.

A good first task might add a derived column, correct one transformation, or improve one data-quality check. Avoid a notebook that controls finance close, deletes data, changes security, or writes across several production tables.

Then run the pilot twice.

The first run proves the happy path. The second run proves rerun behavior. If the same request creates duplicate records, different schema, or another persistent side effect, the workflow is not ready.

Measure something useful:

- time from request to reviewed result;
- number of incorrect target selections;
- number of manual copy-and-paste steps removed;
- percentage of runs with complete evidence;
- defects caught by the acceptance harness;
- recovery time after a deliberate test failure.

That tells you whether the toolkit improved engineering work, not only whether the demo looked impressive.

## My recommendation

Use Fabric Notebook Toolkit as a controlled execution and evidence layer for notebook agents.

Start read-only. Add narrow cell edits in development. Require remote execution evidence and data assertions. Keep promotion inside the existing Git and CI/CD process.

The strongest part of this preview is not that an agent can write Spark code. It is that the agent can work with the notebook's real context, run the change, inspect the result, and return a trail a developer can review.

That is the difference between generated code and validated notebook work.

## Sources

- [Fabric September 2026 Feature Summary](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Fabric-September-2026-Feature-Summary/ba-p/5325825)
- [Fabric Notebook Toolkit package](https://pypi.org/project/fabric-notebook-toolkit/)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Data, Microsoft Fabric, Power BI, Analytics Engineering, and AI<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
