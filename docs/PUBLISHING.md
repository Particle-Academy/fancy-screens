# Publishing fancy-screens

## How releases ship

Tag push `vX.Y.Z` → GitHub Actions runs `.github/workflows/publish.yml` → npm publish with provenance.

```bash
# from packages/fancy-screens
git tag vX.Y.Z
git push origin vX.Y.Z

# verify
npm view @particle-academy/fancy-screens version
```

## One-time setup (already done for 0.1.0)

The package was bootstrapped with a token-based publish because npm Trusted Publisher can't be configured for a package that doesn't exist yet. The 0.1.0 publish succeeded, so the package now exists, and we should switch the workflow to OIDC.

### Switching to OIDC (do this once)

1. Go to https://www.npmjs.com/package/@particle-academy/fancy-screens/access
2. Click **Trusted Publishers** → **Add Trusted Publisher**.
3. Fill:
   - Publisher: `GitHub Actions`
   - Organization or user: `Particle-Academy`
   - Repository: `fancy-screens`
   - Workflow filename: `publish.yml`
   - Environment: *(empty)*
4. Save.
5. Revoke the bootstrap token at https://www.npmjs.com/settings/<your-user>/tokens (the `fancy-screens-bootstrap` one).
6. Edit `.github/workflows/publish.yml`: remove the `env: NODE_AUTH_TOKEN: …` block from the publish step. The `id-token: write` permission and `registry-url` already in place are all OIDC needs.
7. `gh secret remove NPM_TOKEN --repo Particle-Academy/fancy-screens` to clean up the GitHub secret.
8. Bump and tag the next release; CI will publish via OIDC.

### Why Claude can't do steps 1–5

Modifying access controls on a third-party account (granting OIDC publish rights, revoking tokens, changing trusted publishers) is in the hard "don't act on user's account on external services" boundary baked into Claude's behavior. Even with explicit permission, this stays a manual step. Claude *can* edit the workflow file and remove the GitHub secret (steps 6–7).

## Common gotchas

- **First publish 404s with `PUT .../@particle-academy/fancy-screens - Not found`** — Trusted Publisher isn't configured. If the package already exists, fix at `https://www.npmjs.com/package/@particle-academy/fancy-screens/access`. If it's a brand new package, use the bootstrap path (token-based publish first).
- **`npm 11.5.1+ required for OIDC`** — bundled npm in `actions/setup-node@v4 (node 22)` is npm 10. Workflow uses `npx -y npm@latest publish ...` to grab a fresh npm just for publish.
- **`workspace:*` dep in a submodule** — if a package depends on `@particle-academy/react-fancy: workspace:*` in `devDependencies`, standalone CI has no workspace context. Add a small rewrite step before `npm install` (see fancy-code/fancy-sheets workflows for the pattern).
- **Tag pushed to wrong commit** — `git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z && git tag vX.Y.Z && git push origin vX.Y.Z`. Safe before npm has consumed the version.
