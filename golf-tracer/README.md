# Golf Tracer

iOS app that detects and draws the trajectory of a golf ball in video, like the
shot-tracer overlays seen on golf broadcasts. Personal-use, free, sideloaded.

## How it works

1. Pick a video from Photos (taken with iPhone, ideally 1080p @ 240fps slow-mo).
2. The app runs Apple's `VNDetectTrajectoriesRequest` (Vision framework) frame
   by frame to find parabolic motion that matches a golf ball's flight.
3. Detected trajectories are drawn as a glowing line overlay on top of the
   video player.
4. (Future) Export the composited video back to Photos.

`VNDetectTrajectoriesRequest` is purpose-built by Apple for ball-tracking and
runs entirely on-device. It works best against uncluttered backgrounds (sky,
fairway). For shots that fail to auto-detect, a future "tap three frames" mode
will fit a parabola from manual taps.

## Requirements

- macOS with Xcode 15 or later
- iPhone running iOS 17+ (iPhone 11 Pro Max and iPhone 15 both qualify)
- Apple ID for free sideload (no paid Developer account needed for personal use)

## Getting started

See [SETUP.md](SETUP.md) for the full Xcode-project creation steps.

## Project layout

```
GolfTracer/
  GolfTracerApp.swift        @main entry point
  ContentView.swift          Root view: pick video → process → tracer view
  Models/
    Movie.swift              Transferable wrapper for PhotosPicker video import
  ViewModels/
    VideoProcessor.swift     Reads frames, runs Vision, publishes trajectories
  Views/
    TracerView.swift         AVPlayer + tracer overlay + progress
    TracerOverlay.swift      Canvas drawing of detected trajectories
```
