import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import GObject from "gi://GObject";
import Gio from "gi://Gio";

import { Words } from "./words.js";

const columnTitles = [
  _("No."),
  _("Center Letter"),
  _("Outer Letters"),
  _("Score"),
  _("Total Score"),
  _("Words"),
];

export const StatObject = GObject.registerClass(
  {
    GTypeName: "StatObject",
    Properties: {
      stat: GObject.ParamSpec.jsobject(
        "stat",
        "Stat",
        "A property holding puzzle statistics",
        GObject.ParamFlags.READWRITE
      ),
    },
  },
  class StatObject extends GObject.Object {
    constructor(stat) {
      super();
      this.stat = stat;
    }
  }
);

export const Statistics = GObject.registerClass(
  {
    GTypeName: "Statistics",
    Template: getResourceURI("statistics.ui"),
    InternalChildren: ["statistics_stack", "container", "stat_column_view"],
  },
  class Statistics extends Adw.Window {
    constructor(stat) {
      super();

      if (stat?.length) {
        this.stat = stat;
        this.createView();
        this._statistics_stack.visible_child_name = "has_statistics";
      } else {
        this._statistics_stack.visible_child_name = "no_statistics";
      }
    }

    createView = () => {
      const listStore = Gio.ListStore.new(StatObject);
      const stat = this.stat;

      for (let i = 0; i < stat.length; i++) {
        listStore.append(new StatObject(stat[i]));
      }

      this._stat_column_view.model = Gtk.NoSelection.new(listStore);

      for (let i = 0; i < columnTitles.length; i++) {
        const factory = Gtk.SignalListItemFactory.new();

        factory.connect("setup", (binding, listItem) => {
          if (i < columnTitles.length - 1) {
            listItem.child = new Gtk.Label();
          } else {
            listItem.child = new Gtk.Button({
              icon_name: "spelling-bee-view-more-symbolic",
              css_classes: ["flat"],
              tooltip_text: _("View words"),
            });
          }
        });

        factory.connect("bind", (binding, listItem) => {
          const child = listItem.child;
          const item = listItem.item.stat;
          if (i < columnTitles.length - 1) {
            child.label = item[i].toString();
          } else {
            child.connect("clicked", () => {
              const wordsWindow = new Words(item.at(-1));
              wordsWindow.set_transient_for(this);
              wordsWindow.present();
            });
          }
        });

        const column = Gtk.ColumnViewColumn.new(columnTitles[i], factory);
        column.expand = true;
        this._stat_column_view.append_column(column);
      }
    };
  }
);
