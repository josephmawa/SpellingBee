module.exports.processText = function (text) {
  const textArray = text.trim().split("\n");
  return textArray.map((txt) => txt.trim().toLowerCase());
};

module.exports.processCapitals = function (capitals) {
  return Object.values(capitals).map((capital) => capital.toLowerCase());
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

  return result;
};

module.exports.processDictionary = function (dictionary) {
  return Object.keys(dictionary).filter((word) => {
    const wordSet = new Set(word);
    // This removes words less than 4 letters and words such as
    // mama, papa, mimi etc that may appear in the dictionary.
    // From AI generated list of words, most of these words are
    // either rare or informal. Either way they shouldn't be
    // in the puzzle.
    return word.length > 3 && wordSet.size > 2;
  });
};
