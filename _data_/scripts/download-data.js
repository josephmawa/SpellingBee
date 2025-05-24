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
      return processText(dataString)
        .filter((word) => word.length > 3)
        .toSorted();
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

async function downloadJsonData(object) {
  try {
    const response = await fetch(object.url);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);
  }
}

async function downloadData() {
  const textPaths = dataSources.filter(({ url }) => {
    return url.toLowerCase().endsWith(".txt");
  });
  await downloadTextData(textPaths);

  const capitalCitiesObject = dataSources.find(({ id }) => id === 3);
  const capitalCities = await downloadJsonData(capitalCitiesObject);
  await saveData([
    {
      data: processCapitals(capitalCities),
      fileName: capitalCitiesObject.fileName,
    },
  ]);

  const countriesAndNationalitiesObject = dataSources.find(
    ({ id }) => id === 4
  );
  const countriesAndNationalities = await downloadJsonData(
    countriesAndNationalitiesObject
  );
  await saveData([
    {
      data: processCountriesAndNationalities(countriesAndNationalities),
      fileName: countriesAndNationalitiesObject.fileName,
    },
  ]);

   const dictionaryObject = dataSources.find(
    ({ id }) => id === 5
  );
  const dictionary = await downloadJsonData(dictionaryObject);
  await saveData([
    {
      data: processDictionary(dictionary),
      fileName: dictionaryObject.fileName,
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
