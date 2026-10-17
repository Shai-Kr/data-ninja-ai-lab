---
layout: post
title: "Fabric App Functions Give Data Apps the Secure Backend They Needed"
date: 2026-10-17
description: Fabric App functions add TypeScript server-side logic, application authentication, scoped resource tokens, and managed secrets directly to Fabric Apps. Here is the architecture and release contract I would use before shipping one.
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

Fabric Apps just gained the layer that turns a useful interface into a real application.

Fabric App functions are TypeScript functions that run on the server alongside a Fabric app. They can call external APIs, use protected resources, run orchestration, work with secrets, and execute logic that should never sit in browser code. The frontend calls them through a typed client, while Fabric handles the function endpoint and token flow.

That makes the feature attractive for internal data products, operational workflows, and AI-assisted apps. It also changes the review question.

The question is no longer, "Does the screen work?"

The better question is, "Can we prove which identity reaches each resource, which inputs are trusted, and what evidence exists when the call fails?"

## The architecture is simple enough to explain

The browser signs the user into the Fabric app and invokes a named function. The function runs on the server. When it calls a supported Fabric or Azure resource through `ctx.Tokens`, the downstream service sees the app identity, not the person using the screen.

Rayfin database access follows a different path. `ctx.getDataClient()` preserves the caller's identity and database permissions. That distinction is useful, but it has to be explicit in the design.

<figure class="review-visual"><img src="/data-ninja-ai-lab/assets/blog/fabric-app-functions-secure-backend/01-two-identity-paths.svg" alt="Two identity paths in Fabric App functions: app identity for external resources and caller identity for Rayfin database access"></figure>

This gives a team two clean authorization models:

- **Application identity for external resources.** Use this when the app should have a narrow, stable permission set against Fabric REST APIs, SQL, Storage, Azure AI Foundry, or Azure DevOps.
- **Caller identity for app data.** Use this when the database must enforce the signed-in user's permissions and row-level access.

Mixing those models without documenting the boundary is where trouble starts. A developer can access a resource locally, the deployment can succeed, and the live function can still fail because the deployed app identity has not been granted access. The reverse problem is worse: the app identity might have broader permissions than the function actually needs.

## Treat every function as a small service contract

The typed client removes a lot of endpoint plumbing. It does not remove the need for a contract.

For each function, I would record six things:

1. **Business action.** What single outcome does the function own?
2. **Input contract.** Which fields arrive from the browser, and which validations run again on the server?
3. **Identity path.** Does the call use the app identity, the caller identity, or both at different steps?
4. **Resource audience.** Which `AudienceType` values are declared, and which exact permissions were granted downstream?
5. **Failure behavior.** What happens on timeout, throttling, missing token, invalid input, or a partial downstream write?
6. **Operational evidence.** Which correlation ID, result, duration, and safe error details are retained?

<figure class="review-visual"><img src="/data-ninja-ai-lab/assets/blog/fabric-app-functions-secure-backend/02-function-contract.svg" alt="Six-part production contract for a Fabric App function"></figure>

This is not ceremony. It keeps server-side convenience from becoming an invisible integration layer.

Consider an app that reviews Azure DevOps pull requests with an Azure AI Foundry agent. The browser should never receive the Azure DevOps credential or the model secret. The function can call both services with the app identity, validate the requested repository and pull request, constrain what the prompt can contain, and return only the review result the UI needs.

The contract makes the trust boundary visible. It also gives the support team somewhere to start when one dependency works and the other does not.

## Secrets belong behind the function, but that is only step one

Fabric App functions include managed secret support. A secret can be set through the Rayfin CLI and retrieved inside the function with `ctx.getSecret()`.

That is much better than putting an API key in React configuration or returning it to the browser. The operational model still needs a few decisions:

- who can create and rotate the secret
- which environment owns each value
- what happens when a secret is missing
- how rotation is tested without exposing the value
- which response fields are safe to log

A secret store protects the value. It does not define the lifecycle.

The same rule applies to platform-provided tokens. Declaring an audience registers the binding, but it does not grant the app identity access to the resource. Permission assignment remains a separate deployment responsibility.

## Local success does not prove deployed access

The local development experience is deliberately convenient. The developer signs in through the CLI, runs the local function host, and can test the app and functions together.

That is good for development. It creates a predictable acceptance risk because authoring-time access and runtime access are not the same thing.

Before release, I would run a small evidence loop in the deployed environment:

1. invoke the function as an allowed user
2. prove the expected app identity reaches each external resource
3. prove the caller identity still governs Rayfin database access
4. test one denied resource and one denied data row
5. rotate or remove a test secret and verify the failure is safe
6. force a dependency timeout and verify the UI response and invocation record
7. confirm that logs contain correlation data, not secrets or full sensitive payloads

<figure class="review-visual"><img src="/data-ninja-ai-lab/assets/blog/fabric-app-functions-secure-backend/03-release-evidence-loop.svg" alt="Release evidence loop for Fabric App functions from local development to deployed identity and failure tests"></figure>

This matters because the current preview has real runtime limits. Microsoft documents a 240-second execution timeout, a 30 MB deployment package limit, a two-minute publishing cooldown, and 30-day invocation-log retention by default. Those are design inputs, not footnotes.

A long AI workflow may need to return a job reference instead of keeping one function call open. A support process may need to export selected operational evidence before the default log window closes. A large dependency bundle may need pruning before the deployment becomes fragile.

## A useful first app is narrow

The easiest way to misuse server-side functions is to turn one function into the backend for everything.

I would start with one bounded action where the security benefit is obvious:

- retrieve a protected operational status from an internal API
- submit a governed approval request
- run a controlled calculation against a Fabric SQL database
- call an AI agent with a constrained prompt and approved data
- create a work item in Azure DevOps after server-side validation

Keep the first function small enough that the team can explain its inputs, identity, permissions, side effects, and failure path on one page.

Then test it as an application boundary, not only as TypeScript code.

## The practical takeaway

Fabric App functions make Fabric Apps more credible as operational data products. Teams can keep secrets out of the browser, put business logic behind a typed server boundary, call downstream services with an application identity, and preserve caller-level controls for app data.

The strongest implementation pattern is straightforward:

> Give each function one business outcome, one explicit identity map, the smallest resource permissions it needs, and a deployed acceptance test that covers success and denial.

That is enough structure to move from a polished demo to an app a platform team can operate.

## Sources

- [Fabric App functions to use secure server-side custom logic (Preview)](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Fabric-App-functions-to-use-secure-server-side-custom-logic/ba-p/5368691)
- [Use Functions in Fabric Apps](https://learn.microsoft.com/en-us/fabric/apps/functions)
- [Connect Functions to external resources](https://learn.microsoft.com/en-us/fabric/apps/functions-connect-external-resources)
- [Manage function secrets](https://learn.microsoft.com/en-us/fabric/apps/manage-function-secrets)

---

Written by **[Shai Karmani](https://www.linkedin.com/in/shai-kr)**.  
If you work on Microsoft Fabric, Power BI, data engineering, or practical AI systems, feel free to [connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr).
