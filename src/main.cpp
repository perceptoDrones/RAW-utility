#include <stdio.h>
#include <fstream>
#include <iostream>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/highgui/highgui.hpp>

using namespace std;
using namespace cv;

enum running_e {PLAY, PAUSE, STOP};

const unsigned int FPS = 30;

class yuvReader {

public:

    // Constructor: 
    yuvReader(const char * filePath, int width = 640, int height = 480) {
        videoWidth  = width;
        videoHeight = height;
        frameSize = width * height * 3 / 2;
        yuvIstr.open(filePath, ios::binary | ios::ate);
        
        if (!yuvIstr.good()) {
            cerr << "Error: Unable to open video file: " << filePath << endl;
            return; 
        }

        videoFrames = yuvIstr.tellg() / frameSize;
        cout << "Opened YUV video file with " << videoFrames << " frames. " << endl; 
        currentFrame = -100;
        barFrame = 0;
        namedWindow("Video", 1);
        createTrackbar("Seek", "Video", &barFrame, videoFrames - 1, onTrackbar, this); 
        showFrame(0);
    }

    // Show frame:
    void showFrame(long frame) {

        // Make sure the requested frame is in bound: 
        if (frame < 0) frame = 0;
        if (frame >= videoFrames) frame = videoFrames - 1;
        
        // Do nothing if already shown:
        if (currentFrame == frame) return;

        // Seek frame (if not already there):
        // if (currentFrame + 1 != frame) {
            yuvIstr.seekg(frame * frameSize, ios_base::beg);
        // }

        // Read data: 
        char data[(int)frameSize];
        yuvIstr.read(data, frameSize);
        
        // Check that all is good: 
        if (!yuvIstr.good()) {
            cerr << "Error in reading frame #" << frame << " (" << frame * frameSize << "). " << endl;
            return; 
        }

        // Arrange data:
        cv::Mat mat(480, 640, CV_8UC3);
        for (int i = 0; i < videoHeight; i++) {
            for (int j = 0; j < videoWidth; j++) {
                cv::Vec3b YUV;
                YUV[0] = data[i*videoWidth+j];
                YUV[2] = data[videoWidth * videoHeight +                                        (i / 2) * (videoWidth / 2) + (j / 2)];
                YUV[1] = data[videoWidth * videoHeight + (videoWidth / 2) * (videoHeight / 2) + (i / 2) * (videoWidth / 2) + (j / 2)];
                mat.at<cv::Vec3b>(i, j) = YUV;
            }
        }

        // Convert color:
        cvtColor(mat, mat, CV_YUV2BGR);
        
        // Show image:
        imshow("Video", mat); 

        // Set seek bar:
        setTrackbarPos("Seek", "Video", frame); 
        
        // Set shown frame:
        currentFrame = frame;

    }

    inline long getFrame() { 
        return currentFrame; 
    }

    inline long nextFrame() {
        return currentFrame + 1;
    }

    inline long prevFrame() {
        return currentFrame - 1;
    }

    inline bool lastFrame() {
        return currentFrame == videoFrames - 1;
    }

    inline bool sourceGood() {
        return yuvIstr.good();
    }

private: 

    static void onTrackbar(int, void * This) {
        ((yuvReader *)This)->onTrackbarNonStatic();        
    }

    void onTrackbarNonStatic() {
        showFrame(barFrame);
    }

    ifstream yuvIstr;
    unsigned int videoWidth, videoHeight;
    long frameSize; 
    long currentFrame; 
    long videoFrames;
    int barFrame;

}; 


int main(int argc, char* argv[]) {

    // Check input:
    if (argc < 2) {
        cerr << "Missing arguments. " << endl;
        return 1;
    }
    
    // Open file: 
    yuvReader reader(argv[1]); 
    if (!reader.sourceGood()) {
        exit(1);
    }

    // Play file:
    running_e running = PLAY; 
    while (running != STOP) {

        // Pause if at the end of the video: 
        if (reader.lastFrame()) {
            running = PAUSE; 
        }

        // Next frame: 
        if (running == PLAY) reader.showFrame(reader.nextFrame());

        // Check user key:
        int key = waitKey(running == PAUSE ? 0 : int(1000 / FPS));

        switch (key) {

            // Nothing: 
            case -1 : 
                break;

            // 'q': 
            case 113 : 
                running = STOP; 
                break; 

            // ESC: 
            case 27 : 
                running = STOP;
                break;

            // SPACE:
            case 32 : 
                if      (running == PLAY)  running = PAUSE;
                else if (running == PAUSE) running = PLAY;
                break; 

            // Right arrow:
            case 65363 : 
                reader.showFrame(reader.nextFrame());
                break;

            // Right arrow:
            case 46 : 
                reader.showFrame(reader.nextFrame()); 
                break;

            // Left arrow: 
            case 65361 : 
                reader.showFrame(reader.prevFrame()); 
                break;

            // Left arrow: 
            case 44 : 
                reader.showFrame(reader.prevFrame()); 
                break;

            // Other:
            default:
                cout << "Unidentified key detected: " << key << endl;
                break;

        }

    }

}
