---
layout: post
title: "The Fabric Warehouse Deployment Pattern That Finally Brings SQL Security Into CI/CD"
description: "A practical guide to Fabric Data Warehouse pre-deployment and post-deployment scripts, including idempotence, SQL security, Git, deployment pipelines, and release evidence."
date: 2026-09-22
author: Shai Karmani
author_url: https://www.linkedin.com/in/shai-kr
sitemap: false
---

**Review draft. Direct link only. Not listed on the blog.**

A database project is excellent at describing schema. It is less useful for everything that has to happen around that schema.

Reference rows still need to exist. SQL roles and permissions still need to be applied. An environment may need initialization. A cross-warehouse object may need to be moved out of the way before a full schema diff and recreated afterward.

Microsoft has now documented pre-deployment and post-deployment scripts for Fabric Data Warehouse in preview. The scripts are shared SQL queries, their designations are stored with the warehouse project, and they can travel through Git integration and Fabric deployment pipelines.

That closes a practical lifecycle gap.

The feature is small on the surface. The useful part is the operating pattern it enables: **schema, operational SQL, and release evidence can move together without pretending they are the same thing.**

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-warehouse-deployment-scripts/01-deployment-sequence-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-warehouse-deployment-scripts/01-deployment-sequence.svg' | relative_url }}" alt="Fabric Warehouse deployment sequence with pre-deployment script, schema diff, and post-deployment script.">
</picture>

## What the preview actually adds

A Fabric Warehouse can designate one shared query as its pre-deployment script and one as its post-deployment script.

The order is deterministic:

1. The pre-deployment script runs.
2. Fabric applies the schema deployment plan.
3. The post-deployment script runs.

The project records those designations with `PreDeploy` and `PostDeploy` entries in the `.sqlproj` file. Microsoft documents the configuration as warehouse-level metadata that can round-trip through Git and run as a warehouse moves through deployment pipeline stages.

That matters because it replaces a fragile checklist item with versioned deployment behavior.

The old pattern often looked like this:

- deploy the schema;
- remember which permissions were not included;
- find the separate script;
- edit values for the target environment;
- run it manually;
- hope the next person knows the same sequence.

The new pattern can be reviewed as one change set. It still needs controls, but the deployment intent is visible.

## The strongest use case is SQL security

Fabric Warehouse SQL projects describe schema objects, but SQL security such as roles, users, and `GRANT` or `DENY` permissions is not captured as ordinary schema content in the project.

A post-deployment script gives that work a repeatable place.

For example, the script can create a role only when it does not exist and then grant the expected schema permission:

```sql
IF NOT EXISTS (
    SELECT 1
    FROM sys.database_principals
    WHERE name = N'DataReaders'
)
BEGIN
    CREATE ROLE DataReaders;
END;
GO

GRANT SELECT ON SCHEMA::dbo TO DataReaders;
GO
```

The important detail is not the syntax. It is repeat execution.

A post-deployment script runs on every deployment. If the script assumes a clean database, inserts duplicate reference rows, or fails when a role already exists, it will turn routine promotion into incident work.

Idempotence is the entry requirement.

## Keep the ownership boundary clear

Deployment scripts should extend the schema deployment, not become a parallel model of the warehouse.

I would divide responsibilities this way:

| Concern | Best owner |
| --- | --- |
| Tables, views, procedures, and functions | SQL database project |
| Reference or configuration rows | Post-deployment script |
| SQL roles and grants not represented in the project | Post-deployment script |
| Temporary cleanup required before a schema change | Pre-deployment script |
| Environment-specific secrets | Secure pipeline or connection configuration |
| Approval to promote | Deployment process |
| Health checks after release | Validation step with retained evidence |

This boundary matters because scripts are easy to grow.

Once a team has a post-deployment file, every awkward requirement can look like another block of SQL. That creates a second deployment system hidden inside one file.

Keep each script narrow. Give it an owner. Document why the work does not belong in the schema project or pipeline control layer.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-warehouse-deployment-scripts/02-ownership-boundary-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-warehouse-deployment-scripts/02-ownership-boundary.svg' | relative_url }}" alt="Ownership model separating SQL project schema, deployment scripts, and deployment pipeline controls.">
</picture>

## One file makes discipline more important

The preview supports at most one pre-deployment file and one post-deployment file.

Microsoft also states that composing the script from multiple files with the SQLCMD `:r` command is not supported. Multiple `PreDeploy` or `PostDeploy` entries can cause the Git update to fail.

