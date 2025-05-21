/***
 * The code below generates new word list for an already created
 * puzzle list.
 *
 *  */

// const generatedPuzzles = require("./store/generated-puzzles.json");
// const dictionary = require("./store/tmp/dictionary.json");
// const removeWords = require("./scripts/remove-words.json");

const fs = require("fs/promises");
// const path = require("path");

// const cleanDict = dictionary.filter((word) => !removeWords.includes(word));

// for (const puzzle of generatedPuzzles) {
//   const letterSet = new Set(puzzle.letters);
//   puzzle.words = cleanDict.filter((word) => {
//     const wordSet = new Set(word);
//     return letterSet.isSupersetOf(wordSet);
//   });
// }

// const filePath = path.join(__dirname, "store", "generated-puzzles.json");
// fs.writeFile(filePath, JSON.stringify(generatedPuzzles, null, 2), {
//   encoding: "utf-8",
// })
//   .then(() => console.log("Saved data to file"))
//   .catch((error) => console.error(error));

const goodPlaces = require("./store/good-words/good-places.json");
const places = require("./store/tmp/places.json");

let data = goodPlaces
  .filter((word) => word.length > 3 && places.includes(word))
  .sort();

data = [...new Set(data)];
fs.writeFile(
  "./store/good-words/good-places.json",
  JSON.stringify(data, null, 2),
  {
    encoding: "utf-8",
  }
)
  .then(() => console.log("Saved data"))
  .catch((error) => console.error(error));
