---
layout: post
title: "Fabric Warehouse Can Now Call Python. Here Is the Production Pattern I Would Use"
date: 2026-10-19
description: Fabric Data Warehouse can now invoke Fabric User Data Functions from T-SQL. This practical pattern keeps Python useful, bounded, testable, and observable.
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

Fabric Data Warehouse can now call published Fabric User Data Functions from T-SQL.

That gives warehouse developers a clean way to use Python for work that is awkward in SQL: specialized parsing, validation, encryption, external API calls, geocoding, model scoring, and access to other Fabric or Azure services.

The syntax is simple. The architecture decision is not.

Once a `SELECT`, `INSERT`, or `UPDATE` can invoke remote Python code, the function becomes part of the warehouse execution path. Its latency, permissions, version, limits, and side effects now matter to every query that calls it.

I would treat this as a controlled extension layer, not a shortcut around pipelines or application design.

## What Microsoft added

The preview uses two objects:

1. A published Python function in a Fabric User Data Functions item.
2. A T-SQL proxy function in the warehouse, created with `AS EXTERNAL FUNCTION`.

The warehouse proxy can infer parameters and the return type from the published Python function. You can also declare a more precise SQL return type. That is useful when Python returns a string but the warehouse contract should expose `VARCHAR(100)` instead of `VARCHAR(MAX)`.

```python
import ipaddress
import fabric.functions as fn

udf = fn.UserDataFunctions()

@udf.function()
def getIpv6Network(address: str, prefixLength: int) -> str:
    interface = ipaddress.ip_interface(f"{address}/{prefixLength}")
    return str(interface.network)
```

```sql
CREATE OR ALTER FUNCTION ipv6.get_network
RETURNS VARCHAR(64)
AS EXTERNAL FUNCTION utilities.getIpv6Network;

UPDATE dbo.NetworkEvents
SET NetworkPrefix = ipv6.get_network(SourceIp, 48)
WHERE NetworkPrefix IS NULL;
```

The T-SQL stays familiar. Fabric delegates the function execution to the User Data Functions runtime and returns the result to the warehouse query.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-python-extension-layer/01-execution-contract-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-python-extension-layer/01-execution-contract.svg" alt="Execution contract for calling a published Fabric User Data Function from a Fabric Data Warehouse T-SQL proxy function"></picture></figure>

## Put a narrow contract at the boundary

The proxy function should expose a small, typed business capability. It should not expose a general Python utility box.

Good names describe the outcome:

- `security.get_ipv6_network`
- `finance.validate_iban`
- `privacy.mask_customer_token`
- `geo.normalize_postal_code`

The schema can communicate ownership or purpose. The function name can communicate the result. The parameter and return types can communicate the contract.

Keep four rules at this boundary:

**Use deterministic inputs.** The same input should normally produce the same output. If a function depends on current time, an external service, or mutable configuration, make that dependency explicit.

**Return bounded types.** Declare a useful SQL type and length when the result has a known shape. This improves metadata and makes downstream expectations visible.

**Handle expected failures.** The User Data Functions SDK supports `UserThrownError` for business validation failures. Return a specific, actionable error instead of a generic Python exception when an input fails a known rule.

**Version the contract.** The proxy depends on the published item and Python function name. Renaming or deleting the Python function breaks that dependency. Treat the SQL proxy, Python implementation, tests, and deployment notes as one release unit.

## Choose the right workload shape

This integration is strongest when Python adds a capability that SQL does not express cleanly and the call remains bounded.

Examples include parsing an IPv6 address, validating a tax identifier, calling a controlled reference API, using a specialized package, or scoring a limited set of records.

It is less attractive when every row in a large table triggers expensive remote work, when the function has uncontrolled side effects, or when a pipeline could materialize the same result once and let many reports reuse it.

Fabric can batch as many as 900 function calls in one request when batch mode is enabled on the User Data Function and the query pattern supports it. That reduces network overhead. It does not turn an external call into a local SQL expression.

Use the workload shape to choose the execution pattern:

- **Interactive lookup:** small input, fast result, no uncontrolled side effect
- **Bounded write:** validate or enrich a known batch, then persist the result
- **Batch materialization:** process a large set outside the reader's query path and store the output
- **Application workflow:** use an app, event, or pipeline when retries, orchestration, and side effects are the main job

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-python-extension-layer/02-workload-fit-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-python-extension-layer/02-workload-fit.svg" alt="Decision model for choosing interactive, bounded write, batch materialization, or application workflow patterns for Fabric Warehouse Python functions"></picture></figure>

