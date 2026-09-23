---
layout: post
title: "Claude Code and Codex Can Now Understand Your Fabric Notebook Context"
description: "A practical guide to Microsoft Fabric's VS Code integration with Claude Code and Codex, including context boundaries, review controls, and a four-step acceptance workflow."
date: 2026-09-23
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

Coding agents are much more useful when they understand what you are editing.

That sounds obvious, but notebook work has made this harder than it should be. A prompt such as “aggregate the table by region” is incomplete unless the agent also knows the notebook language, selected cell, attached Lakehouse, runtime, workspace, and current document revision.

Until now, the engineer often had to paste that context into the conversation or accept generic code and repair it manually.

Microsoft has published a new Fabric Data Engineering integration for the Claude Code and Codex extensions in Visual Studio Code. The integration gives the selected agent approved context from the active Fabric notebook through a local MCP server.

The result is a better development loop: **shorter prompts, more relevant code, and a clear review boundary before anything runs.**

This is not autonomous notebook execution. It is a controlled context handoff for code generation.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-notebooks-coding-agents/01-context-handoff-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-notebooks-coding-agents/01-context-handoff.svg' | relative_url }}" alt="Controlled handoff of Fabric notebook context through a local MCP server to Claude Code or Codex.">
</picture>

## What the integration actually does

The Fabric Data Engineering VS Code extension can connect to the Claude Code or Codex VS Code extension.

When a supported Fabric notebook is active, the agent can retrieve context such as:

- the notebook language;
- the selected cell or insertion point;
- the document revision;
- workspace and runtime identifiers;
- relevant metadata for attached resources.

That context matters because notebook code is rarely portable without adjustment.

The correct Spark session is already available. A default Lakehouse can use a relative path while another Lakehouse may require a full ABFSS path. The selected cell may already define variables that the next cell needs. Runtime and attached-resource context can change which APIs or paths are valid.

A general coding agent can produce plausible PySpark. A context-aware agent has a better chance of producing code that belongs in this notebook.

Microsoft's documentation is careful about the scope. This integration covers the Claude Code and Codex **VS Code extensions**, not their command-line tools. GitHub Copilot Chat has a separate Fabric notebook integration through the same Fabric Data Engineering extension.

## Why the local MCP handoff is the interesting part

The feature is not valuable because another chat panel can write Spark.

The useful part is that notebook context can move through an explicit interface instead of being reconstructed inside every prompt.

By default, the integration shares metadata relevant to the active notebook and request. Resource content or sample rows require separate consent and are limited to the selected resource and prompt. Microsoft says platform credentials, access tokens, configured secrets, and known sensitive fields are excluded or redacted.

The request is also tied to its context.

If the engineer switches notebooks, changes the target, edits the document, or changes the workspace or runtime while the request is active, the original approval no longer applies. A new request is required.

That is a good control. A code proposal approved for cell 12 in one notebook should not silently land in cell 7 of another notebook after the user changes focus.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-notebooks-coding-agents/03-context-boundary-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-notebooks-coding-agents/03-context-boundary.svg' | relative_url }}" alt="Boundary map showing context shared by default, context requiring explicit consent, and excluded or redacted data.">
</picture>

## The agent proposes code. The engineer still owns execution.

The integration does not automatically run the generated code.

That distinction is important in data engineering. A notebook cell can read a table, but it can also overwrite a Delta path, change a schema, expose a sample, or start an expensive Spark operation.

Generated code needs the same review discipline as a pull request:

- verify every source and destination;
- inspect filters before a write;
- check join cardinality;
- confirm schema and type handling;
- look for broad file or table operations;
- validate the expected result with known data.

Syntax validation is not business validation.

A cell can compile and still join at the wrong grain. It can return rows and still apply the wrong timezone. It can write successfully and still target the wrong Lakehouse.

The agent saves time on the first draft. It does not take ownership of the result.

## A four-step acceptance workflow

I would evaluate the integration with one bounded notebook task rather than a large refactor.

### 1. Lock the context

Open the notebook through the Fabric Data Engineering extension. Select one existing cell or a clear insertion point. Confirm the active workspace, runtime, and attached Lakehouse before the prompt.

