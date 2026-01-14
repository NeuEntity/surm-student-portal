I will resolve the critical security vulnerabilities by upgrading Next.js and its related dependencies to the patched versions, specifically targeting Next.js 15.5.9+ and React 19.0.1+.

### 1. Upgrade Dependencies

I will upgrade the core framework and related packages to their secure versions:

* `next`: Upgrade to `^15.5.9` (Fixes CVE-2025-55183, CVE-2025-55184, CVE-2025-66478, CVE-2025-67779)

* `@next/swc-wasm-nodejs`: Upgrade to `^15.5.9` (Match `next` version)

* `eslint-config-next`: Upgrade to `^15.5.9` (Match `next` version)

* `react` & `react-dom`: Upgrade to `latest` (Ensure we are on a patched version > 19.0.0 to fix React-specific CVEs)

Command: `pnpm add next@^15.5.9 @next/swc-wasm-nodejs@^15.5.9 eslint-config-next@^15.5.9 react@latest react-dom@latest`

### 2. Verify Fixes

After updating the dependencies, I will:

* Run `pnpm audit` to confirm that the specific CVEs are resolved.

* Run `pnpm build` to ensure the application compiles correctly with the new versions.

* Run `pnpm lint` and `pnpm test` (validation tests) to check for any regressions.

### 3. Application Sanity Check

* Verify that the `next.config.js` configuration (specifically `experimental.serverActions`) remains compatible.

* Ensure the `railway-build.sh` script continues to function with the updated CLI.

