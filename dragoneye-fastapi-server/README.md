# Furniture recognition — FastAPI server

A small [FastAPI](https://fastapi.tiangolo.com/) server that classifies furniture
in an uploaded photo using a [Dragoneye](https://dragoneye.ai) vision model. It
exposes two endpoints:

- `POST /predictions/furniture` — the full classification result (detected
  furniture, with categories and attributes).
- `POST /predictions/furniture_style` — just the **style** label(s) (e.g.
  *Modern*, *Mid-Century*), pulled out of the result for you.

It uses the [`dragoneye-python`](https://pypi.org/project/dragoneye-python/) SDK
(v2) and calls a custom model named `furniture`.

---

## Before you start: create your `furniture` model

To get started, you need to build a vision model. This server calls the model
`recognize_anything/furniture`, so create a model named **`furniture`** that
recognizes furniture. The name must match exactly, and the model must be about
furniture — a model built for something else won't work here.

Your model should have:

- **Categories** (the type of furniture): e.g. `Sofa`, `Chair`, `Table`, `Bed`,
  `Dresser`, `Bookshelf`, `Desk`.
- **Attributes**: at minimum an attribute named exactly **`Style`** with options
  like `Modern`, `Mid-Century`, `Traditional`, `Industrial`, `Scandinavian`. The
  `/predictions/furniture_style` endpoint looks for the attribute named `Style`,
  so that name must match.

You can create it either way below.

### Option A — Build it on the website

1. Go to the [Dragoneye Playground](https://playground.dragoneye.ai/) and open
   **Build with Agent**.
2. Describe what you want, for example:
   *"Recognize furniture in a photo, with categories like sofa, chair, table,
   bed, dresser, bookshelf, and desk, and a Style attribute with options like
   modern, mid-century, traditional, industrial, and scandinavian."*
   The agent fills in the categories and attributes in the sidebar as you chat.
3. Click **Save**, name the model exactly **`furniture`**, and save. It builds in
   about a minute.

Full guide: https://docs.dragoneye.ai/vision-models/create-a-custom-vision-model

### Option B — Build it with the Claude MCP

1. Add the Dragoneye MCP server (one-time):
   ```bash
   claude mcp add --transport http dragoneye https://nexus.api.dragoneye.ai/mcp
   ```
   You'll be asked to sign in to your Dragoneye account the first time.
2. Ask Claude:
   *"Build a model named `furniture` that detects furniture and classifies its
   Style (modern, mid-century, traditional, industrial, scandinavian)."*

The model builds in a minute or two. More detail: https://docs.dragoneye.ai/mcp

---

## Run the server

1. **Add your API key.** Open `main.py` and replace `YOUR API KEY HERE` with your
   Dragoneye access token (or set the `DRAGONEYE_API_KEY` environment variable and
   change `Dragoneye(api_key=API_KEY)` to `Dragoneye()` — the SDK reads it
   automatically). Don't have a key? See
   [Creating an Access Token](https://docs.dragoneye.ai/account-management/creating-access-token).

2. **Install and start:**
   ```bash
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

3. **Try it** with any furniture photo:
   ```bash
   curl -F image_file=@chair.jpg http://localhost:8000/predictions/furniture
   curl -F image_file=@chair.jpg http://localhost:8000/predictions/furniture_style
   ```

   Interactive docs are available at http://localhost:8000/docs.

---

### Note on model names

Dragoneye model names follow the format `recognize_anything/<your_model_name>`.
This server uses `recognize_anything/furniture`. If you name your model something
else, update `MODEL_NAME` in `main.py` to match.

### Troubleshooting

If a request returns **`404` with "Model 'recognize_anything/furniture' was not
found"**, you haven't created the model yet (or its name doesn't match). Go back
to [Before you start: create your `furniture` model](#before-you-start-create-your-furniture-model)
and build it.