Do not move the target while the request is running.

### 2. State the result, not only the code shape

A useful prompt names the source, transformation, and expected output.

For example:

> Add one PySpark cell that reads the `publicholidays` table from the attached Lakehouse, groups rows by `countryOrRegion`, returns the holiday count, and orders the result from highest to lowest. Do not write data.

“Do not write data” is a small but useful boundary for an evaluation task.

### 3. Review the proposed change

Check the code against the active notebook context.

Does it use the existing Spark session? Does it reference the intended Lakehouse and table? Is the aggregation grain correct? Are nulls and duplicate rows relevant? Did the agent add imports or operations that are not needed?

Review the selected target as well as the code. The right code in the wrong cell is still a bad change.

### 4. Run with evidence

Execute deliberately. Compare the result to a known SQL query, a trusted report, or a small hand-checked sample. Record the prompt, generated change, review corrections, execution result, and any runtime cost signal that matters.

Repeat the same task with Claude Code, Codex, or GitHub Copilot if the goal is comparison. Keep the notebook context and acceptance criteria fixed. Compare correctness and repair effort, not writing style.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-notebooks-coding-agents/02-acceptance-workflow-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-notebooks-coding-agents/02-acceptance-workflow.svg' | relative_url }}" alt="Four-step acceptance workflow: lock context, state the result, review the diff, and run with evidence.">
</picture>

## Where this can save real time

The best early use cases are narrow and reviewable:

- add a read-only exploration cell for an attached Lakehouse table;
- explain and simplify an existing transformation;
- generate a known aggregation in PySpark;
- adapt a cell to the active Fabric runtime;
- troubleshoot a context or path error;
- draft validation queries after a transformation.

I would avoid using the first evaluation for multi-notebook changes, destructive writes, complex deployment work, or any task where the expected answer is unclear.

The current integration targets one selected cell or insertion range. It does not update multiple cells or notebooks, change notebook metadata, alter Fabric permissions, or modify runtime behavior.

Those limits are useful. They keep the first adoption pattern small enough to inspect.

## What teams should measure

Do not measure this by how impressive the generated code looks.

Measure the engineering loop:

| Question | Evidence |
| --- | --- |
| Did the agent use the correct notebook and resource context? | Paths, target cell, runtime assumptions |
| Was the first proposal executable? | Syntax and Fabric validation result |
| Was the output correct? | Known-result comparison |
| How much repair was required? | Changed lines and reviewer notes |
| Did the request stay inside its boundary? | No unrelated resources or write operations |
| Did it save time? | Prompt-to-validated-result time versus the normal workflow |

A coding agent that writes 40 lines quickly but needs 25 lines repaired is not faster. A shorter proposal that lands in the right context and passes a known-result check may be the better tool.

## My take

This is a practical step in the right direction for Fabric notebook development.

The important capability is not access to more models. It is the separation of responsibilities:

- Fabric provides the active notebook context;
- the selected coding agent proposes a change;
- the extension constrains the target and approval;
- the engineer reviews and decides whether to run it.

That is a much better pattern than pasting workspace details into every prompt or giving a generic agent broad access and hoping it infers the right target.

Start with one read-only task. Keep the expected result known. Compare the generated change with the evidence. If it reduces repair work without weakening review, expand carefully.

The goal is not to make notebooks write themselves.

The goal is to remove context reconstruction so engineers can spend more time checking the part that matters: whether the code is correct.

## Sources

- [Use Claude Code and Codex with Fabric notebooks in VS Code](https://learn.microsoft.com/en-us/fabric/data-engineering/claudecode-codex-with-vs-code)
- [Develop Fabric notebooks with GitHub Copilot in VS Code](https://learn.microsoft.com/en-us/fabric/data-engineering/notebook-custom-agent-with-vs-code)
- [Fabric Data Engineering VS Code extension](https://learn.microsoft.com/en-us/fabric/data-engineering/setup-vs-code-extension)
- [MicrosoftDocs change that added the Claude Code and Codex integration guidance](https://github.com/MicrosoftDocs/fabric-docs/commit/c6fc3c1572a7e7b34b036544ee81d100a043140a)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Microsoft Data and AI practitioner<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
