import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import GObject from "gi://GObject";
import Gio from "gi://Gio";

import { ngettext } from "gettext";

const ranks = [
  _("Novice"),
  _("Apprentice"),
  _("Competent"),
  _("Skilled"),
  _("Masterful"),
  _("Exceptional"),
  _("Amazing"),
  _("Genius"),
];

function clamp(minimum, maximum) {
  return (number) => Math.min(Math.max(number, minimum), maximum);
}

export const RankObject = GObject.registerClass(
  {
    GTypeName: "RankObject",
    Properties: {
      rank: GObject.ParamSpec.string(
        "rank",
        "Rank",
        "A property holding the current rank",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      minimumScore: GObject.ParamSpec.int(
        "minimumScore",
        "minimum_score",
        "A property holding minimum score needed to attain this rank",
        GObject.ParamFlags.READWRITE,
        0,
        10000,
        100
      ),
      maximumScore: GObject.ParamSpec.int(
        "maximumScore",
        "maximum_score",
        "A property holding maximum score for this rank",
        GObject.ParamFlags.READWRITE,
        0,
        10000,
        100
      ),
    },
  },
  class RankObject extends GObject.Object {
    constructor(rank, minimumScore, maximumScore) {
      super();

      this.rank = rank;
      this.minimumScore = minimumScore;
      this.maximumScore = maximumScore;
    }
  }
);

export const Rankings = GObject.registerClass(
  {
    GTypeName: "Rankings",
    Template: getResourceURI("rankings.ui"),
    InternalChildren: ["container", "rankings_list_view"],
  },
  class Rankings extends Adw.Window {
    constructor(minimumScore = 0, totalScore = 100, currentScore = 0) {
      super();
      this.minimumScore = minimumScore;
      this.totalScore = totalScore;
      this.currentScore = currentScore;
      this.ranks = this.createRanks();
      
      if (!this.ranks.length) {
        // FIXME
        // No rank to display
        // Add a switch to display
        // appropriate message
      } else {
        // FIXME
        // I don't trust this solution. Review it one more time.
        this.rankObjects = this.createRankObjects();
        this.createListView();
      }
    }

    getRankMessage = () => {
      const model = this._rankings_list_view.model.model;
      let currentIndex;

      for (let i = 0; i < model.n_items; i++) {
        const item = model.get_item(i);
        if (
          this.currentScore >= item.minimumScore &&
          this.currentScore <= item.maximumScore
        ) {
          currentIndex = i;
          break;
        }
      }

      // Last rank
      if (currentIndex === model.n_items - 1) {
        return _("<small>Highest rank, congratulations</small>");
      }

      const nextItem = model.get_item(currentIndex + 1);
      const lastItem = model.get_item(model.n_items - 1);
      const pointsToNextRank = nextItem.minimumScore - this.currentScore;
      // Second last rank
      if (nextItem.rank === lastItem.rank) {
        return _(
          ngettext(
            "<small><b>%d</b> point to <b>%s</b></small>",
            "<small><b>%d</b> points to <b>%s</b></small>",
            pointsToNextRank
          )
        ).format(pointsToNextRank, nextItem.rank);
      }

      const pointsToLastRank = lastItem.minimumScore - this.currentScore;
      // Other ranks
      return _(
        ngettext(
          "<small><b>%d</b> point to <b>%s</b>, <b>%d</b> to <b>%s</b></small>",
          "<small><b>%d</b> points to <b>%s</b>, <b>%d</b> to <b>%s</b></small>",
          pointsToNextRank
        )
      ).format(
        pointsToNextRank,
        nextItem.rank,
        pointsToLastRank,
        lastItem.rank
      );
    };

    createListView = () => {
      const listStore = Gio.ListStore.new(RankObject);
      for (const { label, minValue, maxValue } of this.rankObjects) {
        listStore.append(new RankObject(label, minValue, maxValue));
      }

      const factory = new Gtk.SignalListItemFactory();
      factory.connect("setup", (_, listItem) => {
        const hBox = new Gtk.Box({
          hexpand: true,
          css_classes: ["pad-box"],
        });

        const vBox = new Gtk.Box({
          hexpand: true,
          valign: Gtk.Align.CENTER,
          orientation: Gtk.Orientation.VERTICAL,
        });

        const rankLabel = new Gtk.Label({
          xalign: 0,
          hexpand: true,
          use_markup: true,
        });
        const progressLabel = new Gtk.Label({
          xalign: 0,
          hexpand: true,
          use_markup: true,
        });

        vBox.append(rankLabel);
        vBox.append(progressLabel);

        const minimumScoreLabel = new Gtk.Label({
          xalign: 1,
          hexpand: true,
          use_markup: true,
        });

        hBox.append(vBox);
        hBox.append(minimumScoreLabel);

        listItem.child = hBox;
      });

      factory.connect("bind", (_, listItem) => {
        const item = listItem.item;
        const child = listItem.child;

        const vBox = child.get_first_child();
        const rankLabel = vBox.get_first_child();
        const progressLabel = vBox.get_last_child();
        const minimumScoreLabel = child.get_last_child();

        item.bind_property_full(
          "minimumScore",
          progressLabel,
          "visible",
          GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.DEFAULT,
          () => {
            if (
              this.currentScore >= item.minimumScore &&
              this.currentScore <= item.maximumScore
            ) {
              return [true, true];
            }
            return [true, false];
          },
          null
        );

        let rank = item.rank.toString();
        let minimumScore = item.minimumScore.toString();

        if (
          this.currentScore >= item.minimumScore &&
          this.currentScore <= item.maximumScore
        ) {
          rank = `<span weight="bold" font-size="large">${rank}</span>`;
          minimumScore = `<span weight="bold" font-size="large">${minimumScore}</span>`;
          child.add_css_class("accent");
          progressLabel.label = this.getRankMessage();
        }

        rankLabel.label = rank;
        minimumScoreLabel.label = minimumScore;
      });

      this._rankings_list_view.factory = factory;
      this._rankings_list_view.model = Gtk.NoSelection.new(listStore);
    };

    createRanks = () => {
      const diff = this.totalScore - this.minimumScore;
      // Successive ranks must differ by at least 5 points
      if (diff >= ranks.length * 5) return ranks;

      // If taking all ranks can't give at least 5 points diff between
      // successive ranks, use a fraction of the ranks but there
      // must be at least 4 ranks.
      const rankCount = Math.floor(diff / 5);
      if (rankCount >= 4) return ranks.slice(0, rankCount);

      // If the above conditions are not met, don't display ranks. Instead
      // display an appropriate UI indicating as such.
      return [];
    };

    createRankObjects = () => {
      const step = Math.ceil(
        (this.totalScore - this.minimumScore) / this.ranks.length
      );

      const rankObjects = [];
      const clampScores = clamp(this.minimumScore, this.totalScore);

      for (let i = 0; i < this.ranks.length; i++) {
        const minValue = clampScores(i * step);
        let maxValue = clampScores((i + 1) * step);

        if (maxValue < this.totalScore) maxValue--;
        rankObjects.push({ minValue, maxValue, label: this.ranks[i] });
      }
      return rankObjects;
    };
  }
);
