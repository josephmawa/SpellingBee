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
