import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import Gio from "gi://Gio";

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
      this.loadStyles();
      this.bindSettings();
      this.setPreferredColorScheme();
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

    bindSettings = () => {
      this.settings = Gio.Settings.new(pkg.name);
      this.settings.bind(
        "window-width",
        this,
        "default-width",
        Gio.SettingsBindFlags.DEFAULT
      );
      this.settings.bind(
        "window-height",
        this,
        "default-height",
        Gio.SettingsBindFlags.DEFAULT
      );
      this.settings.bind(
        "window-maximized",
        this,
        "maximized",
        Gio.SettingsBindFlags.DEFAULT
      );
      this.settings.connect(
        "changed::preferred-theme",
        this.setPreferredColorScheme
      );
    };

    loadStyles = () => {
      const cssProvider = new Gtk.CssProvider();
      cssProvider.load_from_resource(getResourcePath("index.css"));

      Gtk.StyleContext.add_provider_for_display(
        this.display,
        cssProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_USER
      );
    };

    setPreferredColorScheme = () => {
      const preferredColorScheme = this.settings.get_string("preferred-theme");

      const { DEFAULT, FORCE_LIGHT, FORCE_DARK } = Adw.ColorScheme;
      let colorScheme = DEFAULT;

      if (preferredColorScheme === "system") {
        colorScheme = DEFAULT;
      }

      if (preferredColorScheme === "light") {
        colorScheme = FORCE_LIGHT;
      }

      if (preferredColorScheme === "dark") {
        colorScheme = FORCE_DARK;
      }

      const styleManager = this.application.get_style_manager();
      styleManager.color_scheme = colorScheme;
    };
  }
);
