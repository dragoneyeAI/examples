import { Dragoneye } from "dragoneye-node";
import { useFilePicker } from "use-file-picker";
import "./App.css";
import { useMemo, useState } from "react";
import { PredictionResult } from "./components/prediction";

// Shown when the model doesn't exist yet, so users know how to create it.
const MODEL_NAME = "recognize_anything/clothing";
const SETUP_URL =
  "https://github.com/dragoneyeAI/dragoneye-cookbooks/tree/main/dragoneye-clothing-react-app#before-you-start-create-your-clothing-model";

function App() {
  const dragoneyeClient = useMemo(
    () =>
      new Dragoneye({
        apiKey: "YOUR_API_KEY",
      }),
    []
  );

  const [imageFileContent, setImageFileContent] = useState(null);
  const [imagePredictions, setImagePredictions] = useState(null);
  const [modelNotFound, setModelNotFound] = useState(false);

  const { openFilePicker } = useFilePicker({
    readAs: "DataURL",
    accept: "image/*",
    multiple: false,
    onFilesSuccessfullySelected: async ({ plainFiles, filesContent }) => {
      setImageFileContent(filesContent[0]);
      setModelNotFound(false);
      setImagePredictions(null);
      try {
        const image = Dragoneye.Image.fromBlob(plainFiles[0]);
        const results = await dragoneyeClient.classification.predictImage(
          image,
          MODEL_NAME
        );
        setImagePredictions(results);
      } catch (error) {
        // A 404 means the model name doesn't exist on your account yet.
        if (String(error?.message ?? error).includes("404")) {
          setModelNotFound(true);
        } else {
          console.error(error);
          alert(`Prediction failed: ${error?.message ?? error}`);
        }
      }
    },
  });

  return (
    <div className="App">
      <h1>Dragoneye App</h1>
      <button onClick={openFilePicker} className="pickerButton">
        Select an image
      </button>
      {imageFileContent ? (
        <img
          key={imageFileContent.name}
          src={imageFileContent.content}
          alt={imageFileContent.name}
          style={{ maxWidth: "100%", maxHeight: 480 }}
        />
      ) : null}
      {modelNotFound ? (
        <div
          style={{
            backgroundColor: "#fde8e8",
            color: "#9b1c1c",
            borderRadius: 12,
            padding: 16,
            marginTop: 12,
            textAlign: "left",
            maxWidth: 640,
          }}
        >
          <strong>Model "{MODEL_NAME}" was not found.</strong>
          <p style={{ margin: "8px 0 0" }}>
            You need to create it before this app will work. Follow the setup
            steps in the{" "}
            <a href={SETUP_URL} target="_blank" rel="noreferrer">
              README
            </a>{" "}
            to build your <code>clothing</code> model.
          </p>
        </div>
      ) : null}
      {imagePredictions
        ? imagePredictions.objects.map((object) => (
            <PredictionResult key={object.object_id} object={object} />
          ))
        : null}
    </div>
  );
}

export default App;
