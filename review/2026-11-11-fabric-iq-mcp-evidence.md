---
layout: post
title: "Give Every Power BI AI Answer a Verifiable Evidence Chain"
date: 2026-11-11
description: Fabric IQ MCP gives AI agents a read-only path into Power BI reports and semantic models. Here is a practical contract for discovery, DAX, citations, security, and answer validation.
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

Fabric IQ MCP gives an AI agent a read-only path into Power BI reports and semantic models. That is useful because it removes a lot of custom integration work. It is also where teams need to stop treating a fluent answer as proof.

The server exposes six tools for discovery, metadata, value search, and DAX execution. The calling agent still decides which tools to use, writes the query, and explains the result. Fabric IQ MCP does not provide a natural-language answering tool.

That separation is the right design. It also gives us a clean operating model: verify the connection, verify the content, execute a bounded query, retain the citations, and explain what the evidence actually supports.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-iq-mcp-evidence/01-answer-path-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-iq-mcp-evidence/01-answer-path.webp" alt="A five-stage flow shows Power BI content discovery, metadata inspection, value search, DAX execution, and an evidence-backed answer"></picture></figure>

{% include yt-embed.html id="FdP5rTgeqC4" title="Connect ChatGPT to Power BI with a Fabric Data Agent (MCP)" duration="8:31" kicker="Related PBI 101 walkthrough" %}

## The six-tool contract

The current public toolset is `Fabric.Routing.FabricIQ.V2`. Microsoft documents six tools:

| Tool | Job in the evidence chain |
|---|---|
| `DiscoverArtifacts` | Find reports and semantic models by name |
| `ResolveFabricItem` | Resolve a supported browser URL |
| `GetReportMetadata` | Inspect report structure and context |
| `GetSemanticModelSchema` | Read tables, measures, columns, and relationships |
| `ValueSearch` | Find an exact stored value before filtering on it |
| `ExecuteQuery` | Run DAX against one semantic model |

An agent usually combines several of these tools for one answer. The important point is that each step has a different failure mode.

A report name can be ambiguous. A field can exist but mean something different from what the prompt assumes. A customer name can be stored in a form the model did not predict. A valid DAX query can still answer the wrong business question. A correct query can return stale data because the semantic model has not refreshed.

The tool sequence should therefore be visible in logs or retained as an execution record. If the answer matters, the team should be able to reconstruct how the agent moved from the user's words to the final number.

## Discover at runtime

Microsoft explicitly recommends calling `tools/list` instead of hard-coding an assumed schema. That is more than protocol hygiene.

The MCP endpoint version and the tool-contract version are different things. The `v1` in the endpoint URL is not the toolset version. Teams that need a stable contract can send this header on `initialize`, `tools/list`, and `tools/call`:

```http
X-Variants: Fabric.Routing.FabricIQ.V2
```

Pinning the current version improves repeatability. Runtime discovery still matters because clients should tolerate additive tools and fields instead of failing when the service evolves.

I would record four values for every production agent run:

1. MCP endpoint
2. selected tool-contract version
3. tool name and input schema used
4. client and skill version

That record makes a later regression diagnosable. Without it, a team can see that an answer changed but not whether the data, query, agent instructions, or tool contract changed.

## Keep the evidence chain intact

`DiscoverArtifacts` now returns citations in the result content and in `_meta`. That gives clients a consistent representation, although the visible presentation still depends on the MCP client.

Citations are not decoration. They should tell the reviewer which report or semantic model grounded the answer. The DAX query and the result shape provide the next layer of evidence. Refresh state and user identity complete the picture.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-iq-mcp-evidence/02-evidence-chain-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-iq-mcp-evidence/02-evidence-chain.webp" alt="A five-layer stack shows identity, source citation, semantic context, DAX result, and answer scope as the evidence behind a Power BI AI answer"></picture></figure>

For a material answer, retain:

- the signed-in identity
- the resolved report or semantic model
- the citation metadata
- the schema elements selected
- the generated DAX
- the returned row count and truncation state
- the model's latest successful refresh time
- the final explanation and any stated limitation

