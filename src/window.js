import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

import { Hexagon, Container } from "./hexagon.js";
import { Help, HelpObject } from "./help.js";
import { HowToPlay } from "./how-to-play.js";
import { Rankings } from "./rankings.js";
import { Statistics } from "./statistics.js";
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
  createHelpObject,
  getTwoLetterList,
} from "./util.js";

import { newGameAlert, solveGameAlert, goBackAlert } from "./alert-dialogs.js";

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
      "main_stack",
      "container",
      "help_button",
      "entry",
      "button_help",
      "progress_bar",
      "words_stack",
      "flowbox",
      "solution_view_letters",
      "solution_view_statistics",
      "solution_view_word_list",
    ],
  },
  class SpellingbeeWindow extends Adw.ApplicationWindow {
    constructor(application) {
      super({ application });

      this.initState();
      this.createUI();
      this.createActions();
      this.createControlActions();
      this.createToast();
      this.loadStyles();
      this.bindSettings();
      this.bindProperties();
      this.setPreferredColorScheme();

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
    }

    createActions = () => {
      const recycleQuizAction = new Gio.SimpleAction({
        name: "recycle-quiz",
      });
      recycleQuizAction.connect("activate", () => {
        const filePath = getFilePath(["data.json"]);
        const savedData = this.getSavedData(filePath);

        if (savedData?.length) {
          this.deleteSavedData(filePath);
          this.beeState.attempted = this.beeState.attempted.slice(-1);
          this.displayToast(_("Recycled attempted quiz"));
        } else {
          this.displayToast(_("No attempted quiz"));
        }
      });

      const newGameAction = new Gio.SimpleAction({
        name: "new-game",
      });
      newGameAction.connect("activate", () => {
        const alertDialog = newGameAlert();

        alertDialog.connect("response", (_alertDialog, response) => {
          if (response === "close_dialog") return;
          this.startNewGame();
        });

        alertDialog.present(this);
      });

      const solveGameAction = new Gio.SimpleAction({
        name: "solve-game",
      });
      solveGameAction.connect("activate", () => {
        const alertDialog = solveGameAlert();

        alertDialog.connect("response", (_alertDialog, response) => {
          if (response === "close_dialog") return;
          this.solveGame();
        });

        alertDialog.present(this);
      });

      const howToPlayAction = new Gio.SimpleAction({
        name: "how-to-play",
      });
      howToPlayAction.connect("activate", () => {
        const howToPlay = new HowToPlay();
        howToPlay.set_transient_for(this);
        howToPlay.present();
      });

      const rankingsAction = new Gio.SimpleAction({
        name: "rankings",
      });
      rankingsAction.connect("activate", () => {
        const rankings = new Rankings(
          0,
          this.beeState.totalScore,
          this.beeState.currentScore
        );

        rankings.set_transient_for(this);
        rankings.present();
      });

      const statisticsAction = new Gio.SimpleAction({
        name: "statistics",
      });
      statisticsAction.connect("activate", () => {
        const stats = this.beeState.attempted
          .slice(0, -1) // Exclude the current puzzle. Consider filtering instead of this.
          .map((object, index) => {
            let { centerLetter, letters, words } = data[object.index];

            centerLetter = toUpperCase(centerLetter);
            letters = toUpperCase(letters);

            let totalScore = 0;
            let wordsTitleCase = [];

            for (const word of words) {
              wordsTitleCase.push(toTitleCase(word));
              totalScore += getPoints(toUpperCase(word), letters);
            }

            return [
              index + 1,
              centerLetter,
              letters.replaceAll(centerLetter, ""),
              object.score,
              totalScore,
              wordsTitleCase,
            ];
          });

        const statistics = new Statistics(stats);
        statistics.set_transient_for(this);
        statistics.present();
      });

      const goBackToPuzzleViewAction = new Gio.SimpleAction({
        name: "go-back",
      });
      goBackToPuzzleViewAction.connect("activate", () => {
        const alertDialog = goBackAlert();

        alertDialog.connect("response", (_alertDialog, response) => {
          if (response === "close_dialog") return;
          this.startNewGame();
          this._main_stack.visible_child_name = "puzzle_view";
        });

        alertDialog.present(this);
      });

      const toggleHelpMenu = new Gio.SimpleAction({
        name: "help"
      });
      toggleHelpMenu.connect("activate", () => {
        this._help_button.active = !this._help_button.active
      })

      this.add_action(recycleQuizAction);
      this.add_action(newGameAction);
      this.add_action(solveGameAction);
      this.add_action(howToPlayAction);
      this.add_action(rankingsAction);
      this.add_action(statisticsAction);
      this.add_action(goBackToPuzzleViewAction);
      this.add_action(toggleHelpMenu)
    };

    createControlActions = () => {
      const actions = ["hint", "shuffle", "check", "delete"];

      for (const action of actions) {
        this.add_action(Gio.SimpleAction.new(action, null));
      }

      this.lookup_action("hint")?.connect("activate", () => {
        this.showHint();
      });
      this.lookup_action("shuffle")?.connect("activate", () => {
        this.shuffleLetters();
      });
      this.lookup_action("check")?.connect("activate", () => {
        this.checkEntry();
      });
      this.lookup_action("delete")?.connect("activate", () => {
        this.deleteEntry();
      });
    };

    updateScore = () => {
      const currScore = this.beeState.currentScore;
      const totScore = this.beeState.totalScore;

      const fraction = round(currScore / totScore, 2);
      const text =
        format.format(currScore) + " out of " + format.format(totScore);

      this._progress_bar.fraction = fraction;
      this._progress_bar.text = text;
    };

    initState = () => {
      const filePath = getFilePath(["data.json"]);
      let attemptedPuzzles = this.getSavedData(filePath);
      const allIndices = Array.from(
        { length: data.length },
        (_, index) => index
      );

      const unAttemptedIndices = allIndices.filter((index) => {
        return (
          attemptedPuzzles.findIndex((object) => object.index === index) === -1
        );
      });

      let randInt;

      if (unAttemptedIndices.length) {
        const index = getRandInt(0, unAttemptedIndices.length - 1);
        randInt = unAttemptedIndices[index];
      } else {
        randInt = getRandInt(0, data.length - 1);
        attemptedPuzzles = [];
      }

      let { centerLetter, letters, words } = data[randInt];

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
      spellBeeObj.currentScore = 0;

      let totalScore = 0;
      for (const word of words) {
        totalScore += getPoints(toUpperCase(word), toUpperCase(letters));
      }

      spellBeeObj.totalScore = totalScore;
      spellBeeObj.attempted = attemptedPuzzles;

      spellBeeObj.attempted.push({
        index: randInt,
        score: spellBeeObj.currentScore,
      });
      // We need to keep the statistics for the last 20 games.
      // The current puzzle makes the number of attempted puzzles equal 21
      spellBeeObj.attempted = spellBeeObj.attempted.slice(-21);

      this.beeState = new BeeState(spellBeeObj);
      this.updateScore();
      this.saveData(this.beeState.attempted, filePath);
    };

    startNewGame = () => {
      const allIndices = Array.from(
        { length: data.length },
        (_, index) => index
      );

      const notAttemptedIndices = allIndices.filter((index) => {
        const searchIndex = this.beeState.attempted.findIndex(
          (object) => object.index === index
        );

        return searchIndex === -1;
      });

      let randInt;

      if (notAttemptedIndices.length) {
        const index = getRandInt(0, notAttemptedIndices.length);
        randInt = notAttemptedIndices[index];
      } else {
        randInt = getRandInt(0, data.length);
        this.beeState.attempted = [];
      }

      let { centerLetter, letters, words } = data[randInt];

      const centreLetterItem = this.beeState.centerLetter.get_item(0);
      centreLetterItem.letter = toUpperCase(centerLetter);

      const outerLetters = letters.replaceAll(centerLetter, "");

      for (let i = 0; i < outerLetters.length; i++) {
        const item = this.beeState.outerLetters.get_item(i);
        item.letter = toUpperCase(outerLetters[i]);
      }

      this.beeState.words = words.map((word) => toUpperCase(word));
      this.beeState.wordsFound.remove_all();
      this.beeState.currentScore = 0;

      this.beeState.attempted.push({
        index: randInt,
        score: this.beeState.currentScore,
      });
      // We need to keep the statistics for the last 20 games.
      // The current puzzle makes the number of attempted puzzles equal 21
      this.beeState.attempted = this.beeState.attempted.slice(-21);

      let totalScore = 0;
      for (const word of words) {
        totalScore += getPoints(toUpperCase(word), toUpperCase(letters));
      }
      this.beeState.totalScore = totalScore;

      this.updateScore();

      const filePath = getFilePath(["data.json"]);
      this.saveData(this.beeState.attempted, filePath);
    };

    getLettersLabel = (centerLetter, outerLetters) => {
      const styleManager = this.application.get_style_manager();
      let color = "#FACB1C";
      if (styleManager.dark) {
        color = "#B98E5F";
      }
      const lettersLabel =
        `<span letter_spacing="12288">` +
        `<span size="xx-large" color="${color}" weight="ultrabold">${centerLetter}</span>` +
        `<span size="x-large" weight="bold" >${outerLetters}</span>` +
        `</span>`;
      return lettersLabel;
    };

    solveGame = () => {
      const centerLetter = this.beeState.getCenterLetter();
      const outerLetters = this.beeState
        .getOuterLetters()
        .split("")
        .sort()
        .join("");
      const lettersLabel = this.getLettersLabel(centerLetter, outerLetters);

      const totalScore = this.beeState.totalScore;
      const wordCount = this.beeState.words.length;
      const statisticsLabel = _("%d words · %d points").format(
        wordCount,
        totalScore
      );

      const listStore = Gio.ListStore.new(CorrectWord);
      for (const word of this.beeState.words) {
        listStore.append(new CorrectWord(toTitleCase(word)));
      }

      this._solution_view_letters.label = lettersLabel;
      this._solution_view_statistics.label = statisticsLabel;
      this._solution_view_word_list.bind_model(listStore, (item) => {
        const word = item.correctWord;
        return new Gtk.LinkButton({
          child: new Gtk.Label({
            label: word,
            xalign: 0,
          }),
          uri: item.getUri("https://gcide.gnu.org.ua/"),
        });
      });

      this._main_stack.visible_child_name = "solution_view";
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
      const outerLetters = this.beeState.getOuterLetters();
      const shuffledOuterLetters = shuffle(outerLetters.split(""));

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

      const centerLetter = this.beeState.getCenterLetter();
      const outerLetters = this.beeState.getOuterLetters();

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

        this.updateScore();

        const filePath = getFilePath(["data.json"]);
        this.beeState.attempted.at(-1).score++;

        this.saveData(this.beeState.attempted, filePath);
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

    showHint = () => {
      const hintWindow = new Help();

      const centerLetter = this.beeState.getCenterLetter();
      const outerLetters = this.beeState
        .getOuterLetters()
        .split("")
        .sort()
        .join("");
      const lettersLabel = this.getLettersLabel(centerLetter, outerLetters);

      const totalScore = this.beeState.totalScore;
      const wordCount = this.beeState.words.length;
      const statisticsLabel = _("%d words · %d points").format(
        wordCount,
        totalScore
      );

      hintWindow._letters.label = lettersLabel;
      hintWindow._statistics.label = statisticsLabel;

      const letters = centerLetter + outerLetters;
      const helpObject = createHelpObject(letters, this.beeState.words);
      const columnTitles = helpObject[0];

      const listStore = Gio.ListStore.new(HelpObject);
      for (let i = 1; i < helpObject.length; i++) {
        listStore.append(new HelpObject(columnTitles, helpObject[i]));
      }

      hintWindow._help_column_view.model = Gtk.NoSelection.new(listStore);

      for (const title of columnTitles) {
        const factory = Gtk.SignalListItemFactory.new();
        factory.connect("setup", (_, listItem) => {
          listItem.child = new Gtk.Label();
        });

        if (title) {
          factory.connect("bind", (_, listItem) => {
            const { child, item } = listItem;
            child.label = item.helpObject[title];
          });
        } else {
          factory.connect("bind", (_, listItem) => {
            const { child, item } = listItem;
            child.label = item.helpObject.firstValue;
          });
        }

        const column = Gtk.ColumnViewColumn.new(title.toString(), factory);
        column.expand = true;
        hintWindow._help_column_view.append_column(column);
      }

      const twoLetterList = getTwoLetterList(this.beeState.words.toSorted());
      const twoLetterListStore = Gio.ListStore.new(CorrectWord);

      for (const wordCountPair of twoLetterList) {
        const word = toUpperCase(wordCountPair.join("-"));
        twoLetterListStore.append(new CorrectWord(word));
      }

      hintWindow._two_letter_list.bind_model(twoLetterListStore, (item) => {
        const word = item.correctWord;
        const bin = new Adw.Bin({
          child: new Gtk.Label({
            vexpand: true,
            hexpand: true,
            label: word,
            selectable: true,
          }),
          css_classes: ["card", "pad-box"],
        });
        return bin;
      });

      hintWindow.set_transient_for(this);
      hintWindow.present();
    };

    deleteEntry() {
      const text = this._entry.get_text();
      if (!text) return;

      this._entry.set_text("");
    }

    hexClickHandler = (_hexagon, label) => {
      const labelUpperCase = toUpperCase(label);
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

    bindProperties = () => {
      this._entry.connect("icon-press", this.entryIconPressHandler);
      this._flowbox.bind_model(this.beeState.wordsFound, this.createWidgetFunc);
      this.beeState.wordsFound.bind_property_full(
        "n_items",
        this._words_stack,
        "visible_child_name",
        GObject.BindingFlags.SYNC_CREATE |
          GObject.BindingFlags.SYNC_CREATE.DEFAULT,
        (binding, nItems) => {
          if (nItems) return [true, "words_found"];
          return [true, "no_words_found"];
        },
        null
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
