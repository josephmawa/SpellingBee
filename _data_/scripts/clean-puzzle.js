const path = require("path");
const fs = require("fs/promises");
const { existsSync } = require("fs");
const { dataSources } = require("./data-sources.js");
const goodBadWords = require("./good-bad-words.json");

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
  console.log("Incorrect puzzle path");
  process.exit(1);
}

async function cleanPuzzle(puzzle) {
  try {
    const fileNames = dataSources.slice(0, -1).map(({ fileName }) => fileName);

    for (const fileName of fileNames) {
      const filePath = path.join(dataDir, fileName);
      const data = await fs.readFile(filePath, { encoding: "utf-8" });
      let dataArr = JSON.parse(data);

      if (fileName === "bad-words.json") {
        // These are words that may be offensive in one context and not
        // offensive in others. And some of them are marked as offensive
        // erroneously. Therefore, they shouldn't be filtered out from
        // the list of words. The good-bad-words.json file is generated
        // from bad-words.json file using AI.
        dataArr = dataArr.filter((word) => !goodBadWords.includes(word));
      }

      for (const object of puzzle) {
        object.words = object.words.filter((word) => !dataArr.includes(word));
      }
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
  .then(async (cleanPuzzle) => {
    console.log("Cleaned puzzle");
  })
  .catch((error) => console.error(error));