That creates a useful design constraint.

Do not solve it by building one unstructured 2,000-line script. Use clear sections, stable naming, and small stored procedures when supported and appropriate. Keep environment differences in variables or governed configuration rather than copying the file per stage.

A script should be readable in a pull request. A reviewer should be able to answer:

- what state does it expect;
- what changes does it make;
- can it run twice;
- what happens after partial failure;
- how does it behave in development, test, and production;
- what evidence proves it worked.

If those answers are not obvious, the script is not ready to travel with the project.

## Cross-warehouse work needs extra care

Microsoft also documents a use case for cross-warehouse dependencies.

Fabric Warehouse deployments are full schema-diff operations. When two warehouses contain objects that depend on one another, a pre-deployment script can temporarily remove a bridge view before a breaking schema change. A post-deployment script can recreate it after the dependent warehouses are ready.

This can break a dependency cycle, but it is not permission to create hidden deployment ordering.

Make the sequence explicit:

1. Identify the owning project.
2. Record the remote warehouse dependency.
3. Remove only the object that blocks the change.
4. Deploy both required schema states in the intended order.
5. Recreate the bridge object.
6. Query a known result from both sides.

A successful script is not enough. The final cross-warehouse result must be tested.

## A six-gate release checklist

I would apply six gates before letting either script run in production.

### 1. Scope

The script has one documented purpose and one owner. Each block maps to a release requirement.

### 2. Idempotence

Run the same deployment twice in development. The second run should not create duplicate rows, fail on existing principals, or produce a different final state.

### 3. Safety

Generate and review the deployment SQL. Keep `BlockOnPossibleDataLoss` enabled for production. Treat cleanup and drop logic as high-risk changes.

### 4. Environment handling

Do not embed secrets, personal accounts, or fixed production identifiers. Use controlled variables and environment configuration.

### 5. Validation

Add known-result checks after deployment. Verify expected roles, permissions, reference rows, and dependent objects. Retain the output with the release record.

### 6. Recovery

Define what happens if the pre script succeeds and the schema deployment fails, or if the schema succeeds and the post script fails. Document the safe rerun and rollback path.

<picture>
  <source media="(max-width: 600px)" srcset="{{ '/assets/blog/fabric-warehouse-deployment-scripts/03-release-gates-mobile.svg' | relative_url }}">
  <img src="{{ '/assets/blog/fabric-warehouse-deployment-scripts/03-release-gates.svg' | relative_url }}" alt="Six release gates for Fabric Warehouse deployment scripts: scope, idempotence, safety, environment, validation, and recovery.">
</picture>

## How I would adopt it

Start with one warehouse and one missing lifecycle concern.

SQL security is a good candidate because the ownership gap is clear and the validation is concrete. Build an inventory of current roles and grants. Create an idempotent post-deployment script. Commit it with the warehouse project. Promote it through development and test. Run the deployment twice. Compare the effective permissions with the approved access model.

Only then add another use case.

This matters because the feature is still in preview. Preview is the right time to prove the operating pattern, document limits, and find where your environment behaves differently. It is not the right time to push a large estate through an untested script because the portal now exposes two new fields.

The useful shift is bigger than pre and post hooks.

Fabric Warehouse teams can now keep more of the real deployment contract next to the warehouse project: the schema change, the SQL work around it, the review history, and the validation evidence.

That is a credible CI/CD story for a data warehouse.

## Sources

- [Pre-deployment and post-deployment scripts for Fabric Data Warehouse (Preview)](https://learn.microsoft.com/en-us/fabric/data-warehouse/deployment-scripts)
- [Develop Warehouse Projects in Visual Studio Code](https://learn.microsoft.com/en-us/fabric/data-warehouse/develop-warehouse-project)
- [Develop and deploy cross-warehouse dependencies](https://learn.microsoft.com/en-us/fabric/data-warehouse/cross-warehouse-development-database-projects)
- [MicrosoftDocs change that added the deployment scripts guidance](https://github.com/MicrosoftDocs/fabric-docs/commit/a9045dda3c0e081681854789a47c123881aabab6)
- [Fabric Updates Blog](https://community.fabric.microsoft.com/t5/Fabric-Updates-Blogs/bg-p/fbc_fabricupdatesblogs)
- [Power BI Updates Blog](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/bg-p/fbc_pbiupdatesblog)

---

**Shai Karmani**<br>
Microsoft Data and AI practitioner<br>
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
