import GObject from "gi://GObject";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";

import { SpellingbeeWindow } from "./window.js";
import { AboutDialog } from "./about.js";

export const SpellingbeeApplication = GObject.registerClass(
  class SpellingbeeApplication extends Adw.Application {
    constructor() {
      super({
        application_id: pkg.name,
        flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
        resource_base_path: getResourcePath(),
      });

      const quit_action = new Gio.SimpleAction({ name: "quit" });
      quit_action.connect("activate", (action) => {
        this.quit();
      });
      this.add_action(quit_action);
      this.set_accels_for_action("app.quit", ["<primary>q"]);

      const show_about_action = new Gio.SimpleAction({ name: "about" });
      show_about_action.connect("activate", (action) => {
        const aboutDialog = AboutDialog();
        aboutDialog.present(this.active_window);
      });
      this.add_action(show_about_action);
    }

    vfunc_activate() {
      let { active_window } = this;

      if (!active_window) active_window = new SpellingbeeWindow(this);

      active_window.present();
    }
  }
);
