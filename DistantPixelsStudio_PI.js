// ============================================================================
// Distant Pixels Studio v1.0.6
// PixInsight Linear Processing Pipeline
// ============================================================================
//
// Copyright (C) 2026 Distant Pixels Studio
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
//
// ============================================================================
// Features:
// - GUI lets you assign Ha, OIII, SII, R, G, B, L (optional)
// - GradientCorrection, BlurXTerminator, NoiseXTerminator
// - MultiscaleAdaptiveStretch, StarXTerminator
// - Automatic master file detection from folder
// ============================================================================

// PixInsight script feature directives (ignore linter warnings on these lines)
#feature-id    Utilities > DistantPixelsStudio
#feature-info  Distant Pixels Studio v1.0.6 - Linear processing pipeline for astrophotography.

#include <pjsr/UndoFlag.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/DataType.jsh>

// ---------------------------- Utilities ----------------------------

function saveSettings(dialog)
{
   // Save current file paths and settings for next time (following TypeCat.js pattern)
   try {
      var parms = {
         scanFolder: dialog.scanFolderEdit.text,
         haFile: dialog.haRow.edit.text,
         oiiiFile: dialog.oiiiRow.edit.text,
         siiFile: dialog.siiRow.edit.text,
         rFile: dialog.rRow.edit.text,
         gFile: dialog.gRow.edit.text,
         bFile: dialog.bRow.edit.text,
         lFile: dialog.lRow.edit.text,
         cropFile: dialog.cropFileEdit.text,
         outputDir: dialog.outDirEdit.text,
         cropEnabled: dialog.cropCheck.checked,
         nb_processEnabled: dialog.nb_processCheck.checked,
         nb_gradientEnabled: dialog.nb_gradientCheck.checked,
         nb_blurEnabled: dialog.nb_blurCheck.checked,
         nb_noiseEnabled: dialog.nb_noiseCheck.checked,
         nb_denoise: dialog.nb_denoiseSpinBox.value,
         nb_detail: dialog.nb_detailSpinBox.value,
         nb_stretchEnabled: dialog.nb_stretchCheck.checked,
         nb_starEnabled: dialog.nb_starCheck.checked,
         nb_finalNoiseEnabled: dialog.nb_finalNoiseCheck.checked,
         nb_finalDenoise: dialog.nb_finalDenoiseSpinBox.value,
         nb_finalDetail: dialog.nb_finalDetailSpinBox.value,
         rgb_processEnabled: dialog.rgb_processCheck.checked,
         rgb_gradientEnabled: dialog.rgb_gradientCheck.checked,
         rgb_linearfitEnabled: dialog.rgb_linearfitCheck.checked,
         rgb_combineEnabled: dialog.rgb_combineCheck.checked,
         rgb_blurEnabled: dialog.rgb_blurCheck.checked,
         rgb_noiseEnabled: dialog.rgb_noiseCheck.checked,
         rgb_denoise: dialog.rgb_denoiseSpinBox.value,
         rgb_detail: dialog.rgb_detailSpinBox.value,
         rgb_stretchEnabled: dialog.rgb_stretchCheck.checked,
         rgb_starEnabled: dialog.rgb_starCheck.checked,
         rgb_saveREnabled: dialog.rgb_saveRCheck.checked,
         rgb_finalNoiseEnabled: dialog.rgb_finalNoiseCheck.checked,
         rgb_finalDenoise: dialog.rgb_finalDenoiseSpinBox.value,
         rgb_finalDetail: dialog.rgb_finalDetailSpinBox.value,
         mas_targetBackground: dialog.mas_targetBgControl.value,
         mas_aggressiveness: dialog.mas_aggressivenessControl.value,
         mas_dynamicRange: dialog.mas_dynRangeControl.value,
         out_saveTif: dialog.out_saveTifCheck.checked,
         out_keepImages: dialog.out_keepImagesCheck.checked
      };
      
      Settings.write("DistantPixelsStudio/parms", DataType_String, JSON.stringify(parms));
      Console.writeln("Settings saved successfully.");
   } catch (e) {
      Console.warningln("Could not save settings: " + e.toString());
   }
}

function loadSettings(dialog)
{
   // Load previously saved file paths and settings (following TypeCat.js pattern)
   try {
      var setts = Settings.read("DistantPixelsStudio/parms", DataType_String);
      Console.writeln("Settings: " + setts);
      
      if (setts != null) {
         var parms = JSON.parse(setts);
         
         // Apply loaded settings to dialog controls
         if (parms.scanFolder !== undefined) dialog.scanFolderEdit.text = parms.scanFolder;
         if (parms.haFile !== undefined) dialog.haRow.edit.text = parms.haFile;
         if (parms.oiiiFile !== undefined) dialog.oiiiRow.edit.text = parms.oiiiFile;
         if (parms.siiFile !== undefined) dialog.siiRow.edit.text = parms.siiFile;
         if (parms.rFile !== undefined) dialog.rRow.edit.text = parms.rFile;
         if (parms.gFile !== undefined) dialog.gRow.edit.text = parms.gFile;
         if (parms.bFile !== undefined) dialog.bRow.edit.text = parms.bFile;
         if (parms.lFile !== undefined) dialog.lRow.edit.text = parms.lFile;
         if (parms.cropFile !== undefined) dialog.cropFileEdit.text = parms.cropFile;
         if (parms.outputDir !== undefined) dialog.outDirEdit.text = parms.outputDir;
         if (parms.cropEnabled !== undefined) dialog.cropCheck.checked = parms.cropEnabled;
         if (parms.nb_processEnabled !== undefined) dialog.nb_processCheck.checked = parms.nb_processEnabled;
         if (parms.nb_gradientEnabled !== undefined) dialog.nb_gradientCheck.checked = parms.nb_gradientEnabled;
         if (parms.nb_blurEnabled !== undefined) dialog.nb_blurCheck.checked = parms.nb_blurEnabled;
         if (parms.nb_noiseEnabled !== undefined) dialog.nb_noiseCheck.checked = parms.nb_noiseEnabled;
         if (parms.nb_denoise !== undefined) dialog.nb_denoiseSpinBox.value = parms.nb_denoise;
         if (parms.nb_detail !== undefined) dialog.nb_detailSpinBox.value = parms.nb_detail;
         if (parms.nb_stretchEnabled !== undefined) dialog.nb_stretchCheck.checked = parms.nb_stretchEnabled;
         if (parms.nb_starEnabled !== undefined) dialog.nb_starCheck.checked = parms.nb_starEnabled;
         if (parms.nb_finalNoiseEnabled !== undefined) dialog.nb_finalNoiseCheck.checked = parms.nb_finalNoiseEnabled;
         if (parms.nb_finalDenoise !== undefined) dialog.nb_finalDenoiseSpinBox.value = parms.nb_finalDenoise;
         if (parms.nb_finalDetail !== undefined) dialog.nb_finalDetailSpinBox.value = parms.nb_finalDetail;
         if (parms.rgb_processEnabled !== undefined) dialog.rgb_processCheck.checked = parms.rgb_processEnabled;
         if (parms.rgb_gradientEnabled !== undefined) dialog.rgb_gradientCheck.checked = parms.rgb_gradientEnabled;
         if (parms.rgb_linearfitEnabled !== undefined) dialog.rgb_linearfitCheck.checked = parms.rgb_linearfitEnabled;
         if (parms.rgb_combineEnabled !== undefined) dialog.rgb_combineCheck.checked = parms.rgb_combineEnabled;
         if (parms.rgb_blurEnabled !== undefined) dialog.rgb_blurCheck.checked = parms.rgb_blurEnabled;
         if (parms.rgb_noiseEnabled !== undefined) dialog.rgb_noiseCheck.checked = parms.rgb_noiseEnabled;
         if (parms.rgb_denoise !== undefined) dialog.rgb_denoiseSpinBox.value = parms.rgb_denoise;
         if (parms.rgb_detail !== undefined) dialog.rgb_detailSpinBox.value = parms.rgb_detail;
         if (parms.rgb_stretchEnabled !== undefined) dialog.rgb_stretchCheck.checked = parms.rgb_stretchEnabled;
         if (parms.rgb_starEnabled !== undefined) dialog.rgb_starCheck.checked = parms.rgb_starEnabled;
         if (parms.rgb_saveREnabled !== undefined) dialog.rgb_saveRCheck.checked = parms.rgb_saveREnabled;
         if (parms.rgb_finalNoiseEnabled !== undefined) dialog.rgb_finalNoiseCheck.checked = parms.rgb_finalNoiseEnabled;
         if (parms.rgb_finalDenoise !== undefined) dialog.rgb_finalDenoiseSpinBox.value = parms.rgb_finalDenoise;
         if (parms.rgb_finalDetail !== undefined) dialog.rgb_finalDetailSpinBox.value = parms.rgb_finalDetail;
         if (parms.mas_targetBackground !== undefined) dialog.mas_targetBgControl.setValue( parms.mas_targetBackground );
         if (parms.mas_aggressiveness !== undefined) dialog.mas_aggressivenessControl.setValue( parms.mas_aggressiveness );
         if (parms.mas_dynamicRange !== undefined) dialog.mas_dynRangeControl.setValue( parms.mas_dynamicRange );
         if (parms.out_saveTif !== undefined) dialog.out_saveTifCheck.checked = parms.out_saveTif;
         if (parms.out_keepImages !== undefined) dialog.out_keepImagesCheck.checked = parms.out_keepImages;

         Console.writeln("Previous settings loaded successfully.");
      } else {
         Console.writeln("No previous settings found, using defaults.");
      }
   } catch (e) {
      Console.warningln("Could not load previous settings: " + e.toString());
   }
}

// ---------------------------- Utilities ----------------------------

function checkPixInsightVersion()
{
   // Check PixInsight version using proper API
   try {
      var version = CoreApplication.version;
      var versionString = CoreApplication.versionString;
      
      Console.writeln("PixInsight version: " + versionString);
      Console.writeln("Script designed for PixInsight 1.8.8 or later");
      
      // Check if we have the minimum required version (1.8.8 = version code 0x010808)
      var minVersionCode = 0x010808;
      if (version < minVersionCode) {
         Console.warningln("Warning: This script may not work properly with PixInsight versions older than 1.8.8");
      } else {
         Console.writeln("Version check passed.");
      }
      
      // Debug: Check if GUI classes are available
      Console.writeln("Checking GUI class availability:");
      Console.writeln("- Dialog: " + (typeof Dialog !== 'undefined'));
      Console.writeln("- HorizontalSizer: " + (typeof HorizontalSizer !== 'undefined'));
      Console.writeln("- VerticalSizer: " + (typeof VerticalSizer !== 'undefined'));
      Console.writeln("- GroupBox: " + (typeof GroupBox !== 'undefined'));
      
   } catch (e) {
      Console.warningln("Could not determine PixInsight version: " + e.toString());
   }
}

function ensureGuiClasses()
{
   // Ensure GUI classes are available - fallback for different PixInsight versions
   if (typeof HorizontalSizer === 'undefined') {
      try {
         HorizontalSizer = Sizer;
         Console.writeln("Using Sizer as HorizontalSizer fallback");
      } catch (e) {
         Console.warningln("Could not define HorizontalSizer: " + e.toString());
      }
   }
   
   if (typeof VerticalSizer === 'undefined') {
      try {
         VerticalSizer = Sizer;
         Console.writeln("Using Sizer as VerticalSizer fallback");
      } catch (e) {
         Console.warningln("Could not define VerticalSizer: " + e.toString());
      }
   }
}

