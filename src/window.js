import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";

import { Hexagon, Container } from "./hexagon.js";

export const SpellingbeeWindow = GObject.registerClass(
  {
    GTypeName: "SpellingbeeWindow",
    Template: getResourceURI("window.ui"),
    InternalChildren: ["container"],
  },
  class SpellingbeeWindow extends Adw.ApplicationWindow {
    constructor(application) {
      super({ application });

      this.createUI();
    }

    createUI = () => {
      const objects = [
        { label: "W", position: "TOP_LEFT" },
        { label: "X", position: "TOP_RIGHT" },
        { label: "A", position: "LEFT" },
        { label: "M", position: "RIGHT" },
        { label: "T", position: "CENTER" },
        { label: "G", position: "BOTTOM_LEFT" },
        { label: "K", position: "BOTTOM_RIGHT" },
      ];

      const container = new Container({ gap: 8 });

      for (const object of objects) {
        const hexagon = new Hexagon(object);
        hexagon.connect("click", this.hexClickHandler);
        container.appendChild(hexagon);
      }

      this._container.append(container);
    };

    hexClickHandler(_hexagon, label) {
      console.log(label);
    }
  }
);
