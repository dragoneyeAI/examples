from typing import Sequence, Set
from dragoneye import (
    ClassificationPredictImageResponse,
    ClassificationObjectPrediction,
    Dragoneye,
    Image,
    TaxonPrediction,
)
from fastapi import FastAPI, UploadFile

API_KEY = "YOUR API KEY HERE"

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/predictions/furniture")
async def predictions_furniture(
    image_file: UploadFile,
) -> ClassificationPredictImageResponse:
    dragoneye_client = Dragoneye(api_key=API_KEY)

    prediction_result = dragoneye_client.classification.predict(
        image=Image(file_or_bytes=image_file.file.read()),
        model_name="dragoneye/furniture",
    )

    return prediction_result


@app.post("/predictions/furniture_style")
async def predictions_furniture_style(
    image_file: UploadFile,
) -> Sequence[str]:
    def get_furniture_style_predictions(
        prediction: ClassificationObjectPrediction,
    ) -> Set[str]:
        def get_child_predictions_recursive(prediction: TaxonPrediction) -> Set[str]:
            return {
                prediction.displayName,
                *(
                    name
                    for child_prediction in prediction.children
                    for name in get_child_predictions_recursive(child_prediction)
                ),
            }

        furniture_style_prediction = next(
            (
                trait_prediction
                for trait_prediction in prediction.traits
                if trait_prediction.id == 1015792522
            ),
            None,
        )

        if furniture_style_prediction is None:
            return set()

        return {
            name
            for taxon_prediction in furniture_style_prediction.taxons
            for name in get_child_predictions_recursive(taxon_prediction)
        }

    dragoneye_client = Dragoneye(api_key=API_KEY)

    prediction_result = dragoneye_client.classification.predict(
        image=Image(file_or_bytes=image_file.file.read()),
        model_name="dragoneye/furniture",
    )

    return [
        furniture_style
        for prediction in prediction_result.predictions
        for furniture_style in get_furniture_style_predictions(prediction)
    ]
