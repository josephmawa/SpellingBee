import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

import { Hexagon, Container } from "./hexagon.js";
import { data } from "./data.js";
import { Letter } from "./letter.js";
import { getRandInt, shuffle } from "./util.js";

const outerLetterObjects = [
  { label: "", position: "LEFT" },
  { label: "", position: "RIGHT" },
  { label: "", position: "TOP_LEFT" },
  { label: "", position: "TOP_RIGHT" },
  { label: "", position: "BOTTOM_LEFT" },
  { label: "", position: "BOTTOM_RIGHT" },
];

export const SpellingbeeWindow = GObject.registerClass(
  {
    GTypeName: "SpellingbeeWindow",
    Template: getResourceURI("window.ui"),
    InternalChildren: ["toast_overlay", "container", "entry", "flowbox"],
  },
  class SpellingbeeWindow extends Adw.ApplicationWindow {
    constructor(application) {
      super({ application });

      this.createUI();
      this.createToast();
      this.loadStyles();
      this.bindSettings();
      this.setPreferredColorScheme();
      // this.populateFlowbox();

      /**
       * NOTE
       * You can't connect insert-text event to Gtk.Entry directly.
       * Read more about it in the following reference docs:
       * • https://gitlab.gnome.org/GNOME/gtk/-/issues/4315
       * • https://docs.gtk.org/gtk4/iface.Editable.html#implementing-gtkeditable
       */
      this.signalId = this._entry
        .get_delegate()
        .connect("insert-text", this.insertTextHandler);

      this._entry.connect("icon-press", this.entryIconPressHandler);
    }

    createUI = () => {
      const randInt = getRandInt(0, data.length - 1);
      const { centerLetter, letters, words } = data[randInt];
      this.words = words.map((word) => word.toLocaleUpperCase("en-US"));
      this.wordsFound = [];

      this.outerLetters = Gio.ListStore.new(Letter);
      this.centerLetter = new Letter(
        centerLetter[0].toLocaleUpperCase("en-US"),
        "CENTER"
      );

      const outerLetters = letters.replaceAll(centerLetter[0], "");

      const container = new Container({ gap: 8 });
      const centerHexagon = new Hexagon({
        label: this.centerLetter.letter,
        position: this.centerLetter.position,
      });
      centerHexagon.connect("click", this.hexClickHandler);
      container.appendChild(centerHexagon);

      console.assert(
        outerLetterObjects.length === outerLetters.length,
        "Number of letters must equal number of outer letter objects"
      );

      for (let i = 0; i < outerLetters.length; i++) {
        const object = { ...outerLetterObjects[i] };
        object.label = outerLetters[i].toLocaleUpperCase("en-US");

        const letterObject = new Letter(object.label, object.position);
        const outerHexagon = new Hexagon(object);

        letterObject.bind_property(
          "letter",
          outerHexagon,
          "label",
          GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE
        );
        outerHexagon.connect("click", this.hexClickHandler);
        this.outerLetters.append(letterObject);
        container.appendChild(outerHexagon);
      }

      this._container.append(container);
    };

    shuffleLetters() {
      const outerLetters = [];

      for (let i = 0; i < this.outerLetters.n_items; i++) {
        const item = this.outerLetters.get_item(i);
        outerLetters.push(item.letter);
      }

      const shuffledOuterLetters = shuffle(outerLetters);

      for (let i = 0; i < this.outerLetters.n_items; i++) {
        const item = this.outerLetters.get_item(i);
        item.letter = shuffledOuterLetters[i];
      }
    }

    checkEntry() {
      const word = this._entry.get_text();
      if (word.length < 4) {
        this.displayToast(_("Too Short"));
        return;
      }

      if (!word.includes(this.centerLetter.letter)) {
        this.displayToast(_("Missing Center Letter"));
        return;
      }

      if (this.wordsFound.includes(word)) {
        this.displayToast(_("Already Found"));
        return;
      }

      if (!this.words.includes(word)) {
        this.displayToast(_("Word Not Found"));
        return;
      }

      if (this.words.includes(word)) {
        // Be sure to check score and display
        // appropriate toast message instead
        // of this.
        this.displayToast(_("Good +1"));
        this.wordsFound.push(word);
        this._entry.set_text("");
      }
    }

    entryIconPressHandler = (entry, iconPos) => {
      if (Gtk.EntryIconPosition.SECONDARY === iconPos) {
        const text = entry.get_text();
        if (!text) return;

        entry.set_text(text.slice(0, -1));
      }
    };

    deleteEntry() {
      const text = this._entry.get_text();
      if (!text) return;

      this._entry.set_text("");
    }

    hexClickHandler = (_hexagon, label) => {
      const labelUpperCase = label.toLocaleUpperCase("en-US");
      this._entry.insert_text(
        labelUpperCase,
        labelUpperCase.length,
        this._entry.text.length
      );
    };

    submitWord(entry) {
      console.log(entry.get_text());
    }

    wordChanged(entry) {
      // Move cursor to the end of the text
      entry.set_position(-1);
    }

    insertTextHandler = (editable, text, length, position) => {
      const textUpperCase = text.toLocaleUpperCase("en-US");

      const signalId = GObject.signal_lookup("insert-text", editable);
      const handlerId = GObject.signal_handler_find(
        editable,
        GObject.SignalMatchType.ID,
        signalId,
        GLib.quark_to_string(0),
        null,
        null,
        null
      );

      GObject.signal_handler_block(editable, handlerId);

      if (/^[A-Z]+$/.test(textUpperCase)) {
        editable.insert_text(
          textUpperCase,
          textUpperCase.length,
          editable.text.length
        );
      }

      GObject.signal_handler_unblock(editable, handlerId);
      GObject.signal_stop_emission(editable, signalId, GLib.quark_to_string(0));
    };

    // This is for creating a placeholder text.
    // Remove it later.
    populateFlowbox = () => {
      for (const word of words.slice(40)) {
        const item = new Adw.Bin({
          child: new Gtk.Label({
            vexpand: true,
            hexpand: true,
            label: word,
            selectable: true,
          }),
          css_classes: ["card", "pad-box"],
        });

        this._flowbox.append(item);
      }
    };

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

    createToast = (timeout = 1) => {
      this.toast = new Adw.Toast({ timeout });
    };

    displayToast = (message) => {
      this.toast.dismiss();
      this.toast.title = message;
      this._toast_overlay.add_toast(this.toast);
    };
  }
);
