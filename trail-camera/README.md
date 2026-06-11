# Trail camera animal detection

A Jupyter notebook that downloads a set of trail-camera photos and uses a
[Dragoneye](https://dragoneye.ai) vision model to detect which animals appear in
each one.

It uses the [`dragoneye-python`](https://pypi.org/project/dragoneye-python/) SDK
(v2) and calls a custom model named `animals`.

---

## Before you start: create your `animals` model

To get started, you need to build a vision model. This notebook calls the model
`recognize_anything/animals`, so create a model named **`animals`** that
recognizes wildlife. The name must match exactly, and the model must be about
animals — a model built for something else won't work here.

Your model should have **categories** for the animals you want to detect. The
sample photos in this notebook feature a **`Mountain Lion`** and a **`Deer`**, so
make sure those two are included. You can add more, for example: `Mountain Lion`,
`Deer`, `Black Bear`, `Raccoon`, `Red Fox`, `Coyote`, and `Wild Turkey`. (No
attributes are needed for this cookbook — it only reports which animals were
found.)

You can create it either way below.

### Option A — Build it on the website

1. Go to the [Dragoneye Playground](https://playground.dragoneye.ai/) and open
   **Build with Agent**.
2. Describe what you want, for example:
   *"Recognize wildlife in trail-camera photos, with categories like mountain
   lion, deer, black bear, raccoon, red fox, coyote, and wild turkey."*
   The agent fills in the categories in the sidebar as you chat.
3. Click **Save**, name the model exactly **`animals`**, and save. It builds in
   about a minute.

Full guide: https://docs.dragoneye.ai/vision-models/create-a-custom-vision-model

### Option B — Build it with the Claude MCP

1. Add the Dragoneye MCP server (one-time):
   ```bash
   claude mcp add --transport http dragoneye https://nexus.api.dragoneye.ai/mcp
   ```
   You'll be asked to sign in to your Dragoneye account the first time.
2. Ask Claude:
   *"Build me a model named `animals` that detects wildlife like mountain lion,
   deer, black bear, raccoon, red fox, coyote, and wild turkey."*

The model builds in a minute or two. More detail: https://docs.dragoneye.ai/mcp

---

## Run the notebook

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Add your API key.** Open `notebook.ipynb` and replace `<YOUR_API_KEY>` with
   your Dragoneye access token (or set the `DRAGONEYE_API_KEY` environment
   variable and use `Dragoneye()` with no arguments). Don't have a key? See
   [Creating an Access Token](https://docs.dragoneye.ai/account-management/creating-access-token).

3. **Open and run it:**
   ```bash
   jupyter notebook notebook.ipynb
   ```
   Run the cells top to bottom. The notebook downloads the sample photos, runs
   your `animals` model on each one, and prints the animals it detected.

---

### Note on model names

Dragoneye model names follow the format `recognize_anything/<your_model_name>`.
This notebook uses `recognize_anything/animals`. If you name your model something
else, update `MODEL_NAME` in the notebook to match.

### Troubleshooting

If you see **"Model 'recognize_anything/animals' was not found"**, you haven't
created the model yet (or its name doesn't match). Go back to
[Before you start: create your `animals` model](#before-you-start-create-your-animals-model)
and build it.
