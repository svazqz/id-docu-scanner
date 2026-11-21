# ![ID Document Scanner](docs/readme/banner.svg)

A browser app with a camera view and video analysis for document capture. Use sample documents when developing and testing the capture flow.

[Quick start](#quick-start) · [Validation](#validation) · [Project layout](#project-layout)

## Quick start

```sh
npm ci
npm start
```

Open the local URL printed by Nx and allow camera access when exercising the capture flow.

## Validation

```sh
npm test
npm run build
```

Use a simulated camera feed or sample images for repeatable checks.

## Project layout

| Path | Purpose |
| --- | --- |
| [`src/app/`](src/app/) | Application UI and camera analysis |
| [`e2e/`](e2e/) | Cypress end-to-end checks |
| [`project.json`](project.json) | Nx targets |
