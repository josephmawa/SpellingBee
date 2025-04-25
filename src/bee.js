import GObject from "gi://GObject";
import Gio from "gi://Gio";

export const BeeState = GObject.registerClass(
  {
    GTypeName: "BeeState",
    Properties: {
      centerLetter: GObject.ParamSpec.object(
        "centerLetter",
        "center_letter",
        "A property holding the center letter",
        GObject.ParamFlags.READWRITE,
        Gio.ListStore
      ),
      outerLetters: GObject.ParamSpec.object(
        "outerLetters",
        "outer_letters",
        "A property holding the outer letters",
        GObject.ParamFlags.READWRITE,
        Gio.ListStore
      ),
      words: GObject.ParamSpec.jsobject(
        "words",
        "Words",
        "A property holding words for the current spelling bee",
        GObject.ParamFlags.READWRITE
      ),
      wordsFound: GObject.ParamSpec.object(
        "wordsFound",
        "words_found",
        "A property holding the words user has found",
        GObject.ParamFlags.READWRITE,
        Gio.ListStore
      ),
      currentScore: GObject.ParamSpec.int(
        "currentScore",
        "current_score",
        "A property holding the current score",
        GObject.ParamFlags.READWRITE,
        0,
        100,
        0
      ),
      totalScore: GObject.ParamSpec.int(
        "totalScore",
        "total_score",
        "A property holidng total score for the current quiz",
        GObject.ParamFlags.READWRITE,
        0,
        100,
        100
      ),
    },
  },
  class BeeState extends GObject.Object {
    constructor({
      centerLetter,
      outerLetters,
      words,
      wordsFound,
      currentScore,
      totalScore,
    }) {
      super();

      this.centerLetter = centerLetter;
      this.outerLetters = outerLetters;
      this.words = words;
      this.wordsFound = wordsFound;
      this.currentScore = currentScore;
      this.totalScore = totalScore;
    }
  }
);
