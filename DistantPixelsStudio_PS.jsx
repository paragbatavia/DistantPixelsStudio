/**************************************************************************
 * Distant Pixels Studio v1.0.3
 * Astrophotography Workflow Tool for Photoshop
 *
 * Copyright (C) 2026 Distant Pixels Studio
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 **************************************************************************
 * Features:
 * - Mode A: RGB + Ha Enhancement (LRGB style with continuum subtraction)
 * - Mode B: Narrowband Palette (flexible SHO/HOO/HSO channel assignment)
 **************************************************************************/

#target photoshop
app.bringToFront();

// ==================== POLYFILLS FOR EXTENDSCRIPT ====================
// ExtendScript lacks many modern JavaScript features

// Array.indexOf polyfill
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(searchElement, fromIndex) {
    var k;
    if (this == null) throw new TypeError('"this" is null or not defined');
    var o = Object(this);
    var len = o.length >>> 0;
    if (len === 0) return -1;
    var n = fromIndex | 0;
    if (n >= len) return -1;
    k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    while (k < len) {
      if (k in o && o[k] === searchElement) return k;
      k++;
    }
    return -1;
  };
}

// JSON polyfill - ExtendScript doesn't have native JSON support
if (typeof JSON === 'undefined') {
  JSON = {
    parse: function(str) {
      return eval('(' + str + ')');
    },
    stringify: function(obj, replacer, space) {
      var t = typeof obj;
      if (t !== "object" || obj === null) {
        if (t === "string") return '"' + obj.replace(/"/g, '\\"') + '"';
        return String(obj);
      }
      var isArray = obj instanceof Array;
      var json = [];
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
          var v = obj[k];
          var t2 = typeof v;
          if (t2 === "string") {
            v = '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
          } else if (t2 === "object" && v !== null) {
            v = JSON.stringify(v);
          } else if (t2 === "undefined") {
            continue;
          }
          json.push((isArray ? "" : '"' + k + '":') + String(v));
        }
      }
      var result = isArray ? "[" + json.join(",") + "]" : "{" + json.join(",") + "}";
      if (space) {
        // Basic pretty printing
        result = result.replace(/,/g, ",\n").replace(/{/g, "{\n").replace(/}/g, "\n}").replace(/\[/g, "[\n").replace(/\]/g, "\n]");
      }
      return result;
    }
  };
}

// ==================== VERSION & CONFIGURATION ====================
var VERSION = "1.0";
var SCRIPT_NAME = "Distant Pixels Studio";
var SETTINGS_FOLDER = Folder.userData + "/DistantPixelsStudio";
var SETTINGS_FILE = SETTINGS_FOLDER + "/settings.json";

// Palette presets for narrowband mode
var PALETTE_PRESETS = {
  "SHO (Hubble)": {
    SII: ["R"], Ha: ["G"], OIII: ["B"],
    hues: { R: 0, G: 130, B: 230 },
    sats: { R: 100, G: 100, B: 100 },
    lights: { R: -50, G: -50, B: -50 }
  },
  "HOO (Bicolor)": {
    Ha: ["R"], OIII: ["G", "B"],
    hues: { R: 0, G: 230, B: 230 },
    sats: { R: 100, G: 100, B: 100 },
    lights: { R: -50, G: -50, B: -50 }
  },
  "HSO": {
    Ha: ["R"], SII: ["G"], OIII: ["B"],
    hues: { R: 0, G: 0, B: 230 },
    sats: { R: 100, G: 100, B: 100 },
    lights: { R: -50, G: -50, B: -50 }
  },
  "OHS": {
    OIII: ["R"], Ha: ["G"], SII: ["B"],
    hues: { R: 230, G: 0, B: 0 },
    sats: { R: 100, G: 100, B: 100 },
    lights: { R: -50, G: -50, B: -50 }
  }
};

var DEFAULT_SETTINGS = {
  mode: "B",
  useAutoDetect: true,
  lastFolder: "",
  preset: "SHO (Hubble)",
  includeStars: true,
  includeGlobal: true,
  modeAFiles: { L: "", RGB: "", Ha: "", R: "", RGBStars: "", HaStars: "" },
  modeBFiles: { Ha: "", OIII: "", SII: "", RGBStars: "", HaStars: "" },
  channelAssign: { Ha: ["R"], OIII: ["G", "B"], SII: [] },
  hues: { R: 0, G: 130, B: 230 },
  sats: { R: 100, G: 100, B: 100 },
  lights: { R: -50, G: -50, B: -50 }
};

// ==================== UTILITY FUNCTIONS ====================

function ensureRGB16(doc) {
  if (doc.mode !== DocumentMode.RGB) doc.changeMode(ChangeMode.RGB);
  try { doc.bitsPerChannel = BitsPerChannelType.SIXTEEN; } catch (e) {}
}

function placeAsLayer(file, name, targetDoc) {
  var f = new File(file);
  if (!f.exists) return null;
  var src = app.open(f);
  src.activeLayer.name = name;
  src.activeLayer.duplicate(targetDoc, ElementPlacement.PLACEATBEGINNING);
  src.close(SaveOptions.DONOTSAVECHANGES);
  app.activeDocument = targetDoc;
  return getLayerByName(name);
}

function getLayerByName(name) {
  var d = app.activeDocument;
  for (var i = 0; i < d.layers.length; i++) {
    if (d.layers[i].name === name) return d.layers[i];
  }
  return null;
}

function moveLayerToBottom(layer) {
  if (!layer) return;
  layer.move(app.activeDocument, ElementPlacement.PLACEATEND);
}

function moveAbove(bottomName, topName) {
  var bottom = getLayerByName(bottomName);
  var top = getLayerByName(topName);
  if (!bottom || !top) return;
  top.move(bottom, ElementPlacement.PLACEAFTER);
}

function enforceGroupOrder(names) {
  for (var i = names.length - 1; i >= 0; i--) {
    var layer = getLayerByName(names[i]);
    if (layer) layer.move(app.activeDocument, ElementPlacement.PLACEATBEGINNING);
  }
}

// ==================== SETTINGS PERSISTENCE ====================

