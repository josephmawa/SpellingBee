export function getRandInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle(array) {
  let currIdx = array.length,
    tempVal,
    randIdx;
  while (0 !== currIdx) {
    randIdx = Math.floor(Math.random() * currIdx);
    currIdx -= 1;
    tempVal = array[currIdx];
    array[currIdx] = array[randIdx];
    array[randIdx] = tempVal;
  }

  return array;
}

export function toUpperCase(string) {
  return string.toLocaleUpperCase("en-US");
}

export function toLowerCase(string) {
  return string.toLocaleLowerCase("en-US");
}

export function toTitleCase(string) {
  if (!string) return string;
  return (
    string.charAt(0).toLocaleUpperCase("en-US") +
    string.slice(1).toLocaleLowerCase("en-US")
  );
}

export function getPoints(string, letters) {
  if (string.length < 5) return 1;

  const uniqueLetters = new Set(string);
  if (uniqueLetters.isSupersetOf(new Set(letters))) {
    return string.length + 7;
  }

  return string.length;
}

export function getToastMessage(points) {
  if (points === 1) return _("Good +%d").format(points);
  if (points < 6) return _("Great +%d").format(points);
  if (points < 10) return _("Amazing +%d").format(points);
  return _("Superb +%d").format(points)
}
