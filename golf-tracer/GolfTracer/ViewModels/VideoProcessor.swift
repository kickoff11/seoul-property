import AVFoundation
import CoreMedia
import Foundation
import Vision

struct DetectedTrajectory: Identifiable, Hashable {
    let id: UUID
    let normalizedPoints: [CGPoint]
    let confidence: Float
}

@MainActor
final class VideoProcessor: ObservableObject {
    @Published private(set) var progress: Double = 0
    @Published private(set) var trajectories: [DetectedTrajectory] = []
    @Published private(set) var displaySize: CGSize = .zero
    @Published private(set) var isProcessing: Bool = false
    @Published private(set) var error: String?

    private var task: Task<Void, Never>?

    func process(url: URL) {
        cancel()
        task = Task { [weak self] in await self?.run(url: url) }
    }

    func cancel() {
        task?.cancel()
        task = nil
    }

    private func run(url: URL) async {
        isProcessing = true
        progress = 0
        trajectories = []
        error = nil
        defer { isProcessing = false }

        do {
            let asset = AVURLAsset(url: url)
            let (duration, videoTracks) = try await (
                asset.load(.duration),
                asset.loadTracks(withMediaType: .video)
            )
            guard let track = videoTracks.first else {
                error = "Video has no video track."
                return
            }
            let videoComposition = try await AVMutableVideoComposition
                .videoComposition(withPropertiesOf: asset)
            displaySize = videoComposition.renderSize

            let reader = try AVAssetReader(asset: asset)
            let output = AVAssetReaderVideoCompositionOutput(
                videoTracks: [track],
                videoSettings: [
                    kCVPixelBufferPixelFormatTypeKey as String:
                        kCVPixelFormatType_32BGRA
                ]
            )
            output.videoComposition = videoComposition
            output.alwaysCopiesSampleData = false
            guard reader.canAdd(output) else {
                error = "Cannot read this video format."
                return
            }
            reader.add(output)
            guard reader.startReading() else {
                error = reader.error?.localizedDescription
                    ?? "Could not start reading the video."
                return
            }

            let request = VNDetectTrajectoriesRequest(
                frameAnalysisSpacing: .zero,
                trajectoryLength: 5
            ) { _, _ in }
            request.objectMinimumNormalizedRadius = 0.002
            request.objectMaximumNormalizedRadius = 0.05

            var collected: [UUID: VNTrajectoryObservation] = [:]
            let totalSeconds = duration.seconds

            while !Task.isCancelled, reader.status == .reading {
                guard let buffer = output.copyNextSampleBuffer() else { break }
                let pts = CMSampleBufferGetPresentationTimeStamp(buffer)
                let handler = VNImageRequestHandler(
                    cmSampleBuffer: buffer,
                    options: [:]
                )
                try? handler.perform([request])
                for obs in request.results ?? [] {
                    collected[obs.uuid] = obs
                }
                if totalSeconds.isFinite, totalSeconds > 0 {
                    progress = min(1, max(0, pts.seconds / totalSeconds))
                }
            }

            if Task.isCancelled { return }
            progress = 1
            trajectories = collected.values
                .filter { $0.detectedPoints.count >= 5 }
                .sorted { $0.confidence > $1.confidence }
                .map { obs in
                    DetectedTrajectory(
                        id: obs.uuid,
                        normalizedPoints: obs.detectedPoints.map { p in
                            CGPoint(x: p.x, y: 1 - p.y)
                        },
                        confidence: obs.confidence
                    )
                }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
