# Clothing recognition — React app

A small React app that lets you pick an image in the browser, sends it to a
[Dragoneye](https://dragoneye.ai) vision model, and displays the clothing it
detects along with attributes like color, sleeve length, pattern, and material.

It uses the [`dragoneye-node`](https://www.npmjs.com/package/dragoneye-node) SDK
(v4) and calls a custom model named `clothing`.

---

## Before you start: create your `clothing` model

To get started, you need to build a vision model. This app calls the model
`recognize_anything/clothing`, so create a model named **`clothing`** that
recognizes clothing items. The name must match exactly, and the model must be
about clothing — a model built for something else (say, drinks) will return
nothing useful here.

Your model should have:

- **Categories** (the type of garment): e.g. `T-Shirt`, `Shirt`, `Dress`,
  `Pants`, `Jacket`, `Skirt`, `Shorts`, `Sweater`.
- **Attributes** (details about the garment): e.g. `Color`, `Sleeve Length`,
  `Pattern`, `Material`, `Neckline`.

You can create it either way below.

### Option A — Build it on the website

1. Go to the [Dragoneye Playground](https://playground.dragoneye.ai/) and open
   **Build with Agent**.
2. Describe what you want, for example:
   *"Recognize clothing items in a photo, with categories like t-shirt, shirt,
   dress, pants, jacket, skirt, shorts, and sweater, and attributes for color,
   sleeve length, pattern, material, and neckline."*
   The agent fills in the categories and attributes in the sidebar as you chat.
3. Click **Save**, name the model exactly **`clothing`**, and save. It builds in
   about a minute.

Full guide: https://docs.dragoneye.ai/vision-models/create-a-custom-vision-model

### Option B — Build it with the Claude MCP

1. Add the Dragoneye MCP server (one-time):
   ```bash
   claude mcp add --transport http dragoneye https://nexus.api.dragoneye.ai/mcp
   ```
   You'll be asked to sign in to your Dragoneye account the first time.
2. Ask Claude:
   *"Build me a model named `clothing` that detects clothing items and
   classifies their color, sleeve length, pattern, and material."*

The model builds in a minute or two. More detail: https://docs.dragoneye.ai/mcp

---

## Run the app

1. **Add your API key.** Open `src/App.js` and replace `YOUR_API_KEY` with your
   Dragoneye access token. Don't have one? See
   [Creating an Access Token](https://docs.dragoneye.ai/account-management/creating-access-token).

2. **Install and start:**
   ```bash
   npm install
   npm start
   ```

3. Open the app, click **Select an image**, pick a photo of a clothing item, and
   the detected garment and its attributes appear below it.

---

### Note on model names

Dragoneye model names follow the format `recognize_anything/<your_model_name>`.
This app uses `recognize_anything/clothing`. If you name your model something
else, update the model name in `src/App.js` to match.

### Troubleshooting

**"Model 'recognize_anything/clothing' was not found"** — you haven't created the
model yet (or its name doesn't match). Go back to
[Before you start: create your `clothing` model](#before-you-start-create-your-clothing-model)
and build it.