This is enough to review the answer without dumping every internal prompt or exposing unnecessary data.

## Security is user-shaped

Fabric IQ MCP uses delegated OAuth. It applies the signed-in user's existing Power BI and Fabric permissions. RLS and OLS continue to restrict returned data.

That means two users can ask the same question and receive different valid answers. The difference may be security context, not inconsistency.

The current service does not support service-principal or application-only authentication. It also does not provide an administrator impersonation path. Production design should reflect that boundary instead of hiding a personal token behind a shared bot identity.

For acceptance testing, create named personas that represent actual access patterns:

- a report consumer limited by RLS
- a user with broader model visibility
- a user who can find the report but cannot access required objects
- a user with no access to the target item

Run the same questions through each persona and compare the answer, citations, error behavior, and returned fields. The expected result is not always the same number. The expected result is behavior that matches the user's permissions.

## Bound the query before trusting the prose

`ExecuteQuery` targets one semantic model per call. When `maxRows` is not specified, the default is up to 250 rows. Larger results can arrive as an embedded CSV resource, and client support for those resources varies.

This creates a simple review rule: aggregate and filter in DAX before asking the language model to explain the output.

A narrow query is easier to validate, cheaper to process, and less likely to be silently truncated. If the business question needs data from multiple semantic models, the agent must run separate queries and combine the results. That combination step should be explicit because it is outside the single-model execution contract.

Value search deserves similar discipline. Use it to resolve an exact stored value, then show which value was selected. A plausible fuzzy match that remains invisible to the reviewer is an easy way to produce a confident answer about the wrong customer, product, or region.

## Two tests, not one

A connected MCP server proves transport and authentication. It does not prove that the agent can answer a business question correctly.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-iq-mcp-evidence/03-two-tests-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-iq-mcp-evidence/03-two-tests.webp" alt="A comparison separates the MCP connection test from the business-answer acceptance test"></picture></figure>

The connection test should verify:

- OAuth sign-in completes
- the endpoint responds
- `tools/list` returns the expected contract
- the user can discover one known artifact

The business-answer test should verify:

- the intended artifact was selected
- the relevant measures and fields were found
- the generated DAX matches the question
- RLS and OLS produce the expected persona-specific result
- row limits and CSV handling are visible
- the answer identifies its source and time boundary
- a known control total matches

Keep a small regression pack with ten to twenty representative questions. Include a few that should fail cleanly. Re-run it when the semantic model, skill, client, or pinned tool contract changes.

## A practical production contract

Fabric IQ MCP is generally available, but the operating contract still belongs to the team using it.

My minimum contract would be:

1. Discover tools at runtime and pin V2 where repeatability matters.
2. Use the Fabric IQ skill so the agent has the recommended orchestration and guardrails.
3. Resolve a report or model before generating DAX.
4. Use metadata and value search to remove ambiguity.
5. Aggregate and filter before returning data to the model.
6. Preserve citations, DAX, identity, refresh state, and truncation evidence.
7. Test with real RLS and OLS personas.
8. Validate against known totals after every material change.

The opportunity is bigger than connecting an agent to Power BI. The real gain is a reusable, permission-aware route from a business question to a result that another practitioner can inspect.

That is the standard I would use before letting an AI-generated number into an executive decision, an operational workflow, or another automated action.

## Sources

- [Get started with the Fabric IQ MCP server](https://learn.microsoft.com/en-us/fabric/iq/connectors/fabric-iq-mcp)
- [Skills for Fabric overview](https://learn.microsoft.com/en-us/fabric/fundamentals/skills-for-fabric-overview)
- [Fabric IQ skill](https://github.com/microsoft/skills-for-fabric/blob/main/skills/fabriciq/SKILL.md)
- [Microsoft Fabric documentation update for Fabric IQ MCP V2 and citations](https://github.com/MicrosoftDocs/fabric-docs/commit/e295b337527829fa1ac3a15b8b19527c126fd245)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
