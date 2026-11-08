---
layout: post
title: "Share Fabric Data Across Tenants Without Building Another Pipeline"
date: 2026-11-08
description: IQ Share can expose supported Fabric items across tenants without copying the data. Here is a practical operating model for scope, context, lifecycle, and consumer dependencies.
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

Cross-tenant data sharing usually creates a second system to operate.

Someone exports files, builds a transfer pipeline, schedules refreshes, reconciles versions, and sends definitions in a separate document. The recipient gets the data, but the relationship between the source, the copy, and the business meaning starts drifting immediately.

Microsoft Fabric IQ Share takes a different approach. In the current preview, a producer can share supported Fabric items with recipients in another Fabric tenant. The data remains in the producer tenant. The consumer accepts the share into its own workspace and receives a Share Subscription Item plus a read-only Mirrored OneLake Item that uses Fabric-managed shortcuts.

That removes a lot of replication work. It does not remove the need for a contract.

The contract moves from file delivery to item scope, recipient identity, business context, expiration, revocation, and downstream dependency management.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-iq-share-contract/01-cross-tenant-flow-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-iq-share-contract/01-cross-tenant-flow.webp" alt="A four-stage flow shows a producer item becoming a governed share, consumer subscription, and read-only mirrored item across Fabric tenants"></picture></figure>

## What IQ Share changes

The preview supports sharing an entire Lakehouse, Warehouse, or supported mirrored item. For Lakehouses, Markdown files can travel with the share so the producer can include descriptions, business definitions, and usage guidance.

The source data stays in the producer tenant. Fabric creates shortcuts for the consumer instead of creating a separate data copy for the sharing relationship.

New tables added to an already shared item are automatically reflected for consumers. When an entire source item is added or removed, the consumer refreshes the Share Subscription to see that item-level change.

This is the first design decision that matters: **the whole item is the sharing boundary**.

If a Warehouse contains twelve approved tables and two internal tables, the right answer is not to share it and hope permissions will carry the intent. Build a curated item whose current and future contents are safe for that partner relationship.

## A zero-copy share still needs ownership

IQ Share gives the producer lifecycle controls. The producer can review acceptance, update the expiration, revoke a recipient, or delete the Share. OneLake Catalog provides a central place to monitor shares.

Those controls need named owners and operating rules:

| Decision | What to record |
|---|---|
| Data product owner | Who approves the item boundary and business meaning |
| Share owner | Who creates the Share and monitors recipient status |
| Recipient | The exact identity invited to accept the Share |
| Consumer workspace | Where the subscription is allowed to land |
| Expiration | The date and renewal decision owner |
| Revocation | Who can stop access and what evidence triggers it |
| Change policy | How new tables and removed items are reviewed |
| Downstream impact | Which reports, notebooks, models, or agents depend on the share |

The Share creator is also a dependency. Microsoft's guidance notes that losing the creator's source access can interrupt consumer access. Use an ownership model that can survive role changes and offboarding.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-iq-share-contract/02-copy-vs-share-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-iq-share-contract/02-copy-vs-share.webp" alt="A comparison shows an export-and-reconcile delivery pattern beside an IQ Share relationship with shortcuts, context, expiration, and revocation"></picture></figure>

## Treat context as part of the data product

Zero-copy access solves movement. It does not explain the data.

For a Lakehouse share, use Markdown context files to carry the information a consumer would otherwise request in meetings and chat threads:

- the business purpose of the shared item
- table and field definitions that matter to the use case
- refresh timing and what freshness means
- quality checks and known limitations
- allowed and prohibited uses
- owner and support route
- change and deprecation policy

This matters even more when the consumer plans to use the data in analytics or AI. A model can query a table and still misunderstand its grain, exclusions, or effective date.

The context file should be versioned and reviewed with the same change that modifies the shared schema.

## Know the current consumer path

The consumer accepts the invitation URL, reviews the producer tenant, shared content, and expiration, then selects a destination workspace.

The accepting user needs Contributor access to that workspace and must sign in with the identity named in the Share. The producer needs Read and Reshare permissions on the source item. Required preview tenant settings must also be enabled on both sides.

The resulting Mirrored OneLake Item is read-only. Consumers can query it through its SQL endpoint.

There is also an important preview boundary. Spark notebooks, semantic models, data agents, and ontologies currently require an intermediate Lakehouse and shortcuts instead of direct use of the Mirrored OneLake Item.

Document that extra hop before promising a simple consumer architecture. The share may remove the transfer pipeline while the downstream tool still needs an intermediate item.

## Test the relationship end to end

Start with a curated nonproduction item and one consumer team.

Test this sequence:

1. Enable the required preview tenant settings on both sides.
2. Confirm the producer has Read and Reshare permissions.
3. Review every current table and the policy for future additions.
4. Add business context and an expiration date.
5. Invite one named recipient.
6. Accept into the approved consumer workspace.
7. Query the shared data through the SQL endpoint.
8. Test the intermediate Lakehouse path if the consumer needs Spark, a semantic model, an agent, or an ontology.
9. Add and remove a test table, then record what the consumer sees.
10. Revoke the recipient and prove downstream access stops as expected.

The last two tests matter. They validate the lifecycle, not only the happy path.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-iq-share-contract/03-release-checks-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-iq-share-contract/03-release-checks.webp" alt="A six-check release model covers item scope, identities, context, lifecycle, consumer access, and change testing for IQ Share"></picture></figure>

## The practical takeaway

IQ Share can make cross-tenant Fabric collaboration much simpler because the producer can keep the source data in place and manage the sharing relationship directly.

The strongest implementation pattern is a curated data product with a deliberate whole-item boundary, context shipped beside the data, named lifecycle owners, and tested consumer dependencies.

Start with one partner, one nonproduction item, and one expiration date. Prove acceptance, query access, change behavior, and revocation before expanding the relationship.

That is how zero-copy sharing becomes an operating model instead of another access link nobody owns.

## Sources

- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [Share data and context across organizations with IQ Share (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Share-data-and-context-across-organizations-with-IQ-Share/ba-p/5378764)
- [IQ Share overview in Microsoft Learn](https://learn.microsoft.com/fabric/onelake/iq-share/onelake-share-overview)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