function fileExists( path )
{
   if ( !path || path.length === 0 ) return false;
   
   try {
      // Try different methods to check file existence
      var f = new File;
      f.openForReading( path );
      f.close();
      return true;
   } catch (e) {
      // If opening fails, try alternative check
      try {
         var windows = ImageWindow.open( path, { mode: "preview" } );
         if ( windows && windows.length > 0 ) {
            for ( var i = 0; i < windows.length; ++i ) {
               windows[i].close();
            }
            return true;
         }
      } catch (e2) {}
      return false;
   }
}

function ensureFolder( dirPath )
{
   if ( dirPath.length === 0 )
      throw new Error("Please choose an output folder.");

   // For PixInsight, we'll skip the directory check and let the save operation fail if needed
   // This avoids API compatibility issues across different PixInsight versions
   Console.writeln("Output folder set to: " + dirPath);
   Console.writeln("(Directory existence will be verified during save operation)");
}

// ---------------------- Master File Scanner ----------------------

function scanFolderForMasters( folderPath )
{
   // Scan a folder for PixInsight master files and return a mapping of filter -> file path
   // Supports standard PixInsight naming: masterLight_BIN-X_DIMS_EXPOSURE-Xs_FILTER-NAME_mono.xisf
   // Also supports simpler naming conventions

   var results = {
      Ha: null,
      OIII: null,
      SII: null,
      R: null,
      G: null,
      B: null,
      L: null
   };

   try {
      var searchDir = new FileFind;

      // Search for .xisf, .fits, .fit, .fts files
      var extensions = ["*.xisf", "*.fits", "*.fit", "*.fts", "*.tif", "*.tiff"];

      for ( var e = 0; e < extensions.length; ++e ) {
         var pattern = folderPath + "/" + extensions[e];

         if ( searchDir.begin( pattern ) ) {
            do {
               if ( !searchDir.isDirectory ) {
                  var fileName = searchDir.name;
                  var filePath = folderPath + "/" + fileName;
                  var filter = extractFilterFromFilename( fileName );

                  if ( filter && results[filter] === null ) {
                     results[filter] = filePath;
                     Console.writeln( "Found " + filter + ": " + fileName );
                  }
               }
            } while ( searchDir.next() );
         }
      }

   } catch (e) {
      Console.warningln( "Error scanning folder: " + e.toString() );
   }

   return results;
}

function extractFilterFromFilename( fileName )
{
   // Extract filter name from various PixInsight master filename formats
   // Standard format: masterLight_BIN-1_9576x6388_EXPOSURE-300.00s_FILTER-Ha_mono.xisf
   // Also handles: Ha_master.xisf, masterLight_Ha.xisf, etc.

   var fileNameUpper = fileName.toUpperCase();

   // Pattern 1: FILTER-{name}_ (standard PixInsight WBPP format)
   var filterMatch = fileName.match( /FILTER-([A-Za-z0-9]+)[_\.]/ );
   if ( filterMatch ) {
      var filterName = filterMatch[1].toUpperCase();
      return normalizeFilterName( filterName );
   }

   // Pattern 2: _{filter}_master or _{filter}.xisf (common naming)
   var patterns = [
      /_HA[_\.]/i, /_H-ALPHA[_\.]/i, /_HALPHA[_\.]/i,
      /_OIII[_\.]/i, /_O3[_\.]/i,
      /_SII[_\.]/i, /_S2[_\.]/i,
      /_RED[_\.]/i, /_R[_\.]/i,
      /_GREEN[_\.]/i, /_G[_\.]/i,
      /_BLUE[_\.]/i, /_B[_\.]/i,
      /_LUM[_\.]/i, /_LUMINANCE[_\.]/i, /_L[_\.]/i
   ];

   // Check for Ha
   if ( fileNameUpper.indexOf("_HA_") >= 0 || fileNameUpper.indexOf("_HA.") >= 0 ||
        fileNameUpper.indexOf("-HA_") >= 0 || fileNameUpper.indexOf("-HA.") >= 0 ||
        fileNameUpper.indexOf("_H-ALPHA") >= 0 || fileNameUpper.indexOf("_HALPHA") >= 0 ) {
      return "Ha";
   }

   // Check for OIII
   if ( fileNameUpper.indexOf("_OIII_") >= 0 || fileNameUpper.indexOf("_OIII.") >= 0 ||
        fileNameUpper.indexOf("-OIII_") >= 0 || fileNameUpper.indexOf("-OIII.") >= 0 ||
        fileNameUpper.indexOf("_O3_") >= 0 || fileNameUpper.indexOf("_O3.") >= 0 ) {
      return "OIII";
   }

   // Check for SII
   if ( fileNameUpper.indexOf("_SII_") >= 0 || fileNameUpper.indexOf("_SII.") >= 0 ||
        fileNameUpper.indexOf("-SII_") >= 0 || fileNameUpper.indexOf("-SII.") >= 0 ||
        fileNameUpper.indexOf("_S2_") >= 0 || fileNameUpper.indexOf("_S2.") >= 0 ) {
      return "SII";
   }

   // Check for L (luminance) - be careful not to match other L-containing names
   if ( fileNameUpper.indexOf("_LUM_") >= 0 || fileNameUpper.indexOf("_LUM.") >= 0 ||
        fileNameUpper.indexOf("-LUM_") >= 0 || fileNameUpper.indexOf("-LUM.") >= 0 ||
        fileNameUpper.indexOf("_LUMINANCE") >= 0 ||
        (fileNameUpper.indexOf("_L_") >= 0 || fileNameUpper.indexOf("_L.") >= 0 ||
         fileNameUpper.indexOf("-L_") >= 0 || fileNameUpper.indexOf("-L.") >= 0) ) {
      return "L";
   }

   // Check for R (red) - must be careful with pattern to avoid false matches
   if ( (fileNameUpper.indexOf("_R_") >= 0 || fileNameUpper.indexOf("_R.") >= 0 ||
         fileNameUpper.indexOf("-R_") >= 0 || fileNameUpper.indexOf("-R.") >= 0 ||
         fileNameUpper.indexOf("_RED_") >= 0 || fileNameUpper.indexOf("_RED.") >= 0) &&
        fileNameUpper.indexOf("MASTER") < fileNameUpper.indexOf("_R") ) {
      return "R";
   }

   // Check for G (green)
   if ( fileNameUpper.indexOf("_G_") >= 0 || fileNameUpper.indexOf("_G.") >= 0 ||
        fileNameUpper.indexOf("-G_") >= 0 || fileNameUpper.indexOf("-G.") >= 0 ||
        fileNameUpper.indexOf("_GREEN_") >= 0 || fileNameUpper.indexOf("_GREEN.") >= 0 ) {
      return "G";
   }

   // Check for B (blue)
   if ( fileNameUpper.indexOf("_B_") >= 0 || fileNameUpper.indexOf("_B.") >= 0 ||
        fileNameUpper.indexOf("-B_") >= 0 || fileNameUpper.indexOf("-B.") >= 0 ||
        fileNameUpper.indexOf("_BLUE_") >= 0 || fileNameUpper.indexOf("_BLUE.") >= 0 ) {
      return "B";
   }

   return null;
}

function normalizeFilterName( filterName )
{
   // Normalize various filter name variations to standard names
   var upper = filterName.toUpperCase();

   // Hydrogen-alpha variations
   if ( upper === "HA" || upper === "H-ALPHA" || upper === "HALPHA" || upper === "H_ALPHA" ) {
      return "Ha";
   }

   // Oxygen III variations
   if ( upper === "OIII" || upper === "O3" || upper === "O-III" ) {
      return "OIII";
   }

   // Sulfur II variations
   if ( upper === "SII" || upper === "S2" || upper === "S-II" ) {
      return "SII";
   }

   // Red
   if ( upper === "R" || upper === "RED" ) {
      return "R";
   }

   // Green
   if ( upper === "G" || upper === "GREEN" ) {
      return "G";
   }

   // Blue
   if ( upper === "B" || upper === "BLUE" ) {
      return "B";
   }

   // Luminance
   if ( upper === "L" || upper === "LUM" || upper === "LUMINANCE" ) {
      return "L";
   }

   return null;
}

function openImageOrThrow( path )
{
   if ( !path || path.length === 0 )
      throw new Error("No file path provided");
      
   Console.writeln("Attempting to open: " + path);
   
   try {
      var windows = ImageWindow.open( path );
      if ( windows.length === 0 )
         throw new Error("Failed to open image file (no windows created): " + path);
      Console.writeln("Successfully opened: " + path);
      return windows[0];
   } catch (e) {
      throw new Error("Cannot open image file: " + path + " - " + e.toString());
   }
}

function saveWindowAsTIF( window, outDir, bandName )
{
   // Use band name instead of the view ID for file naming
   var fileName = bandName + "_NL.tif";
   var outPath = outDir + '/' + fileName;

   try {
      // Modern PixInsight file saving approach
      var ff = new FileFormat( ".tif", false, true ); // extension, canRead, canWrite
      var ffi = new FileFormatInstance( ff );
      
      if ( !ffi.create( outPath ) ) {
         throw new Error("Cannot create: " + outPath);
      }
      
      if ( !ffi.writeImage( window.mainView.image ) ) {
         throw new Error("Write failed: " + outPath);
      }
      
      ffi.close();
      Console.writeln("File saved: " + outPath);
      return outPath;
   } catch (e) {
      Console.warningln("Save failed: " + e.toString());
      throw e;
   }
}

// ---------------------- Crop (using saved process) ----------------------

function runCrop( win, cropProcessFile )
{
   // Apply cropping using DynamicCrop with GUI suppression (based on WhatsInMyImage.js approach)
   try {
      if ( !cropProcessFile || cropProcessFile.length === 0 ) {
         Console.writeln("No crop process file specified - skipping crop.");
         return win;
      }
      
      if ( !fileExists( cropProcessFile ) ) {
         Console.warningln("Crop process file not found: " + cropProcessFile + " - skipping crop.");
         return win;
      }
      
      Console.writeln("Loading crop parameters from: " + cropProcessFile);
      
      // Load the saved DynamicCrop process from PixInsight's process icon bar
      var iconId = File.extractName( cropProcessFile ); // Extract name without path/extension
      Console.writeln("Loading process icon: " + iconId);
      
      var savedProcessIcon = ProcessInstance.fromIcon( iconId );
      if ( !savedProcessIcon ) {
         Console.warningln("Failed to load crop process icon: " + iconId);
         Console.warningln("Make sure the .xpsm file is loaded as a process icon in PixInsight's desktop.");
         return win;
      }
      
      // Extract crop parameters from the saved process
      Console.writeln("Extracting DynamicCrop parameters...");
      var refWidth = savedProcessIcon.refWidth;
      var refHeight = savedProcessIcon.refHeight;
      var outWidth = savedProcessIcon.outWidth;
      var outHeight = savedProcessIcon.outHeight;
      var centerX = savedProcessIcon.centerX;
      var centerY = savedProcessIcon.centerY;
      
      Console.writeln("Crop parameters - refWidth: " + refWidth + ", refHeight: " + refHeight);
      Console.writeln("Output size - outWidth: " + outWidth + ", outHeight: " + outHeight);
      Console.writeln("Center position - centerX: " + centerX + ", centerY: " + centerY);
      
      // Create a new DynamicCrop instance with GUI suppression (WhatsInMyImage.js approach)
      var P = new DynamicCrop;
      P.refWidth = refWidth;
      P.refHeight = refHeight;
      P.outWidth = outWidth;
      P.outHeight = outHeight;
      P.centerX = centerX;
      P.centerY = centerY;
      P.noGUIMessages = true;  // This suppresses the GUI dialog
      
      Console.writeln("Executing DynamicCrop with GUI suppression...");
      
      if ( !P.executeOn( win.mainView, false ) ) {
         Console.warningln("DynamicCrop execution failed.");
         return win;
      }
      Console.writeln("Crop applied successfully with no GUI dialogs.");
      
   } catch (e) {
      Console.warningln("Crop failed: " + e.toString());
   }
   return win;
}

