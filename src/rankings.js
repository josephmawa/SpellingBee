import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import GObject from "gi://GObject";
import Gio from "gi://Gio";

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
        // No rank to display
      } else {
        this.rankObjects = this.createRankObjects();
        this.createListView();
      }
    }

    createListView = () => {
      const listStore = Gio.ListStore.new(RankObject);
      for (const { label, minValue, maxValue } of this.rankObjects) {
        listStore.append(new RankObject(label, minValue, maxValue));
      }

      const factory = new Gtk.SignalListItemFactory();
      factory.connect("setup", (_, listItem) => {
        const hbox = new Gtk.Box({
          hexpand: true,
          spacing: 40,
          homogeneous: true,
        });

        const rankLabel = new Gtk.Label({
          xalign: 0,
          css_classes: ["pad-box"],
        });
        const minimumScoreLabel = new Gtk.Label({
          xalign: 1,
          css_classes: ["pad-box"],
        });

        hbox.append(rankLabel);
        hbox.append(minimumScoreLabel);

        listItem.child = hbox;
      });

      factory.connect("bind", (_, listItem) => {
        const item = listItem.item;
        const child = listItem.child;

        if (
          this.currentScore >= item.minimumScore &&
          this.currentScore <= item.maximumScore
        ) {
          child.add_css_class("accent");
        }

        const rankLabel = child.get_first_child();
        const minimumScoreLabel = child.get_last_child();

        rankLabel.label = item.rank.toString();
        minimumScoreLabel.label = item.minimumScore.toString();
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

        rankObjects.push({ minValue, maxValue, label: ranks[i] });
      }
      return rankObjects;
    };
  }
);
