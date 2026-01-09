# Distant Pixels Studio v1.0.5

A two-tool workflow for astrophotography image processing: PixInsight linear preprocessing combined with Photoshop layer composition.

## Overview

Distant Pixels Studio consists of two scripts that work together:

1. **DistantPixelsStudio_PI.js** (PixInsight) - Automated linear processing pipeline
2. **DistantPixelsStudio_PS.jsx** (Photoshop) - Layer structure builder for final composition

The workflow processes master files through PixInsight's linear pipeline, then builds organized layer structures in Photoshop for final image editing.

---

## PixInsight Script (DistantPixelsStudio_PI.js)

### Features

- **Dual Workflow Processing**: Separate pipelines for NB/L and RGB channels
- **Supported Channels**: Ha, OIII, SII, R, G, B, L (all optional)
- **Automated Processing Steps**:
  - Image cropping (using saved process icons)
  - Gradient correction (GradientCorrection)
  - Blur reduction (BlurXTerminator)
  - Noise reduction (NoiseXTerminator)
  - Non-linear stretch (MultiscaleAdaptiveStretch)
  - Star removal (StarXTerminator)
  - Final noise reduction
- **RGB Combination**: Automatic LinearFit calibration and PixelMath combination
- **Folder Scanner**: Auto-detect master files by filter name
- **Flexible Output**: Save TIF files and/or keep images in PixInsight
- **Settings Persistence**: Remembers settings between sessions

### Requirements

- PixInsight 1.9.0 or later
- Optional plugins: BlurXTerminator, NoiseXTerminator, StarXTerminator
- Built-in: GradientCorrection, LinearFit, PixelMath, MultiscaleAdaptiveStretch

### Installation

1. Download `DistantPixelsStudio_PI.js`
2. In PixInsight: **Script > Feature Scripts > Add**
3. Navigate to the script folder and click **Done**
4. Access via **Script > Utilities > DistantPixelsStudio**

### Processing Order

**RGB Workflow:**
1. Open R, G, B → 2. Crop → 3. Gradient → 4. LinearFit → 5. Combine → 6. Blur → 7. Noise → 8. Stretch → 9. Final Noise → 10. Star Removal → 11. Save

**NB/L Workflow:**
1. Open images → 2. Crop → 3. Gradient → 4. Blur → 5. Noise → 6. Stretch → 7. Star Removal → 8. Final Noise → 9. Save

### MultiscaleAdaptiveStretch Parameters

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| Target Background | 0.0-0.5 | 0.15 | Background brightness level |
| Aggressiveness | 0.0-1.0 | 0.70 | Shadow clipping (higher = more contrast) |
| Dynamic Range | 0.0-1.0 | 0.40 | Highlight compression (higher = better stars) |

### Output Files

| Input | Output |
|-------|--------|
| Ha | Ha_NL.tif |
| OIII | OIII_NL.tif |
| SII | SII_NL.tif |
| L | L_NL.tif |
| R+G+B | RGB_NL.tif |
| R+G+B (stars) | RGB_Stars_NL.tif |
| Ha (stars) | HA_Stars_NL.tif |
| R (optional) | R_NL.tif |

---

## Photoshop Script (DistantPixelsStudio_PS.jsx)

### Features

- **Mode A: RGB + Ha Enhancement** - LRGB-style workflow with optional Ha continuum subtraction
- **Mode B: Narrowband Palette** - Flexible SHO/HOO/HSO channel assignment with presets
- Auto-detect files from folder
- Settings persistence between sessions
- Optional Stars and Global adjustment groups

### Installation

1. Download `DistantPixelsStudio_PS.jsx`
2. In Photoshop: **File > Scripts > Browse**
3. Select the script file

### Usage

#### Mode A: RGB + Ha Enhancement

**Required files:** L_NL.tif, RGB_NL.tif

**Optional files:** Ha_NL.tif + R_NL.tif (both required for continuum subtraction), RGB_Stars_NL.tif, Ha_Stars_NL.tif

#### Mode B: Narrowband Palette

**Required:** At least one of Ha_NL.tif, OIII_NL.tif, SII_NL.tif

**Presets:** SHO (Hubble), HOO (Bicolor), HSO, OHS, Custom

### Layer Structure & Blend Modes

#### RGB+L (Mode A without Ha)

| Group | Blend Mode | Notes |
|-------|------------|-------|
| **Stars** | SCREEN | |
| ├─ RGB_Stars_NL | COLOR | |
| └─ Ha_Stars_NL | SCREEN | (if present) |
| **Global** | SCREEN | |
| **Lum** | SCREEN | |
| └─ L_NL | NORMAL | |
| **RGB** | COLOR | |
| └─ RGB_NL | COLOR | |

#### HaLRGB (Mode A with Ha+R)

| Group | Blend Mode | Notes |
|-------|------------|-------|
| **Stars** | SCREEN | |
| ├─ RGB_Stars_NL | COLOR | |
| └─ Ha_Stars_NL | SCREEN | |
| **Global** | PASSTHROUGH | |
| **Ha** | SCREEN | RED channel only |
| ├─ R_NL | SUBTRACT | |
| └─ Ha_NL | SUBTRACT | |
| **RGB** | PASSTHROUGH | |
| └─ RGB_NL | COLOR | |
| **Lum** | PASSTHROUGH | |
| └─ L_NL | NORMAL | |

#### SHO/HOO (Mode B - Narrowband)

| Group | Blend Mode | Notes |
|-------|------------|-------|
| **Stars** | SCREEN | |
| **Global** | PASSTHROUGH | |
| **SII (R)** | SCREEN | Hue: 0 |
| **Ha (G)** | SCREEN | Hue: 130 |
| **OIII (B)** | SCREEN | Hue: 230 |

### File Naming Conventions

| Channel | Expected Filenames |
|---------|-------------------|
| L | L_NL.tif |
| RGB | RGB_NL.tif |
| Ha | HA_NL.tif, Ha_NL.tif |
| R | R_NL.tif |
| OIII | OIII_NL.tif |
| SII | SII_NL.tif |
| RGB Stars | RGB_Stars_NL.tif |
| Ha Stars | HA_Stars_NL.tif, Ha_Stars_NL.tif |

---

## Documentation

See [UserManual.md](UserManual.md) for comprehensive documentation including:
- Detailed installation instructions
- Complete workflow examples (LRGB, HaLRGB, SHO, HOO)
- All parameter descriptions
- Troubleshooting guide

---

## Version History

### v1.0.5 (January 2026)
- Initial public release
- PixInsight: Dual NB/L and RGB pipelines with MultiscaleAdaptiveStretch
- Photoshop: Mode A (LRGB/HaLRGB) and Mode B (Narrowband palettes)
- Automatic master file detection
- Settings persistence
- Star removal with separate star image generation

---

## License

Copyright (C) 2026 Distant Pixels Studio

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

See <https://www.gnu.org/licenses/gpl-3.0.html> for the full license text.
