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
      attempted: GObject.ParamSpec.jsobject(
        "attempted",
        "Attempted",
        "A property holding the indices for the attempted spelling bee",
        GObject.ParamFlags.READWRITE
      ),
      currentScore: GObject.ParamSpec.int(
        "currentScore",
        "current_score",
        "A property holding the current score",
        GObject.ParamFlags.READWRITE,
        // For some reason GObject.ParamSpec.int requires
        // minimum and maximum values. 0 and 1_000_000 are
        // chosen as min and max values resp. 1_000_000 was
        // chosen because it is large enough.
        0,
        1_000_000,
        0
      ),
      totalScore: GObject.ParamSpec.int(
        "totalScore",
        "total_score",
        "A property holidng total score for the current quiz",
        GObject.ParamFlags.READWRITE,
        0,
        1_000_000,
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
      attempted,
      currentScore,
      totalScore,
    }) {
      super();

      this.centerLetter = centerLetter;
      this.outerLetters = outerLetters;
      this.words = words;
      this.wordsFound = wordsFound;
      this.attempted = attempted;
      this.currentScore = currentScore;
      this.totalScore = totalScore;
    }

    getCenterLetter = () => {
      return this.centerLetter?.get_item(0)?.letter ?? "";
    };
    getOuterLetters = () => {
      let outerLetters = "";
      for (let i = 0; i < this.outerLetters.n_items; i++) {
        outerLetters += this.outerLetters?.get_item(i)?.letter ?? "";
      }
      return outerLetters;
    };
  }
);
