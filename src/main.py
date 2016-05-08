#!/usr/bin/python

# Import libraries: 
import numpy as np
import cv2
import sys
from enum import Enum


# State enum:
class state(Enum):
    PLAY  = 1
    PAUSE = 2
    STOP  = 3


# YUV Reader class:
class yuvReader:

    # Constructor:
    def __init__(self, fileName, videoWidth = 640, videoHeight = 480, frameRate = 30): 
        self.videoWidth  = videoWidth
        self.videoHeight = videoHeight
        self.frameRate   = frameRate
        self.useYUV      = fileName.endswith(".yuv")
        if (self.useYUV):
            self.frameSize   = videoWidth * videoHeight * 3 / 2
        else:
            self.frameSize   = videoWidth * videoHeight * 3
        self.file = open(fileName, "rb")
        self.file.seek(0, 2)
        self.videoFrames = self.file.tell() / self.frameSize
        self.currentFrame = self.videoFrames - 1
        print "Opened video file with", self.videoFrames, "frames. "
        cv2.namedWindow('Video')
        cv2.createTrackbar('Seek', 'Video', 0, self.videoFrames - 1, self.onTrackbar)
        self.showFrame(0)

    # Show frame:
    def showFrame(self, frame):

        # Make sure the requested frame is in bound: 
        if frame < 0:
            frame = 0
        elif frame >= self.videoFrames:
            frame = self.videoFrames - 1
        
        # Do nothing if already shown:
        if self.currentFrame == frame:
            return

        # Seek frame (if not already there):
        if self.currentFrame + 1 != frame:
            self.file.seek(frame * self.frameSize, 0)
        
        # Read data:
        data = np.fromstring(self.file.read(self.frameSize), dtype=np.uint8)
        
        # Decode & show YUV:
        if (self.useYUV):

            # Split to channels: 
            (Y1, Y2, UV) = np.split(data, 3)
            Y = np.concatenate((Y1, Y2))
            (U, V) = np.split(UV,   2)

            # Re-arrange:
            Y = np.reshape(Y, (self.videoHeight, self.videoWidth))
            U = np.repeat(U, 2, 0)
            U = np.reshape(U, (self.videoHeight / 2, self.videoWidth))
            U = np.repeat(U, 2, 0)
            V = np.repeat(V, 2, 0)
            V = np.reshape(V, (self.videoHeight / 2, self.videoWidth))
            V = np.repeat(V, 2, 0)

            # Stack & convert color:
            rgbFrame = cv2.cvtColor(np.dstack((Y,U,V)), cv2.COLOR_YUV2RGB)

            # Show image: 
            cv2.imshow('Video', rgbFrame)

        # Decode & show RGB:
        else:

            # Stack & convert color:
            rgbFrame = np.reshape(data, (self.videoHeight, self.videoWidth, 3))

            # Convert color:
            rgbFrame = cv2.cvtColor(rgbFrame, cv2.COLOR_RGB2BGR)

            # Show image: 
            print rgbFrame.shape
            cv2.imshow('Video', rgbFrame)


        # Set current frame:
        self.currentFrame = frame

        # Set seek bar:
        cv2.setTrackbarPos("Seek", "Video", frame)

    # Check if last frame: 
    def lastFrame(self):
        return self.currentFrame == self.videoFrames - 1

    # Next frame: 
    def nextFrame(self):
        return self.currentFrame + 1

    # Previous frame:
    def prevFrame(self):
        return self.currentFrame - 1

    # On trackbar change:
    def onTrackbar(self, frame):
        self.showFrame(frame)
        pass


# Main:
def main():

    # Check arguments: 
    if len(sys.argv) < 2:
        print "Missing arguments. "
        sys.exit(1) 

    # Open YUV reader: 
    reader = yuvReader(sys.argv[1])

    # Play video:
    running = state.PLAY
    while (running is not state.STOP): 

        # Pause if at the end of the video: 
        if reader.lastFrame(): 
            running = state.PAUSE

        # Next frame: 
        if (running is state.PLAY):
            reader.showFrame(reader.nextFrame())

        # Check user key:
        key = -1
        if (running is state.PAUSE):
            key = cv2.waitKey(0)
        else:
            key = cv2.waitKey(1000 / reader.frameRate)


        # Stop (q or ESC):
        if key == ord('q') or key == 27:
            running = state.STOP

        # Pause/Resume (SPACE):
        elif key == 32:
            if (running is state.PLAY):
                running = state.PAUSE
            elif (running is state.PAUSE):
                running = state.PLAY

        # Next frame (right arrow or >):
        elif key == 46 or key == 65363:
            reader.showFrame(reader.nextFrame())

        # Previous frame (left arrow or <):
        elif key == 44 or key == 65361:
            reader.showFrame(reader.prevFrame())

        # Show unidentified keys:
        elif key != -1:
            print "Unidentified key detected: ", key

    # Close window: 
    cv2.destroyAllWindows()


# Run main:
if __name__ == "__main__":
    main()
