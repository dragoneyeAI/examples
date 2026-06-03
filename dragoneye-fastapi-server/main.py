from typing import Sequence
from dragoneye import (
    ClassificationPredictImageResponse,
    Dragoneye,
    Image,
    PredictionTaskError,
)
from fastapi import FastAPI, HTTPException, UploadFile

API_KEY = "YOUR API KEY HERE"

# Model names follow the format recognize_anything/<your_model_name>.
# This server uses a custom model named "furniture" (see the README).
MODEL_NAME = "recognize_anything/furniture"

# Shown when the model doesn't exist yet, so users know how to create it.
SETUP_URL = (
    "https://github.com/dragoneyeAI/dragoneye-cookbooks/tree/main/"
    "dragoneye-fastapi-server#before-you-start-create-your-furniture-model"
)
MODEL_NOT_FOUND_MESSAGE = (
    f"Model '{MODEL_NAME}' was not found. You need to create it before running "
    f"this cookbook. Follow the setup instructions in the README: {SETUP_URL}"
)

app = FastAPI()


async def classify_furniture(image_file: UploadFile) -> ClassificationPredictImageResponse:
    """Run the furniture model on an uploaded image.

    Raises a clear 404 if the model hasn't been created yet.
    """
    dragoneye_client = Dragoneye(api_key=API_KEY)

    try:
        return await dragoneye_client.classification.predict_image(
            media=Image.from_bytes(
                image_file.file.read(),
                mime_type=image_file.content_type or "image/jpeg",
            ),
            model_name=MODEL_NAME,
        )
    except PredictionTaskError as error:
        # A 404 from the API means the model name doesn't exist on your account.
        underlying_status = (
            getattr(error.args[1], "status", None) if len(error.args) > 1 else None
        )
        if underlying_status == 404 or "404" in str(error):
            raise HTTPException(status_code=404, detail=MODEL_NOT_FOUND_MESSAGE)
        raise


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/predictions/furniture")
async def predictions_furniture(
    image_file: UploadFile,
) -> ClassificationPredictImageResponse:
    return await classify_furniture(image_file)


@app.post("/predictions/furniture_style")
async def predictions_furniture_style(
    image_file: UploadFile,
) -> Sequence[str]:
    prediction_result = await classify_furniture(image_file)

    # Pull out the "Style" attribute from every detected object. Each detected
    # object has categories, and each category has attributes; we keep the
    # chosen option of the attribute named "Style".
    return [
        attribute.option_name
        for detected_object in prediction_result.objects
        for category in detected_object.categories
        for attribute in category.attributes
        if attribute.attribute_name.lower() == "style"
    ]
