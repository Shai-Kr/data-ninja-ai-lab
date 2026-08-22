---
layout: post
title: "Fabric Warehouse Agents Can Finally Help Where SQL Work Actually Happens"
date: 2026-08-22
description: MCP and Skills for Fabric move warehouse agents from generic SQL helpers toward context-aware development loops. The opportunity is faster validated warehouse work.
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
---

<style>
@media (max-width: 760px) {
  .article { max-width: 100%; overflow-x: hidden; }
  .article-header { padding: 22px 14px; border-radius: 18px; }
  .article-header h1 { font-size: clamp(1.3rem, 5.8vw, 1.75rem); line-height: 1.16; overflow-wrap: anywhere; }
  .article-body { overflow-x: hidden; font-size: 0.98rem; }
  .article-body img { width: 100%; max-width: 100%; border-radius: 16px; }
  .subscribe-orbit { display: none; }
}
</style>

Microsoft's new preview for agentic Fabric Data Warehouse development is the kind of AI feature that is easy to underestimate.

The obvious headline is that agents can help write SQL. Useful, but not new. Developers have been asking coding assistants for SQL for a while.

The more interesting part is the combination of Model Context Protocol and Skills for Fabric. MCP gives the agent a way to connect to live Fabric context. Skills give it workload-specific instructions for how Fabric actually works. Put those together, and the agent can move closer to the real warehouse workflow: find the right objects, inspect schema, draft a query, run it, understand errors, and help troubleshoot performance.

That is a better target than "AI writes SQL." SQL generation is one step. Warehouse development is a loop.

![Agentic warehouse workflow with MCP and Skills for Fabric](/data-ninja-ai-lab/assets/blog/fabric-warehouse-agent-skills/diagrams/01-agentic-warehouse-loop.svg)

## The useful shift is context

Most AI-assisted SQL workflows fail in boring ways. The model writes a query against tables that do not exist. It guesses column names. It misses security boundaries. It produces a query that looks reasonable but does not match the model of the warehouse in front of you.

That is not a writing problem. It is a context problem.

Fabric Warehouse work depends on the objects, schemas, SQL endpoint behavior, permissions, data shape, and operational rules of a specific workspace. A generic assistant does not know those things. A Fabric-aware agent has a better chance because it can use tools and instructions designed for the workload.

Microsoft describes MCP as the tool layer and Skills for Fabric as the instruction layer. That split matters.

- MCP can expose live tools and data access.
- Skills can tell the agent which Fabric APIs, SQL patterns, and operational practices to use.
- Fabric Warehouse provides the actual work surface: tables, views, procedures, query results, errors, and performance context.

This is the right architecture for agent-assisted data work. The agent should not rely on memory of public documentation alone. It should inspect the current environment and use rules that fit the product.

## Where this can help first

The safest early wins are not full autonomous warehouse changes. They are assistive tasks where a developer or data engineer still owns the decision.

A few examples:

**Explain a warehouse object.** Ask the agent to inspect a table or view and explain how it appears to be used. That is useful for onboarding and inherited estates.

**Draft a query from real schema.** Instead of asking for a generic SQL pattern, ask the agent to inspect the actual schema and draft the first version. The human still checks the logic.

**Troubleshoot a failed query.** Give the agent the error, the query, and access to the relevant warehouse metadata. It can propose a fix with product context.

**Compare result sets.** Have the agent help validate whether a new query or view matches expected totals before it becomes part of a report or semantic model.

**Document the warehouse as you work.** The same context that helps an agent write SQL can also help it explain assumptions, key joins, and metric caveats.

None of those require pretending the agent is a data architect. They use the agent as an accelerator inside a controlled workflow.

![Safe operating pattern for Fabric Warehouse agents](/data-ninja-ai-lab/assets/blog/fabric-warehouse-agent-skills/diagrams/02-safe-agent-pattern.svg)

## The guardrail most teams will need

The agent should be fast. The release process should not be.

That is the main governance point. If agentic warehouse development turns into "generate and apply changes directly in production," teams will create a new class of data platform incidents. Faster does not help if nobody can explain why a view changed, why a result moved, or why a query got more expensive.

A safer pattern looks like this:

