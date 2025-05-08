const fs = require("fs/promises");
const path = require("path");
const { dataSources } = require("./data-sources.js");
const { processText } = require("./util.js");

const tmpDir = path.join(__dirname, "..", "store", "tmp");

async function downloadTextData(urlArrays) {
  try {
    const data = await Promise.all(
      urlArrays.map(async (object) => {
        return fetch(object.url).then((response) => response.text());
      })
    );

    await Promise.all(
      urlArrays.map((object, index) => {
        const filePath = path.join(tmpDir, object.fileName);
        const processedData = processText(data[index]).filter(
          (word) => word.length > 3
        );
        return fs.writeFile(filePath, JSON.stringify(processedData, null, 2), {
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

    await Promise.all(
      urlArrays.map((object, index) => {
        const filePath = path.join(tmpDir, object.fileName);
        const processedData = processText(data[index]).filter(
          (word) => word.length > 3
        );
        return fs.writeFile(filePath, JSON.stringify(processedData, null, 2), {
          encoding: "utf-8",
        });
      })
    );
  } catch (error) {
    console.error(error);
  }
}

const textPaths = dataSources.filter(({ url }) => {
  return url.toLowerCase().endsWith(".txt");
});

downloadTextData(textPaths);
