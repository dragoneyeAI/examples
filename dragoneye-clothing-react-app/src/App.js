import { Dragoneye } from "dragoneye-node";
import { useFilePicker } from "use-file-picker";
import "./App.css";
import { useMemo, useState } from "react";
import { PredictionResult } from "./components/prediction";

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

  const { openFilePicker } = useFilePicker({
    readAs: "DataURL",
    accept: "image/*",
    multiple: false,
    onFilesSuccessfullySelected: async ({ plainFiles, filesContent }) => {
      setImageFileContent(filesContent[0]);
      const results = await dragoneyeClient.classification.predict({
        image: {
          blob: plainFiles[0],
        },
        modelName: "dragoneye/fashion",
      });
      setImagePredictions(results);
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
      {imagePredictions
        ? imagePredictions["predictions"].map((prediction) => (
            <PredictionResult prediction={prediction} />
          ))
        : null}
    </div>
  );
}

export default App;
