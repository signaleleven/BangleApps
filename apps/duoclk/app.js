{ // must be inside our own scope here so that when we are unloaded everything disappears
  // Layout (Bangle.js 2, 176x176):
  //  widgets | big HH:MM | date | two ClockInfo slots side by side
  let R = Bangle.appRect;
  let W = g.getWidth();
  let slotH = 68;
  let slotY = g.getHeight() - slotH;
  let slotW = W >> 1;
  let timeY = R.y + ((slotY - 18 - R.y) >> 1); // centre of the area above the date
  let dateY = slotY - 10;

  let drawTimeout;
  let queueDraw = function() {
    if (drawTimeout) clearTimeout(drawTimeout);
    drawTimeout = setTimeout(function() {
      drawTimeout = undefined;
      draw();
    }, 60000 - (Date.now() % 60000));
  };

  let draw = function() {
    queueDraw();
    let d = new Date();
    let locale = require("locale");
    let time = locale.time(d, 1 /*omit seconds*/);
    let date = locale.dow(d, 1) + " " + locale.date(d, 1);
    g.reset().clearRect(0, R.y, W - 1, slotY - 1);
    g.setFontAlign(0, 0).setFont("Vector", 58).drawString(time, W / 2, timeY);
    g.setFont("Vector", 18).drawString(date.toUpperCase(), W / 2, dateY);
  };

  let clockInfoDraw = (itm, info, options) => {
    let x = options.x, y = options.y, w = options.w, h = options.h;
    let frame = {x:x + 2, y:y + 2, w:w - 5, h:h - 5, r:8};
    g.reset().clearRect(x, y, x + w - 1, y + h - 1);
    // focussed slot is drawn inverted so it's obvious what a tap will do
    if (options.focus) g.fillRect(frame).setColor(g.theme.bg).setBgColor(g.theme.fg);
    else g.drawRect(frame);
    let midx = x + w / 2;
    if (info.img) {
      let m = g.imageMetrics(info.img);
      if (m.width > 24) { // e.g. Home Assistant icons are 48px - shrink to fit
        let s = 24 / m.width;
        g.drawImage(info.img, midx - 12, y + 8, {scale:s});
      } else if (options.focus) g.drawImage(info.img, midx - 12, y + 8);
      else require("clock_info").drawFilledImage(info.img, midx - 12, y + 8);
    }
    let txt = info.text === undefined ? "" : info.text.toString();
    let maxW = w - 12;
    g.setFontAlign(0, -1).setFont("Vector", 18);
    if (g.stringWidth(txt) > maxW) g.setFont("Vector", 16);
    if (g.stringWidth(txt) > maxW) {
      let l = g.wrapString(txt, maxW);
      txt = l.slice(0, 2).join("\n") + (l.length > 2 ? "..." : "");
    }
    g.drawString(txt, midx, info.img ? y + 34 : y + 24);
  };

  let clockInfoMenuA, clockInfoMenuB;
  Bangle.setUI({
    mode: "clock",
    redraw: draw,
    remove: function() {
      if (drawTimeout) clearTimeout(drawTimeout);
      drawTimeout = undefined;
      if (clockInfoMenuA) clockInfoMenuA.remove();
      if (clockInfoMenuB) clockInfoMenuB.remove();
    }
  });

  g.clear();
  Bangle.loadWidgets();
  Bangle.drawWidgets();
  draw();

  let clockInfoItems = require("clock_info").load();
  clockInfoMenuA = require("clock_info").addInteractive(clockInfoItems, {
    app: "duoclk", x: 0, y: slotY, w: slotW, h: slotH, draw: clockInfoDraw
  });
  clockInfoMenuB = require("clock_info").addInteractive(clockInfoItems, {
    app: "duoclk", x: slotW, y: slotY, w: W - slotW, h: slotH, draw: clockInfoDraw
  });
}
