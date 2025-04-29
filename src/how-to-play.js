import Adw from "gi://Adw";
import GObject from "gi://GObject";

export const HowToPlay = GObject.registerClass(
  {
    GTypeName: "HowToPlay",
    Template: getResourceURI("how-to-play.ui"),
  },
  class extends Adw.Window {
    constructor() {
      super();
    }
  }
);