import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import Gdk from "gi://Gdk";
import GObject from "gi://GObject";
import Graphene from "gi://Graphene";
import Gio from "gi://Gio";

export const Hexagon = GObject.registerClass(
  {
    GTypeName: "Hexagon",
    Properties: {
      label: GObject.ParamSpec.string(
        "label",
        "Label",
        "Label for the hexagon",
        GObject.ParamFlags.READWRITE,
        ""
      ),
      xCoord: GObject.ParamSpec.int(
        "xCoord",
        "x_coord",
        "X co-ordinate of the widget",
        GObject.ParamFlags.READWRITE,
        0
      ),
      yCoord: GObject.ParamSpec.int(
        "yCoord",
        "y_coord",
        "Y co-ordinate of the widget",
        GObject.ParamFlags.READWRITE,
        0
      ),
      position: GObject.ParamSpec.string(
        "position",
        "Position",
        "Position of the hexagon",
        GObject.ParamFlags.READWRITE,
        ""
      ),
    },
    Signals: {
      click: {
        param_types: [GObject.TYPE_STRING, GObject.TYPE_INT, GObject.TYPE_INT],
        flags: GObject.SignalFlags.RUN_FIRST,
        return_type: GObject.TYPE_NONE,
      },
    },
  },
  class Hexagon extends Gtk.Widget {
    // Somehow css_name needs to be set before calling
    // super and set_css_name method is not available in GJS
    css_name = "hexagon";
    constructor({ label, position, ...prop } = {}) {
      super(prop);
      this.ASPECT_RATIO = Math.sqrt(3) / 2;
      this.lightBackground = [0.89, 0.91, 0.95, 1];
      this.darkBackground = [0.19, 0.18, 0.28, 1];

      this.lightBackgroundCenter = [1.0, 0.83, 0.0, 1];
      this.darkBackgroundCenter = [0.61, 0.5, 0.34, 1];

      this.lightColor = [1.0, 1.0, 1.0, 1];
      this.darkColor = [0.0, 0.0, 0.0, 1];

      this.height = 125;
      this.width = this.ASPECT_RATIO * this.height;
      this.side = this.calcSide();

      this.set_size_request(this.width, this.height);
      this._label = label;
      this.position = position;

      this.can_focus = true;
      this.can_target = true;
      this.focus_on_click = true;

      const gestureClick = new Gtk.GestureClick();
      gestureClick.connect("pressed", this.pressedHandler);
      this.add_controller(gestureClick);

      this.settings = Gio.Settings.new(pkg.name);
      this.settings.connect("changed::preferred-theme", () => {
        this.queue_draw();
      });
    }

    set label(label) {
      if (label === this._label) return;
      this._label = label;
      this.notify("label");
      this.queue_draw();
    }

    get label() {
      return this._label;
    }

    calcSide = () => {
      const angle = Math.PI / 6; // 30 deg in rad
      const deltaY = (this.width / 2) * Math.tan(angle);
      return this.height - 2 * deltaY;
    };

    getTheme = () => {
      const theme = this.settings.get_string("preferred-theme");
      if (theme === "system") {
        return new Adw.StyleManager().dark ? "dark" : "light";
      }
      return theme;
    };

    vfunc_snapshot(snapshot) {
      // Figure out a way of using this to dynamically calculate
      // the width and height instead of using a fixed value. Check 👇
      // https://gist.github.com/josephmawa/104984bbecfc6a8d290be00124d0b71b
      let width = this.get_allocated_width();
      let height = this.get_allocated_height();

      // console.log("width: ", this.width, "height: ", this.height);

      const midX = this.width / 2;
      const midY = this.height / 2;

      this.center = [midX, midY];

      const angle = Math.PI / 6; // 30 deg in rad
      const deltaY = midX * Math.tan(angle);
      /**
       * Radius of the inscribed circle of a regular
       * hexagon is 0.5 * √3 * s where s is the side
       * length of the regular hexagon
       */
      this.radiusInscribedCircle =
        0.5 * Math.sqrt(3) * (this.height - 2 * deltaY);

      this.side = this.height - 2 * deltaY;

      const rect = Graphene.Rect.alloc().init(0, 0, this.width, this.height);
      const cairo = snapshot.append_cairo(rect);
      /*
       * Vertices labelled using the
       * indices of the coords array
       *
       *         1
       *         x
       *       x   x
       *     x       x
       * 0 x           x 2
       *   x           x
       *   x           x
       * 5 x           x 3
       *     x       x
       *       x   x
       *         x
       *         4
       *
       */
      const coords = [
        [0, deltaY],
        [midX, 0],
        [this.width, deltaY],
        [this.width, this.height - deltaY],
        [midX, this.height],
        [0, this.height - deltaY],
      ];

      const theme = this.getTheme();
      if (theme === "dark") {
        if (this.position === "CENTER") {
          cairo.setSourceRGBA(...this.darkBackgroundCenter);
        } else {
          cairo.setSourceRGBA(...this.darkBackground);
        }
      } else {
        if (this.position === "CENTER") {
          cairo.setSourceRGBA(...this.lightBackgroundCenter);
        } else {
          cairo.setSourceRGBA(...this.lightBackground);
        }
      }
      cairo.moveTo(...coords[0]);
      cairo.lineTo(...coords[1]);
      cairo.lineTo(...coords[2]);
      cairo.lineTo(...coords[3]);
      cairo.lineTo(...coords[4]);
      cairo.lineTo(...coords[5]);
      cairo.closePath();
      cairo.fill();

      cairo.selectFontFace("user", 0, 1);
      cairo.setFontSize(32);

      const textExtents = cairo.textExtents(this.label);
      const textWidth = textExtents.width;
      const textHeight = textExtents.height;
      const textX = midX - textWidth / 2;
      const textY = midY + textHeight / 2;

      if (theme === "dark") {
        cairo.setSourceRGBA(...this.lightColor);
      } else {
        cairo.setSourceRGBA(...this.darkColor);
      }
      cairo.moveTo(textX, textY);
      cairo.showText(this.label);

      return false;
    }

    pressedHandler = (gesture, nPress, x, y) => {
      // FIXME
      // This is a temportary solution. This only captures clicks
      // inside the inscribed circle. Figure out a way of capturing
      // clickes outside the inscribed circle but within the hexagon.
      // Currently, clicks near the vertices aren't reigstered.
      const distFromCenter = Math.hypot(x - this.center[0], y - this.center[1]);
      if (distFromCenter < this.radiusInscribedCircle) {
        this.emit("click", this.label, x, y);
      }
    };
  }
);

