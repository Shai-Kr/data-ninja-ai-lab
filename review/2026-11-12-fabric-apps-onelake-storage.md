---
layout: post
title: "The OneLake Pattern That Makes Fabric Apps Stateful"
date: 2026-11-12
description: Fabric Apps Storage adds OneLake-backed files to an app. Here is a practical contract for identity, folder permissions, remote development, deployment, and safe deletion.
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

Fabric Apps can now store documents, images, and attachments in OneLake-backed storage without asking every app team to provision a separate lakehouse or storage account.

That sounds like a file-upload feature. The more useful way to see it is as an application contract across identity, permissions, deployment, and lifecycle.

The app uses the same authenticated client session for sign-in and storage calls. Every folder needs an authenticated permission rule. Development also uses remote Fabric storage, not a local emulator. Removing an applied folder can permanently delete its files.

Those details make the feature useful for real operational apps. They also tell us exactly what needs to be designed and tested before the first production upload.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-apps-onelake-storage/01-storage-path-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-apps-onelake-storage/01-storage-path.webp" alt="A four-stage flow shows a signed-in Fabric Apps user passing through folder permission and SDK operations into OneLake-backed storage"></picture></figure>

## The storage path starts with identity

Fabric Apps Storage does not create a second sign-in model. The storage SDK uses the app's existing, signed-in client session. Anonymous storage access is not supported.

That is a good boundary because file access stays aligned with the identity already using the app. It also means the acceptance test cannot stop at “the upload button worked.” The team needs to prove that the right user can perform the right operation on the right folder.

I would test at least four personas:

1. A user who owns and manages their own files
2. A user who can read shared files but cannot modify them
3. A signed-in user with no permission to the folder
4. A user attempting to access another user's object path

The folder path only organizes content. Microsoft is explicit that the permission rule controls access. A neat path such as `users/alex/reports` is not a security boundary by itself.

## Separate business records from file content

Microsoft recommends keeping structured app data in data models. Storage is for documents, images, attachments, and similar file content.

That split avoids turning object paths into a substitute for a data model. A PDF can live in app storage while its owner, review status, retention class, checksum, and business record ID live in the model.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-apps-onelake-storage/02-two-data-types-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-apps-onelake-storage/02-two-data-types.webp" alt="A comparison separates structured Fabric Apps data models from binary files held in app storage"></picture></figure>

A practical design record for each folder should include:

- purpose and owner
- allowed file types and maximum size
- who can upload, list, download, and delete
- conflict behavior when the same path is uploaded again
- the model entity that stores business metadata
- retention, backup, and deletion expectations

This gives reviewers something concrete to approve. It also prevents a generic `documents` folder from becoming an ungoverned dumping ground.

## Development is remote by design

Running `npx rayfin dev` starts the frontend locally, but file operations read and write remote files in Fabric. There is no local storage emulator, and storage is not supported with the Docker provider.

That changes the normal development assumption. A developer test can touch persistent remote content even when the user interface is running on a laptop.

Use a dedicated development app, isolated test folders, and synthetic files. Do not test against production data. Include a cleanup step in the test plan and verify that interrupted operations do not leave paths blocked.

Microsoft notes that an interrupted upload or delete can temporarily block another operation on the same path. In some cases, the path can remain blocked for about 70 minutes. A production app needs a visible retry state instead of treating that condition as a mysterious permanent failure.

## File behavior needs explicit limits

The client SDK supports upload, list, download, and delete. The useful details are in the boundaries:

- Object paths are relative to the configured folder.
- List operations are paginated and return continuation tokens.
- A list result can include a file in a `Deleting` state.
- Downloading into a browser `Blob` buffers the whole file in memory.
- Larger files should consume the returned stream incrementally.
- Uploading to an existing path follows the folder's conflict setting.

These are not implementation footnotes. They are acceptance criteria.

For example, a ten-megabyte PDF workflow can safely use a bounded browser conversion. A large export flow should stream. A list screen must handle continuation. A delete action must show an in-progress state and block an immediate conflicting upload cleanly.

## Deployment applies a storage schema

A full `npx rayfin up` deploy applies registered folders when storage is enabled. The storage-only command, `npx rayfin up storage apply`, retries a failed storage step or applies folder changes to an existing deployment.

I would treat that folder configuration like a schema migration:

- review the declaration in source control
- compare the intended change with the deployed state
- inspect deployment warnings
- test permissions after deployment
- retain evidence for destructive changes

The strongest warning is folder removal. Removing an applied folder makes it unavailable and permanently deletes its files. A non-empty folder requires `--force`, but that flag is an approval mechanism, not a backup strategy. The folder cannot be restored, and its name cannot be reused until deletion finishes.

Also, removing every declaration from the schema does not delete the deployed folders. An empty schema is not a cleanup procedure.

<figure class="review-visual"><picture><source media="(max-width: 600px)" srcset="/data-ninja-ai-lab/assets/blog/fabric-apps-onelake-storage/03-release-contract-mobile.webp"><img src="/data-ninja-ai-lab/assets/blog/fabric-apps-onelake-storage/03-release-contract.webp" alt="A five-part release checklist covers tenant access, folder rules, file limits, lifecycle, and operations for Fabric Apps Storage"></picture></figure>

## The tenant setting is broader than one app

Fabric Apps Storage requires the tenant setting **Users can access data stored in OneLake with apps external to Fabric**. Microsoft says it is enabled for the organization by default, but enabling storage in one app does not change that tenant policy.

This deserves an architecture review because the setting governs external application access to OneLake generally, not only the app being deployed. App-level folder permissions still provide the specific access boundary.

The decision record should therefore show both layers:

1. The tenant administrator approved the organization-level OneLake setting.
2. The app owner defined and tested folder-level permissions for each user pattern.

Neither layer replaces the other.

## A practical release gate

Before production, I would ask for evidence that:

- the app runs in a supported Fabric capacity, not a Power BI Pro workspace
- the OneLake tenant setting is approved
- storage and sign-in use the same configured client
- every folder has an authenticated rule
- cross-user access tests pass
- file size, type, conflict, pagination, and streaming behavior are bounded
- development uses isolated remote storage
- interrupted operations and blocked paths have a retry experience
- folder removal has a backup and approval procedure
- deployment warnings, request count, and error rate have owners

Fabric Apps Storage removes infrastructure work, which is valuable. The team still owns the application contract.

The real opportunity is not simply adding attachments to a Fabric app. It is keeping operational files close to Fabric while preserving a clear chain from user identity to folder policy, object operation, deployment evidence, and lifecycle control.

That is what makes the app stateful without making its storage behavior opaque.

## Sources

- [Store and manage files in Fabric Apps](https://learn.microsoft.com/en-us/fabric/apps/storage)
- [OneLake overview](https://learn.microsoft.com/en-us/fabric/onelake/onelake-overview)
- [OneLake tenant settings](https://learn.microsoft.com/en-us/fabric/admin/service-admin-portal-onelake)
- [Define data permissions in Fabric Apps](https://learn.microsoft.com/en-us/fabric/apps/data-permissions)
- [Microsoft Fabric documentation update for Fabric Apps Storage](https://github.com/MicrosoftDocs/fabric-docs/commit/69fdbc6c05e8a4e18e23ca8a6adc24407b1110a8)

---

**Shai Karmani**  
Data, Microsoft Fabric, Power BI, and practical AI  
[Connect with me on LinkedIn](https://www.linkedin.com/in/shai-kr)
