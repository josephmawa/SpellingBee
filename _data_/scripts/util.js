module.exports.processText = function (text) {
  const textArray = text.trim().split("\n");
  return textArray.map((txt) => txt.toLowerCase().trim());
};
