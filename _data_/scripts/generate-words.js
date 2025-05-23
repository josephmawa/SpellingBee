/***
 * The code below generates new word list for an already created
 * puzzle list.
 *
 *  */

const generatedPuzzles = require("../store/generated-puzzles.json");
const dictionary = require("../store/tmp/dictionary.json");
const removeWords = require("./remove-words.json");

const fs = require("fs/promises");

const removeWordsSet = new Set(removeWords)
const cleanDict = dictionary.filter((word) => !removeWordsSet.has(word));


// for (const puzzle of generatedPuzzles) {
//   const letterSet = new Set(puzzle.letters);
//   puzzle.words = cleanDict.filter((word) => {
//     const wordSet = new Set(word);
//     return letterSet.isSupersetOf(wordSet);
//   });
// }

// const filePath =  "../store/generated-puzzles-temp.json";
// fs.writeFile(filePath, JSON.stringify(generatedPuzzles, null, 2), {
//   encoding: "utf-8",
// })
//   .then(() => console.log("Saved data to file"))
//   .catch((error) => console.error(error));
