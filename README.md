# Reef Hunger

Reef Hunger is a fast mobile-first arcade game where a hungry anemone devours sea creatures on a falling tactical grid while dodging cursed ocean junk.

## License

Noncommercial use is permitted under [PolyForm Noncommercial 1.0.0](./LICENSE).

Commercial use requires prior written permission from the author and a paid commercial license. See [COMMERCIAL.md](./COMMERCIAL.md).

## GitHub Pages

The repo is configured for project-site deployment on GitHub Pages through GitHub Actions.

### What is already set up

- `Vite` resolves `base` automatically for GitHub Actions using the repository name.
- `.github/workflows/deploy-pages.yml` builds and deploys the `dist/` artifact to Pages.
- `public/.nojekyll` is included so static assets are served directly.

### What you need to do on GitHub

1. Push the repository to GitHub.
2. In repository settings, open `Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to `main` or run the `Deploy GitHub Pages` workflow manually.

### Local commands

- `pnpm dev` for normal local development.
- `pnpm build` to verify the production build.
- `pnpm verify` to run lint, format check, typecheck, secret scan, and build.
