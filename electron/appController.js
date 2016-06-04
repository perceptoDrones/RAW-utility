
// Get electron library:
var electron = require('electron');

// Start angular:
var app = angular.module("RawUtility", []);

// Raw controller:
app.controller('appController', ['$scope', function($scope) {

    // Get elements:
    var trackBar     = document.getElementById("trackBar");
    var cropBarCont  = document.getElementById("cropBarsContainer");
    var cropStartBar = document.getElementById("cropStartBar");
    var cropEndBar   = document.getElementById("cropEndBar");
    var canvas       = document.getElementById("canvas");

    // Utility status:
    $scope.playing    = false;
    $scope.cropMode   = false;
    $scope.barsHidden = false;

    // Crop margins:
    $scope.cropStart = 1;
    $scope.cropEnd   = 3;

    // Create util:
    $scope.util = new RawUtility(canvas.getContext("2d"));

    // Timeouts/Intervals handlers:
    var barsTimeout     = null;
    var playingInterval = null;

    // Open new video file:
    $scope.openFile = function(options) {

        // Log:
        console.log("Opening video: ", options);

        // Close previous file:
        $scope.util.close();

        // Initialize util:
        $scope.util.init(options);

        // Set canvas size:
        canvas.width  = options.width;
        canvas.height = options.height;

        // Set bars size:
        trackBar.style.width    = (options.width - 180) + "px";
        cropBarCont.style.width = (options.width - 230) + "px";

        // Reset crop bar:
        $scope.resetCropBar();

        // Play video:
        $scope.play();

    }

    // Play / Pause:
    $scope.play = function(newState) {

        // Do nothing if state unchanged:
        if (newState != null && $scope.playing == newState) return;

        // Update state:
        $scope.playing = (newState == null) ? !$scope.playing : newState;

        // Start playing:
        if ($scope.playing) {

            // Play frames according to FPS:
            playingInterval = setInterval(function() {
                $scope.showFrame("next", true);
            }, 1000 / $scope.util.frameRate);

        }

        // Stop playing
        if (!$scope.playing) {

            // Stop intervals:
            clearInterval(playingInterval);

        }

    }

    // Show specific frame:
    $scope.showFrame = function(frame, updateScope) {

        // Do nothing if file wasn't open yet:
        if (!$scope.util) return;

        // Fix current frame:
        $scope.util.currentFrame = parseInt($scope.util.currentFrame);

        // If frame not specified, show current frame:
        if      (frame == null   ) frame = $scope.util.currentFrame;

        // If specified next, show next:
        else if (frame == "next" ) frame = $scope.util.currentFrame + 1;

        // If specified prev, show prev:
        else if (frame == "prev" ) frame = $scope.util.currentFrame - 1;

        // If specified first, show first:
        else if (frame == "first") frame = $scope.cropStart;

        // If specified last, show last:
        else if (frame == "last" ) frame = $scope.cropEnd;

        // Don't show a frame that out of crop:
        if (frame < $scope.cropStart) frame = $scope.cropStart;
        if (frame > $scope.cropEnd)   frame = $scope.cropEnd;

        // Show current frame:
        $scope.util.showFrame(frame);

        // Update view:
        if (updateScope) $scope.$apply();

        // Color track bar:
        $scope.trackBarColor($scope.util.currentFrame);

        // Pause if in last frame in crop:
        if ($scope.util.currentFrame == $scope.cropEnd) $scope.play(false);

    }

    // Open bars:
    $scope.openBars = function() {

        // Clear timeout:
        if (barsTimeout != null) clearTimeout(barsTimeout)

        // Show bars:
        $scope.barsHidden = $scope.barsHidden = false;

    }

    // Close bars:
    $scope.closeBars = function() {

        // Set new timeout:
        barsTimeout = setTimeout(function() {
            $scope.barsHidden = $scope.barsHidden = true;
            $scope.$apply();
        }, 3000);

    }

    // Toggle crop:
    $scope.toggleCrop = function() {
        $scope.cropMode = !$scope.cropMode;
    }

    // Crop a video file:
    $scope.cropFile = function() {

        // Crop the video:
        $scope.util.crop($scope.cropStart, $scope.cropEnd);

        // Reset the crop bar:
        $scope.resetCropBar();

        // Exit crop mode:
        $scope.toggleCrop();

        // Show 1st frame of new video:
        $scope.showFrame(1);

    }

    // Color track bar:
    $scope.trackBarColor = function(value) {
        $scope.colorBar(trackBar, (value - trackBar.min) / (trackBar.max - trackBar.min), '#FFA000', '#C5C5C5');
    }

    // Reset crop bar:
    $scope.resetCropBar = function() {

        // Set crop values:
        $scope.cropEnd   = $scope.util.videoFrames;
        $scope.cropStart = 1;

        // Adjust for new values:
        $scope.adjustCropBars();

    }

    // Handle crop bars:
    $scope.adjustCropBars = function(changed) {

        // Do nothing if file wasn't open yet:
        if (!$scope.util) return;

        // Fix ranges:
        cropStartBar.max = $scope.cropEnd;
        cropEndBar.min   = $scope.cropStart;

        // Fix width:
        cropStartBar.style.width = (($scope.util.videoWidth - 230 - 32) * ($scope.cropEnd          - 1               ) / $scope.util.videoFrames + 16) + "px";
        cropEndBar.style.width   = (($scope.util.videoWidth - 230 - 32) * ($scope.util.videoFrames - $scope.cropStart) / $scope.util.videoFrames + 16) + "px";

        // Color both bars:
        $scope.colorBar(cropStartBar, ($scope.cropStart - cropStartBar.min) / (cropStartBar.max - cropStartBar.min), '#C5C5C5', '#FFA000');
        $scope.colorBar(cropEndBar,   ($scope.cropEnd   - cropEndBar.min  ) / (cropEndBar.max   - cropEndBar.min  ), '#FFA000', '#C5C5C5');

        // Show relevant frame:
        if (changed != null) $scope.showFrame(changed == 'end' ? $scope.cropEnd : $scope.cropStart);

    }

    // Color a range bar:
    $scope.colorBar = function(bar, val, color1, color2) {
        bar.style.backgroundImage = '-webkit-gradient(linear, left top, right top, color-stop(' + val + ', ' + color1 + '), color-stop(' + val + ', ' + color2 + '))';
    }

    // Check mouse position on canvas:
    $scope.checkMousePosition = function(event) {
        if (event.clientY > ($scope.util.videoHeight - 50) || event.clientY < 50) $scope.openBars();
    }

    // Get file name from main:
    electron.ipcRenderer.on('video', (event, options) => {
        $scope.openFile(options);
    });

    // Keyboard events:
    document.onkeydown = function (e) {

        // Print to console:
        console.log("Keydown: " + e.code);

        // Play/Pause:
        if (e.code == 'Space') $scope.play();

        // Next frame:
        if (e.code == 'ArrowRight') $scope.showFrame('next', true);

        // Previous frame:
        if (e.code == 'ArrowLeft') $scope.showFrame('prev', true);

        // Quit:
        if (e.code == 'Escape' || e.code == 'KeyQ') window.close();

    }

}]);