export const Container = GObject.registerClass(
  {
    GTypeName: "Container",
    Properties: {
      gap: GObject.ParamSpec.int(
        "gap",
        "Gap",
        "Gap between hexagons",
        GObject.ParamFlags.READWRITE,
        // 5 is minimum and 20 is maximum. Both
        // values are required when dealing with
        // GObject.ParamSpec.int
        5,
        20,
        5
      ),
    },
  },
  class extends Gtk.Widget {
    constructor({ gap, ...props } = {}) {
      super(props);
      this.visible = true;
      this.children = [];
      this.gap = gap || 5;
    }

    appendChild(child) {
      if (!this.width || !this.height) {
        const [width, height] = this.calcDim(
          child.width,
          child.height,
          child.side
        );

        this.width = width;
        this.height = height;
      }

      const [x, y] = this.calcCoord(child);
      child.xCoord = x;
      child.yCoord = y;

      child.set_parent(this);
      this.children.push(child);
    }

    calcDim = (width, height, side) => {
      return [width * 3 + 2 * this.gap, 2 * height + side + 2 * this.gap];
    };

    calcCoord = (widget) => {
      const width = widget.width;
      const height = widget.height;
      const deltaY = Math.tan(Math.PI / 6) * (width / 2);
      const pos = widget.position;

      let x, y;

      if (pos === "LEFT") {
        x = 0;
        y = height - deltaY + this.gap;
      } else if (pos === "CENTER") {
        x = width + this.gap;
        y = height - deltaY + this.gap;
      } else if (pos === "RIGHT") {
        x = 2 * width + 2 * this.gap;
        y = height - deltaY + this.gap;
      } else if (pos === "TOP_LEFT") {
        x = width / 2 + this.gap / 2;
        y = 0;
      } else if (pos === "TOP_RIGHT") {
        x = 1.5 * width + 1.5 * this.gap;
        y = 0;
      } else if (pos === "BOTTOM_LEFT") {
        x = width / 2 + this.gap / 2;
        y = this.height - height;
      } else if (pos === "BOTTOM_RIGHT") {
        x = 1.5 * width + 1.5 * this.gap;
        y = this.height - height;
      } else {
        throw new Error(`Invalid position ${pos}`);
      }

      return [x, y];
    };

    vfunc_measure() {
      return [this.width, this.width, -1, -1];
    }

    vfunc_size_allocate(width, height, baseline) {
      for (const child of this.children) {
        const allocation = new Gdk.Rectangle({
          x: child.xCoord,
          y: child.yCoord,
          width: child.width,
          height: child.height,
        });

        child.size_allocate(allocation, -1);
      }
    }

    unparentChildren() {
      for (const child of this.children) {
        if (child.get_parent() === this) {
          child.unparent();
        }
      }
      this.children = [];
    }
  }
);
