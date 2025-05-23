module.exports.dataSources = [
  // This is a list of abbreviations. Some of them like UNIX and UNESCO
  // appear in the English dictionary.
  {
    id: 1,
    fileName: "acronyms.json",
    url: "https://www.gutenberg.org/files/3201/files/ACRONYMS.TXT",
  },
  // These are words mostly considered offensive. However, some of them
  // in this list are actually not. After downloading and processing, such
  // words shouldn't be filtered.
  {
    id: 2,
    fileName: "bad-words.json",
    url: "https://www.cs.cmu.edu/~biglou/resources/bad-words.txt",
  },

  // Capital cities of the different countries. Some of these cities appear
  // in the English dictionary.
  {
    id: 3,
    fileName: "capital-cities.json",
    url: "https://country.io/capital.json",
  },

  // This is a list of countries and nationalities of the people originating
  // from those countries in JSON format. Some of these countries appear
  // in the English dictionary.
  {
    id: 4,
    fileName: "countries-and-nationalities.json",
    url: "https://raw.githubusercontent.com/Imagin-io/country-nationality-list/refs/heads/master/countries.json",
  },

  // This is a list of the dictionary words used for generating puzzles.
  {
    id: 5,
    fileName: "dictionary.json",
    url: "https://raw.githubusercontent.com/dwyl/english-words/refs/heads/master/words_dictionary.json",
  },

  // These are the most common names used in the United States and
  // Great Britain. Some of these names appear in the English
  // dictionary.
  {
    id: 6,
    fileName: "names.json",
    url: "https://www.gutenberg.org/files/3201/files/NAMES.TXT",
  },

  // These are names of places in the United States. Some of them appear
  // in the English dictionary.
  {
    id: 7,
    fileName: "places.json",
    url: "https://www.gutenberg.org/files/3201/files/PLACES.TXT",
  },

  // These are swear words. Some of them might overlap with the bad words
  // from CMU above.
  {
    id: 8,
    fileName: "swear-words.json",
    url: "http://www.bannedwordlist.com/lists/swearWords.txt",
  },
];
