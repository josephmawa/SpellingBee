import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

import { Hexagon, Container } from "./hexagon.js";
import { data } from "./data.js";
import { Letter, CorrectWord } from "./letter.js";
import {
  getRandInt,
  shuffle,
  toLowerCase,
  toUpperCase,
  toTitleCase,
  getPoints,
  getToastMessage,
  round,
} from "./util.js";

import { BeeState } from "./bee.js";

const outerLetterObjects = [
  { label: "", position: "LEFT" },
  { label: "", position: "RIGHT" },
  { label: "", position: "TOP_LEFT" },
  { label: "", position: "TOP_RIGHT" },
  { label: "", position: "BOTTOM_LEFT" },
  { label: "", position: "BOTTOM_RIGHT" },
];

function getFilePath(args) {
  const DATA_DIR = GLib.get_user_data_dir();
  return GLib.build_filenamev([DATA_DIR, "spelling-bee", ...args]);
}

const format = new Intl.NumberFormat("en-US", { style: "decimal" });

export const SpellingbeeWindow = GObject.registerClass(
  {
    GTypeName: "SpellingbeeWindow",
    Properties: {
      beeState: GObject.ParamSpec.object(
        "beeState",
        "bee_state",
        "A property holding the state of the current Spelling Bee",
        GObject.ParamFlags.READWRITE,
        BeeState
      ),
    },
    Template: getResourceURI("window.ui"),
    InternalChildren: [
      "toast_overlay",
      "container",
      "entry",
      "progress_bar",
      "flowbox",
    ],
  },
  class SpellingbeeWindow extends Adw.ApplicationWindow {
    constructor(application) {
      super({ application });

      this.initState();
      this.createUI();
      this.createToast();
      this.loadStyles();
      this.bindSettings();
      this.setPreferredColorScheme();

      this.correctWordsModel = Gio.ListStore.new(CorrectWord);

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
      this._flowbox.bind_model(this.beeState.wordsFound, this.createWidgetFunc);
    }

    initState = () => {
      const filePath = getFilePath(["data.json"]);
      let attemptedSpellBeeIndices = this.getSavedData(filePath);
      const allIndices = Array.from(
        { length: data.length },
        (_, index) => index
      );

      const unAttemptedSpellBeeIndices = allIndices.filter(
        (index) => !attemptedSpellBeeIndices.includes(index)
      );

      let randInt;

      if (unAttemptedSpellBeeIndices.length) {
        const index = getRandInt(0, unAttemptedSpellBeeIndices.length - 1);
        randInt = unAttemptedSpellBeeIndices[index];
      } else {
        randInt = getRandInt(0, data.length - 1);
        attemptedSpellBeeIndices = [];
      }

      let { centerLetter, letters, words } = data[randInt];

      centerLetter = Array.isArray(centerLetter)
        ? centerLetter[0]
        : centerLetter;

      const spellBeeObj = {};
      spellBeeObj.centerLetter = Gio.ListStore.new(Letter);
      spellBeeObj.centerLetter.append(
        new Letter(toUpperCase(centerLetter), "CENTER")
      );

      spellBeeObj.outerLetters = Gio.ListStore.new(Letter);
      const outerLetters = letters.replaceAll(centerLetter, "");

      for (let i = 0; i < outerLetters.length; i++) {
        const object = { ...outerLetterObjects[i] };
        object.label = toUpperCase(outerLetters[i]);

        spellBeeObj.outerLetters.append(
          new Letter(object.label, object.position)
        );
      }

      spellBeeObj.words = words.map((word) => toUpperCase(word));
      spellBeeObj.wordsFound = Gio.ListStore.new(CorrectWord);

      let currentScore = 0,
        totalScore = 0;
      for (const word of words) {
        totalScore += getPoints(toUpperCase(word), toUpperCase(letters));
      }

      spellBeeObj.currentScore = currentScore;
      spellBeeObj.totalScore = totalScore;

      attemptedSpellBeeIndices.push(randInt);
      this.saveData(attemptedSpellBeeIndices, filePath);

      spellBeeObj.attempted = attemptedSpellBeeIndices;

      this.beeState = new BeeState(spellBeeObj);
      this._progress_bar.fraction = round(currentScore / totalScore, 2);
      this._progress_bar.text =
        format.format(currentScore) + " out of " + format.format(totalScore);
    };

    createUI = () => {
      const centerLetter = this.beeState.centerLetter.get_item(0);
      const centerHexagon = new Hexagon({
        label: centerLetter.letter,
        position: centerLetter.position,
      });
      centerLetter.bind_property(
        "letter",
        centerHexagon,
        "label",
        GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE
      );

      centerHexagon.connect("click", this.hexClickHandler);

      const container = new Container({ gap: 8 });
      container.appendChild(centerHexagon);

      const outerLetters = this.beeState.outerLetters;

      for (let i = 0; i < outerLetters.n_items; i++) {
        const outerLetter = outerLetters.get_item(i);

        const outerHexagon = new Hexagon({
          label: outerLetter.letter,
          position: outerLetter.position,
        });

        outerLetter.bind_property(
          "letter",
          outerHexagon,
          "label",
          GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE
        );

        outerHexagon.connect("click", this.hexClickHandler);
        container.appendChild(outerHexagon);
      }

      this._container.append(container);
    };

    shuffleLetters() {
      const outerLetters = [];

      for (let i = 0; i < this.beeState.outerLetters.n_items; i++) {
        const item = this.beeState.outerLetters.get_item(i);
        outerLetters.push(item.letter);
      }

      const shuffledOuterLetters = shuffle(outerLetters);

      for (let i = 0; i < this.beeState.outerLetters.n_items; i++) {
        const item = this.beeState.outerLetters.get_item(i);
        item.letter = shuffledOuterLetters[i];
      }
    }

    checkEntry() {
      const word = this._entry.get_text();

      if (word.length < 4) {
        this.displayToast(_("Too Short"));
        return;
      }

      const centerLetter = this.beeState.centerLetter.get_item(0).letter;
      let outerLetters = "";

      for (let i = 0; i < this.beeState.outerLetters.n_items; i++) {
        outerLetters += this.beeState.outerLetters.get_item(i).letter;
      }

      const wordSet = new Set(word);
      const lettersSet = new Set(outerLetters + centerLetter);

      if (!lettersSet.isSupersetOf(wordSet)) {
        this.displayToast(_("Contains Invalid Letter"));
        return;
      }

      if (!word.includes(centerLetter)) {
        this.displayToast(_("Missing Center Letter"));
        return;
      }

      let wordFound = false;

      for (let i = 0; i < this.beeState.wordsFound.n_items; i++) {
        const item = this.beeState.wordsFound.get_item(i);
        if (item.correctWord === word) {
          wordFound = true;
          break;
        }
      }

      if (wordFound) {
        this.displayToast(_("Already Found"));
        return;
      }

      if (!this.beeState.words.includes(word)) {
        this.displayToast(_("Word Not Found"));
        return;
      }

      if (this.beeState.words.includes(word)) {
        const points = getPoints(word, centerLetter + outerLetters);
        const message = getToastMessage(points);

        this.displayToast(message);
        this.beeState.currentScore += points;

        this.beeState.wordsFound.append(new CorrectWord(word));
        this._entry.set_text("");

        const curScore = this.beeState.currentScore;
        const totScore = this.beeState.totalScore;
        this._progress_bar.fraction = round(curScore / totScore, 2);
        this._progress_bar.text =
          format.format(curScore) + " out of " + format.format(totScore);
      }
    }

    createWidgetFunc = (item) => {
      const word = item.correctWord;
      const bin = new Adw.Bin({
        child: new Gtk.Label({
          vexpand: true,
          hexpand: true,
          label: toTitleCase(word),
          selectable: true,
        }),
        css_classes: ["card", "pad-box"],
      });
      return bin;
    };

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
      this.checkEntry();
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

    getSavedData = (filePath) => {
      const file = Gio.File.new_for_path(filePath);
      const path = file.get_path();
      const fileExists = GLib.file_test(path, GLib.FileTest.EXISTS);

      if (!fileExists) {
        const data = [];
        this.saveData(data, filePath);
        return data;
      }

      const [success, arrBuff] = GLib.file_get_contents(path);

      if (success) {
        const decoder = new TextDecoder("utf-8");
        const savedData = JSON.parse(decoder.decode(arrBuff));
        return savedData;
      } else {
        return [];
      }
    };

    saveData = (data = [], filePath) => {
      const file = Gio.File.new_for_path(filePath);
      const path = file.get_parent().get_path();

      // 0o777 is file permission, ugo+rwx, in numeric mode
      const flag = GLib.mkdir_with_parents(path, 0o777);

      if (flag === 0) {
        const [success, tag] = file.replace_contents(
          JSON.stringify(data),
          null,
          false,
          Gio.FileCreateFlags.REPLACE_DESTINATION,
          null
        );

        if (success) {
          return true;
        } else {
          return false;
        }
      }

      if (flag === -1) {
        return false;
      }
    };

    deleteSavedData = (path) => {
      const file = Gio.File.new_for_path(path);
      const filePath = file.get_path();

      const fileExists = GLib.file_test(filePath, GLib.FileTest.EXISTS);
      if (!fileExists) {
        throw new Error(filePath + " doesn't exist");
      }

      const dirPath = file.get_parent()?.get_path();

      const fileDeleteFlag = file.delete(null);
      if (!fileDeleteFlag) {
        throw new Error("Failed to delete " + filePath);
      }

      const dirDeleteFlag = GLib.rmdir(dirPath);
      if (dirDeleteFlag !== 0) {
        throw new Error("Failed to delete " + dirPath);
      }
    };
  }
);