## Make identity and secrets visible in the design

A function that reads another Fabric item, calls an API, or retrieves a secret crosses a security boundary.

Document the execution identity for each dependency. The User Data Functions context can expose the verified object ID, tenant ID, preferred username, and invocation ID for the caller. Connections can also be configured for resources such as Fabric items, Azure services, variable libraries, and Azure Key Vault.

Before production use, answer these questions:

- Which identity invokes the function?
- Which identity reaches each downstream resource?
- Which workspace and tenant boundaries apply?
- Where are secrets or environment values stored?
- Can the function write data or only read it?
- What evidence appears in logs for one invocation?

Do not put a key in Python code because the call started in T-SQL. Use the supported connection, variable library, or Key Vault path and grant only the access the function needs.

For side-effecting functions such as sending a message or calling an external API, design for retries and duplicate execution. A query can be rerun. A client can disconnect. A partial operation can be retried. If duplicate delivery matters, use an idempotency key or move the side effect into a workflow that owns delivery state.

## Design for the documented limits

The current User Data Functions service limits include:

- 4 MB maximum combined request parameters
- 240 seconds maximum function execution time
- 100 seconds for public endpoint invocation
- 30 MB maximum response value
- 30 days of invocation log retention by default
- Python 3.11 for published run capability and Python 3.12 for test capability

These limits are generous for a focused function. They are also a clear signal that this is a remote service boundary.

I would define a smaller operating budget for each production function. For example: expected p95 latency, maximum input length, maximum output length, downstream timeout, retry behavior, and an acceptable failure rate.

The platform limit is where execution stops. The operating budget is where the team starts investigating.

## Build an acceptance harness before using it in a query path

Test the Python function and the warehouse proxy together.

I would use a small table of known-answer cases that covers:

1. normal values
2. boundary values
3. null or missing input
4. malformed input
5. duplicate invocation
6. downstream timeout or unavailable dependency
7. authorization failure
8. deployment mismatch between the SQL proxy and published Python function

For each case, record the expected SQL value or expected handled error. Then run the same suite after a Python package change, connection change, function publication, or warehouse deployment.

Also capture the invocation ID in operational logs where possible. It gives support teams a correlation point between the warehouse call and the User Data Functions runtime.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-warehouse-python-extension-layer/03-release-gates-mobile.svg"><img src="/data-ninja-ai-lab/assets/blog/fabric-warehouse-python-extension-layer/03-release-gates.svg" alt="Six production release gates for Fabric Warehouse external functions covering contract, identity, workload, limits, testing, and observability"></picture></figure>

## The pattern I would ship

For a warehouse enrichment use case, I would use this sequence:

1. Create a narrow Python function with typed parameters and a typed return value.
2. Add supported connections for secrets and downstream resources.
3. Publish the User Data Functions item with a versioned release note.
4. Create a clearly named T-SQL proxy with an explicit return type.
5. Run known-answer and failure tests through the warehouse.
6. Apply the function to a bounded set and persist the result when reuse matters.
7. Monitor latency, errors, dependency failures, and invocation IDs.
8. Keep a rollback script for the SQL proxy and the previous published function version.

This keeps Python available where it adds real value without making every warehouse query depend on hidden remote behavior.

## The practical takeaway

Fabric Data Warehouse can now use Python without forcing the warehouse developer to build a separate application for every specialized operation.

That is useful. The production pattern is to make the remote boundary explicit: a narrow typed contract, a known identity, bounded execution, an acceptance harness, and observable failures.

Used that way, User Data Functions become a focused extension layer for the warehouse. SQL remains the analytical contract. Python handles the capability that actually needs Python.

## Sources

- [Fabric Data Warehouse integration with Fabric User Data Functions (Preview)](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/Fabric-Data-Warehouse-integration-with-Fabric-User-Data/ba-p/5375137)
- [Use User Data Functions in Fabric Data Warehouse (Preview)](https://learn.microsoft.com/en-us/fabric/data-warehouse/fabric-user-data-functions)
- [Fabric User Data Functions programming model](https://learn.microsoft.com/en-us/fabric/data-engineering/user-data-functions/python-programming-model)
- [Service details and limitations of Fabric User Data Functions](https://learn.microsoft.com/en-us/fabric/data-engineering/user-data-functions/user-data-functions-service-limits)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.  
If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
