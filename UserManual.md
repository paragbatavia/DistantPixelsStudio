# Distant Pixels Studio v1.0.6 - User Manual

A two-tool workflow for astrophotography image processing, combining PixInsight linear preprocessing with Photoshop layer composition.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Installation](#2-installation)
3. [PixInsight Tool (DistantPixelsStudio_PI.js)](#3-pixinsight-tool)
4. [Photoshop Tool (DistantPixelsStudio_PS.jsx)](#4-photoshop-tool)
5. [Complete Workflow Examples](#5-complete-workflow-examples)
6. [Blend Mode Reference](#6-blend-mode-reference)
7. [Output File Reference](#7-output-file-reference)
8. [Troubleshooting](#8-troubleshooting)
9. [Settings Persistence](#9-settings-persistence)

---

## 1. Introduction

### What is Distant Pixels Studio?

Distant Pixels Studio is a two-tool workflow designed to streamline astrophotography image processing:

1. **DistantPixelsStudio_PI.js** (PixInsight) - Handles linear preprocessing: gradient correction, deconvolution, noise reduction, stretching, and star removal
2. **DistantPixelsStudio_PS.jsx** (Photoshop) - Builds organized layer structures for final image composition and color adjustment

### The Workflow Concept

```
PixInsight (Linear Processing)          Photoshop (Composition)
┌─────────────────────────────┐         ┌─────────────────────────────┐
│ Master Files (Ha, OIII,     │         │ Load *_NL.tif files         │
│ SII, R, G, B, L)            │         │                             │
│         ↓                   │         │         ↓                   │
│ Crop, Gradient, Blur,       │  ───>   │ Build layer groups with     │
│ Noise, Stretch, Stars       │         │ adjustment layers           │
│         ↓                   │         │                             │
│ Output: *_NL.tif files      │         │ Final image editing         │
└─────────────────────────────┘         └─────────────────────────────┘
```

### Supported Image Types

- **LRGB** - Luminance + Red/Green/Blue broadband
- **HaLRGB** - LRGB with Hydrogen-alpha enhancement (continuum subtraction)
- **SHO (Hubble Palette)** - Sulfur II, Hydrogen-alpha, Oxygen III
- **HOO (Bicolor)** - Hydrogen-alpha, Oxygen III mapped to RGB
- **HSO, OHS** - Alternative narrowband mappings
- **Custom** - Any combination of narrowband filters

---

## 2. Installation

### PixInsight Script Installation

1. Download `DistantPixelsStudio_PI.js` to your computer
2. In PixInsight, go to **Script > Feature Scripts**
3. Click **Add** and navigate to the folder containing the script
4. Click **Done**
5. Access via **Script > Utilities > DistantPixelsStudio**

**Alternative:** Run directly via **Script > Run Script File** and select `DistantPixelsStudio_PI.js`

### Photoshop Script Installation

1. Download `DistantPixelsStudio_PS.jsx` to any location
2. In Photoshop, go to **File > Scripts > Browse**
3. Select the script file to run

**Tip:** For frequent use, copy the script to Photoshop's Scripts folder for direct menu access.

---

## 3. PixInsight Tool

### 3.1 Overview

The PixInsight tool provides automated linear processing pipelines for astrophotography master files. It features:

- **Dual Workflow Processing**: Separate pipelines for NB/L and RGB channels
- **Automatic Master Detection**: Scan folders to auto-populate channel files
- **Flexible Processing Steps**: Enable/disable each processing stage
- **Configurable Parameters**: Adjust noise reduction and stretch settings

### 3.2 Quick Start

1. Launch the script via **Script > Utilities > DistantPixelsStudio**
2. Click **Select...** next to Scan Folder and choose your masters folder
3. Click **Scan** to auto-detect master files
4. Configure processing options as needed
5. Set your output folder
6. Click **Run**

### 3.3 Input Files Section

#### Folder Scanner

The folder scanner automatically detects master files by parsing filenames for filter information.

**Supported naming patterns:**
- Standard WBPP format: `masterLight_BIN-1_9576x6388_EXPOSURE-300.00s_FILTER-Ha_mono.xisf`
- Simple format: `Ha_master.xisf`, `masterLight_Ha.xisf`
- Filter variations: `_HA_`, `_H-ALPHA_`, `_HALPHA_`, `_OIII_`, `_O3_`, etc.

**Supported file formats:**
- `.xisf` (PixInsight native)
- `.fits`, `.fit`, `.fts` (FITS)
- `.tif`, `.tiff` (TIFF)

#### Manual File Selection

Use the **...** button next to each channel to manually select files. The **Clear** button removes the selection.

**Available channels:**

| Channel | Description |
|---------|-------------|
| Ha | Hydrogen-alpha narrowband |
| OIII | Oxygen III narrowband |
| SII | Sulfur II narrowband |
| R | Red broadband |
| G | Green broadband |
| B | Blue broadband |
| L | Luminance |

All channels are optional. Only selected channels will be processed.

### 3.4 Crop Settings

Cropping uses saved DynamicCrop process icons (`.xpsm` files).

**To create a crop file:**

1. Open a reference image in PixInsight
2. Apply **DynamicCrop** with your desired crop region
3. Drag the process icon from the Process Bar to your desktop or folder
4. Save as a `.xpsm` file
5. In the script, enable "Apply crop" and select this file

The same crop will be applied to all images ensuring consistent framing.

### 3.5 NB/L Processing Workflow

Enable "Enable NB/L processing" to process Ha, OIII, SII, and L channels.

**Processing order:**

1. **Open** - Load the image
2. **Crop** - Apply crop (if enabled)
3. **Gradient correction** - Remove gradients using GradientCorrection
4. **Blur reduction** - Sharpen using BlurXTerminator
5. **Noise reduction** - Initial noise reduction with NoiseXTerminator
6. **MultiscaleAdaptiveStretch** - Convert to non-linear
7. **Star removal** - Ha generates both starless and stars images; others generate starless only
8. **Final noise reduction** - Post-stretch noise reduction

**Noise reduction parameters:**

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| Denoise | 0-100 | 40 | Noise reduction strength |
| Detail | 0-100 | 15 | Detail preservation |
| Final Denoise | 0-100 | 20 | Post-stretch noise reduction |
| Final Detail | 0-100 | 25 | Post-stretch detail preservation |

### 3.6 RGB Processing Workflow

Enable "Enable RGB processing" to process R, G, B channels as a combined workflow.

**Processing order:**
1. **Open** - Load R, G, B images
2. **Crop** - Apply crop (if enabled)
3. **Gradient correction** - Remove gradients from each channel
4. **LinearFit** - Calibrate G and B to R reference
5. **Combine** - Create RGB image via PixelMath
6. **Blur reduction** - Sharpen combined image
7. **Noise reduction** - Initial noise reduction
8. **MultiscaleAdaptiveStretch** - Convert to non-linear
9. **Final noise reduction** - Post-stretch noise reduction
10. **Star removal** - Generate RGB starless and RGB stars images
11. **Save R channel** (optional) - Save processed R for Ha continuum subtraction

**Save Individual R Channel:**
Enable this option when processing HaLRGB data. The R channel is processed with Blur, Noise, Stretch, Final Noise, and Star Removal (starless only), then saved as `R_NL.tif` for use in Photoshop's Ha continuum subtraction.

### 3.7 MultiscaleAdaptiveStretch Parameters

MAS provides better star shape preservation and contrast compared to traditional histogram stretching.

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| Target Background | 0.0-0.5 | 0.15 | Controls background brightness level |
| Aggressiveness | 0.0-1.0 | 0.70 | Shadow clipping. Higher = more contrast, more noise |
| Dynamic Range | 0.0-1.0 | 0.40 | Highlight compression. Higher = better star profiles |

**Notes:**
- L channel uses the same RGB stretch settings for consistent LRGB combining
- Adjust Target Background to control how dark your background appears
- Lower Aggressiveness if you see excessive noise in shadows
- Increase Dynamic Range if stars appear bloated

### 3.8 Output Options

| Option | Description |
|--------|-------------|
| Save TIF files | Save processed images as 32-bit float TIF files |
| Keep images in PixInsight | Keep final images as PixInsight windows for immediate inspection |
| Output folder | Directory where TIF files will be saved |
| Suffix | Optional suffix appended to output filenames |

Both output options can be enabled simultaneously.

**Output naming convention:** `{Channel}_NL.tif`

### 3.9 Plugin Dependencies

The script uses optional third-party plugins that gracefully degrade if not installed:

| Plugin | Purpose | Fallback |
|--------|---------|----------|
| BlurXTerminator | Deconvolution/sharpening | Step skipped with warning |
| NoiseXTerminator | Noise reduction | Step skipped with warning |
| StarXTerminator | Star removal | Step skipped with warning |
| MultiscaleAdaptiveStretch | Non-linear stretch | **Required** - script fails without it |

Install these via PixInsight's update system or from their respective vendors.

---

## 4. Photoshop Tool

### 4.1 Overview

The Photoshop tool builds organized layer structures from PixInsight output files. It supports two modes:

- **Mode A: RGB + Ha Enhancement** - For LRGB and HaLRGB workflows
- **Mode B: Narrowband Palette** - For SHO, HOO, and other narrowband combinations

### 4.2 Quick Start

**For LRGB:**

1. Select Mode A
2. Enable "Auto-detect from folder" and click **Select Folder...**
3. Verify L_NL.tif and RGB_NL.tif are detected
4. Click **Build Layers**

**For SHO:**

1. Select Mode B
2. Enable "Auto-detect from folder" and click **Select Folder...**
3. Select "SHO (Hubble)" preset
4. Click **Build Layers**

### 4.3 Mode A: RGB + Ha Enhancement

Mode A creates layer structures for LRGB and HaLRGB workflows.

**Required files:**
- `L_NL.tif` - Luminance
- `RGB_NL.tif` - Combined RGB

**Optional files (for HaLRGB):**
- `Ha_NL.tif` - Hydrogen-alpha (requires R_NL.tif)
- `R_NL.tif` - Red channel for continuum subtraction (requires Ha_NL.tif)

**Optional star files:**
- `RGB_Stars_NL.tif` - RGB star layer
- `HA_Stars_NL.tif` or `Ha_Stars_NL.tif` - Ha star layer

**Validation rules:**
- L and RGB are always required
- Ha and R must be provided together (for continuum subtraction) or not at all

### 4.4 Mode A Layer Structure

#### LRGB (Without Ha)

```
Stars (SCREEN)
├── Stars Hue/Sat
├── Stars Curves
├── Stars Levels
├── RGB_Stars_NL (COLOR)
└── Ha_Stars_NL (SCREEN) [if present]

Global (SCREEN)
├── Vibrance
├── Global Hue/Sat
├── Global Curves
├── Color Balance
└── Global Levels

Lum (SCREEN)
├── Lum Levels
└── L_NL (NORMAL)

RGB (COLOR)
├── RGB Hue/Sat
├── RGB Curves
├── RGB Levels
└── RGB_NL (COLOR)
```

#### HaLRGB (With Ha+R)

```
Stars (SCREEN)
├── Stars Hue/Sat
├── Stars Curves
├── Stars Levels
├── RGB_Stars_NL (COLOR)
└── Ha_Stars_NL (SCREEN)

Global (PASSTHROUGH)
├── Vibrance
├── Global Hue/Sat
├── Global Curves
├── Color Balance
└── Global Levels

Ha (SCREEN, RED channel only)
├── R Levels (Continuum)
├── R_NL (SUBTRACT)
└── Ha_NL (SUBTRACT)

RGB (PASSTHROUGH)
├── RGB Hue/Sat
├── RGB Curves
├── RGB Levels
└── RGB_NL (COLOR)

Lum (PASSTHROUGH)
├── Lum Levels
└── L_NL (NORMAL)
```

### 4.5 Mode B: Narrowband Palette

Mode B creates layer structures for narrowband imaging with flexible channel assignment.

**Required files (at least one):**
- `Ha_NL.tif` - Hydrogen-alpha
- `OIII_NL.tif` - Oxygen III
- `SII_NL.tif` - Sulfur II

**Optional star files:**
- `RGB_Stars_NL.tif`
- `HA_Stars_NL.tif` or `Ha_Stars_NL.tif`

#### Channel Assignment

Each narrowband filter can be mapped to one or more RGB channels:

| Filter | Can map to |
|--------|------------|
| Ha | R, G, B |
| OIII | R, G, B |
| SII | R, G, B |

**Multi-channel mapping:** A single filter can be assigned to multiple channels. For example, in HOO, OIII is mapped to both G and B, creating cyan tones.

### 4.6 Narrowband Presets

| Preset | Mapping | Typical Use |
|--------|---------|-------------|
| SHO (Hubble) | SII→R, Ha→G, OIII→B | Classic Hubble Palette |
| HOO (Bicolor) | Ha→R, OIII→G+B | Two-filter bicolor |
| HSO | Ha→R, SII→G, OIII→B | Alternative mapping |
| OHS | OIII→R, Ha→G, SII→B | Inverted palette |
| Custom | User-defined | Any combination |

### 4.7 Hue/Saturation/Lightness Controls

Each RGB channel has adjustable colorization parameters:

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| Hue | 0-360 | Varies | Color hue for the channel |
| Saturation | 0-100 | 100 | Color saturation |
| Lightness | -100 to +100 | -50 | Lightness adjustment |

**Default hue values by preset:**

| Preset | R Hue | G Hue | B Hue |
|--------|-------|-------|-------|
| SHO | 0 | 130 | 230 |
| HOO | 0 | 230 | 230 |
| HSO | 0 | 0 | 230 |
| OHS | 230 | 0 | 0 |

### 4.8 Mode B Layer Structure

```
Stars (SCREEN)
├── Stars Hue/Sat
├── Stars Curves
├── Stars Levels
├── RGB_Stars_NL (COLOR) [if present]
└── Ha_Stars_NL (SCREEN) [if present]

Global (PASSTHROUGH)
├── Vibrance
├── Global Hue/Sat
├── Global Curves
├── Color Balance
└── Global Levels

SII (R) (SCREEN) [if SII→R]
├── Hue/Sat (H:0, S:100, L:-50)
├── Curves
├── Levels
└── SII_NB

Ha (G) (SCREEN) [if Ha→G]
├── Hue/Sat (H:130, S:100, L:-50)
├── Curves
├── Levels
└── Ha_NB

OIII (B) (SCREEN) [if OIII→B]
├── Hue/Sat (H:230, S:100, L:-50)
├── Curves
├── Levels
└── OIII_NB
```

**Note:** Group names include the channel assignment, e.g., "Ha (G)" indicates Ha is mapped to Green.

### 4.9 Stars Group

The Stars group provides isolated star control:

| Layer | Blend Mode | Purpose |
|-------|------------|---------|
| Stars group | SCREEN | Additive blending for stars |
| Stars Hue/Sat | - | Adjust star colors |
| Stars Curves | - | Adjust star brightness/contrast |
| Stars Levels | - | Fine-tune star brightness |
| RGB_Stars_NL | COLOR | Provides star color |
| Ha_Stars_NL | SCREEN | Adds Ha star brightness |

### 4.10 Global Adjustments Group

The Global group provides overall image adjustments:

| Layer | Purpose |
|-------|---------|
| Vibrance | Enhance color saturation naturally |
| Hue/Saturation | Global color shifts |
| Curves | Contrast and tonal adjustments |
| Color Balance | Shadow/Midtone/Highlight color shifts |
| Levels | Black point, white point, gamma |

**Blend mode varies by workflow:**
- LRGB: SCREEN
- HaLRGB: PASSTHROUGH
- Narrowband: PASSTHROUGH

### 4.11 Auto-Detect Files

The auto-detect feature searches for files matching these patterns:

| Channel | Patterns Searched |
|---------|-------------------|
| L | L_NL.tif, L.tif |
| RGB | RGB_NL.tif, RGB.tif |
| Ha | HA_NL.tif, Ha_NL.tif, Ha.tif |
| R | R_NL.tif, R.tif |
| OIII | OIII_NL.tif, OIII_NB.tif |
| SII | SII_NL.tif, SII_NB.tif |
| RGB Stars | RGB_Stars_NL.tif, RGB_Stars.tif |
| Ha Stars | HA_Stars_NL.tif, Ha_Stars_NL.tif |

---

## 5. Complete Workflow Examples

### 5.1 Example: Processing LRGB Data

**PixInsight:**

1. Scan folder containing L, R, G, B masters
2. Enable "RGB Processing" with: Gradient, LinearFit, Combine, Blur, Noise, Stretch, Star Removal
3. Enable "NB/L Processing" for L channel with: Gradient, Blur, Noise, Stretch
4. Run pipeline

**Output files:** `L_NL.tif`, `RGB_NL.tif`, `RGB_Stars_NL.tif`

**Photoshop:**

1. Select Mode A
2. Auto-detect from output folder
3. Enable Stars group and Global adjustments
4. Build Layers
5. Adjust Lum Levels for brightness, RGB adjustments for color

### 5.2 Example: HaLRGB with Continuum Subtraction

**PixInsight:**

1. Scan folder containing Ha, L, R, G, B masters
2. Enable "RGB Processing" with all options plus "Save individual R channel"
3. Enable "NB/L Processing" for Ha and L with Star Removal enabled for Ha
4. Run pipeline

**Output files:** `Ha_NL.tif`, `HA_Stars_NL.tif`, `L_NL.tif`, `RGB_NL.tif`, `RGB_Stars_NL.tif`, `R_NL.tif`

**Photoshop:**

1. Select Mode A
2. Auto-detect from output folder (should find all files)
3. Enable Stars group and Global adjustments
4. Build Layers
5. Adjust R Levels (Continuum) in Ha group to control subtraction strength
6. The Ha group is restricted to RED channel only

### 5.3 Example: SHO Hubble Palette

**PixInsight:**

1. Scan folder containing Ha, OIII, SII masters
2. Enable "NB/L Processing" with: Gradient, Blur, Noise, Stretch, Star Removal (for Ha)
3. Run pipeline

**Output files:** `Ha_NL.tif`, `HA_Stars_NL.tif`, `OIII_NL.tif`, `SII_NL.tif`

**Photoshop:**

1. Select Mode B
2. Auto-detect from output folder
3. Select "SHO (Hubble)" preset
4. Build Layers
5. Adjust Hue/Sat in each narrowband group to fine-tune colors
6. Use Levels/Curves in each group to balance channel brightness

### 5.4 Example: HOO Bicolor

**PixInsight:**

1. Scan folder containing Ha, OIII masters
2. Enable "NB/L Processing" with: Gradient, Blur, Noise, Stretch, Star Removal (for Ha)
3. Run pipeline

**Output files:** `Ha_NL.tif`, `HA_Stars_NL.tif`, `OIII_NL.tif`

**Photoshop:**

1. Select Mode B
2. Auto-detect from output folder
3. Select "HOO (Bicolor)" preset
4. Note: OIII is mapped to both G and B (creates duplicate layer)
5. Build Layers
6. Adjust the two OIII groups independently if desired

---

## 6. Blend Mode Reference

### Blend Modes Used

| Mode | Description | Usage |
|------|-------------|-------|
| SCREEN | Lightens by inverse multiply. Additive-like effect. | Stars groups, Lum in LRGB, narrowband groups |
| COLOR | Applies hue and saturation, preserves luminosity | RGB layer, RGB Stars |
| SUBTRACT | Subtracts pixel values | Ha continuum subtraction (Ha - R) |
| PASSTHROUGH | Group inherits blend mode of contents | Most groups in HaLRGB and narrowband |
| NORMAL | Standard opacity blending | Base image layers |

### Why These Blend Modes?

**SCREEN for luminosity layers:**
- Adds brightness without replacing underlying color
- Perfect for combining L with RGB or adding narrowband signal

**COLOR for RGB:**
- Applies color information to luminosity
- Preserves the detail from underlying layers

**SUBTRACT for continuum:**
- Ha contains both emission nebula and star continuum
- Subtracting R (which is mostly continuum) isolates pure Ha emission

**PASSTHROUGH for groups:**
- Allows adjustment layers in the group to affect layers below
- Essential for Global adjustments to work on the entire image

---

## 7. Output File Reference

### PixInsight Output Files

| File | Source | Description |
|------|--------|-------------|
| Ha_NL.tif | Ha master | Processed Ha (starless) |
| HA_Stars_NL.tif | Ha master | Ha stars only |
| OIII_NL.tif | OIII master | Processed OIII (starless) |
| SII_NL.tif | SII master | Processed SII (starless) |
| L_NL.tif | L master | Processed Luminance (starless) |
| RGB_NL.tif | R+G+B masters | Combined RGB (starless) |
| RGB_Stars_NL.tif | R+G+B masters | RGB stars only |
| R_NL.tif | R master | Processed R channel for continuum |

**Note:** "_NL" suffix indicates "Non-Linear" (stretched) image.

### Photoshop Expected Input Files

| Mode A | Mode B |
|--------|--------|
| L_NL.tif (required) | Ha_NL.tif |
| RGB_NL.tif (required) | OIII_NL.tif |
| Ha_NL.tif (optional) | SII_NL.tif |
| R_NL.tif (optional) | RGB_Stars_NL.tif (optional) |
| RGB_Stars_NL.tif (optional) | HA_Stars_NL.tif (optional) |
| HA_Stars_NL.tif (optional) | |

---

## 8. Troubleshooting

### PixInsight Issues

**"Process not found" errors:**
- Install required plugins (BlurXTerminator, NoiseXTerminator, StarXTerminator)
- Update PixInsight to latest version
- MultiscaleAdaptiveStretch is included in PixInsight 1.9.0+

**Script not appearing in menu:**
- Add the script folder via Script > Feature Scripts
- Restart PixInsight after adding

**Folder scan finds no files:**
- Verify files have filter names in filenames
- Supported patterns: `FILTER-Ha`, `_HA_`, `_Ha_`, etc.
- Check file extensions: .xisf, .fits, .fit, .fts, .tif, .tiff

**Crop not applying:**
- Ensure .xpsm file is a valid DynamicCrop process icon
- The process icon must be loaded in PixInsight's desktop

**Out of memory:**
- Close unnecessary images before running
- Process fewer channels at once
- Reduce image bit depth if possible

### Photoshop Issues

**"Mode A requires at least L and RGB files":**
- Verify L_NL.tif and RGB_NL.tif exist in selected folder
- Check file naming matches expected patterns

**"Ha file requires R file for continuum subtraction":**
- When providing Ha, you must also provide R for continuum subtraction
- Either provide both Ha and R, or neither

**Stars group appears empty:**
- Verify star files exist: RGB_Stars_NL.tif or HA_Stars_NL.tif
- Check file naming case sensitivity

**Auto-detect not finding files:**
- Verify files are in the selected folder (not subfolders)
- Check exact file naming: L_NL.tif, RGB_NL.tif, etc.
- File extension must be .tif

**Blend modes look wrong:**
- Ensure images are in RGB mode (not Grayscale)
- Check that images are 16-bit (8-bit may show banding)

---

## 9. Settings Persistence

### PixInsight Settings

Settings are stored using PixInsight's Settings API under the key `DistantPixelsStudio/parms`.

**Settings saved:**
- All file paths (channels, crop file, output folder)
- All processing checkboxes
- Noise reduction parameters
- MAS stretch parameters
- Output options

Settings are automatically loaded when the script starts.

### Photoshop Settings

Settings are stored in: `~/DistantPixelsStudio/settings.json`

**Settings saved:**
- Selected mode (A or B)
- Auto-detect preference
- Last used folder
- Selected preset
- File paths for both modes
- Channel assignments
- Hue/Saturation/Lightness values
- Stars and Global group preferences

Settings persist between Photoshop sessions.

---

## License

Distant Pixels Studio is free software released under the GNU General Public License v3.0 (GPL-3.0).

You may redistribute and/or modify it under the terms of the GPL as published by the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html> for details.

## Version History

### v1.0.6 (January 2026)
- Initial public release
- PixInsight: Dual NB/L and RGB pipelines with MAS stretch
- Photoshop: Mode A (LRGB/HaLRGB) and Mode B (Narrowband palettes)
- Automatic master file detection
- Settings persistence
- Star removal with separate star image generation