// ------------------ GradientCorrection (default) -------------------

function runGradientCorrection( win )
{
   // Uses tool defaults. If you have a preferred preset, set parameters here.
   try {
      Console.writeln("Running GradientCorrection...");
      var p = new GradientCorrection;
      // Use default parameters - these work well for most cases
      if ( !p.executeOn( win.mainView, false ) ) {
         Console.warningln("GradientCorrection execution failed.");
         return win;
      }
      Console.writeln("GradientCorrection applied successfully.");
   } catch (e) {
      Console.warningln("GradientCorrection failed: " + e.toString());
   }
   return win;
}

// ---------------------- RGB Processing Functions ----------------------

function runLinearFit( targetWin, referenceWin )
{
   // Apply LinearFit using reference image to match target to reference
   try {
      Console.writeln("Running LinearFit on " + targetWin.mainView.id + " using " + referenceWin.mainView.id + " as reference...");
      var p = new LinearFit;
      p.referenceViewId = referenceWin.mainView.id;
      if ( !p.executeOn( targetWin.mainView, false ) ) {
         Console.warningln("LinearFit execution failed.");
         return targetWin;
      }
      Console.writeln("LinearFit applied successfully.");
   } catch (e) {
      Console.warningln("LinearFit failed: " + e.toString());
   }
   return targetWin;
}

function combineRGBPixelMath( rWin, gWin, bWin )
{
   // Use PixelMath to combine R, G, B into RGB image
   try {
      Console.writeln("Combining RGB using PixelMath...");
      
      // Create new RGB image window
      var rgbWin = new ImageWindow( rWin.mainView.image.width, rWin.mainView.image.height, 3, 32, false, true, "RGB_combined" );
      
      var p = new PixelMath;
      // Use proper PixelMath syntax with separate expressions for each channel
      p.expression = rWin.mainView.id;    // Red channel
      p.expression1 = gWin.mainView.id;   // Green channel  
      p.expression2 = bWin.mainView.id;   // Blue channel
      p.expression3 = "";                 // Alpha channel (unused)
      p.useSingleExpression = false;      // Use separate expressions for each channel
      p.symbols = "";
      p.clearImageCacheAndExit = false;
      p.cacheGeneratedImages = false;
      p.generateOutput = true;
      p.singleThreaded = false;
      p.optimization = true;
      p.use64BitWorkingImage = false;
      p.rescale = false;
      p.rescaleLower = 0;
      p.rescaleUpper = 1;
      p.truncate = true;
      p.truncateLower = 0;
      p.truncateUpper = 1;
      p.createNewImage = false;
      p.showNewImage = true;
      p.newImageId = "RGB_combined";
      p.newImageWidth = 0;
      p.newImageHeight = 0;
      p.newImageAlpha = false;
      p.newImageColorSpace = PixelMath.prototype.RGB;
      p.newImageSampleFormat = PixelMath.prototype.f32;
      
      if ( !p.executeOn( rgbWin.mainView, false ) ) {
         Console.warningln("PixelMath RGB combination failed.");
         rgbWin.close();
         return null;
      }
      
      Console.writeln("RGB combination completed successfully.");
      return rgbWin;
      
   } catch (e) {
      Console.warningln("RGB combination failed: " + e.toString());
      return null;
   }
}

function runStarXTerminatorRGB( win )
{
   // StarXTerminator with automatic star mask generation for RGB workflow
   try {
      Console.writeln("Running StarXTerminator on RGB image...");
      
      // Clone the window for starless version
      var starlessWin = new ImageWindow( win.mainView.image.width, win.mainView.image.height, win.mainView.image.numberOfChannels, 32, false, win.mainView.image.isColor, "RGB_NL" );
      starlessWin.mainView.beginProcess(UndoFlag_NoSwapFile);
      starlessWin.mainView.image.apply( win.mainView.image );
      starlessWin.mainView.endProcess();
      
      // Take snapshot of windows before StarXTerminator to detect new ones
      var windowsBefore = {};
      var allWindowsBefore = ImageWindow.windows;
      for ( var i = 0; i < allWindowsBefore.length; ++i ) {
         windowsBefore[allWindowsBefore[i].mainView.id] = true;
      }
      
      var p = new StarXTerminator;
      p.stars = true; // Generate a separate star image
      p.unscreenStars = true;     // Unscreen stars during the process
      p.linear = false;           // We're processing after stretch (non-linear)
      p.luminance = false;        // Process RGB channels
      
      if ( !p.executeOn( starlessWin.mainView, false ) ) {
         Console.warningln("StarXTerminator execution failed.");
         starlessWin.close();
         return { starless: null, stars: null };
      }
      
      // Look for newly created star image window
      var starImageWin = null;
      var allWindowsAfter = ImageWindow.windows;
      
      Console.writeln("Looking for newly created RGB star windows...");
      for ( var i = 0; i < allWindowsAfter.length; ++i ) {
         var newWin = allWindowsAfter[i];
         var winId = newWin.mainView.id;
         
         // Only consider windows that didn't exist before StarXTerminator
         if ( !windowsBefore[winId] ) {
            Console.writeln("Found new window: " + winId);
            // Check if it looks like a star image (contains "star" and matches dimensions)
            if ( (winId.toLowerCase().indexOf("star") >= 0) && 
                 newWin.mainView.image.width == win.mainView.image.width &&
                 newWin.mainView.image.height == win.mainView.image.height ) {
               starImageWin = newWin;
               Console.writeln("Identified as RGB star image window: " + winId);
               // Rename it to our desired name
               try {
                  starImageWin.mainView.id = "RGB_Stars_NL";
                  Console.writeln("Renamed RGB star image window to: RGB_Stars_NL");
               } catch (e) {
                  Console.writeln("Could not rename star image window: " + e.toString());
               }
               break;
            }
         }
      }
      
      if ( !starImageWin ) {
         Console.warningln("StarXTerminator did not generate expected star image window.");
         Console.writeln("Checking if generateStarImage parameter is supported...");
      }
      
      Console.writeln("StarXTerminator RGB processing completed successfully.");
      return { starless: starlessWin, stars: starImageWin };

   } catch (e) {
      Console.warningln("StarXTerminator RGB failed: " + e.toString());
      return { starless: null, stars: null };
   }
}

function cloneImageWindow( srcWin, newName )
{
   // Clone an image window
   try {
      var newWin = new ImageWindow(
         srcWin.mainView.image.width,
         srcWin.mainView.image.height,
         srcWin.mainView.image.numberOfChannels,
         32, // 32-bit float
         false, // not complex
         srcWin.mainView.image.isColor,
         newName
      );
      newWin.mainView.beginProcess(UndoFlag_NoSwapFile);
      newWin.mainView.image.apply( srcWin.mainView.image );
      newWin.mainView.endProcess();
      return newWin;
   } catch (e) {
      Console.warningln("Failed to clone image window: " + e.toString());
      return null;
   }
}

function runStarXTerminatorStarless( win )
{
   // StarXTerminator for starless only (no star image generated)
   try {
      Console.writeln("Running StarXTerminator (starless only)...");

      var p = new StarXTerminator;
      p.stars = false;            // Don't generate a separate star image
      p.unscreenStars = false;    // Don't unscreen (not needed for continuum)
      p.linear = false;           // We're processing after stretch (non-linear)
      p.luminance = true;         // Process as luminance for mono R channel

      if ( !p.executeOn( win.mainView, false ) ) {
         Console.warningln("StarXTerminator execution failed.");
         return null;
      }

      Console.writeln("StarXTerminator starless processing completed.");
      return win;

   } catch (e) {
      Console.warningln("StarXTerminator starless failed: " + e.toString());
      return null;
   }
}

// ---------------------- Optional Plugin Stubs ----------------------

function runBlurReduction( win )
{
   // Example: BlurXTerminator (if installed)
   try {
      Console.writeln("Running BlurXTerminator...");
      var p = new BlurXTerminator;
      // BlurXTerminator uses direct property assignment, not setParameter
      p.correctOnly = true;
      p.luminance = true;
      if ( !p.executeOn( win.mainView, false ) ) {
         Console.warningln("BlurXTerminator execution failed.");
         return win;
      }
      Console.writeln("BlurXTerminator applied successfully.");
   } catch (e) {
      Console.warningln("BlurXTerminator failed (plugin may not be installed): " + e.toString());
   }
   return win;
}

function runNoiseReduction( win, denoiseValue, detailValue )
{
   // NoiseXTerminator with adjustable parameters
   try {
      Console.writeln("Running NoiseXTerminator...");
      Console.writeln("Denoise: " + denoiseValue + ", Detail: " + detailValue);
      
      var p = new NoiseXTerminator;
      // NoiseXTerminator uses direct property assignment, not setParameter
      p.detail = detailValue / 100.0;      // Convert 0-100 to 0.0-1.0
      p.denoise = denoiseValue / 100.0;    // Convert 0-100 to 0.0-1.0
      p.denoiseColor = denoiseValue / 100.0; // Use same value for color denoise
      p.luminance = true;
      
      if ( !p.executeOn( win.mainView, false ) ) {
         Console.warningln("NoiseXTerminator execution failed.");
         return win;
      }
      Console.writeln("NoiseXTerminator applied successfully.");
   } catch (e) {
      Console.warningln("NoiseXTerminator failed (plugin may not be installed): " + e.toString());
   }
   return win;
}

function runStarRemoval( win )
{
   // Example: StarXTerminator (if installed)
   try {
      Console.writeln("Running StarXTerminator...");
      var p = new StarXTerminator;
      // StarXTerminator uses direct property assignment, not setParameter
      p.linear = false; // Processing after stretch (non-linear)
      // p.generateStarMask = false;
      // p.generateStarImage = true;
      p.stars = false; // Don't generate star image for regular NB processing
      p.luminance = true;
      if ( !p.executeOn( win.mainView, false ) ) {
         Console.warningln("StarXTerminator execution failed.");
         return win;
      }
      Console.writeln("StarXTerminator applied successfully.");
   } catch (e) {
      Console.warningln("StarXTerminator failed (plugin may not be installed): " + e.toString());
   }
   return win;
}

function runStarXTerminatorNB( win, label )
{
   // StarXTerminator for NB images with star image generation (Ha only)
   try {
      Console.writeln("Running StarXTerminator on " + label + " with star generation...");
      
      // Clone the window for starless version  
      var starlessWin = new ImageWindow( win.mainView.image.width, win.mainView.image.height, win.mainView.image.numberOfChannels, 32, false, win.mainView.image.isColor, label + "_starless" );
      starlessWin.mainView.beginProcess(UndoFlag_NoSwapFile);
      starlessWin.mainView.image.apply( win.mainView.image );
      starlessWin.mainView.endProcess();
      
      // Take snapshot of windows before StarXTerminator to detect new ones
      var windowsBefore = {};
      var allWindowsBefore = ImageWindow.windows;
      for ( var i = 0; i < allWindowsBefore.length; ++i ) {
         windowsBefore[allWindowsBefore[i].mainView.id] = true;
      }
      
      var p = new StarXTerminator;
      p.stars = true; // Generate star image
      p.linear = false; // Processing after stretch (non-linear)
      p.luminance = true; // Process luminance for NB
      p.unscreenStars = true;
      
      if ( !p.executeOn( starlessWin.mainView, false ) ) {
         Console.warningln("StarXTerminator execution failed.");
         starlessWin.close();
         return { starless: null, stars: null };
      }
      
      // Look for newly created star image window
      var starImageWin = null;
      var allWindowsAfter = ImageWindow.windows;
      
      Console.writeln("Looking for newly created " + label + " star windows...");
      for ( var i = 0; i < allWindowsAfter.length; ++i ) {
         var newWin = allWindowsAfter[i];
         var winId = newWin.mainView.id;
         
         // Only consider windows that didn't exist before StarXTerminator
         if ( !windowsBefore[winId] ) {
            Console.writeln("Found new window: " + winId);
            // Check if it looks like a star image (contains "star" and matches dimensions)
            if ( (winId.toLowerCase().indexOf("star") >= 0) && 
                 newWin.mainView.image.width == win.mainView.image.width &&
                 newWin.mainView.image.height == win.mainView.image.height ) {
               starImageWin = newWin;
               Console.writeln("Identified as " + label + " star image window: " + winId);
               // Rename it appropriately
               try {
                  starImageWin.mainView.id = label + "_Stars_NL";
                  Console.writeln("Renamed " + label + " star image window to: " + label + "_Stars_NL");
               } catch (e) {
                  Console.writeln("Could not rename star image window: " + e.toString());
               }
               break;
            }
         }
      }
      
      if ( !starImageWin ) {
         Console.warningln("StarXTerminator did not generate expected star image window.");
      }
      
      Console.writeln("StarXTerminator " + label + " processing completed successfully.");
      return { starless: starlessWin, stars: starImageWin };
      
   } catch (e) {
      Console.warningln("StarXTerminator " + label + " failed: " + e.toString());
      return { starless: null, stars: null };
   }
}

