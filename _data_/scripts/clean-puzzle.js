const path = require("path");
const fs = require("fs/promises");
const { existsSync } = require("fs");
const { dataSources } = require("./data-sources.js");

const dataDir = path.join(__dirname, "..", "store", "tmp");
if (!existsSync(dataDir)) {
  console.log("Please download data before proecessing");
  process.exit(1);
}

const puzzlePath = path.join(
  __dirname,
  "..",
  "store",
  "generated-puzzles.json"
);

if (!existsSync(puzzlePath)) {
  console.log("Provide correct puzzle path");
  process.exit(1);
}

async function cleanPuzzle(puzzle) {
  try {
    const fileNames = dataSources.slice(0, -1).map(({ fileName }) => fileName);

    for (const fileName of fileNames) {
      const filePath = path.join(dataDir, fileName);
      const data = await fs.readFile(filePath, { encoding: "utf-8" });
      const dataArr = JSON.parse(data);

      console.log("Removing %s words from puzzle", fileName);

      for (const object of puzzle) {
        object.words = object.words.filter((word) => !dataArr.includes(word));
      }

      console.log("Finished removing %s words from puzzle", fileName);
    }

    const filePath = path.join(
      path.dirname(dataDir),
      "generated-puzzles-clean.json"
    );
    await fs.writeFile(filePath, JSON.stringify(puzzle, null, 2), {
      encoding: "utf-8",
    });

    return puzzle;
  } catch (error) {
    console.log(error);
    return [];
  }
}

const puzzle = require("../store/generated-puzzles.json");

cleanPuzzle(puzzle)
  .then(() => console.log("Finished cleaning data"))
  .catch((error) => console.error(error));
