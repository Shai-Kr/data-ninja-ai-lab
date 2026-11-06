---
layout: post
title: "Make Fabric Warehouse Smarter With Batched Python Functions"
date: 2026-11-06
description: Fabric Data Warehouse can call published User Data Functions from T-SQL and batch multiple calls per request. Here is a practical production pattern.
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

Fabric User Data Functions create a useful bridge between reusable Python logic and the workloads that need it.

The latest documentation makes that bridge more practical for Fabric Data Warehouse. You can generate the T-SQL needed to create an external proxy function, call the published Python function from a warehouse query, and enable batch mode so multiple calls travel in one request.

The documented starting point is `max_batch_size=900`. Microsoft also says to reduce it when inputs are large, such as long text values, so the request stays within supported payload limits.

This is more than a syntax improvement. It gives teams a cleaner place for specialized logic that is awkward in T-SQL, while keeping the warehouse query readable.

It also creates a new execution boundary. That boundary needs an owner, a tested workload range, and a failure contract.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-udf-warehouse-batch/01-query-path-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-udf-warehouse-batch/01-query-path.webp" alt="A four-stage flow shows a Fabric Warehouse query invoking an external proxy function, running batched Python logic, and returning a result"></picture></figure>

## What changed

Fabric can generate T-SQL invocation code for a published User Data Function. The generated statement creates or alters an external function in the warehouse that points to the published function item.

The warehouse query then calls that proxy like another SQL function:

```sql
SELECT
    CustomerId,
    dbo.score_customer(CustomerText) AS CustomerScore
FROM dbo.CustomerInput;
```

The exact generated code and function signature depend on the published function. Creating the external function also requires the relevant warehouse permission.

Batch mode is enabled in the Python function decorator:

```python
@udf.function(max_batch_size=900)
def score_customer(customerText: str) -> str:
    return classify(customerText)
```

Batch mode does not change how the function behaves for a single value. It changes how Fabric Data Warehouse can group calls when the function is applied to many rows.

That distinction matters. The warehouse remains the query surface. The published User Data Function remains the execution unit for the Python logic.

## Use Python where it earns the boundary

Do not move ordinary filtering, joins, grouping, or simple string cleanup out of SQL just because a Python function is available.

A User Data Function is a stronger fit when the logic needs one or more of these:

- a Python library that is not available in T-SQL
- a reusable classification or transformation shared by several Fabric workloads
- structured logic that would become difficult to review as nested SQL expressions
- one published implementation that external applications or agents may also call

Keep set-based work in the warehouse. Use the function for the specialized part.

That makes the architecture easier to explain: SQL selects the workload, the proxy defines the contract, and Python performs the bounded operation.

## Treat batch size as a tested ceiling

`900` is a documented recommendation, not proof that every workload should use it unchanged.

The safe batch size depends on the payload, not only the number of rows. Nine hundred short codes are different from nine hundred long text documents. Complex inputs, library behavior, and response size also affect the request.

Start with the documented value, then test:

1. representative input lengths, including the upper range
2. small, medium, and expected peak row counts
3. warm and cold execution behavior
4. invalid values and nulls
5. timeout and partial-failure behavior

If large inputs push the payload or latency outside the accepted range, lower `max_batch_size` and test again.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-udf-warehouse-batch/02-batch-contract-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-udf-warehouse-batch/02-batch-contract.webp" alt="Four cards show how input size, batch boundary, measured query behavior, and an acceptance range form a batch contract"></picture></figure>

## Define the function contract before the query

The proxy function should not hide ambiguity.

Write down:

- accepted SQL and Python input types
- null and empty-string behavior
- output type and business meaning
- behavior for values that cannot be classified or transformed
- function and library versions used by production
- expected latency for the accepted workload range
- owner of the function and owner of the consuming query

A useful function returns an explicit fallback or a review status for bad input. It should not silently turn an execution problem into a plausible business value.

Version changes deserve the same care as a semantic model or stored procedure change. A published function can keep the same name while its behavior changes. The release record should connect the query test to the function version that produced the accepted result.

## Plan for failure at the row and request levels

Batching reduces request overhead, but it also groups work. That changes how failures need to be investigated.

Test at least these paths:

- one malformed value in an otherwise valid set
- a payload that is too large
- a function timeout
- a missing library or incompatible library version
- a permission failure while creating or invoking the external function
- a function update that changes the returned value or type

Decide whether the query should fail, return a defined fallback, or route records to a review table. The right answer depends on the business use case. A customer-risk score and a descriptive label should not share the same failure policy.

Keep enough evidence to reproduce the run: query text or version, warehouse object, function item and version, batch setting, input profile, duration, and result counts.

## A practical first release

Choose a deterministic function with a small output type. A category standardizer or code parser is easier to validate than a probabilistic scoring model.

Build the release in this order:

1. Implement and test the function in the User Data Functions item.
2. Enable batch mode with a documented starting value.
3. Publish the function and generate the Fabric Data Warehouse T-SQL.
4. Create the proxy with a least-privilege deployment identity.
5. Run representative data through SQL and compare the output with expected results.
6. Test payload, timeout, null, and bad-record paths.
7. Record the accepted volume range and recovery owner.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-udf-warehouse-batch/03-release-checklist-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-udf-warehouse-batch/03-release-checklist.webp" alt="A six-step release checklist covers purpose, contract, permission, batch testing, failure behavior, and evidence"></picture></figure>

## The practical takeaway

Generated T-SQL and batch mode make Fabric User Data Functions a more credible extension point for warehouse workloads.

The useful pattern is narrow: keep set-based processing in SQL, place specialized reusable logic in a published function, call it through an explicit proxy, and test the batch boundary with real data.

Start with one deterministic function and one measured query. Once the result, latency, and failure paths are reproducible, the same contract can support more complex logic.

## Sources

- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)
- [Create a Fabric User Data Functions item](https://learn.microsoft.com/en-us/fabric/data-engineering/user-data-functions/create-user-data-functions-portal)
- [Generate invocation code for User Data Functions](https://learn.microsoft.com/en-us/fabric/data-engineering/user-data-functions/generate-invocation-code)
- [Use User Data Functions in Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/fabric-user-data-functions)
- [Documentation update: batch mode support](https://github.com/MicrosoftDocs/fabric-docs/commit/01be15fa4485e4d93a563228a0ead05cbe1eb16f)
- [Documentation update: T-SQL invocation code](https://github.com/MicrosoftDocs/fabric-docs/commit/2b6e27a7fab898d6d689598bb1d517745fc48f86)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.

If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
