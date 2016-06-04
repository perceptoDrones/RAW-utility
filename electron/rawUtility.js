// Require filesytem library:
var fs = require('fs');

// RAW utility:
var RawUtility = function(ctx) {

    // Save properties:
    this.ctx          = ctx;
    this.currentFrame = 0;
    this.videoFrames  = 3;

    // Initialize:
    this.init = function(options) {

        // Process properties:
        this.videoWidth   = options.width     || this.videoWidth;
        this.videoHeight  = options.height    || this.videoHeight;
        this.frameRate    = options.frameRate || this.frameRate;
        this.fileName     = options.file      || this.fileName;
        this.useYUV       = this.fileName.endsWith('.yuv');
        this.frameSize    = this.useYUV ? (this.videoWidth * this.videoHeight * 3 / 2) : (this.videoWidth * this.videoHeight * 3);

        // Get size:
        this.videoFrames  = Math.floor(fs.statSync(this.fileName).size / this.frameSize);
        this.currentFrame = 0;

        // Open file:
        this.fd = fs.openSync(this.fileName, 'r');
        console.log("Opened video file with " + this.videoFrames + " frames. ");

        // Show first frame:
        this.showFrame(1)

    }

    // Show frame:
    this.showFrame = function(frame) {

        // Make sure the requested frame is in bound:
        if (frame < 1) frame = 1;
        if (frame > this.videoFrames) frame = this.videoFrames;

        // Do nothing if already shown:
        // if (this.currentFrame == frame) return;

        // Set current frame:
        this.currentFrame = frame;

        // Read frame data:
        var buffer = new Buffer(this.frameSize); // TODO: is this a must?
        fs.read(this.fd, buffer, 0, buffer.length, (frame - 1) * this.frameSize, (err, bytesRead, data) => {

            // Error in reading data:
            if (err) throw err;

            // Allocate image data:
            var x = new Uint8ClampedArray(this.videoWidth * this.videoHeight * 4);

            // Arrange & show YUV:
            if (this.useYUV) {
                var res  = this.videoWidth * this.videoHeight;
                var hlin = Math.floor(this.videoWidth / 2);
                var qres = hlin * Math.floor(this.videoHeight / 2);
                for (i = 0; i < this.videoHeight / 2; i++) {
                    for (j = 0; j < this.videoWidth / 2; j++) {
                        var uvbase = res + i * hlin + j;
                        var U = data[uvbase + qres] - 128;
                        var V = data[uvbase] - 128;

                        var base = (2 * i) * this.videoWidth + (2 * j);
                        var Y = data[base];
                        base = 4 * base;
                        x[base + 0] = Math.round(Y + 1.40200 * U);
                        x[base + 1] = Math.round(Y - 0.34414 * V - 0.71414 * U)
                        x[base + 2] = Math.round(Y + 1.77200 * V)
                        x[base + 3] = 255;

                        base = (2 * i) * this.videoWidth + (2 * j + 1);
                        Y = data[base];
                        base = 4 * base;
                        x[base + 0] = Math.round(Y + 1.40200 * U);
                        x[base + 1] = Math.round(Y - 0.34414 * V - 0.71414 * U)
                        x[base + 2] = Math.round(Y + 1.77200 * V)
                        x[base + 3] = 255;

                        base = (2 * i + 1) * this.videoWidth + (2 * j);
                        Y = data[base];
                        base = 4 * base;
                        x[base + 0] = Math.round(Y + 1.40200 * U);
                        x[base + 1] = Math.round(Y - 0.34414 * V - 0.71414 * U)
                        x[base + 2] = Math.round(Y + 1.77200 * V)
                        x[base + 3] = 255;

                        base = (2 * i + 1) * this.videoWidth + (2 * j + 1);
                        Y = data[base];
                        base = 4 * base;
                        x[base + 0] = Math.round(Y + 1.40200 * U);
                        x[base + 1] = Math.round(Y - 0.34414 * V - 0.71414 * U)
                        x[base + 2] = Math.round(Y + 1.77200 * V)
                        x[base + 3] = 255;
                    }
                }
            }

            // Arrange & show RGB:
            else {
                for (i = 0, j = 0; i < this.videoWidth * this.videoHeight * 4; i++) {
                    if (i % 4 == 3) {
                        x[i] = 255;
                    } else {
                        x[i] = data[j];
                        j++;
                    }
                }
            }

            // Create image data object:
            var data = new ImageData(x, this.videoWidth, this.videoHeight);

            // Draw frame:
            this.ctx.putImageData(data, 0, 0);

        });

    }

    // Close:
    this.close = function() {
        if (this.fd) fs.closeSync(this.fd);
    }

    // Crop:
    this.crop = function(startFrame, endFrame) {

        // Make sure arguments are numbers:
        startFrame = parseInt(startFrame);
        endFrame   = parseInt(endFrame);

        // Open file for write:
        var fd_new = fs.openSync(this.fileName + '.tmp', 'w+');

        // Allocate buffer:
        var buffer = new Buffer(this.frameSize);

        // Move relevant data to start of file:
        for (frame = startFrame; frame <= endFrame; frame++) {

            // Read frame:
            fs.readSync(this.fd, buffer, 0, buffer.length, (frame - 1) * this.frameSize);

            // Write frame:
            fs.writeSync(fd_new, buffer, 0, buffer.length, (frame - startFrame) * this.frameSize);

        }

        // Close both files:
        fs.closeSync(this.fd);
        fs.closeSync(fd_new);

        // Overwrite file:
        fs.renameSync(this.fileName + '.tmp', this.fileName);

        // Re-init:
        this.init({});

    }

};