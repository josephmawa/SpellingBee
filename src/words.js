import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk";

export const Words = GObject.registerClass(
  {
    GTypeName: "Words",
    Template: getResourceURI("words.ui"),
    InternalChildren: ["words_flowbox"],
  },
  class Words extends Adw.Window {
    constructor(words) {
      super();

      this._words_flowbox.bind_model(Gtk.StringList.new(words), (item) => {
        return new Gtk.LinkButton({
          child: new Gtk.Label({
            label: item.string,
            xalign: 0,
          }),
          uri: `https://gcide.gnu.org.ua/?q=${item.string}&define=Define`,
        });
      });
    }
  }
);