function saveSettings(settings) {
  try {
    var folder = new Folder(SETTINGS_FOLDER);
    if (!folder.exists) folder.create();

    var file = new File(SETTINGS_FILE);
    file.open("w");
    file.write(JSON.stringify(settings, null, 2));
    file.close();
  } catch (e) {
    // Silent fail - settings are nice to have but not critical
  }
}

function loadSettings() {
  try {
    var file = new File(SETTINGS_FILE);
    if (!file.exists) return cloneObject(DEFAULT_SETTINGS);

    file.open("r");
    var content = file.read();
    file.close();

    var loaded = JSON.parse(content);
    // Merge with defaults to handle new settings
    return mergeSettings(DEFAULT_SETTINGS, loaded);
  } catch (e) {
    return cloneObject(DEFAULT_SETTINGS);
  }
}

function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function mergeSettings(defaults, loaded) {
  var result = cloneObject(defaults);
  for (var key in loaded) {
    if (loaded.hasOwnProperty(key)) {
      if (typeof loaded[key] === "object" && !Array.isArray(loaded[key]) && loaded[key] !== null) {
        result[key] = mergeSettings(defaults[key] || {}, loaded[key]);
      } else {
        result[key] = loaded[key];
      }
    }
  }
  return result;
}

// ==================== ADJUSTMENT LAYER CREATORS ====================

