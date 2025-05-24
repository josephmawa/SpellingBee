const goodWordsArray = require("../store/good-words/index.js");
const { dataSources: dataSourcesArray } = require("./data-sources.js");
const fs = require("fs");
const path = require("path");

module.exports.extractBadWords = function () {
  const dataSources = dataSourcesArray.filter(
    (dataSource) =>
      !!goodWordsArray.find((goodWord) => dataSource.id === goodWord.id)
  );

  let extractedBadWords = [];

  for (const { id, fileName } of dataSources) {
    const filePath = path.join(__dirname, "..", "store", "tmp", fileName);
    const badWords = JSON.parse(
      fs.readFileSync(filePath, { encoding: "utf-8" })
    );
    const goodWords =
      goodWordsArray.find((goodWord) => goodWord.id === id)?.words ?? [];

    const badWordsSet = new Set(badWords);
    const goodWordsSet = new Set(goodWords);

    extractedBadWords.push(...badWordsSet.difference(goodWordsSet));
  }

  extractedBadWords = extractedBadWords.filter((word) => word.length > 3);

  return [...new Set(extractedBadWords)].sort();
};

module.exports.processText = function (text) {
  const textArray = text.trim().split("\n");
  return textArray.map((txt) => txt.trim().toLowerCase());
};

module.exports.dedupe = function (array) {
  return [...new Set(array)];
};

module.exports.processCapitals = function (capitals) {
  return Object.values(capitals)
    .filter((word) => word.length > 3)
    .map((capital) => capital.toLowerCase())
    .sort();
};

module.exports.processCountriesAndNationalities = function (
  countriesAndNationalities
) {
  const result = [];

  for (const { en_short_name, nationality } of countriesAndNationalities) {
    const processedNationality = nationality
      .split(",")
      .map((word) => word.trim().toLowerCase());
    result.push(en_short_name.toLowerCase(), ...processedNationality);
  }
  const filteredData = result.filter((word) => word.length > 3);
  return filteredData.sort();
};

module.exports.processDictionary = function (dictionary) {
  return Object.keys(dictionary)
    .filter((word) => {
      const wordSet = new Set(word);
      // This removes words less than 4 letters and words such as
      // mama, papa, mimi etc that may appear in the dictionary.
      // From AI generated list of words, most of these words are
      // either rare or informal. Either way they shouldn't be
      // in the puzzle.
      return word.length > 3 && wordSet.size > 2;
    })
    .sort();
};
