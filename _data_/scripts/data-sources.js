module.exports.dataSources = [
  // These are words mostly considered offensive. However, some of them
  // in this list are actually not. After downloading and processing, such
  // words shouldn't be filtered.
  {
    fileName: "bad-words.json",
    url: "https://www.cs.cmu.edu/~biglou/resources/bad-words.txt",
  },

  // These are swear words. Some of them might overlap with the bad words
  // from CMU above.

  {
    fileName: "swear-words.json",
    url: "http://www.bannedwordlist.com/lists/swearWords.txt",
  },

  // These are names of places in the United States. Some of them appear
  // in the English dictionary.
  {
    fileName: "places.json",
    url: "https://www.gutenberg.org/files/3201/files/PLACES.TXT",
  },

  // These are the most common names used in the United States and
  // Great Britain. Some of these names appear in the English
  // dictionary.
  {
    fileName: "names.json",
    url: "https://www.gutenberg.org/files/3201/files/NAMES.TXT",
  },

  // This is a list of abbreviations. Some of them like UNIX and UNESCO
  // appear in the English dictionary.
  {
    fileName: "acronyms.json",
    url: "https://www.gutenberg.org/files/3201/files/ACRONYMS.TXT",
  },

  // Capital cities of the different countries. Some of these cities appear
  // in the English dictionary.
  {
    fileName: "capital-cities.json",
    url: "https://country.io/capital.json",
  },

  // This is a list of countries and nationalities of the people originating
  // from those countries in JSON format. Some of these countries appear
  // in the English dictionary.
  {
    fileName: "countries-and-nationalities.json",
    url: "https://raw.githubusercontent.com/Imagin-io/country-nationality-list/refs/heads/master/countries.json",
  },

  // This is a list of the dictionary words used for generating puzzles.
  {
    fileName: "dictionary.json",
    url: "https://raw.githubusercontent.com/dwyl/english-words/refs/heads/master/words_dictionary.json",
  },
];
