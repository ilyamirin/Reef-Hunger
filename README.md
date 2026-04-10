# Reef Hunger

Reef Hunger is a fast mobile-first arcade game where a hungry anemone devours sea creatures on a falling tactical grid while dodging cursed ocean junk.

## License

Noncommercial use is permitted under [PolyForm Noncommercial 1.0.0](./LICENSE).

Commercial use requires prior written permission from the author and a paid commercial license. See [COMMERCIAL.md](./COMMERCIAL.md).

## Audio

The game ships with prepared `CC0` sound effects and ambience placed in [`public/audio`](./public/audio). These files are trimmed, normalized, loop-prepared where needed, and converted to browser-safe `mp3` for in-game use.

Source pages used for the current audio set:

- Kenney, [51 UI sound effects (buttons, switches and clicks)](https://opengameart.org/content/51-ui-sound-effects-buttons-switches-and-clicks)
- wubitog, [3 Pop Sounds](https://opengameart.org/content/3-pop-sounds)
- rubberduck, [40 CC0 water / splash / slime SFX](https://opengameart.org/content/40-cc0-water-splash-slime-sfx)
- rubberduck, [100 CC0 metal and wood SFX](https://opengameart.org/content/100-cc0-metal-and-wood-sfx)
- Sudocolon, [Menu Choice](https://opengameart.org/content/menu-choice)
- yd, [Short alarm](https://opengameart.org/content/short-alarm)
- isaiah658, [Underwater Ambient Pad](https://opengameart.org/content/underwater-ambient-pad)
- Holizna, [Game Over (Collection)](https://opengameart.org/content/game-over-collection)

The game code remains licensed under the repository license. The packaged audio files are third-party `CC0` source material used in edited, compiled form. A full per-file registry is available in [`docs/audio-sources.md`](./docs/audio-sources.md).

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
