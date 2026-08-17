---
name: Npm lockfile regeneration
description: Package-firewall behavior to account for when refreshing npm manifests and lockfiles.
---

When the lockfile has already been refreshed by npm audit, a later lockfile-only install can fail on an optional platform package that the Replit package firewall does not serve. In that case, keep the successful audited dependency resolution, update only manifest range metadata when needed, and verify the lockfile and audit report directly.

**Why:** A failed follow-up install does not mean the prior security update failed, and retrying can make a clean lockfile harder to reproduce in this environment.

**How to apply:** After dependency remediation, check the installed package tree, parse lockfile package versions, and run `npm audit`; only regenerate again if the lockfile is actually stale.