---
layout: post
title: "Give Your Fabric AI Agent a Real Dependency Map"
description: "Turn the new item relations API preview into a useful, read-only change-review workflow, with evidence your team can inspect."
date: 2026-09-10
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: true
---

<style>.article-body pre, .article-body pre code { white-space: pre-wrap; overflow-wrap: anywhere; }</style>

An AI agent can explain a proposed data-platform change much better when it can see what depends on the item being changed.

That is the useful opportunity in Microsoft's September 10 announcement of the **Fabric item relations API, in preview**. Two REST operations expose upstream and downstream item relationships as a graph that code can read. The response includes items, typed relations, and the workspaces referenced by those items.

My first use for this would be a read-only change brief. Pick an item, retrieve its relationships, and give the reviewer an evidence-backed summary of the dependencies to inspect before approving a change.

This is a proposed workflow, not a report of a production implementation or measured results. Microsoft explicitly describes the preview as intended for evaluation and development, and not recommended for production use. That boundary matters: build a small evaluation, not an automatic production deployment gate.

## Start with a decision, not a chatbot

Consider a hypothetical team planning to replace a semantic model. The useful question is: which related items and teams should participate in the review?

The portal's lineage view already helps a person explore those dependencies. The API makes that metadata available to another tool. A script can turn the response into a change attachment. An agent can summarize it. A reviewer can inspect the original evidence without retracing every relationship manually.

I would keep the first version deliberately narrow: one familiar model, a read-only identity, one downstream request, and a short review brief. Once that output is understandable, add an upstream request to explain the model's source context.

The two directions answer different questions. Downstream helps identify consumers to investigate. Upstream helps explain dependencies that feed the item. Neither direction, by itself, proves that a proposed change is compatible.

![Two separate questions: upstream identifies source context; downstream identifies consumers to review.]({{ '/assets/blog/fabric-lineage-review/01-directions.svg' | relative_url }})

## What the preview actually exposes

The documented operations have these paths:

~~~http
GET /v1/workspaces/{workspaceId}/items/{itemId}/relations/downstream?beta=true
GET /v1/workspaces/{workspaceId}/items/{itemId}/relations/upstream?beta=true
~~~

These are request shapes, not a complete executable authentication example. Use an approved identity and your normal protected authentication mechanism. Do not paste access tokens into a notebook, an agent prompt, or a review document.

The announcement says the caller needs read permission on the item and that both user and service principal identities are supported. The preview currently requires the beta query parameter. Check the linked API reference as the contract evolves.

Each response has three useful collections:

- **items:** item identifiers, types, display names, and workspace identifiers. The queried item is included too.
- **relations:** the edges connecting items, with a relation type.
- **workspaces:** workspace context for the items returned in the graph.

Keep identifiers in the review evidence. Display names help a human read the result, but matching on names alone makes a poor join strategy. Two items can have similar names, and a friendly name is not a durable identity.

## Preserve what the edges mean

A list of item names is less useful than a typed dependency map.

In Microsoft's association example, a report consumes a semantic model. The edge has the report as itemId and the model as dependentOnItemId. Read that as “the report depends on the model.” Keep that orientation intact when generating the explanation.

Other relationship types describe different behavior. A Shortcut references data through a shortcut. Orchestration describes an item running or managing another item. PushData describes writing or pushing data to a dependency item. Those are different reasons for bringing an owner into a change review.

The documented set of relationship types is extensible. My parser would preserve an unfamiliar type and label it for inspection rather than discard it. An unexpected relationship is useful evidence; silently dropping it makes the brief look more complete than it is.

The same principle applies to scope. Describe this as an **item dependency map**. Do not present it as column-level lineage, a measure dependency analyzer, or a complete inventory of every external consumer. Those are stronger claims than the item graph establishes.

## Give the agent a bounded evidence package

The agent should summarize a structured record, not improvise a map from item names in the prompt.

For a prototype, I would store the target item ID, workspace ID, request direction, retrieval time, calling identity context, raw response, and any request errors. The summary can then reference the same item IDs as the evidence.

Treat names and metadata as data. An item description containing instructions is not permission for the agent to run a command, change access, or follow a link. The agent's job here is to explain the graph within the review task.

A useful output has a short answer to each of these questions:

- What item are we reviewing, and when was this graph retrieved?
- Which returned items depend on it, and through which relation types?
- Which upstream dependencies help explain its context?
- Which workspace owners or item owners still need to be identified?
- What remains unverified before this change can be approved?

Owner assignment is a separate enrichment step. Do not imply the three response collections automatically provide an accountable business owner for every relationship.

![A read-only review flow: retrieve evidence, create a cited brief, then let a person review the proposed change.]({{ '/assets/blog/fabric-lineage-review/02-review-flow.svg' | relative_url }})

## Use a small acceptance test

Choose an item whose relationships your team already understands. Compare the returned graph with the portal view under the same identity context. Investigate discrepancies rather than asking the agent to explain them away.

Check that an association is described in the right direction. Confirm the queried item is not counted as one of its own consumers. Check that items from different workspaces retain their workspace context. Feed the summarizer a synthetic unfamiliar relation type and verify that it remains visible.

Then test failure behavior. If a request fails, the brief should say that evidence could not be retrieved. If no downstream items are returned, it should say exactly that. “No downstream items returned” is not the same conclusion as “safe to delete.”

Finally, review whether the brief is actually useful. Can a reviewer find the underlying item identifiers? Can they separate an observed relationship from a proposed action? Can they see what has not been checked? Those are better prototype success criteria than how confident the generated paragraph sounds.

## Keep approval separate from explanation

A dependency tells you where to look. Compatibility testing tells you whether the proposed change works.

Changing a model may require report testing, refresh checks, security validation, and business sign-off even when the dependency graph is accurate. The item relations API adds useful context to that process. It does not replace it.

During this preview, I would use the brief as an evaluation artifact alongside an existing review process. No automatic deletion. No permission changes. No claim that an agent has certified a change as safe.

The practical win is straightforward: give the reviewer a grounded starting point, with the evidence attached. An agent that can explain what it knows, where it came from, and what still needs checking is far more useful than one that simply says “looks good.”

## Sources and preview status

Verified September 10, 2026. The announcement was readable in the official Fabric RSS feed; the Community article URL returned an access restriction during this scan. Both API reference pages were accessible.

- [Lineage-aware AI with the Fabric item relations API (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Lineage-aware-AI-with-the-Fabric-item-relations-API-Preview/ba-p/5366064)
- [Official Fabric Updates RSS feed](https://community.fabric.microsoft.com/rss/board?board.id=fbc_fabricupdatesblogs)
- [Get Downstream Relations, beta](https://learn.microsoft.com/rest/api/fabric/core/items/get-downstream-relations(beta))
- [Get Upstream Relations, beta](https://learn.microsoft.com/rest/api/fabric/core/items/get-upstream-relations(beta))

**Shai Karmani** writes about practical Microsoft Fabric, Power BI, data engineering, and AI implementation. [Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
