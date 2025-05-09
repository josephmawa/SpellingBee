const fs = require("fs/promises");
const { existsSync, mkdirSync } = require("fs");
const path = require("path");
const { dataSources } = require("./data-sources.js");
const {
  processText,
  processCapitals,
  processCountriesAndNationalities,
  processDictionary,
} = require("./util.js");

let tmpDir = path.join(__dirname, "..", "store", "tmp");
if (!existsSync(tmpDir)) {
  mkdirSync(tmpDir);
}

async function downloadTextData(urlArrays) {
  try {
    const data = await Promise.all(
      urlArrays.map(async (object) => {
        return fetch(object.url).then((response) => response.text());
      })
    );

    const processedData = data.map((dataString) => {
      return processText(dataString).filter((word) => word.length > 3);
    });

    await saveData(
      processedData.map((data, index) => {
        return { data, fileName: urlArrays[index].fileName };
      })
    );
  } catch (error) {
    console.error(error);
  }
}

async function saveData(data) {
  try {
    return await Promise.all(
      data.map(({ data, fileName }) => {
        const filePath = path.join(tmpDir, fileName);
        return fs.writeFile(filePath, JSON.stringify(data, null, 2), {
          encoding: "utf-8",
        });
      })
    );
  } catch (error) {
    console.error(error);
  }
}

async function downloadJsonData(urlArrays) {
  try {
    const data = await Promise.all(
      urlArrays.map(async (object) => {
        return fetch(object.url).then((response) => response.json());
      })
    );

    return data;
  } catch (error) {
    console.error(error);
  }
}

async function downloadData() {
  const textPaths = dataSources.filter(({ url }) => {
    return url.toLowerCase().endsWith(".txt");
  });

  const jsonPaths = dataSources.filter(({ url }) => {
    return url.toLowerCase().endsWith(".json");
  });

  await downloadTextData(textPaths);

  const [capitalCities] = await downloadJsonData([jsonPaths[0]]);
  await saveData([
    {
      data: processCapitals(capitalCities),
      fileName: jsonPaths[0].fileName,
    },
  ]);

  const [countriesAndNationalities] = await downloadJsonData([jsonPaths[1]]);
  await saveData([
    {
      data: processCountriesAndNationalities(countriesAndNationalities),
      fileName: jsonPaths[1].fileName,
    },
  ]);

  const [dict] = await downloadJsonData([jsonPaths.at(-1)]);
  await saveData([
    {
      data: processDictionary(dict),
      fileName: jsonPaths.at(-1).fileName,
    },
  ]);
}

downloadData()
  .then(() => {
    console.log("Finished downloading");
  })
  .catch((error) => {
    console.error(error);
  });
