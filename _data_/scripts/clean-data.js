const path = require("path");
const fs = require("fs");
const { dataSources } = require("./data-sources.js");

const dataDir = path.join(__dirname, "..", "store", "tmp");
const dictObj = dataSources.find(({ id }) => id === 5);
const dict = require(path.join(dataDir, dictObj.fileName));
const dictSet = new Set(dict);

for (const dataSource of dataSources) {
  if (dataSource.id === 5) continue;

  const filePath = path.join(dataDir, dataSource.fileName);
  const data = require(filePath);
  const dataSet = new Set(data);
  const intersect = [...dataSet.intersection(dictSet)];

  fs.writeFileSync(filePath, JSON.stringify(intersect, null, 2), {
    encoding: "utf-8",
  });
}
