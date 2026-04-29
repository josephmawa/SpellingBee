import Adw from "gi://Adw";
import GObject from "gi://GObject";

export const PreferencesDialog = GObject.registerClass(
  {
    GTypeName: "PreferencesDialog",
    Template: getResourceURI("preferences.ui"),
  },
  class PreferencesDialog extends Adw.PreferencesDialog {
    constructor(options = {}) {
      super(options);
    }
  },
);
