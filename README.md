# Example projects for Dragoneye

This repo contains example projects that use the [Dragoneye](https://dragoneye.ai)
API. Each project builds and calls a custom vision model — see the project's
README for what to create and how to run it.

## Dragoneye cookbooks

- **[dragoneye-clothing-react-app](./dragoneye-clothing-react-app)** — a React app
  that recognizes clothing items in a photo in the browser
  (`dragoneye-node` SDK).
- **[dragoneye-fastapi-server](./dragoneye-fastapi-server)** — a FastAPI server
  that classifies furniture and extracts its style (`dragoneye-python` SDK).
- **[trail-camera](./trail-camera)** — a notebook that detects which animals
  appear in trail-camera photos (`dragoneye-python` SDK).

New to Dragoneye? You'll need an [access token](https://docs.dragoneye.ai/account-management/creating-access-token)
and a custom model — build one on the [Playground](https://playground.dragoneye.ai/)
or with the [Claude MCP](https://docs.dragoneye.ai/mcp). Each cookbook's README
walks you through exactly what to create.

## Other examples

- **[object-detection](./object-detection)** — standalone object-detection
  notebooks (DETR, YOLOv9, and a fine-tuned fashion detector). These use
  third-party models and do not call the Dragoneye API.