// --------- Auto-STF-like stretch baked into HistogramTransformation --------
//
// This approximates PixInsight's AutoSTF behavior by computing low/high
// percentiles (robust clipping) and a gentle midtones curve, then writing
// those directly as HT parameters so the stretch becomes *real* pixel data.
//
// Notes:
// - Works for grayscale or RGB images.
// - Adjust P_LOW / P_HIGH if you want a softer/harder stretch.
// - If you already have a favorite STF preset, you can swap this out with
//   your own mapping of STF -> HT parameters.



// --------- STF Auto-Stretch (Standard PixInsight Method) --------

// Based on SKill.js proven implementation
function applyAutoSTF( view, shadowsClipping, targetBackground, rgbLinked )
{
   var stf = new ScreenTransferFunction;

   var n = view.image.isColor ? 3 : 1;

   var median = view.computeOrFetchProperty( "Median" );
   var mad = view.computeOrFetchProperty( "MAD" );
   mad.mul( 1.4826 ); // coherent with a normal distribution

   if ( rgbLinked )
   {
      // Try to find how many channels look as channels of an inverted image
      var invertedChannels = 0;
      for ( var c = 0; c < n; ++c )
         if ( median.at( c ) > 0.5 )
            ++invertedChannels;

      if ( invertedChannels < n )
      {
         // Noninverted image
         var c0 = 0, m = 0;
         for ( var c = 0; c < n; ++c )
         {
            if ( 1 + mad.at( c ) != 1 )
               c0 += median.at( c ) + shadowsClipping * mad.at( c );
            m  += median.at( c );
         }
         c0 = Math.range( c0/n, 0.0, 1.0 );
         m = Math.mtf( targetBackground, m/n - c0 );

         stf.STF = [ // c0, c1, m, r0, r1
                     [c0, 1, m, 0, 1],
                     [c0, 1, m, 0, 1],
                     [c0, 1, m, 0, 1],
                     [0, 1, 0.5, 0, 1] ];
      }
      else
      {
         // Inverted image
         var c1 = 0, m = 0;
         for ( var c = 0; c < n; ++c )
         {
            m  += median.at( c );
            if ( 1 + mad.at( c ) != 1 )
               c1 += median.at( c ) - shadowsClipping * mad.at( c );
            else
               c1 += 1;
         }
         c1 = Math.range( c1/n, 0.0, 1.0 );
         m = Math.mtf( c1 - m/n, targetBackground );

         stf.STF = [ // c0, c1, m, r0, r1
                     [0, c1, m, 0, 1],
                     [0, c1, m, 0, 1],
                     [0, c1, m, 0, 1],
                     [0, 1, 0.5, 0, 1] ];
      }
   }
   else
   {
      // Unlinked RGB channels: Compute automatic stretch functions for individual RGB channels separately
      var A = [ // c0, c1, m, r0, r1
               [0, 1, 0.5, 0, 1],
               [0, 1, 0.5, 0, 1],
               [0, 1, 0.5, 0, 1],
               [0, 1, 0.5, 0, 1] ];

      for ( var c = 0; c < n; ++c )
      {
         if ( median.at( c ) < 0.5 )
         {
            // Noninverted channel
            var c0 = (1 + mad.at( c ) != 1) ? Math.range( median.at( c ) + shadowsClipping * mad.at( c ), 0.0, 1.0 ) : 0.0;
            var m  = Math.mtf( targetBackground, median.at( c ) - c0 );
            A[c] = [c0, 1, m, 0, 1];
         }
         else
         {
            // Inverted channel
            var c1 = (1 + mad.at( c ) != 1) ? Math.range( median.at( c ) - shadowsClipping * mad.at( c ), 0.0, 1.0 ) : 1.0;
            var m  = Math.mtf( c1 - median.at( c ), targetBackground );
            A[c] = [0, c1, m, 0, 1];
         }
      }

      stf.STF = A;
   }

   stf.executeOn( view );
}

function applySTFHistogram(view)
{
   var stf = view.stf;

   var H = [[  0, 0.0, 1.0, 0, 1.0],
            [  0, 0.5, 1.0, 0, 1.0],
            [  0, 0.5, 1.0, 0, 1.0],
            [  0, 0.5, 1.0, 0, 1.0]];

   if (view.image.isColor)
   {
      for (var c = 0; c < 3; c++)
      {
         H[c][0] = stf[c][1];
         H[c][1] = stf[c][0];
      }
   }
   else
   {
      H[3][0] = stf[0][1];
      H[3][1] = stf[0][0];
   }

   // Reset STF to neutral
   var STF = new ScreenTransferFunction;
   view.stf =  [ // c0, c1, m, r0, r1
      [0.00000, 1.00000, 0.50000, 0.00000, 1.00000],
      [0.00000, 1.00000, 0.50000, 0.00000, 1.00000],
      [0.00000, 1.00000, 0.50000, 0.00000, 1.00000],
      [0.00000, 1.00000, 0.50000, 0.00000, 1.00000]
   ];
   STF.executeOn(view);

   // Apply the transformation
   var HT = new HistogramTransformation;
   HT.H = H;
   HT.executeOn(view);
}

function applySTFAutoStretch( win )
{
   try {
      Console.writeln("Applying STF auto-stretch (SKill.js proven method)...");
      
      // Step 1: Apply AutoSTF computation (from SKill.js)
      var shadowsClipping = -2.80;  // DEFAULT_AUTOSTRETCH_SCLIP
      var targetBackground = 0.25;  // DEFAULT_AUTOSTRETCH_TBGND  
      var rgbLinked = false;        // DEFAULT_AUTOSTRETCH_CLINK
      
      Console.writeln("Step 1: Computing AutoSTF parameters...");
      applyAutoSTF( win.mainView, shadowsClipping, targetBackground, rgbLinked );
      Console.writeln("Step 1: AutoSTF computation completed.");
      
      // Step 2: Apply the histogram transformation (from SKill.js)
      Console.writeln("Step 2: Applying histogram transformation...");
      applySTFHistogram( win.mainView );
      Console.writeln("Step 2: Histogram transformation completed.");
      
      Console.writeln("STF auto-stretch applied successfully.");
   } catch (e) {
      Console.warningln("STF auto-stretch failed at: " + e.toString());
      Console.warningln("Error location: " + (e.fileName || "unknown") + ":" + (e.lineNumber || "unknown"));
      throw e; // Re-throw to allow fallback
   }
   return win;
}



// --------- MultiscaleAdaptiveStretch Function --------

function applyMultiscaleAdaptiveStretch( win, targetBackground, aggressiveness, dynamicRangeCompression )
{
   try {
      Console.writeln("Applying MultiscaleAdaptiveStretch to image: " + win.mainView.id);
      Console.writeln("Parameters - Target Background: " + targetBackground +
                      ", Aggressiveness: " + aggressiveness +
                      ", Dynamic Range Compression: " + dynamicRangeCompression);

      var P = new MultiscaleAdaptiveStretch;
      P.targetBackground = targetBackground;
      P.aggressiveness = aggressiveness;
      P.dynamicRangeCompression = dynamicRangeCompression;
      P.contrastRecovery = true;
      P.scaleSeparation = 7;
      P.previewLargeScale = false;
      P.saturationEnabled = true;
      P.saturationAmount = 0.75;
      P.saturationBoost = 0.50;
      P.saturationLightnessMask = true;

      if ( !P.executeOn( win.mainView, false ) ) {
         Console.warningln("MultiscaleAdaptiveStretch execution failed.");
         return win;
      }

      Console.writeln("MultiscaleAdaptiveStretch applied successfully.");
      return win;
   } catch (e) {
      Console.criticalln("MultiscaleAdaptiveStretch failed: " + e.toString());
      Console.criticalln("Pipeline terminated due to stretch failure.");
      throw new Error("MultiscaleAdaptiveStretch process failed. Cannot continue pipeline processing.");
   }
}

// --------------------------- GUI Dialog ----------------------------

function PipelineDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.windowTitle = "Distant Pixels Studio v1.0.6";
   this.adjustToContents();
   this.setVariableSize();

   var labelStyle = function( w )
   {
      w.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      w.minWidth = this.font.width( "Arcsinh Stretch:" ) + 6;
   }.bind( this );

   function channelRow( labelText )
   {
      var LabelCtrl = new Label( this );
      LabelCtrl.text = labelText;
      LabelCtrl.toolTip = "Optional. Leave empty if not used.";
      labelStyle( LabelCtrl );

      var EditCtrl = new Edit( this );
      EditCtrl.readOnly = true;
      EditCtrl.minWidth = 360;

      var BtnCtrl = new PushButton( this );
      BtnCtrl.text = "...";
      BtnCtrl.onClick = function()
      {
         var ofd = new OpenFileDialog;
         ofd.caption = "Select " + labelText + " file";
         ofd.multipleSelections = false;
         ofd.filters = [["FITS/XISF/TIFF","*.fits *.fit *.fts *.xisf *.tif *.tiff"]];
         if ( ofd.execute() )
            EditCtrl.text = ofd.fileName;
      };

      var ClearBtnCtrl = new PushButton( this );
      ClearBtnCtrl.text = "Clear";
      ClearBtnCtrl.toolTip = "Clear the selected file";
      ClearBtnCtrl.onClick = function()
      {
         EditCtrl.text = "";
      };

      var s = new HorizontalSizer;
      s.margin = 0; s.spacing = 6;
      s.add( LabelCtrl );
      s.add( EditCtrl, 100 );
      s.add( BtnCtrl );
      s.add( ClearBtnCtrl );
      return { sizer: s, edit: EditCtrl };
   }

   // ---------- Folder Scanner ----------
   this.scanFolderLabel = new Label( this );
   this.scanFolderLabel.text = "Scan Folder:";
   this.scanFolderLabel.toolTip = "Automatically detect master files by filter name";
   labelStyle( this.scanFolderLabel );

   this.scanFolderEdit = new Edit( this );
   this.scanFolderEdit.readOnly = true;
   this.scanFolderEdit.minWidth = 300;
   this.scanFolderEdit.toolTip = "Folder containing PixInsight master files";

   this.scanFolderBtn = new PushButton( this );
   this.scanFolderBtn.text = "Select...";
   this.scanFolderBtn.toolTip = "Select folder to scan for master files";
   this.scanFolderBtn.onClick = function()
   {
      var gdd = new GetDirectoryDialog;
      gdd.caption = "Select folder containing master files";
      if ( gdd.execute() ) {
         this.dialog.scanFolderEdit.text = gdd.directory;
      }
   }.bind(this);

   this.scanBtn = new PushButton( this );
   this.scanBtn.text = "Scan";
   this.scanBtn.toolTip = "Scan folder for master files and auto-populate channels";
   this.scanBtn.onClick = function()
   {
      var folderPath = this.dialog.scanFolderEdit.text.trim();
      if ( folderPath.length === 0 ) {
         new MessageBox( "Please select a folder first.", "No Folder Selected", StdIcon_Warning, StdButton_Ok ).execute();
         return;
      }

      Console.show();
      Console.writeln( "\n--- Scanning folder for master files ---" );
      Console.writeln( "Folder: " + folderPath );

      var results = scanFolderForMasters( folderPath );

      // Populate the channel edit fields
      var foundCount = 0;
      if ( results.Ha ) { this.dialog.haRow.edit.text = results.Ha; foundCount++; }
      if ( results.OIII ) { this.dialog.oiiiRow.edit.text = results.OIII; foundCount++; }
      if ( results.SII ) { this.dialog.siiRow.edit.text = results.SII; foundCount++; }
      if ( results.R ) { this.dialog.rRow.edit.text = results.R; foundCount++; }
      if ( results.G ) { this.dialog.gRow.edit.text = results.G; foundCount++; }
      if ( results.B ) { this.dialog.bRow.edit.text = results.B; foundCount++; }
      if ( results.L ) { this.dialog.lRow.edit.text = results.L; foundCount++; }

      // Also set the output folder to the same location if not already set
      if ( this.dialog.outDirEdit.text.trim().length === 0 ) {
         this.dialog.outDirEdit.text = folderPath;
         Console.writeln( "Set output folder to: " + folderPath );
      }

      Console.writeln( "Scan complete. Found " + foundCount + " master files." );

      if ( foundCount === 0 ) {
         new MessageBox( "No master files found in the selected folder.\n\nExpected naming pattern:\nmasterLight_..._FILTER-Ha_...\nor similar variations.", "No Files Found", StdIcon_Warning, StdButton_Ok ).execute();
      }
   }.bind(this);

   this.scanClearBtn = new PushButton( this );
   this.scanClearBtn.text = "Clear All";
   this.scanClearBtn.toolTip = "Clear all channel file assignments";
   this.scanClearBtn.onClick = function()
   {
      this.dialog.haRow.edit.text = "";
      this.dialog.oiiiRow.edit.text = "";
      this.dialog.siiRow.edit.text = "";
      this.dialog.rRow.edit.text = "";
      this.dialog.gRow.edit.text = "";
      this.dialog.bRow.edit.text = "";
      this.dialog.lRow.edit.text = "";
      this.dialog.scanFolderEdit.text = "";
   }.bind(this);

   var scanFolderRow = new HorizontalSizer;
   scanFolderRow.spacing = 6;
   scanFolderRow.add( this.scanFolderLabel );
   scanFolderRow.add( this.scanFolderEdit, 100 );
   scanFolderRow.add( this.scanFolderBtn );
   scanFolderRow.add( this.scanBtn );
   scanFolderRow.add( this.scanClearBtn );

   this.haRow  = channelRow.call( this, "Hα:" );
   this.oiiiRow= channelRow.call( this, "OIII:" );
   this.siiRow = channelRow.call( this, "SII:" );
   this.rRow   = channelRow.call( this, "R:" );
   this.gRow   = channelRow.call( this, "G:" );
   this.bRow   = channelRow.call( this, "B:" );
   this.lRow   = channelRow.call( this, "L:" );

   var filesGroup = new GroupBox( this );
   filesGroup.title = "Assign Input Files";
   filesGroup.sizer = new VerticalSizer;
   filesGroup.sizer.margin = 6; filesGroup.sizer.spacing = 4;
   filesGroup.sizer.add( scanFolderRow );
   filesGroup.sizer.addSpacing( 6 );
   filesGroup.sizer.add( this.haRow.sizer );
   filesGroup.sizer.add( this.oiiiRow.sizer );
   filesGroup.sizer.add( this.siiRow.sizer );
   filesGroup.sizer.add( this.rRow.sizer );
   filesGroup.sizer.add( this.gRow.sizer );
   filesGroup.sizer.add( this.bRow.sizer );
   filesGroup.sizer.add( this.lRow.sizer );

   // ---------- Crop Options (shared) ----------
   this.cropCheck = new CheckBox( this );
   this.cropCheck.text = "Apply crop (using saved process icon)";
   this.cropCheck.checked = false;
   
   this.cropFileLabel = new Label( this );
   this.cropFileLabel.text = "Crop process file:";
   labelStyle( this.cropFileLabel );
   
   this.cropFileEdit = new Edit( this );
   this.cropFileEdit.readOnly = true;
   this.cropFileEdit.minWidth = 300;
   this.cropFileEdit.toolTip = "Select a saved process icon (.xpsm file) containing your crop settings";
   
   this.cropFileBtn = new PushButton( this );
   this.cropFileBtn.text = "...";
   this.cropFileBtn.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.caption = "Select crop process icon file";
      ofd.multipleSelections = false;
      ofd.filters = [["Process Icons","*.xpsm"]];
      if ( ofd.execute() )
         this.dialog.cropFileEdit.text = ofd.fileName;
   }.bind(this);
   
   this.cropFileClearBtn = new PushButton( this );
   this.cropFileClearBtn.text = "Clear";
   this.cropFileClearBtn.toolTip = "Clear the selected crop file";
   this.cropFileClearBtn.onClick = function()
   {
      this.dialog.cropFileEdit.text = "";
   }.bind(this);
   
   var cropFileRow = new HorizontalSizer;
   cropFileRow.spacing = 6;
   cropFileRow.add( this.cropFileLabel );
   cropFileRow.add( this.cropFileEdit, 100 );
   cropFileRow.add( this.cropFileBtn );
   cropFileRow.add( this.cropFileClearBtn );

   var cropGroup = new GroupBox( this );
   cropGroup.title = "Crop Settings (Applied to All)";
   cropGroup.sizer = new VerticalSizer;
   cropGroup.sizer.margin = 6; cropGroup.sizer.spacing = 6;
   cropGroup.sizer.add( this.cropCheck );
   cropGroup.sizer.add( cropFileRow );

   // ---------- L/Ha/OIII/SII Processing Options ----------
   this.nb_processCheck = new CheckBox( this );
   this.nb_processCheck.text = "Enable NB/L processing";
   this.nb_processCheck.checked = true;
   this.nb_processCheck.toolTip = "Process L, Ha, OIII, SII images";

   this.nb_gradientCheck = new CheckBox( this );
   this.nb_gradientCheck.text = "Gradient correction";
   this.nb_gradientCheck.checked = true;

   this.nb_blurCheck = new CheckBox( this );
   this.nb_blurCheck.text = "Blur reduction (BlurXTerminator)";
   this.nb_blurCheck.checked = true;

   this.nb_noiseCheck = new CheckBox( this );
   this.nb_noiseCheck.text = "Noise reduction (NoiseXTerminator)";
   this.nb_noiseCheck.checked = true;

   // NB Denoise parameters
   this.nb_denoiseLabel = new Label( this );
   this.nb_denoiseLabel.text = "NB Denoise:";
   labelStyle( this.nb_denoiseLabel );

   this.nb_denoiseSpinBox = new SpinBox( this );
   this.nb_denoiseSpinBox.minValue = 0;
   this.nb_denoiseSpinBox.maxValue = 100;
   this.nb_denoiseSpinBox.value = 40;
   this.nb_denoiseSpinBox.toolTip = "Denoise strength (0-100, default 40)";

   this.nb_detailLabel = new Label( this );
   this.nb_detailLabel.text = "NB Detail:";
   labelStyle( this.nb_detailLabel );

   this.nb_detailSpinBox = new SpinBox( this );
   this.nb_detailSpinBox.minValue = 0;
   this.nb_detailSpinBox.maxValue = 100;
   this.nb_detailSpinBox.value = 15;
   this.nb_detailSpinBox.toolTip = "Detail preservation (0-100, default 15)";

   var nb_denoiseRow = new HorizontalSizer;
   nb_denoiseRow.spacing = 6;
   nb_denoiseRow.add( this.nb_denoiseLabel );
   nb_denoiseRow.add( this.nb_denoiseSpinBox );
   nb_denoiseRow.addSpacing( 12 );
   nb_denoiseRow.add( this.nb_detailLabel );
   nb_denoiseRow.add( this.nb_detailSpinBox );
   nb_denoiseRow.addStretch();

   this.nb_stretchCheck = new CheckBox( this );
   this.nb_stretchCheck.text = "Convert to non-linear (MAS stretch)";
   this.nb_stretchCheck.checked = true;
   this.nb_stretchCheck.toolTip = "Apply MultiscaleAdaptiveStretch";

   this.nb_starCheck = new CheckBox( this );
   this.nb_starCheck.text = "Star removal (create starless + stars)";
   this.nb_starCheck.checked = false;
   this.nb_starCheck.toolTip = "Create Ha starless + Ha stars images (Ha only)";

   this.nb_finalNoiseCheck = new CheckBox( this );
   this.nb_finalNoiseCheck.text = "Final noise reduction (NoiseXTerminator)";
   this.nb_finalNoiseCheck.checked = false;

   // NB Final Denoise parameters
   this.nb_finalDenoiseLabel = new Label( this );
   this.nb_finalDenoiseLabel.text = "NB Final Denoise:";
   labelStyle( this.nb_finalDenoiseLabel );

   this.nb_finalDenoiseSpinBox = new SpinBox( this );
   this.nb_finalDenoiseSpinBox.minValue = 0;
   this.nb_finalDenoiseSpinBox.maxValue = 100;
   this.nb_finalDenoiseSpinBox.value = 20;
   this.nb_finalDenoiseSpinBox.toolTip = "Final denoise strength (0-100, default 20)";

   this.nb_finalDetailLabel = new Label( this );
   this.nb_finalDetailLabel.text = "NB Final Detail:";
   labelStyle( this.nb_finalDetailLabel );

   this.nb_finalDetailSpinBox = new SpinBox( this );
   this.nb_finalDetailSpinBox.minValue = 0;
   this.nb_finalDetailSpinBox.maxValue = 100;
   this.nb_finalDetailSpinBox.value = 25;
   this.nb_finalDetailSpinBox.toolTip = "Final detail preservation (0-100, default 25)";

   var nb_finalDenoiseRow = new HorizontalSizer;
   nb_finalDenoiseRow.spacing = 6;
   nb_finalDenoiseRow.add( this.nb_finalDenoiseLabel );
   nb_finalDenoiseRow.add( this.nb_finalDenoiseSpinBox );
   nb_finalDenoiseRow.addSpacing( 12 );
   nb_finalDenoiseRow.add( this.nb_finalDetailLabel );
   nb_finalDenoiseRow.add( this.nb_finalDetailSpinBox );
   nb_finalDenoiseRow.addStretch();

   var nbOptsGroup = new GroupBox( this );
   nbOptsGroup.title = "L/Ha/OIII/SII Processing";
   nbOptsGroup.sizer = new VerticalSizer;
   nbOptsGroup.sizer.margin = 6; nbOptsGroup.sizer.spacing = 6;
   nbOptsGroup.sizer.add( this.nb_processCheck );
   nbOptsGroup.sizer.addSpacing( 4 );
   nbOptsGroup.sizer.add( this.nb_gradientCheck );
   nbOptsGroup.sizer.add( this.nb_blurCheck );
   nbOptsGroup.sizer.add( this.nb_noiseCheck );
   nbOptsGroup.sizer.add( nb_denoiseRow );
   nbOptsGroup.sizer.add( this.nb_stretchCheck );
   nbOptsGroup.sizer.add( this.nb_starCheck );
   nbOptsGroup.sizer.add( this.nb_finalNoiseCheck );
   nbOptsGroup.sizer.add( nb_finalDenoiseRow );

   // ---------- RGB Processing Options ----------
   this.rgb_processCheck = new CheckBox( this );
   this.rgb_processCheck.text = "Enable RGB processing";
   this.rgb_processCheck.checked = true;
   this.rgb_processCheck.toolTip = "Process R,G,B images as RGB workflow";

   this.rgb_gradientCheck = new CheckBox( this );
   this.rgb_gradientCheck.text = "Gradient correction";
   this.rgb_gradientCheck.checked = true;

   this.rgb_linearfitCheck = new CheckBox( this );
   this.rgb_linearfitCheck.text = "LinearFit (R as reference)";
   this.rgb_linearfitCheck.checked = true;
   this.rgb_linearfitCheck.toolTip = "Apply LinearFit to G and B using R as reference";

   this.rgb_combineCheck = new CheckBox( this );
   this.rgb_combineCheck.text = "Combine into RGB image";
   this.rgb_combineCheck.checked = true;

   this.rgb_blurCheck = new CheckBox( this );
   this.rgb_blurCheck.text = "Blur reduction (BlurXTerminator)";
   this.rgb_blurCheck.checked = true;

   this.rgb_noiseCheck = new CheckBox( this );
   this.rgb_noiseCheck.text = "Noise reduction (NoiseXTerminator)";
   this.rgb_noiseCheck.checked = true;

   // RGB Denoise parameters
   this.rgb_denoiseLabel = new Label( this );
   this.rgb_denoiseLabel.text = "RGB Denoise:";
   labelStyle( this.rgb_denoiseLabel );

   this.rgb_denoiseSpinBox = new SpinBox( this );
   this.rgb_denoiseSpinBox.minValue = 0;
   this.rgb_denoiseSpinBox.maxValue = 100;
   this.rgb_denoiseSpinBox.value = 40;
   this.rgb_denoiseSpinBox.toolTip = "Denoise strength (0-100, default 40)";

   this.rgb_detailLabel = new Label( this );
   this.rgb_detailLabel.text = "RGB Detail:";
   labelStyle( this.rgb_detailLabel );

   this.rgb_detailSpinBox = new SpinBox( this );
   this.rgb_detailSpinBox.minValue = 0;
   this.rgb_detailSpinBox.maxValue = 100;
   this.rgb_detailSpinBox.value = 15;
   this.rgb_detailSpinBox.toolTip = "Detail preservation (0-100, default 15)";

   var rgb_denoiseRow = new HorizontalSizer;
   rgb_denoiseRow.spacing = 6;
   rgb_denoiseRow.add( this.rgb_denoiseLabel );
   rgb_denoiseRow.add( this.rgb_denoiseSpinBox );
   rgb_denoiseRow.addSpacing( 12 );
   rgb_denoiseRow.add( this.rgb_detailLabel );
   rgb_denoiseRow.add( this.rgb_detailSpinBox );
   rgb_denoiseRow.addStretch();

   this.rgb_stretchCheck = new CheckBox( this );
   this.rgb_stretchCheck.text = "Convert to non-linear (MAS stretch)";
   this.rgb_stretchCheck.checked = true;
   this.rgb_stretchCheck.toolTip = "Apply MultiscaleAdaptiveStretch";

   this.rgb_starCheck = new CheckBox( this );
   this.rgb_starCheck.text = "Star removal (create starless + stars)";
   this.rgb_starCheck.checked = true;
   this.rgb_starCheck.toolTip = "Create RGB_NL (starless) and RGB_Stars_NL images";

   this.rgb_saveRCheck = new CheckBox( this );
   this.rgb_saveRCheck.text = "Save individual R channel (for Ha continuum)";
   this.rgb_saveRCheck.checked = false;
   this.rgb_saveRCheck.toolTip = "Process and save R channel separately for Ha continuum subtraction";

   this.rgb_finalNoiseCheck = new CheckBox( this );
   this.rgb_finalNoiseCheck.text = "Final noise reduction (NoiseXTerminator)";
   this.rgb_finalNoiseCheck.checked = false;

   // RGB Final Denoise parameters
   this.rgb_finalDenoiseLabel = new Label( this );
   this.rgb_finalDenoiseLabel.text = "RGB Final Denoise:";
   labelStyle( this.rgb_finalDenoiseLabel );

   this.rgb_finalDenoiseSpinBox = new SpinBox( this );
   this.rgb_finalDenoiseSpinBox.minValue = 0;
   this.rgb_finalDenoiseSpinBox.maxValue = 100;
   this.rgb_finalDenoiseSpinBox.value = 20;
   this.rgb_finalDenoiseSpinBox.toolTip = "Final denoise strength (0-100, default 20)";

   this.rgb_finalDetailLabel = new Label( this );
   this.rgb_finalDetailLabel.text = "RGB Final Detail:";
   labelStyle( this.rgb_finalDetailLabel );

   this.rgb_finalDetailSpinBox = new SpinBox( this );
   this.rgb_finalDetailSpinBox.minValue = 0;
   this.rgb_finalDetailSpinBox.maxValue = 100;
   this.rgb_finalDetailSpinBox.value = 25;
   this.rgb_finalDetailSpinBox.toolTip = "Final detail preservation (0-100, default 25)";

   var rgb_finalDenoiseRow = new HorizontalSizer;
   rgb_finalDenoiseRow.spacing = 6;
   rgb_finalDenoiseRow.add( this.rgb_finalDenoiseLabel );
   rgb_finalDenoiseRow.add( this.rgb_finalDenoiseSpinBox );
   rgb_finalDenoiseRow.addSpacing( 12 );
   rgb_finalDenoiseRow.add( this.rgb_finalDetailLabel );
   rgb_finalDenoiseRow.add( this.rgb_finalDetailSpinBox );
   rgb_finalDenoiseRow.addStretch();

   var rgbOptsGroup = new GroupBox( this );
   rgbOptsGroup.title = "RGB Processing";
   rgbOptsGroup.sizer = new VerticalSizer;
   rgbOptsGroup.sizer.margin = 6; rgbOptsGroup.sizer.spacing = 6;
   rgbOptsGroup.sizer.add( this.rgb_processCheck );
   rgbOptsGroup.sizer.addSpacing( 4 );
   rgbOptsGroup.sizer.add( this.rgb_gradientCheck );
   rgbOptsGroup.sizer.add( this.rgb_linearfitCheck );
   rgbOptsGroup.sizer.add( this.rgb_combineCheck );
   rgbOptsGroup.sizer.add( this.rgb_blurCheck );
   rgbOptsGroup.sizer.add( this.rgb_noiseCheck );
   rgbOptsGroup.sizer.add( rgb_denoiseRow );
   rgbOptsGroup.sizer.add( this.rgb_stretchCheck );
   rgbOptsGroup.sizer.add( this.rgb_starCheck );
   rgbOptsGroup.sizer.add( this.rgb_saveRCheck );
   rgbOptsGroup.sizer.add( this.rgb_finalNoiseCheck );
   rgbOptsGroup.sizer.add( rgb_finalDenoiseRow );

   // ---------- Two-column layout for processing options ----------
   var processingRow = new HorizontalSizer;
   processingRow.spacing = 8;
   processingRow.add( nbOptsGroup, 50 );
   processingRow.add( rgbOptsGroup, 50 );

   // ---------- MultiscaleAdaptiveStretch Parameters ----------
   this.mas_targetBgControl = new NumericControl( this );
   this.mas_targetBgControl.label.text = "Target Background:";
   this.mas_targetBgControl.setRange( 0.0, 0.5 );
   this.mas_targetBgControl.slider.setRange( 0, 500 );
   this.mas_targetBgControl.setPrecision( 2 );
   this.mas_targetBgControl.setValue( 0.15 );
   this.mas_targetBgControl.toolTip = "Target background brightness (0.0-0.5, default 0.15)";

   this.mas_aggressivenessControl = new NumericControl( this );
   this.mas_aggressivenessControl.label.text = "Aggressiveness:";
   this.mas_aggressivenessControl.setRange( 0.0, 1.0 );
   this.mas_aggressivenessControl.slider.setRange( 0, 1000 );
   this.mas_aggressivenessControl.setPrecision( 2 );
   this.mas_aggressivenessControl.setValue( 0.70 );
   this.mas_aggressivenessControl.toolTip = "Shadows clipping aggressiveness (0.0-1.0, default 0.70)";

   this.mas_dynRangeControl = new NumericControl( this );
   this.mas_dynRangeControl.label.text = "Dynamic Range:";
   this.mas_dynRangeControl.setRange( 0.0, 1.0 );
   this.mas_dynRangeControl.slider.setRange( 0, 1000 );
   this.mas_dynRangeControl.setPrecision( 2 );
   this.mas_dynRangeControl.setValue( 0.40 );
   this.mas_dynRangeControl.toolTip = "Dynamic range compression (0.0-1.0, default 0.40)";

   var masGroup = new GroupBox( this );
   masGroup.title = "MultiscaleAdaptiveStretch Parameters";
   masGroup.sizer = new VerticalSizer;
   masGroup.sizer.margin = 6; masGroup.sizer.spacing = 6;
   masGroup.sizer.add( this.mas_targetBgControl );
   masGroup.sizer.add( this.mas_aggressivenessControl );
   masGroup.sizer.add( this.mas_dynRangeControl );

   var optsGroup = new GroupBox( this );
   optsGroup.title = "Processing Options";
   optsGroup.sizer = new VerticalSizer;
   optsGroup.sizer.margin = 6; optsGroup.sizer.spacing = 6;
   optsGroup.sizer.add( cropGroup );
   optsGroup.sizer.add( processingRow );
   optsGroup.sizer.add( masGroup );

   // ---------- Output ----------
   this.out_saveTifCheck = new CheckBox( this );
   this.out_saveTifCheck.text = "Save TIF files to output folder";
   this.out_saveTifCheck.checked = true;
   this.out_saveTifCheck.toolTip = "Save processed images as 32-bit TIF files";

   this.out_keepImagesCheck = new CheckBox( this );
   this.out_keepImagesCheck.text = "Keep images in PixInsight";
   this.out_keepImagesCheck.checked = false;
   this.out_keepImagesCheck.toolTip = "Keep final images as PixInsight windows (cascaded)";

   this.outDirLabel = new Label( this );
   this.outDirLabel.text = "Output folder:";
   labelStyle( this.outDirLabel );

   this.outDirEdit = new Edit( this );
   this.outDirEdit.readOnly = true;
   this.outDirEdit.minWidth = 360;

   this.outDirBtn = new PushButton( this );
   this.outDirBtn.text = "...";
   this.outDirBtn.onClick = function()
   {
      var sfd = new GetDirectoryDialog;
      sfd.caption = "Select output folder";
      if ( sfd.execute() )
         this.dialog.outDirEdit.text = sfd.directory;
   }.bind(this);

   var outDirRow = new HorizontalSizer;
   outDirRow.spacing = 6;
   outDirRow.add( this.outDirLabel );
   outDirRow.add( this.outDirEdit, 100 );
   outDirRow.add( this.outDirBtn );

   var outGroup = new GroupBox( this );
   outGroup.title = "Output";
   outGroup.sizer = new VerticalSizer;
   outGroup.sizer.margin = 6; outGroup.sizer.spacing = 6;
   outGroup.sizer.add( this.out_saveTifCheck );
   outGroup.sizer.add( this.out_keepImagesCheck );
   outGroup.sizer.add( outDirRow );

   // ---------- Tool Buttons (lower left) ----------
   this.newInstanceButton = new ToolButton( this );
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstanceButton.setScaledFixedSize( 20, 20 );
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = function()
   {
      this.hasFocus = true;
      saveSettings( this.dialog );
      this.pushed = false;
      this.dialog.newInstance();
   };

   this.resetButton = new ToolButton( this );
   this.resetButton.icon = this.scaledResource( ":/icons/reload.png" );
   this.resetButton.setScaledFixedSize( 20, 20 );
   this.resetButton.toolTip = "<p>Reset all settings to default values.</p>";
   this.resetButton.onClick = function()
   {
      var msg = new MessageBox( "Do you really want to reset all settings to their default values?",
                                "Distant Pixels Studio", StdIcon_Warning, StdButton_Yes, StdButton_No );
      if ( msg.execute() == StdButton_Yes )
      {
         Settings.remove( "DistantPixelsStudio" );
         this.dialog.resetRequest = true;
         this.dialog.cancel();
      }
   };

   this.helpButton = new ToolButton( this );
   this.helpButton.icon = this.scaledResource( ":/process-interface/browse-documentation.png" );
   this.helpButton.setScaledFixedSize( 20, 20 );
   this.helpButton.toolTip = "<p>Browse Documentation</p>";
   this.helpButton.onClick = function()
   {
      Dialog.browseScriptDocumentation( "DistantPixelsStudio" );
   };

   // ---------- Action Buttons ----------
   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "Run";
   this.ok_Button.icon = this.scaledResource( ":/icons/play.png" );
   this.ok_Button.onClick = function()
   {
      try {
         this.dialog.runPipeline();
         this.dialog.ok();
      } catch (e) {
         new MessageBox( e.toString(), "Error", StdIcon_Error, StdButton_Ok ).execute();
      }
   }.bind(this);

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function(){ this.dialog.cancel(); }.bind(this);

   var buttonRow = new HorizontalSizer;
   buttonRow.spacing = 6;
   buttonRow.add( this.newInstanceButton );
   buttonRow.add( this.resetButton );
   buttonRow.add( this.helpButton );
   buttonRow.addStretch();
   buttonRow.add( this.ok_Button );
   buttonRow.add( this.cancel_Button );

   // ---------- Layout ----------
   this.sizer = new VerticalSizer;
   this.sizer.margin = 6; this.sizer.spacing = 8;
   this.sizer.add( filesGroup );
   this.sizer.add( optsGroup );
   this.sizer.add( outGroup );
   this.sizer.add( buttonRow );
   
   // Load previous settings
   loadSettings(this);

   // ---------- Pipeline ----------
   this.collectSelected = function()
   {
      var A = [];
      function pushIf( label, edit )
      {
         if ( edit.text && edit.text.length > 0 )
            A.push( { label: label, path: edit.text } );
      }
      pushIf( "HA",   this.haRow.edit );
      pushIf( "OIII", this.oiiiRow.edit );
      pushIf( "SII",  this.siiRow.edit );
      pushIf( "R",    this.rRow.edit );
      pushIf( "G",    this.gRow.edit );
      pushIf( "B",    this.bRow.edit );
      pushIf( "L",    this.lRow.edit );
      if ( A.length === 0 )
         throw new Error("Assign at least one input file.");
      return A;
   };

   this.runPipeline = function()
   {
      // Save current settings for next time
      saveSettings(this);
      
      var outDir = this.outDirEdit.text.trim();
      ensureFolder( outDir );

      var doCrop = this.cropCheck.checked;
      var cropFile = this.cropFileEdit.text.trim();
      
      // NB/L processing options
      var nb_doProcess = this.nb_processCheck.checked;
      var nb_doGrad = this.nb_gradientCheck.checked;
      var nb_doBlur = this.nb_blurCheck.checked;
      var nb_doNoise = this.nb_noiseCheck.checked;
      var nb_denoise = this.nb_denoiseSpinBox.value;
      var nb_detail = this.nb_detailSpinBox.value;
      var nb_doStretch = this.nb_stretchCheck.checked;
      var nb_doStar = this.nb_starCheck.checked;
      var nb_doFinalNoise = this.nb_finalNoiseCheck.checked;
      var nb_finalDenoise = this.nb_finalDenoiseSpinBox.value;
      var nb_finalDetail = this.nb_finalDetailSpinBox.value;
      
      // RGB processing options
      var rgb_doProcess = this.rgb_processCheck.checked;
      var rgb_doGrad = this.rgb_gradientCheck.checked;
      var rgb_doLinearFit = this.rgb_linearfitCheck.checked;
      var rgb_doCombine = this.rgb_combineCheck.checked;
      var rgb_doBlur = this.rgb_blurCheck.checked;
      var rgb_doNoise = this.rgb_noiseCheck.checked;
      var rgb_denoise = this.rgb_denoiseSpinBox.value;
      var rgb_detail = this.rgb_detailSpinBox.value;
      var rgb_doStretch = this.rgb_stretchCheck.checked;
      var rgb_doStar = this.rgb_starCheck.checked;
      var rgb_doSaveR = this.rgb_saveRCheck.checked;
      var rgb_doFinalNoise = this.rgb_finalNoiseCheck.checked;
      var rgb_finalDenoise = this.rgb_finalDenoiseSpinBox.value;
      var rgb_finalDetail = this.rgb_finalDetailSpinBox.value;

      // MAS (MultiscaleAdaptiveStretch) parameters
      var mas_targetBackground = this.mas_targetBgControl.value;
      var mas_aggressiveness = this.mas_aggressivenessControl.value;
      var mas_dynamicRange = this.mas_dynRangeControl.value;

      // Output options
      var out_saveTif = this.out_saveTifCheck.checked;
      var out_keepImages = this.out_keepImagesCheck.checked;

      var inputs = this.collectSelected();

      // Variables for intermediate windows (for cleanup at end)
      var rgbCombined = null;
      var starResults = null;
      var haStarResults = { starless: null, stars: null };

      // Track windows to keep (not close during cleanup) when out_keepImages is enabled
      var windowsToKeep = {};

      // Snapshot all currently open windows (to know what to keep after cleanup)
      var windowsBefore = {};
      var allWindowsBefore = ImageWindow.windows;
      for ( var i = 0; i < allWindowsBefore.length; ++i ) {
         windowsBefore[allWindowsBefore[i].mainView.id] = true;
      }

      Console.show();
      Console.writeln( "Starting dual-workflow pipeline processing..." );

      // Separate RGB and NB images
      var rgbImages = [];
      var nbImages = [];
      
      for ( var i = 0; i < inputs.length; ++i ) {
         var ch = inputs[i];
         if ( ch.label === "R" || ch.label === "G" || ch.label === "B" ) {
            rgbImages.push( ch );
         } else {
            nbImages.push( ch );
         }
      }
      
      Console.writeln( "Found " + rgbImages.length + " RGB images and " + nbImages.length + " NB/L images." );

      // ===== RGB WORKFLOW =====
      var rgbWindows = [];
      if ( rgb_doProcess && rgbImages.length > 0 ) {
         Console.writeln( "\n=== RGB WORKFLOW ===" );
         
         // Step 1: Open RGB images
         Console.writeln( "\n--- RGB Step 1: Opening RGB images ---" );
         for ( var i = 0; i < rgbImages.length; ++i ) {
            var ch = rgbImages[i];
         Console.writeln( "Opening [" + ch.label + "]: " + ch.path );
         var win = openImageOrThrow( ch.path );
            try { win.mainView.id = File.extractName( ch.path ); } catch (e) {}
            rgbWindows.push({ window: win, label: ch.label, originalPath: ch.path });
         }

         // Step 2: Crop RGB images
         if ( doCrop ) {
            Console.writeln( "\n--- RGB Step 2: Cropping RGB images ---" );
            for ( var i = 0; i < rgbWindows.length; ++i ) {
               Console.writeln( "Cropping [" + rgbWindows[i].label + "]..." );
               rgbWindows[i].window = runCrop( rgbWindows[i].window, cropFile );
            }
         }

         // Step 3: Gradient correction on RGB images
         if ( rgb_doGrad ) {
            Console.writeln( "\n--- RGB Step 3: Gradient correction ---" );
            for ( var i = 0; i < rgbWindows.length; ++i ) {
               Console.writeln( "Gradient correction on [" + rgbWindows[i].label + "]..." );
               rgbWindows[i].window = runGradientCorrection( rgbWindows[i].window );
            }
         }

         // Step 4: LinearFit G and B to R
         if ( rgb_doLinearFit && rgbWindows.length >= 3 ) {
            Console.writeln( "\n--- RGB Step 4: LinearFit calibration ---" );
            var rWin = null, gWin = null, bWin = null;
            for ( var i = 0; i < rgbWindows.length; ++i ) {
               if ( rgbWindows[i].label === "R" ) rWin = rgbWindows[i].window;
               if ( rgbWindows[i].label === "G" ) gWin = rgbWindows[i].window;
               if ( rgbWindows[i].label === "B" ) bWin = rgbWindows[i].window;
            }
            
            if ( rWin && gWin && bWin ) {
               Console.writeln( "Applying LinearFit to G using R as reference..." );
               gWin = runLinearFit( gWin, rWin );
               Console.writeln( "Applying LinearFit to B using R as reference..." );
               bWin = runLinearFit( bWin, rWin );
               
               // Update windows array
               for ( var i = 0; i < rgbWindows.length; ++i ) {
                  if ( rgbWindows[i].label === "G" ) rgbWindows[i].window = gWin;
                  if ( rgbWindows[i].label === "B" ) rgbWindows[i].window = bWin;
               }
            } else {
               Console.warningln( "Cannot perform LinearFit: missing R, G, or B images" );
            }
         }

         // Step 5: Combine RGB
         if ( rgb_doCombine && rgbWindows.length >= 3 ) {
            Console.writeln( "\n--- RGB Step 5: Combining into RGB image ---" );
            var rWin = null, gWin = null, bWin = null;
            for ( var i = 0; i < rgbWindows.length; ++i ) {
               if ( rgbWindows[i].label === "R" ) rWin = rgbWindows[i].window;
               if ( rgbWindows[i].label === "G" ) gWin = rgbWindows[i].window;
               if ( rgbWindows[i].label === "B" ) bWin = rgbWindows[i].window;
            }
            
            if ( rWin && gWin && bWin ) {
               rgbCombined = combineRGBPixelMath( rWin, gWin, bWin );
               if ( rgbCombined ) {
                  Console.writeln( "RGB combination successful." );
               }
            } else {
               Console.warningln( "Cannot combine RGB: missing R, G, or B images" );
            }
         }

         // Step 6: Blur reduction on RGB
         if ( rgb_doBlur && rgbCombined ) {
            Console.writeln( "\n--- RGB Step 6: Blur reduction ---" );
            rgbCombined = runBlurReduction( rgbCombined );
         }

         // Step 7: Noise reduction on RGB
         if ( rgb_doNoise && rgbCombined ) {
            Console.writeln( "\n--- RGB Step 7: Noise reduction ---" );
            rgbCombined = runNoiseReduction( rgbCombined, rgb_denoise, rgb_detail );
         }

         // Step 8: MultiscaleAdaptiveStretch on RGB
         if ( rgb_doStretch && rgbCombined ) {
            Console.writeln( "\n--- RGB Step 8: MultiscaleAdaptiveStretch ---" );
            rgbCombined = applyMultiscaleAdaptiveStretch( rgbCombined, mas_targetBackground, mas_aggressiveness, mas_dynamicRange );
         }

         // Step 9: Final noise reduction on RGB (after stretch)
         if ( rgb_doFinalNoise && rgbCombined ) {
            Console.writeln( "\n--- RGB Step 9: Final noise reduction ---" );
            rgbCombined = runNoiseReduction( rgbCombined, rgb_finalDenoise, rgb_finalDetail );
         }

         // Step 10: Star removal with StarXTerminator on RGB
         if ( rgb_doStar && rgbCombined ) {
            Console.writeln( "\n--- RGB Step 10: Star removal ---" );
            starResults = runStarXTerminatorRGB( rgbCombined );

            if ( starResults.starless ) {
               Console.writeln( "Output: RGB starless image..." );
               if ( out_saveTif ) {
                  var savedStarless = saveWindowAsTIF( starResults.starless, outDir, "RGB" );
                  Console.writeln( "Saved: " + savedStarless );
               }
               if ( out_keepImages ) {
                  try { starResults.starless.mainView.id = "RGB_NL"; } catch (e) {}
                  windowsToKeep["RGB_NL"] = true;
                  starResults.starless.show();
                  Console.writeln( "Kept in PixInsight: RGB_NL" );
               }
            }

            if ( starResults.stars ) {
               Console.writeln( "Output: RGB stars image..." );
               if ( out_saveTif ) {
                  var savedStars = saveWindowAsTIF( starResults.stars, outDir, "RGB_Stars" );
                  Console.writeln( "Saved: " + savedStars );
               }
               if ( out_keepImages ) {
                  try { starResults.stars.mainView.id = "RGB_Stars_NL"; } catch (e) {}
                  windowsToKeep["RGB_Stars_NL"] = true;
                  starResults.stars.show();
                  Console.writeln( "Kept in PixInsight: RGB_Stars_NL" );
               }
            }
         } else if ( rgbCombined ) {
            // Output regular RGB if no star removal
            Console.writeln( "Output: RGB image..." );
            if ( out_saveTif ) {
               var savedRGB = saveWindowAsTIF( rgbCombined, outDir, "RGB" );
               Console.writeln( "Saved: " + savedRGB );
            }
            if ( out_keepImages ) {
               try { rgbCombined.mainView.id = "RGB_NL"; } catch (e) {}
               windowsToKeep["RGB_NL"] = true;
               rgbCombined.show();
               Console.writeln( "Kept in PixInsight: RGB_NL" );
            }
         }

         // ===== R CHANNEL PROCESSING (for Ha continuum subtraction) =====
         if ( rgb_doSaveR ) {
            Console.writeln( "\n=== R CHANNEL PROCESSING ===" );

            // Find R window from rgbWindows
            var rWin = null;
            for ( var i = 0; i < rgbWindows.length; ++i ) {
               if ( rgbWindows[i].label === "R" ) {
                  rWin = rgbWindows[i].window;
                  break;
               }
            }

            if ( rWin ) {
               // Clone R window for separate processing (original may be modified)
               Console.writeln( "Cloning R channel for separate processing..." );
               var rClone = cloneImageWindow( rWin, "R_processing" );

               // Apply blur reduction to R (same as RGB)
               if ( rgb_doBlur ) {
                  Console.writeln( "--- R: Blur reduction ---" );
                  rClone = runBlurReduction( rClone );
               }

               // Apply noise reduction to R (same as RGB)
               if ( rgb_doNoise ) {
                  Console.writeln( "--- R: Noise reduction ---" );
                  rClone = runNoiseReduction( rClone, rgb_denoise, rgb_detail );
               }

               // Apply stretch to R
               if ( rgb_doStretch ) {
                  Console.writeln( "--- R: MultiscaleAdaptiveStretch ---" );
                  rClone = applyMultiscaleAdaptiveStretch( rClone, mas_targetBackground, mas_aggressiveness, mas_dynamicRange );
               }

               // Apply final noise reduction to R
               if ( rgb_doFinalNoise ) {
                  Console.writeln( "--- R: Final noise reduction ---" );
                  rClone = runNoiseReduction( rClone, rgb_finalDenoise, rgb_finalDetail );
               }

               // Apply star removal to R (starless only)
               if ( rgb_doStar ) {
                  Console.writeln( "--- R: Star removal ---" );
                  var rStarResults = runStarXTerminatorStarless( rClone );
                  if ( rStarResults ) {
                     rClone = rStarResults;
                  }
               }

               // Output R_NL
               Console.writeln( "Output: R channel image..." );
               if ( out_saveTif ) {
                  var savedR = saveWindowAsTIF( rClone, outDir, "R" );
                  Console.writeln( "Saved: " + savedR );
               }
               if ( out_keepImages ) {
                  try { rClone.mainView.id = "R_NL"; } catch (e) {}
                  windowsToKeep["R_NL"] = true;
                  rClone.show();
                  Console.writeln( "Kept in PixInsight: R_NL" );
               }
            } else {
               Console.warningln( "R channel not found - cannot save individual R" );
            }
         }
      }

      // ===== NB/L WORKFLOW =====
      var nbWindows = [];
      if ( nb_doProcess && nbImages.length > 0 ) {
         Console.writeln( "\n=== NB/L WORKFLOW ===" );
         
         // Step 1: Open NB images
         Console.writeln( "\n--- NB Step 1: Opening NB/L images ---" );
         for ( var i = 0; i < nbImages.length; ++i ) {
            var ch = nbImages[i];
            Console.writeln( "Opening [" + ch.label + "]: " + ch.path );
            var win = openImageOrThrow( ch.path );
         try { win.mainView.id = File.extractName( ch.path ); } catch (e) {}
            nbWindows.push({ window: win, label: ch.label, originalPath: ch.path });
         }

         // Step 2: Crop NB images
         if ( doCrop ) {
            Console.writeln( "\n--- NB Step 2: Cropping NB/L images ---" );
            for ( var i = 0; i < nbWindows.length; ++i ) {
               Console.writeln( "Cropping [" + nbWindows[i].label + "]..." );
               nbWindows[i].window = runCrop( nbWindows[i].window, cropFile );
            }
         }

         // Step 3: Gradient correction on NB images
         if ( nb_doGrad ) {
            Console.writeln( "\n--- NB Step 3: Gradient correction ---" );
            for ( var i = 0; i < nbWindows.length; ++i ) {
               Console.writeln( "Gradient correction on [" + nbWindows[i].label + "]..." );
               nbWindows[i].window = runGradientCorrection( nbWindows[i].window );
            }
         }

         // Step 4: Blur reduction on NB images
         if ( nb_doBlur ) {
            Console.writeln( "\n--- NB Step 4: Blur reduction ---" );
            for ( var i = 0; i < nbWindows.length; ++i ) {
               Console.writeln( "Blur reduction on [" + nbWindows[i].label + "]..." );
               nbWindows[i].window = runBlurReduction( nbWindows[i].window );
            }
         }

         // Step 5: Noise reduction on NB images
         if ( nb_doNoise ) {
            Console.writeln( "\n--- NB Step 5: Noise reduction ---" );
            for ( var i = 0; i < nbWindows.length; ++i ) {
               Console.writeln( "Noise reduction on [" + nbWindows[i].label + "]..." );
               nbWindows[i].window = runNoiseReduction( nbWindows[i].window, nb_denoise, nb_detail );
            }
         }

         // Step 6: MultiscaleAdaptiveStretch on NB images
         // All NB/L images use NB stretch checkbox, but share the same MAS parameters as RGB
         if ( nb_doStretch ) {
            Console.writeln( "\n--- NB Step 6: MultiscaleAdaptiveStretch ---" );
            for ( var i = 0; i < nbWindows.length; ++i ) {
               Console.writeln( "MultiscaleAdaptiveStretch on [" + nbWindows[i].label + "]..." );
               nbWindows[i].window = applyMultiscaleAdaptiveStretch( nbWindows[i].window, mas_targetBackground, mas_aggressiveness, mas_dynamicRange );
            }
         }

         // Step 7: Star removal on NB images (with Ha star image generation)
         if ( nb_doStar ) {
            Console.writeln( "\n--- NB Step 7: Star removal ---" );
            for ( var i = 0; i < nbWindows.length; ++i ) {
               if ( nbWindows[i].label === "HA" ) {
                  // Special handling for Ha - generate star image
                  Console.writeln( "Star removal with star generation on [" + nbWindows[i].label + "]..." );
                  haStarResults = runStarXTerminatorNB( nbWindows[i].window, nbWindows[i].label );
                  if ( haStarResults.starless ) {
                     nbWindows[i].window = haStarResults.starless;
                  }
               } else {
                  // Regular star removal for other NB images
                  Console.writeln( "Star removal on [" + nbWindows[i].label + "]..." );
                  nbWindows[i].window = runStarRemoval( nbWindows[i].window );
               }
            }
         }

         // Step 8: Final noise reduction on NB images (after stretch and star removal)
         if ( nb_doFinalNoise ) {
            Console.writeln( "\n--- NB Step 8: Final noise reduction ---" );
            for ( var i = 0; i < nbWindows.length; ++i ) {
               Console.writeln( "Final noise reduction on [" + nbWindows[i].label + "]..." );
               nbWindows[i].window = runNoiseReduction( nbWindows[i].window, nb_finalDenoise, nb_finalDetail );
            }
         }

         // Step 9: Output NB images and Ha star image
         Console.writeln( "\n--- NB Step 9: Output NB/L images ---" );
         for ( var i = 0; i < nbWindows.length; ++i ) {
            var outputName = nbWindows[i].label + "_NL";
            Console.writeln( "Output: [" + nbWindows[i].label + "]..." );
            if ( out_saveTif ) {
               var saved = saveWindowAsTIF( nbWindows[i].window, outDir, nbWindows[i].label );
               Console.writeln( "Saved: " + saved );
            }
            if ( out_keepImages ) {
               try { nbWindows[i].window.mainView.id = outputName; } catch (e) {}
               windowsToKeep[outputName] = true;
               nbWindows[i].window.show();
               Console.writeln( "Kept in PixInsight: " + outputName );
            }
         }

         // Output Ha star image if it was generated
         if ( haStarResults.stars ) {
            Console.writeln( "Output: Ha stars image..." );
            if ( out_saveTif ) {
               var savedHaStars = saveWindowAsTIF( haStarResults.stars, outDir, "HA_Stars" );
               Console.writeln( "Saved: " + savedHaStars );
            }
            if ( out_keepImages ) {
               try { haStarResults.stars.mainView.id = "HA_Stars_NL"; } catch (e) {}
               windowsToKeep["HA_Stars_NL"] = true;
               haStarResults.stars.show();
               Console.writeln( "Kept in PixInsight: HA_Stars_NL" );
            }
         }
      }

      // ===== CLEANUP: Close all intermediate windows =====
      // Close any window that wasn't open before the pipeline started (except those we want to keep)
      Console.writeln( "\n--- Cleaning up intermediate images ---" );

      var allWindowsAfter = ImageWindow.windows;
      var closedCount = 0;
      var keptCount = 0;
      for ( var i = 0; i < allWindowsAfter.length; ++i ) {
         var win = allWindowsAfter[i];
         var winId = win.mainView.id;
         // Skip windows that existed before or are marked to keep
         if ( windowsBefore[winId] ) {
            continue;
         }
         if ( windowsToKeep[winId] ) {
            Console.writeln( "Keeping: " + winId );
            keptCount++;
            continue;
         }
         // Close intermediate window
         try {
            Console.writeln( "Closing: " + winId );
            win.forceClose();
            closedCount++;
         } catch (e) {
            Console.writeln( "Could not close " + winId + ": " + e.toString() );
         }
      }

      Console.writeln( "Cleanup complete. Closed " + closedCount + " intermediate windows, kept " + keptCount + " output windows." );

      Console.writeln( "\n=== DUAL PIPELINE COMPLETE ===" );
      Console.writeln( "RGB workflow: " + (rgb_doProcess ? "Enabled" : "Disabled") );
      Console.writeln( "NB/L workflow: " + (nb_doProcess ? (nbImages.length > 0 ? "Processed " + nbImages.length + " images" : "No images") : "Disabled") );
   };
}
PipelineDialog.prototype = new Dialog;

// ------------------------------ Main -------------------------------

function main()
{
   Console.show();
   checkPixInsightVersion();
   ensureGuiClasses();
   
   var dlg = new PipelineDialog();
   dlg.execute();
}

main();
