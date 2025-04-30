import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import GObject from "gi://GObject";

const rulesHeader = _("The Rules");
const rules = [
  _('Create words using the <span weight="ultrabold">provided letters</span>'),
  _(
    'The words <span weight="ultrabold">must contain at least 4 letters</span>'
  ),
  _('Each word <span weight="ultrabold">must include the center letter</span>'),
  _(
    'Provided <span weight="ultrabold">letters can be used more than once</span>'
  ),
];

const scoresHeader = _("The Scores");
const scores = [
  _(
    'Each <span weight="ultrabold">four-letter</span> word is worth <span  weight="ultrabold">one point</span>'
  ),
  _(
    '<span weight="ultrabold">Longer words</span> earn <span weight="ultrabold">one point per letter</span>'
  ),
  _(
    'Words containing <span weight="ultrabold">all the letters</span> earn <span weight="ultrabold">seven additional points</span>'
  ),
];

const aboutHintsHeader = _("About Hints");

export const HowToPlay = GObject.registerClass(
  {
    GTypeName: "HowToPlay",
    Template: getResourceURI("how-to-play.ui"),
    InternalChildren: ["wrapper"],
  },
  class extends Adw.Window {
    constructor() {
      super();

      this._wrapper.append(this.createTitle(rulesHeader));
      this._wrapper.append(this.createUnorderedList(rules));

      this._wrapper.append(this.createTitle(scoresHeader));
      this._wrapper.append(this.createUnorderedList(scores));

      this._wrapper.append(this.createTitle(aboutHintsHeader));
    }

    createUnorderedList = (list) => {
      const box = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_start: 18,
      });

      for (const text of list) {
        box.append(this.createListItem(text));
      }

      return box;
    };

    createTitle = (title) =>
      new Gtk.Label({
        label: title,
        css_classes: ["title-2"],
        wrap: true,
        margin_bottom: 12,
        xalign: 0,
      });

    createListItem = (text) => {
      const middotBox = new Gtk.Box({
        valign: Gtk.Align.START,
      });
      const labelBox = new Gtk.Box();

      middotBox.append(
        new Gtk.Label({
          use_markup: true,
          label: '<span weight="ultrabold">•</span>',
        })
      );
      labelBox.append(
        new Gtk.Label({ label: text, use_markup: true, xalign: 0, wrap: true })
      );

      const wrapperBox = new Gtk.Box({
        spacing: 5,
      });
      wrapperBox.append(middotBox);
      wrapperBox.append(labelBox);

      return wrapperBox;
    };
  }
);
