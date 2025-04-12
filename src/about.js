import Adw from "gi://Adw";
import Gtk from "gi://Gtk";

const URL = "https://github.com/josephmawa/SpellingBee";

const aboutParams = {
  application_name: APP_NAME,
  developer_name: "Joseph Mawa",
  application_icon: pkg.name,
  version: pkg.version,
  license_type: Gtk.License.LGPL_3_0,
  developers: ["Joseph Mawa"],
  artists: ["Joseph Mawa"],
  copyright: "Copyright © 2025 Joseph Mawa",
  translator_credits: _("translator-credits"),
  website: URL,
  issue_url: URL + "/issues",
  support_url: URL + "/issues",
};

export const AboutDialog = () => {
  return new Adw.AboutDialog(aboutParams);
};