1. Scope the agent to one workspace or one non-production environment first.
2. Start with read-first access and narrowly defined task types.
3. Let it generate drafts, explanations, tests, and troubleshooting suggestions.
4. Require human review before any persistent object change.
5. Capture prompts, generated SQL, result checks, and approval notes.

This is not bureaucracy. It is how you keep the agent useful without letting it become an invisible change path.

For Fabric Warehouse specifically, I would be strict about three things.

**Result validation.** Every generated query needs a known comparison point: row counts, totals, sample rows, or a business-owned expected result.

**Cost and performance review.** Fabric Warehouse now has more explicit performance and cost controls than it used to. Agent-generated work should not bypass that operating model.

**Change traceability.** If the agent helped create a view, stored procedure, or transformation pattern, the repository, ticket, or deployment record should say so. You want the speed, not the mystery.

## Why this fits Fabric's direction

A lot of recent Fabric updates point in the same direction: more work moving from isolated UI clicks into governed, automatable workflows.

Power BI projects made reports and semantic models more file-based. TMDL made semantic models more inspectable as code. Skills for Fabric package product knowledge for coding agents. MCP gives agents a standard way to use live tools. Fabric Warehouse is now getting closer to that same development loop.

That is good news for teams that already operate like engineers.

It is less comfortable for teams whose BI and warehouse processes still depend on manual changes, undocumented Desktop files, and tribal knowledge. Agentic development does not remove the need for process. It exposes where the process is missing.

The teams that benefit first will not be the teams that trust AI the most. They will be the teams with enough structure to review, test, and promote the work safely.

## A practical two-week pilot

I would not start with a production warehouse. I would start with a bounded pilot.

![Two-week Fabric Warehouse agent pilot checklist](/data-ninja-ai-lab/assets/blog/fabric-warehouse-agent-skills/diagrams/03-first-pilot-checklist.svg)

**Week 1: controlled setup**

Pick one non-production warehouse. Install the relevant Skills for Fabric. Connect the MCP tooling with read-first access. Define what the agent is allowed to do: explain objects, draft queries, compare results, and troubleshoot errors. Define what it is not allowed to do: persist changes, modify production objects, or approve its own output.

Also capture every prompt and every generated query. That gives you a review trail and helps you improve the prompts that actually work.

**Week 2: useful validation**

Run real tasks from the team's backlog. Ask the agent to explain unfamiliar tables, draft a query for a known report requirement, troubleshoot a failed SQL statement, and compare results from old and new logic.

Then score the pilot on practical measures:

- Did it reduce time to first useful query?
- Did it find the right warehouse objects without guessing?
- Were the generated queries understandable?
- Did result validation catch issues early?
- Did the review process stay clear?

If the answer is yes, expand the task list. If the answer is no, fix the context and the guardrails before expanding access.

## The real opportunity

The value of agentic warehouse development is not replacing the data engineer. It is shortening the loop between intent, context, SQL, validation, and documentation.

That is where warehouse work actually happens.

A good Fabric Warehouse agent should help the human move faster through the boring but important steps: find the object, understand the shape, draft the query, check the result, explain the tradeoff, document the decision.

If Microsoft keeps pushing MCP and Skills deeper into Fabric workloads, this becomes more than a demo feature. It becomes part of how serious Fabric teams operate.

The trick is to adopt it like an engineering tool, not like a magic button.

---

**Sources**

- [Bringing agentic warehouse development to Fabric Data Warehouse with MCP and Agent Skills (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Bringing-agentic-warehouse-development-to-Fabric-Data-Warehouse/ba-p/5360190)
- [Skills for Fabric overview (Microsoft Learn)](https://learn.microsoft.com/en-us/fabric/fundamentals/skills-for-fabric-overview)
- [What is MCP in Real-Time Intelligence? (Microsoft Learn)](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/mcp-overview)
- [What is Fabric Data Warehouse? (Microsoft Learn)](https://learn.microsoft.com/en-us/fabric/data-warehouse/data-warehousing)
- [What's New in Microsoft Fabric (Microsoft Learn)](https://learn.microsoft.com/en-us/fabric/fundamentals/whats-new)

---

*Shai Karmani is a senior data and AI practitioner based in Waterloo, Ontario. He works across Microsoft Fabric, Power BI, SQL, data engineering, and practical AI implementation. [Connect on LinkedIn](https://www.linkedin.com/in/shaikarmani/)*