function createHueSat(h, s, l) {
  try {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(charIDToTypeID("AdjL"));
    desc.putReference(charIDToTypeID("null"), ref);

    var adjDesc = new ActionDescriptor();
    var hsPayload = new ActionDescriptor();
    hsPayload.putEnumerated(stringIDToTypeID("presetKind"), stringIDToTypeID("presetKindType"), stringIDToTypeID("presetKindDefault"));
    hsPayload.putBoolean(charIDToTypeID("Clrz"), false);
    adjDesc.putObject(charIDToTypeID("Type"), charIDToTypeID("HStr"), hsPayload);
    desc.putObject(charIDToTypeID("Usng"), charIDToTypeID("AdjL"), adjDesc);

    executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);

    var layer = app.activeDocument.activeLayer;
    layer.name = "Hue/Sat";

    // Now modify to enable Colorize and set values
    var setDesc = new ActionDescriptor();
    var setRef = new ActionReference();
    setRef.putEnumerated(charIDToTypeID("AdjL"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    setDesc.putReference(charIDToTypeID("null"), setRef);

    var setHsPayload = new ActionDescriptor();
    setHsPayload.putEnumerated(stringIDToTypeID("presetKind"), stringIDToTypeID("presetKindType"), stringIDToTypeID("presetKindCustom"));
    setHsPayload.putBoolean(charIDToTypeID("Clrz"), true);

    var adjList = new ActionList();
    var adjValues = new ActionDescriptor();
    adjValues.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Cmps"));
    adjValues.putInteger(charIDToTypeID("H   "), h);
    adjValues.putInteger(charIDToTypeID("Strt"), s);
    adjValues.putInteger(charIDToTypeID("Lght"), l);

    adjList.putObject(charIDToTypeID("Hst2"), adjValues);
    setHsPayload.putList(charIDToTypeID("Adjs"), adjList);

    setDesc.putObject(charIDToTypeID("T   "), charIDToTypeID("HStr"), setHsPayload);

    executeAction(charIDToTypeID("setd"), setDesc, DialogModes.NO);

    return layer;
  } catch (e) {
    return null;
  }
}

function createNeutralHueSat() {
  try {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(charIDToTypeID("AdjL"));
    desc.putReference(charIDToTypeID("null"), ref);

    var adjDesc = new ActionDescriptor();
    var hsPayload = new ActionDescriptor();
    hsPayload.putEnumerated(stringIDToTypeID("presetKind"), stringIDToTypeID("presetKindType"), stringIDToTypeID("presetKindDefault"));
    hsPayload.putBoolean(charIDToTypeID("Clrz"), false);
    adjDesc.putObject(charIDToTypeID("Type"), charIDToTypeID("HStr"), hsPayload);
    desc.putObject(charIDToTypeID("Usng"), charIDToTypeID("AdjL"), adjDesc);

    executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
    app.activeDocument.activeLayer.name = "Hue/Saturation";
    return app.activeDocument.activeLayer;
  } catch (e) {
    return null;
  }
}

function createLevels() {
  try {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(charIDToTypeID("AdjL"));
    desc.putReference(charIDToTypeID("null"), ref);

    var adjDesc = new ActionDescriptor();
    adjDesc.putObject(charIDToTypeID("Type"), charIDToTypeID("Lvls"), new ActionDescriptor());
    desc.putObject(charIDToTypeID("Usng"), charIDToTypeID("AdjL"), adjDesc);

    executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
    app.activeDocument.activeLayer.name = "Levels";
    return app.activeDocument.activeLayer;
  } catch (e) {
    return null;
  }
}

function createCurves() {
  try {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(charIDToTypeID("AdjL"));
    desc.putReference(charIDToTypeID("null"), ref);

    var adjDesc = new ActionDescriptor();
    adjDesc.putObject(charIDToTypeID("Type"), charIDToTypeID("Crvs"), new ActionDescriptor());
    desc.putObject(charIDToTypeID("Usng"), charIDToTypeID("AdjL"), adjDesc);

    executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
    app.activeDocument.activeLayer.name = "Curves";
    return app.activeDocument.activeLayer;
  } catch (e) {
    return null;
  }
}

function createColorBalance() {
  try {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(charIDToTypeID("AdjL"));
    desc.putReference(charIDToTypeID("null"), ref);

    var adjDesc = new ActionDescriptor();
    adjDesc.putObject(charIDToTypeID("Type"), charIDToTypeID("ClrB"), new ActionDescriptor());
    desc.putObject(charIDToTypeID("Usng"), charIDToTypeID("AdjL"), adjDesc);

    executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
    app.activeDocument.activeLayer.name = "Color Balance";
    return app.activeDocument.activeLayer;
  } catch (e) {
    return null;
  }
}

function createVibrance() {
  try {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass(charIDToTypeID("AdjL"));
    desc.putReference(charIDToTypeID("null"), ref);

    var adjDesc = new ActionDescriptor();
    adjDesc.putObject(charIDToTypeID("Type"), stringIDToTypeID("vibrance"), new ActionDescriptor());
    desc.putObject(charIDToTypeID("Usng"), charIDToTypeID("AdjL"), adjDesc);

    executeAction(charIDToTypeID("Mk  "), desc, DialogModes.NO);
    app.activeDocument.activeLayer.name = "Vibrance";
    return app.activeDocument.activeLayer;
  } catch (e) {
    return null;
  }
}

function setBlendModeChar(layer, modeChar) {
  if (!layer || !modeChar) return;
  app.activeDocument.activeLayer = layer;
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  desc.putReference(charIDToTypeID("null"), ref);
  var layerDesc = new ActionDescriptor();
  layerDesc.putEnumerated(charIDToTypeID("Md  "), charIDToTypeID("BlnM"), charIDToTypeID(modeChar));
  desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Lyr "), layerDesc);
  executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

function restrictLayerToChannels(layer, red, green, blue) {
  if (!layer) return;
  app.activeDocument.activeLayer = layer;

  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  desc.putReference(charIDToTypeID("null"), ref);

  var layerDesc = new ActionDescriptor();
  var channelList = new ActionList();
  if (red) channelList.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Rd  "));
  if (green) channelList.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Grn "));
  if (blue) channelList.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Bl  "));
  layerDesc.putList(stringIDToTypeID("channelRestrictions"), channelList);

  desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Lyr "), layerDesc);
  executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

// ==================== GROUP BUILDERS - MODE A (RGB+Ha/L) ====================

function buildLumGroup(layerName) {
  var base = getLayerByName(layerName);
  if (!base) return null;
  var group = app.activeDocument.layerSets.add();
  group.name = "Lum";
  group.blendMode = BlendMode.PASSTHROUGH;

  app.activeDocument.activeLayer = base;
  var levels = createLevels();
  if (levels) levels.name = "Lum Levels";

  if (levels) levels.move(group, ElementPlacement.INSIDE);
  base.move(group, ElementPlacement.INSIDE);

  base.move(group, ElementPlacement.PLACEATEND);
  if (levels) levels.move(group, ElementPlacement.PLACEATBEGINNING);
  return group;
}

function buildRGBGroup(layerName) {
  var base = getLayerByName(layerName);
  if (!base) return null;
  var group = app.activeDocument.layerSets.add();
  group.name = "RGB";
  group.blendMode = BlendMode.PASSTHROUGH;

  app.activeDocument.activeLayer = base;
  var hueSat = createNeutralHueSat();
  if (hueSat) hueSat.name = "RGB Hue/Sat";

  app.activeDocument.activeLayer = base;
  var curves = createCurves();
  if (curves) curves.name = "RGB Curves";

  app.activeDocument.activeLayer = base;
  var levels = createLevels();
  if (levels) levels.name = "RGB Levels";

  if (hueSat) hueSat.move(group, ElementPlacement.INSIDE);
  if (curves) curves.move(group, ElementPlacement.INSIDE);
  if (levels) levels.move(group, ElementPlacement.INSIDE);
  base.move(group, ElementPlacement.INSIDE);

  setBlendModeChar(base, "Clr ");
  base.move(group, ElementPlacement.PLACEATEND);
  if (levels) levels.move(base, ElementPlacement.PLACEBEFORE);
  if (curves) curves.move(levels ? levels : base, ElementPlacement.PLACEBEFORE);
  if (hueSat) hueSat.move(curves ? curves : (levels ? levels : base), ElementPlacement.PLACEBEFORE);

  return group;
}

function buildHaContinuumGroup(haName, rName) {
  var haLayer = getLayerByName(haName);
  var rLayer = getLayerByName(rName);
  if (!haLayer || !rLayer) return null;

  var group = app.activeDocument.layerSets.add();
  group.name = "Ha";
  group.blendMode = BlendMode.SCREEN;

  app.activeDocument.activeLayer = rLayer;
  var rLevels = createLevels();
  if (rLevels) rLevels.name = "R Levels (Continuum)";

  if (rLevels) rLevels.move(group, ElementPlacement.INSIDE);
  rLayer.move(group, ElementPlacement.INSIDE);
  haLayer.move(group, ElementPlacement.INSIDE);

  haLayer.blendMode = BlendMode.SUBTRACT;
  rLayer.blendMode = BlendMode.SUBTRACT;

  haLayer.move(group, ElementPlacement.PLACEATEND);
  rLayer.move(haLayer, ElementPlacement.PLACEBEFORE);
  if (rLevels) rLevels.move(rLayer, ElementPlacement.PLACEBEFORE);

  restrictLayerToChannels(group, true, false, false);
  return group;
}

// ==================== GROUP BUILDERS - MODE B (NARROWBAND) ====================

function buildNarrowbandGroup(groupName, srcName, hue, sat, light, channelName) {
  var doc = app.activeDocument;
  var src = getLayerByName(srcName);
  if (!src) return null;

  var group = doc.layerSets.add();
  // Include channel name in group name, e.g., "Ha (G)" or "OIII (B)"
  group.name = channelName ? groupName + " (" + channelName + ")" : groupName;
  group.blendMode = BlendMode.SCREEN;

  app.activeDocument.activeLayer = src;
  var hs = createHueSat(hue, sat, light);

  app.activeDocument.activeLayer = src;
  var lev = createLevels();

  app.activeDocument.activeLayer = src;
  var cur = createCurves();

  if (hs) hs.move(group, ElementPlacement.INSIDE);
  if (lev) lev.move(group, ElementPlacement.INSIDE);
  if (cur) cur.move(group, ElementPlacement.INSIDE);
  src.move(group, ElementPlacement.INSIDE);

  // Arrange: Hue/Sat (top), Curves, Levels, Image (bottom)
  if (hs) hs.move(group, ElementPlacement.PLACEATEND);
  if (cur) cur.move(hs ? hs : group, ElementPlacement.PLACEBEFORE);
  if (lev) lev.move(cur ? cur : (hs ? hs : group), ElementPlacement.PLACEBEFORE);
  src.move(group, ElementPlacement.PLACEATEND);

  return group;
}

// ==================== GROUP BUILDERS - SHARED ====================

function buildStarsGroup(rgbStarsName, haStarsName) {
  var rgbStars = getLayerByName(rgbStarsName);
  var haStars = getLayerByName(haStarsName);
  if (!rgbStars && !haStars) return null;

  var group = app.activeDocument.layerSets.add();
  group.name = "Stars";
  group.blendMode = BlendMode.SCREEN;

  var base = rgbStars ? rgbStars : haStars;
  app.activeDocument.activeLayer = base;
  var hueSat = createNeutralHueSat();
  if (hueSat) hueSat.name = "Stars Hue/Sat";

  app.activeDocument.activeLayer = base;
  var curves = createCurves();
  if (curves) curves.name = "Stars Curves";

  app.activeDocument.activeLayer = base;
  var levels = createLevels();
  if (levels) levels.name = "Stars Levels";

  // Move all layers into the group first
  if (hueSat) hueSat.move(group, ElementPlacement.INSIDE);
  if (curves) curves.move(group, ElementPlacement.INSIDE);
  if (levels) levels.move(group, ElementPlacement.INSIDE);

  if (rgbStars) {
    rgbStars.move(group, ElementPlacement.INSIDE);
    setBlendModeChar(rgbStars, "Clr ");  // COLOR blend mode
  }
  if (haStars) {
    haStars.move(group, ElementPlacement.INSIDE);
    haStars.blendMode = BlendMode.SCREEN;  // SCREEN blend mode
  }

  // Now reorder layers WITHIN the group
  // Target order (top to bottom): Hue/Sat, Curves, Levels, RGB_Stars, Ha_Stars
  // Use PLACEATEND to place at bottom of group, then stack others above

  // Start with the bottom-most layer
  if (haStars) {
    haStars.move(group, ElementPlacement.PLACEATEND);
  }

  // RGB_Stars goes above Ha_Stars (or at bottom if no Ha_Stars)
  if (rgbStars) {
    if (haStars) {
      rgbStars.move(haStars, ElementPlacement.PLACEBEFORE);
    } else {
      rgbStars.move(group, ElementPlacement.PLACEATEND);
    }
  }

  // Get reference to the topmost star layer for placing adjustment layers above
  var topStarLayer = rgbStars ? rgbStars : haStars;

  // Levels goes above the star layers
  if (levels) {
    levels.move(topStarLayer, ElementPlacement.PLACEBEFORE);
  }

  // Curves goes above Levels
  if (curves) {
    curves.move(levels ? levels : topStarLayer, ElementPlacement.PLACEBEFORE);
  }

  // Hue/Sat goes at the very top
  if (hueSat) {
    hueSat.move(curves ? curves : (levels ? levels : topStarLayer), ElementPlacement.PLACEBEFORE);
  }

  return group;
}

function buildGlobalAdjustments() {
  try {
    var doc = app.activeDocument;

    // Create the Global group
    var globalGroup = doc.layerSets.add();
    globalGroup.name = "Global";
    globalGroup.blendMode = BlendMode.PASSTHROUGH;

    // Create adjustment layers
    var levels = createLevels();
    if (levels) levels.name = "Global Levels";
    var colorBalance = createColorBalance();
    var curves = createCurves();
    if (curves) curves.name = "Global Curves";
    var hueSat = createNeutralHueSat();
    if (hueSat) hueSat.name = "Global Hue/Sat";
    var vibrance = createVibrance();

    // Move all adjustment layers into the Global group
    if (levels) levels.move(globalGroup, ElementPlacement.INSIDE);
    if (colorBalance) colorBalance.move(globalGroup, ElementPlacement.INSIDE);
    if (curves) curves.move(globalGroup, ElementPlacement.INSIDE);
    if (hueSat) hueSat.move(globalGroup, ElementPlacement.INSIDE);
    if (vibrance) vibrance.move(globalGroup, ElementPlacement.INSIDE);

    // Stack in order: Levels at bottom, Vibrance at top
    if (levels) levels.move(globalGroup, ElementPlacement.PLACEATEND);
    if (colorBalance) colorBalance.move(levels ? levels : globalGroup, ElementPlacement.PLACEAFTER);
    if (curves) curves.move(colorBalance ? colorBalance : (levels ? levels : globalGroup), ElementPlacement.PLACEAFTER);
    if (hueSat) hueSat.move(curves ? curves : (colorBalance ? colorBalance : (levels ? levels : globalGroup)), ElementPlacement.PLACEAFTER);
    if (vibrance) vibrance.move(hueSat ? hueSat : (curves ? curves : (colorBalance ? colorBalance : (levels ? levels : globalGroup))), ElementPlacement.PLACEAFTER);

    return globalGroup;
  } catch (e) {
    return null;
  }
}

// ==================== WORKFLOW EXECUTORS ====================

function executeModeA(config) {
  // RGB + Ha Enhancement workflow
  var files = config.files;

  // Validate required files: L and RGB are always required
  if (!files.L || !files.RGB) {
    alert("Mode A requires at least L and RGB files.");
    return false;
  }

  // Check Ha/R dependency: if Ha is provided, R must also be provided (for continuum subtraction)
  var hasHa = files.Ha && files.Ha.length > 0;
  var hasR = files.R && files.R.length > 0;

  if (hasHa && !hasR) {
    alert("Ha file requires R file for continuum subtraction.\nPlease provide both Ha and R, or neither.");
    return false;
  }
  if (hasR && !hasHa) {
    alert("R file is only used for Ha continuum subtraction.\nPlease provide both Ha and R, or neither.");
    return false;
  }

  var includeHaGroup = hasHa && hasR;

  // Open L as base
  var lFile = new File(files.L);
  if (!lFile.exists) { alert("L file not found: " + files.L); return false; }

  open(lFile);
  var doc = app.activeDocument;
  doc.activeLayer.name = "L_NL";
  ensureRGB16(doc);

  // Place other layers
  placeAsLayer(files.RGB, "RGB_NL", doc);
  if (includeHaGroup) {
    placeAsLayer(files.Ha, "Ha_NL", doc);
    placeAsLayer(files.R, "R_NL", doc);
  }
  if (files.RGBStars) placeAsLayer(files.RGBStars, "RGB_Stars_NL", doc);
  if (files.HaStars) placeAsLayer(files.HaStars, "Ha_Stars_NL", doc);

  // Arrange layers
  moveLayerToBottom(getLayerByName("L_NL"));
  moveAbove("L_NL", "RGB_NL");

  if (includeHaGroup) {
    moveAbove("RGB_NL", "Ha_NL");
    moveAbove("Ha_NL", "R_NL");
    if (files.RGBStars) moveAbove("R_NL", "RGB_Stars_NL");
    if (files.HaStars) {
      if (files.RGBStars) {
        moveAbove("RGB_Stars_NL", "Ha_Stars_NL");
      } else {
        moveAbove("R_NL", "Ha_Stars_NL");
      }
    }
  } else {
    // No Ha group - stars go above RGB
    if (files.RGBStars) moveAbove("RGB_NL", "RGB_Stars_NL");
    if (files.HaStars) {
      if (files.RGBStars) {
        moveAbove("RGB_Stars_NL", "Ha_Stars_NL");
      } else {
        moveAbove("RGB_NL", "Ha_Stars_NL");
      }
    }
  }

  // Build groups
  var lumGroup = buildLumGroup("L_NL");
  var rgbGroup = buildRGBGroup("RGB_NL");

  var haGroup = null;
  if (includeHaGroup) {
    haGroup = buildHaContinuumGroup("Ha_NL", "R_NL");
  }

  var starsGroup = null;
  if (config.includeStars && (getLayerByName("RGB_Stars_NL") || getLayerByName("Ha_Stars_NL"))) {
    starsGroup = buildStarsGroup("RGB_Stars_NL", "Ha_Stars_NL");
  }

  var globalGroup = null;
  if (config.includeGlobal) {
    globalGroup = buildGlobalAdjustments();
  }

  // Set blend modes and layer order based on whether Ha is included
  if (includeHaGroup) {
    // With Ha: standard LRGB+Ha structure
    // Order (top to bottom): Stars, Global, Ha, RGB, Lum
    var order = ["Stars", "Global", "Ha", "RGB", "Lum"];
    enforceGroupOrder(order);
  } else {
    // Without Ha: simple LRGB structure
    // Lum (SCREEN) sits above RGB (COLOR) to apply luminance over color
    // Order (top to bottom): Stars, Global, Lum, RGB
    lumGroup.blendMode = BlendMode.SCREEN;
    setBlendModeChar(rgbGroup, "Clr ");  // COLOR blend mode (BlendMode.COLOR doesn't exist in ExtendScript)
    if (globalGroup) globalGroup.blendMode = BlendMode.SCREEN;

    var order = ["Stars", "Global", "Lum", "RGB"];
    enforceGroupOrder(order);
  }

  return true;
}

function executeModeB(config) {
  // Narrowband Palette workflow
  var files = config.files;
  var channelAssign = config.channelAssign;
  var hues = config.hues;
  var sats = config.sats;
  var lights = config.lights;

  // Determine which files we have
  var haFile = files.Ha ? new File(files.Ha) : null;
  var oiiiFile = files.OIII ? new File(files.OIII) : null;
  var siiFile = files.SII ? new File(files.SII) : null;

  // Find the first valid file to use as base
  var baseFile = null;
  var baseName = "";

  if (siiFile && siiFile.exists) { baseFile = siiFile; baseName = "SII_NB"; }
  else if (haFile && haFile.exists) { baseFile = haFile; baseName = "Ha_NB"; }
  else if (oiiiFile && oiiiFile.exists) { baseFile = oiiiFile; baseName = "OIII_NB"; }

  if (!baseFile) {
    alert("Mode B requires at least one narrowband file (Ha, OIII, or SII).");
    return false;
  }

  // Open base file
  open(baseFile);
  var doc = app.activeDocument;
  doc.activeLayer.name = baseName;
  ensureRGB16(doc);

  // Place other narrowband files
  var layerNames = [];
  if (baseName !== "SII_NB" && siiFile && siiFile.exists) {
    placeAsLayer(siiFile, "SII_NB", doc);
    layerNames.push("SII_NB");
  } else if (baseName === "SII_NB") {
    layerNames.push("SII_NB");
  }

  if (baseName !== "Ha_NB" && haFile && haFile.exists) {
    placeAsLayer(haFile, "Ha_NB", doc);
    layerNames.push("Ha_NB");
  } else if (baseName === "Ha_NB") {
    layerNames.push("Ha_NB");
  }

  if (baseName !== "OIII_NB" && oiiiFile && oiiiFile.exists) {
    placeAsLayer(oiiiFile, "OIII_NB", doc);
    layerNames.push("OIII_NB");
  } else if (baseName === "OIII_NB") {
    layerNames.push("OIII_NB");
  }

  // Place star files
  if (files.RGBStars) placeAsLayer(files.RGBStars, "Stars_RGB", doc);
  if (files.HaStars) placeAsLayer(files.HaStars, "Ha_Stars", doc);

  // Build narrowband groups based on channel assignment
  // Process in order: channels assigned to R first, then G, then B
  var groupsCreated = [];
  var channels = ["R", "G", "B"];
  var nbTypes = ["SII", "Ha", "OIII"];

  for (var c = 0; c < channels.length; c++) {
    var channel = channels[c];
    for (var n = 0; n < nbTypes.length; n++) {
      var nbType = nbTypes[n];
      var assignments = channelAssign[nbType] || [];

      // Check if this NB type is assigned to this channel
      var isAssigned = false;
      for (var a = 0; a < assignments.length; a++) {
        if (assignments[a] === channel) { isAssigned = true; break; }
      }

      if (isAssigned) {
        var layerName = nbType + "_NB";
        if (getLayerByName(layerName)) {
          // For multi-channel assignment, we may need to duplicate the layer
          var existingGroup = null;
          for (var g = 0; g < groupsCreated.length; g++) {
            if (groupsCreated[g].nbType === nbType) {
              existingGroup = groupsCreated[g];
              break;
            }
          }

          if (existingGroup) {
            // Already created a group for this NB type - this is a multi-map
            // Duplicate the layer for the additional channel
            var srcLayer = getLayerByName(layerName);
            if (srcLayer) {
              var dupName = nbType + "_NB_" + channel;
              srcLayer.duplicate();
              app.activeDocument.activeLayer.name = dupName;
              var group = buildNarrowbandGroup(nbType, dupName, hues[channel], sats[channel], lights[channel], channel);
              if (group) groupsCreated.push({ group: group, nbType: nbType, channel: channel });
            }
          } else {
            // First time creating group for this NB type
            var group = buildNarrowbandGroup(nbType, layerName, hues[channel], sats[channel], lights[channel], channel);
            if (group) groupsCreated.push({ group: group, nbType: nbType, channel: channel });
          }
        }
      }
    }
  }

  // Build stars group
  var starsGroup = null;
  if (config.includeStars && (getLayerByName("Stars_RGB") || getLayerByName("Ha_Stars"))) {
    starsGroup = buildStarsGroup("Stars_RGB", "Ha_Stars");
  }

  // Build global adjustments
  var globalGroup = null;
  if (config.includeGlobal) {
    globalGroup = buildGlobalAdjustments();
  }

  // Enforce group order (Stars and Global at top)
  var order = ["Stars", "Global"];
  // Add narrowband groups in reverse order (B, G, R from bottom to top in stack)
  for (var i = groupsCreated.length - 1; i >= 0; i--) {
    order.push(groupsCreated[i].group.name);
  }
  enforceGroupOrder(order);

  return true;
}

// ==================== UI DIALOG ====================

function UnifiedWorkflowDialog(settings) {
  this.settings = settings;

  this.win = new Window("dialog", SCRIPT_NAME + " v" + VERSION);
  this.win.orientation = "column";
  this.win.alignChildren = ["fill", "top"];

  // ===== GROUP 1: Mode Selection =====
  var modePanel = this.win.add("panel", undefined, "Mode Selection");
  modePanel.alignChildren = ["left", "top"];
  modePanel.margins = 15;

  this.modeA = modePanel.add("radiobutton", undefined, "Mode A: RGB + Ha Enhancement (LRGB style)");
  this.modeB = modePanel.add("radiobutton", undefined, "Mode B: Narrowband Palette (SHO/HOO style)");

  if (settings.mode === "A") {
    this.modeA.value = true;
  } else {
    this.modeB.value = true;
  }

  // ===== STACKED CONTAINER for Mode-specific content =====
  // Using stack orientation so Mode A and Mode B content overlap in the same space
  // Only the visible one will show, and there's no empty space
  var stackContainer = this.win.add("group");
  stackContainer.orientation = "stack";
  stackContainer.alignChildren = ["fill", "top"];

  // ===== Mode A Stack Panel =====
  this.modeAStack = stackContainer.add("group");
  this.modeAStack.orientation = "column";
  this.modeAStack.alignChildren = ["fill", "top"];
  this.modeAStack.spacing = 10;

  // Mode A: File Input Panel
  var modeAFilePanel = this.modeAStack.add("panel", undefined, "File Input");
  modeAFilePanel.alignChildren = ["fill", "top"];
  modeAFilePanel.margins = 15;

  // Auto-detect row for Mode A
  var autoRowA = modeAFilePanel.add("group");
  autoRowA.alignChildren = ["left", "center"];
  this.autoDetectA = autoRowA.add("checkbox", undefined, "Auto-detect from folder");
  this.autoDetectA.value = settings.useAutoDetect;
  this.folderBtnA = autoRowA.add("button", undefined, "Select Folder...");
  this.folderPathA = autoRowA.add("statictext", undefined, settings.lastFolder || "(no folder selected)");
  this.folderPathA.characters = 40;

  this.modeAFiles = {};
  var modeALabels = ["L", "RGB", "Ha", "R", "RGB Stars (opt)", "Ha Stars (opt)"];
  var modeAKeys = ["L", "RGB", "Ha", "R", "RGBStars", "HaStars"];

  for (var i = 0; i < modeALabels.length; i++) {
    var row = modeAFilePanel.add("group");
    row.alignChildren = ["left", "center"];
    var lbl = row.add("statictext", undefined, modeALabels[i] + ":");
    lbl.characters = 15;
    var edit = row.add("edittext", undefined, settings.modeAFiles[modeAKeys[i]] || "");
    edit.characters = 50;
    var btn = row.add("button", undefined, "...");

    this.modeAFiles[modeAKeys[i]] = { edit: edit, btn: btn };

    // File browse handler
    (function(key, editField) {
      btn.onClick = function() {
        var f = File.openDialog("Select " + key + " file", "Images:*.tif;*.tiff;*.psd;*.psb;*.png;*.jpg;*.jpeg");
        if (f) editField.text = f.fsName;
      };
    })(modeAKeys[i], edit);
  }

  // ===== Mode B Stack Panel =====
  this.modeBStack = stackContainer.add("group");
  this.modeBStack.orientation = "column";
  this.modeBStack.alignChildren = ["fill", "top"];
  this.modeBStack.spacing = 10;

  // Mode B: Palette Panel
  this.presetPanel = this.modeBStack.add("panel", undefined, "Narrowband Palette");
  this.presetPanel.alignChildren = ["fill", "top"];
  this.presetPanel.margins = 15;

  var presetRow = this.presetPanel.add("group");
  presetRow.alignChildren = ["left", "center"];
  presetRow.add("statictext", undefined, "Palette:");
  this.presetDropdown = presetRow.add("dropdownlist", undefined,
    ["SHO (Hubble)", "HOO (Bicolor)", "HSO", "OHS", "Custom"]);
  this.presetDropdown.selection = 0;
  for (var p = 0; p < this.presetDropdown.items.length; p++) {
    if (this.presetDropdown.items[p].text === settings.preset) {
      this.presetDropdown.selection = p;
      break;
    }
  }

  // Hue/Sat/Light controls
  var hslGroup = this.presetPanel.add("group");
  hslGroup.orientation = "column";
  hslGroup.alignChildren = ["fill", "top"];

  this.hueSliders = {};
  this.satSliders = {};
  this.lightSliders = {};
  var channels = ["R", "G", "B"];

  for (var c = 0; c < channels.length; c++) {
    var ch = channels[c];
    var chRow = hslGroup.add("group");
    chRow.alignChildren = ["left", "center"];

    chRow.add("statictext", undefined, ch + ":");
    chRow.add("statictext", undefined, "Hue");
    var hueEdit = chRow.add("edittext", undefined, String(settings.hues[ch]));
    hueEdit.characters = 5;

    chRow.add("statictext", undefined, "Sat");
    var satEdit = chRow.add("edittext", undefined, String(settings.sats[ch]));
    satEdit.characters = 5;

    chRow.add("statictext", undefined, "Light");
    var lightEdit = chRow.add("edittext", undefined, String(settings.lights[ch]));
    lightEdit.characters = 5;

    this.hueSliders[ch] = hueEdit;
    this.satSliders[ch] = satEdit;
    this.lightSliders[ch] = lightEdit;
  }

  // Mode B: File Input Panel
  var modeBFilePanel = this.modeBStack.add("panel", undefined, "File Input");
  modeBFilePanel.alignChildren = ["fill", "top"];
  modeBFilePanel.margins = 15;

  // Auto-detect row for Mode B
  var autoRowB = modeBFilePanel.add("group");
  autoRowB.alignChildren = ["left", "center"];
  this.autoDetectB = autoRowB.add("checkbox", undefined, "Auto-detect from folder");
  this.autoDetectB.value = settings.useAutoDetect;
  this.folderBtnB = autoRowB.add("button", undefined, "Select Folder...");
  this.folderPathB = autoRowB.add("statictext", undefined, settings.lastFolder || "(no folder selected)");
  this.folderPathB.characters = 40;

  this.modeBFiles = {};
  this.channelChecks = {};
  var modeBLabels = ["Ha", "OIII", "SII", "RGB Stars (opt)", "Ha Stars (opt)"];
  var modeBKeys = ["Ha", "OIII", "SII", "RGBStars", "HaStars"];

  for (var i = 0; i < modeBLabels.length; i++) {
    var row = modeBFilePanel.add("group");
    row.alignChildren = ["left", "center"];
    var lbl = row.add("statictext", undefined, modeBLabels[i] + ":");
    lbl.characters = 15;
    var edit = row.add("edittext", undefined, settings.modeBFiles[modeBKeys[i]] || "");
    edit.characters = 35;
    var btn = row.add("button", undefined, "...");

    this.modeBFiles[modeBKeys[i]] = { edit: edit, btn: btn };

    // File browse handler
    (function(key, editField) {
      btn.onClick = function() {
        var f = File.openDialog("Select " + key + " file", "Images:*.tif;*.tiff;*.psd;*.psb;*.png;*.jpg;*.jpeg");
        if (f) editField.text = f.fsName;
      };
    })(modeBKeys[i], edit);

    // Channel assignment checkboxes (only for narrowband, not stars)
    if (i < 3) {
      row.add("statictext", undefined, " -> ");
      var rChk = row.add("checkbox", undefined, "R");
      var gChk = row.add("checkbox", undefined, "G");
      var bChk = row.add("checkbox", undefined, "B");

      // Set initial values from settings
      var assigns = settings.channelAssign[modeBKeys[i]] || [];
      rChk.value = assigns.indexOf("R") >= 0;
      gChk.value = assigns.indexOf("G") >= 0;
      bChk.value = assigns.indexOf("B") >= 0;

      this.channelChecks[modeBKeys[i]] = { R: rChk, G: gChk, B: bChk };
    }
  }

  // ===== GROUP 4: Options =====
  var optPanel = this.win.add("panel", undefined, "Options");
  optPanel.alignChildren = ["left", "top"];
  optPanel.margins = 15;

  this.includeStars = optPanel.add("checkbox", undefined, "Include Stars group");
  this.includeStars.value = settings.includeStars;

  this.includeGlobal = optPanel.add("checkbox", undefined, "Include Global adjustments (Levels, Curves, Color Balance, Vibrance)");
  this.includeGlobal.value = settings.includeGlobal;

  // Buttons
  var btnGroup = this.win.add("group");
  btnGroup.alignment = ["right", "bottom"];
  this.cancelBtn = btnGroup.add("button", undefined, "Cancel", { name: "cancel" });
  this.buildBtn = btnGroup.add("button", undefined, "Build Layers", { name: "ok" });

  // Event handlers
  var self = this;

  // Mode switching
  this.modeA.onClick = function() { self.updateModeVisibility(); };
  this.modeB.onClick = function() { self.updateModeVisibility(); };

  // Folder selection - Mode A
  this.folderBtnA.onClick = function() {
    var folder = Folder.selectDialog("Select folder containing image files");
    if (folder) {
      self.folderPathA.text = folder.fsName;
      if (self.autoDetectA.value) {
        self.autoDetectFiles(folder, "A");
      }
    }
  };

  // Folder selection - Mode B
  this.folderBtnB.onClick = function() {
    var folder = Folder.selectDialog("Select folder containing image files");
    if (folder) {
      self.folderPathB.text = folder.fsName;
      if (self.autoDetectB.value) {
        self.autoDetectFiles(folder, "B");
      }
    }
  };

  // Preset selection
  this.presetDropdown.onChange = function() {
    var presetName = self.presetDropdown.selection.text;
    if (presetName !== "Custom" && PALETTE_PRESETS[presetName]) {
      self.applyPreset(PALETTE_PRESETS[presetName]);
    }
  };

  // Initialize visibility
  this.updateModeVisibility();
}

UnifiedWorkflowDialog.prototype.updateModeVisibility = function() {
  var isA = this.modeA.value;

  // Show/hide stacked panels - only one visible at a time
  this.modeAStack.visible = isA;
  this.modeBStack.visible = !isA;

  // Apply preset when switching to Mode B to set initial channel assignments
  if (!isA && this.presetDropdown.selection) {
    var presetName = this.presetDropdown.selection.text;
    if (presetName !== "Custom" && PALETTE_PRESETS[presetName]) {
      this.applyPreset(PALETTE_PRESETS[presetName]);
    }
  }
};

UnifiedWorkflowDialog.prototype.autoDetectFiles = function(folder, mode) {
  var self = this;

  // Helper to try multiple filename patterns and return first match
  function findFile(folder, patterns) {
    for (var i = 0; i < patterns.length; i++) {
      var f = new File(folder.fsName + "/" + patterns[i] + ".tif");
      if (f.exists) return f;
    }
    return null;
  }

  if (mode === "A") {
    // Mode A file detection - try multiple naming conventions
    var modeAPatterns = {
      "L": ["L_NL", "L"],
      "RGB": ["RGB_NL", "RGB"],
      "Ha": ["HA_NL", "Ha_NL", "Ha"],
      "R": ["R_NL", "R"],
      "RGBStars": ["RGB_Stars_NL", "RGB_Stars"],
      "HaStars": ["HA_Stars_NL", "Ha_Stars_NL", "Ha_Stars"]
    };

    for (var key in modeAPatterns) {
      if (this.modeAFiles[key]) {
        var f = findFile(folder, modeAPatterns[key]);
        if (f) {
          this.modeAFiles[key].edit.text = f.fsName;
        }
      }
    }
  } else {
    // Mode B file detection
    var modeBPatterns = {
      "Ha": ["Ha_NL", "HA_NL", "Ha_NB", "HA_NB"],
      "OIII": ["OIII_NL", "OIII_NB"],
      "SII": ["SII_NL", "SII_NB"],
      "RGBStars": ["RGB_Stars_NL", "RGB_Stars", "Stars_RGB"],
      "HaStars": ["HA_Stars_NL", "Ha_Stars_NL", "Ha_Stars", "HA_Stars"]
    };

    for (var key in modeBPatterns) {
      if (this.modeBFiles[key]) {
        var f = findFile(folder, modeBPatterns[key]);
        if (f) {
          this.modeBFiles[key].edit.text = f.fsName;
        }
      }
    }
  }
};

UnifiedWorkflowDialog.prototype.applyPreset = function(preset) {
  // Apply channel assignments
  for (var nb in this.channelChecks) {
    var checks = this.channelChecks[nb];
    var assigns = preset[nb] || [];
    checks.R.value = assigns.indexOf("R") >= 0;
    checks.G.value = assigns.indexOf("G") >= 0;
    checks.B.value = assigns.indexOf("B") >= 0;
  }

  // Apply hue/sat/light values
  for (var ch in preset.hues) {
    if (this.hueSliders[ch]) this.hueSliders[ch].text = String(preset.hues[ch]);
    if (this.satSliders[ch]) this.satSliders[ch].text = String(preset.sats[ch]);
    if (this.lightSliders[ch]) this.lightSliders[ch].text = String(preset.lights[ch]);
  }
};

UnifiedWorkflowDialog.prototype.getConfig = function() {
  var config = {
    mode: this.modeA.value ? "A" : "B",
    includeStars: this.includeStars.value,
    includeGlobal: this.includeGlobal.value,
    files: {},
    channelAssign: {},
    hues: {},
    sats: {},
    lights: {}
  };

  if (config.mode === "A") {
    for (var key in this.modeAFiles) {
      config.files[key] = this.modeAFiles[key].edit.text;
    }
  } else {
    for (var key in this.modeBFiles) {
      config.files[key] = this.modeBFiles[key].edit.text;
    }

    // Get channel assignments
    for (var nb in this.channelChecks) {
      var assigns = [];
      if (this.channelChecks[nb].R.value) assigns.push("R");
      if (this.channelChecks[nb].G.value) assigns.push("G");
      if (this.channelChecks[nb].B.value) assigns.push("B");
      config.channelAssign[nb] = assigns;
    }

    // Get hue/sat/light values
    var channels = ["R", "G", "B"];
    for (var i = 0; i < channels.length; i++) {
      var ch = channels[i];
      config.hues[ch] = parseInt(this.hueSliders[ch].text) || 0;
      config.sats[ch] = parseInt(this.satSliders[ch].text) || 100;
      config.lights[ch] = parseInt(this.lightSliders[ch].text) || -50;
    }
  }

  return config;
};

UnifiedWorkflowDialog.prototype.getSettings = function() {
  var s = cloneObject(this.settings);
  s.mode = this.modeA.value ? "A" : "B";
  // Save auto-detect from whichever mode is active
  s.useAutoDetect = this.modeA.value ? this.autoDetectA.value : this.autoDetectB.value;
  s.lastFolder = this.modeA.value ? this.folderPathA.text : this.folderPathB.text;
  s.preset = this.presetDropdown.selection ? this.presetDropdown.selection.text : "Custom";
  s.includeStars = this.includeStars.value;
  s.includeGlobal = this.includeGlobal.value;

  // Save file paths
  for (var key in this.modeAFiles) {
    s.modeAFiles[key] = this.modeAFiles[key].edit.text;
  }
  for (var key in this.modeBFiles) {
    s.modeBFiles[key] = this.modeBFiles[key].edit.text;
  }

  // Save channel assignments
  for (var nb in this.channelChecks) {
    var assigns = [];
    if (this.channelChecks[nb].R.value) assigns.push("R");
    if (this.channelChecks[nb].G.value) assigns.push("G");
    if (this.channelChecks[nb].B.value) assigns.push("B");
    s.channelAssign[nb] = assigns;
  }

  // Save hue/sat/light
  var channels = ["R", "G", "B"];
  for (var i = 0; i < channels.length; i++) {
    var ch = channels[i];
    s.hues[ch] = parseInt(this.hueSliders[ch].text) || 0;
    s.sats[ch] = parseInt(this.satSliders[ch].text) || 100;
    s.lights[ch] = parseInt(this.lightSliders[ch].text) || -50;
  }

  return s;
};

UnifiedWorkflowDialog.prototype.show = function() {
  return this.win.show();
};

// ==================== MAIN ====================

function main() {
  var settings = loadSettings();
  var dialog = new UnifiedWorkflowDialog(settings);

  if (dialog.show() === 1) {
    var config = dialog.getConfig();
    var success = false;

    try {
      if (config.mode === "A") {
        success = executeModeA(config);
      } else {
        success = executeModeB(config);
      }

      if (success) {
        saveSettings(dialog.getSettings());
        alert(SCRIPT_NAME + " complete!\n\n" +
          "Mode: " + (config.mode === "A" ? "RGB + Ha Enhancement" : "Narrowband Palette") + "\n" +
          "Stars group: " + (config.includeStars ? "Yes" : "No") + "\n" +
          "Global adjustments: " + (config.includeGlobal ? "Yes" : "No"));
      }
    } catch (e) {
      alert("Error during execution: " + e.message);
    }
  }
}

main();
