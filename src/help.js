import Adw from "gi://Adw";
import GObject from "gi://GObject";

export const Help = GObject.registerClass(
  {
    GTypeName: "Help",
    Template: getResourceURI("help.ui"),
    InternalChildren: ["letters", "statistics", "help_column_view"],
  },
  class extends Adw.Window {
    constructor() {
      super();
    }
  }
);

export const HelpObject = GObject.registerClass(
  {
    GTypeName: "HelpObject",
    Properties: {
      helpObject: GObject.ParamSpec.jsobject(
        "helpObject",
        "help_object",
        "Property holding help objects",
        GObject.ParamFlags.READWRITE
      ),
    },
  },
  class HelpObject extends GObject.Object {
    constructor(props = [], values = []) {
      super();
      this.setHelpObject(props, values);
    }

    setHelpObject = (props, values) => {
      const object = {};

      for (let i = 0; i < props.length; i++) {
        if (!props[i]) {
          object.firstValue = values[i];
          continue;
        }

        object[props[i]] = values[i].toString();
      }

      this.helpObject = object;
    };
  }
);
