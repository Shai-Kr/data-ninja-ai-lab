---
layout: post
title: "The Rayfin Release Pattern That Makes Fabric Apps Easier to Ship"
date: 2026-11-15
description: Rayfin can move a Fabric App from local code to a live URL with one command. Here is a practical release contract for making that deployment repeatable and testable.
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

Rayfin gives Fabric Apps a development and deployment workflow that feels familiar to software teams.

The CLI can scaffold a project, run local infrastructure, deploy to Microsoft Fabric, apply a database schema, publish static content, and report the resulting hosting URL. The headline command is simple:

```bash
npx rayfin up
```

The more useful story is the release model around it. A Fabric App can contain runtime settings, data, authentication, Functions, and a static frontend. Shipping all of that with one command is convenient. Shipping it repeatedly, to the intended workspace, with evidence that the application works, needs a small contract.

The October 2026 Fabric Influencers Spotlight called out the first community guidance on building with the Rayfin CLI. That is a good signal to move past the demo command and define the path a production team can actually operate.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/rayfin-fabric-app-release/01-release-path-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/rayfin-fabric-app-release/01-release-path.webp" alt="A five-stage Rayfin release path covers project setup, local development, dry-run planning, deployment, and verification"></picture></figure>

## Start with a local loop that declares the application

A new Rayfin project starts with a template:

```bash
npm create @microsoft/rayfin@latest my-app
cd my-app
```

An existing project can add the CLI as a development dependency and initialize the `rayfin/` directory:

```bash
npm install --save-dev @microsoft/rayfin-cli
npx rayfin init
```

The configuration under `rayfin/` is the important part. It describes the services the application expects instead of leaving the deployment shape inside a sequence of manual portal steps.

For the normal development loop, Rayfin documents `npx rayfin dev`. It provisions or reuses the Fabric backend, applies runtime settings and database schema, generates framework environment variables, and starts the frontend and enabled Functions locally.

That local loop should answer three questions before a team thinks about deployment:

1. Which services are enabled in `rayfin.yml`?
2. Which database changes are part of this release?
3. Which environment values are generated, and which values must come from an approved secret store?

The CLI can apply declared state. The repository still needs to make that state reviewable.

## Preview the target before changing it

Rayfin supports a dry run:

```bash
npx rayfin up --dry-run --workspace-id <workspace-guid>
```

The dry run validates deterministic local static-hosting inputs, authenticates, and resolves the target workspace through read-only Fabric requests. It does not build the app, provision an item, apply settings or schemas, or update deployment files.

That limitation is useful. A passing dry run is a deployment plan, not proof that the release will succeed.

I would keep its output as release evidence and check:

- the resolved workspace name and ID
- the intended item name
- whether static hosting is enabled
- whether the expected frontend path and build inputs exist
- which deployment identity performed the check

For CI, use explicit workspace targeting and structured output. Avoid a pipeline that depends on an interactive workspace picker.

```bash
npx rayfin up \
  --item-name operations-control-app \
  --workspace-id <workspace-guid> \
  --output json
```

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/rayfin-fabric-app-release/02-deployment-contract-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/rayfin-fabric-app-release/02-deployment-contract.webp" alt="Five deployment contract decisions cover identity, target, declared state, schema safety, and release evidence"></picture></figure>

## Give the deployment identity a name

Interactive development can use Microsoft Entra sign-in:

```bash
npx rayfin login
npx rayfin login status
```

Rayfin also supports service principal authentication for non-interactive environments. That is the better CI boundary because the release no longer depends on the person who happened to run the command.

```bash
npx rayfin login --service-principal \
  --client-id <client-id> \
  --client-secret *** \
  --tenant <tenant-id>
```

The design question is not only whether authentication succeeds. Record which identity may deploy to each environment, which Fabric workspace it can access, and who owns the credential lifecycle.

The deployment target deserves the same discipline. Rayfin records the Fabric item, workspace, tenant, hosting URL, and deployment metadata in `rayfin/.deployments.json`. Treat that file as environment state. Review how it is stored, ignored, or persisted in your delivery workflow before multiple developers and pipelines start switching targets.

## Treat schema changes as a separate safety decision

`rayfin up` can apply the database schema generated from TypeScript data model decorators. Rayfin also provides a targeted schema command:

```bash
npx rayfin up db apply
```

Potentially destructive operations produce a warning and stop. The `--force` option overrides that safety check.

```bash
npx rayfin up db apply --force
```

That flag belongs behind an explicit release decision. Before using it, capture the proposed operation, the affected data, the recovery path, and the person who accepted the risk. Do not turn `--force` into a default pipeline argument because one deployment needed it once.

The same principle applies to partial updates. Rayfin can deploy static content independently and can skip static hosting in selected automation flows. Those commands are useful when the team knows exactly which layer changed. They should not become a way to hide drift between runtime settings, schema, Functions, and the frontend.

## Separate management health from application health

After deployment, Rayfin can return machine-readable status:

```bash
npx rayfin up status --json
```

The status command checks authenticated management access to the deployed Fabric item and retrieves deployment metadata. The documentation is explicit that it does not verify every application route or Function.

That distinction should shape the acceptance test.

A release is not complete because the CLI can reach the management endpoint. Test at least one real path through the application:

- open the hosting URL with the intended user identity
- confirm the Fabric brokered authentication flow
- read one expected record through the deployed data path
- execute one enabled Function when the app uses Functions
- verify one authorization boundary with a restricted user

The exact tests depend on the app. The important part is that they exercise user behavior, not only deployment metadata.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/rayfin-fabric-app-release/03-release-gates-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/rayfin-fabric-app-release/03-release-gates.webp" alt="Five release gates check the plan, deployment identity, schema safety, deployment record, and application behavior"></picture></figure>

## The five-gate release record

I would keep the release record small:

| Gate | Evidence |
| --- | --- |
| Plan | Dry-run output with the resolved workspace and intended item |
| Identity | Named interactive user or service principal approved for the environment |
| Schema | Reviewed changes and an explicit decision for any destructive operation |
| Deployment | Item ID, deployment ID, workspace ID, and hosting URL |
| Application | Results from user-route, authentication, data, and Function checks |

This is enough to answer the questions that appear during an incident: what changed, where it went, who deployed it, which schema decision was made, and what actually passed.

Rayfin removes a lot of application deployment plumbing from Fabric. That is exactly why the operating contract can stay simple. The CLI handles the mechanics. The team defines the target, safety rules, and proof.

One command gets the application deployed. Five small gates make the release repeatable.

## Sources

- [Fabric Influencers Spotlight: October 2026](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/Fabric-Influencers-Spotlight-October-2026/ba-p/5420043)
- [Rayfin CLI installation](https://microsoft.github.io/rayfin/docs/guide/cli/installation/)
- [Rayfin CLI quickstart](https://microsoft.github.io/rayfin/docs/guide/cli/quickstart/)
- [Deploy to Microsoft Fabric with Rayfin](https://microsoft.github.io/rayfin/docs/guide/app-backend/deploy/)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
