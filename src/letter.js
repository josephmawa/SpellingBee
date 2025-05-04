import GObject from "gi://GObject";

export const Letter = GObject.registerClass(
  {
    GTypeName: "Letter",
    Properties: {
      letter: GObject.ParamSpec.string(
        "letter",
        "Letter",
        "Letter for creating words",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      position: GObject.ParamSpec.string(
        "position",
        "Position",
        "Position of the letter in the hexagon setup",
        GObject.ParamFlags.READWRITE,
        ""
      ),
    },
  },
  class Letter extends GObject.Object {
    constructor(letter, position) {
      super();
      this.letter = letter;
      this.position = position;
    }
  }
);

export const CorrectWord = GObject.registerClass(
  {
    GTypeName: "CorrectWord",
    Properties: {
      correctWord: GObject.ParamSpec.string(
        "correctWord",
        "correct_word",
        "Correct word",
        GObject.ParamFlags.READWRITE,
        ""
      ),
    },
  },
  class CorrectWord extends GObject.Object {
    constructor(correctWord) {
      super();
      this.correctWord = correctWord;
    }

    getUri = (uri) => {
     return `${uri}?q=${this.correctWord}&define=Define`
    }
  }
);
