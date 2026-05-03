import AVKit
import SwiftUI

struct TracerView: View {
    let videoURL: URL
    let onDone: () -> Void

    @StateObject private var processor = VideoProcessor()
    @State private var player: AVPlayer

    init(videoURL: URL, onDone: @escaping () -> Void) {
        self.videoURL = videoURL
        self.onDone = onDone
        _player = State(initialValue: AVPlayer(url: videoURL))
    }

    var body: some View {
        VStack(spacing: 0) {
            VideoPlayer(player: player)
                .aspectRatio(displayAspect, contentMode: .fit)
                .overlay {
                    TracerOverlay(trajectories: processor.trajectories)
                        .allowsHitTesting(false)
                }
                .background(Color.black)

            statusBar
                .frame(maxWidth: .infinity)
                .background(.ultraThinMaterial)
        }
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    onDone()
                } label: {
                    Label("New", systemImage: "chevron.left")
                }
            }
        }
        .onAppear {
            processor.process(url: videoURL)
            player.play()
        }
        .onDisappear {
            processor.cancel()
            player.pause()
        }
    }

    private var displayAspect: CGFloat {
        let s = processor.displaySize
        guard s.width > 0, s.height > 0 else { return 9.0 / 16.0 }
        return s.width / s.height
    }

    @ViewBuilder
    private var statusBar: some View {
        if processor.isProcessing {
            VStack(alignment: .leading, spacing: 6) {
                Text("Detecting trajectory…")
                    .font(.caption)
                ProgressView(value: processor.progress)
            }
            .padding()
        } else if let error = processor.error {
            HStack(spacing: 8) {
                Image(systemName: "xmark.octagon.fill")
                Text(error)
            }
            .font(.caption)
            .foregroundStyle(.red)
            .padding()
        } else {
            HStack(spacing: 8) {
                Image(
                    systemName: processor.trajectories.isEmpty
                        ? "exclamationmark.triangle.fill"
                        : "checkmark.circle.fill"
                )
                Text(
                    processor.trajectories.isEmpty
                        ? "No trajectory found. Try clearer background or slo-mo."
                        : "\(processor.trajectories.count) trajectory\(processor.trajectories.count == 1 ? "" : "ies") detected."
                )
                Spacer()
            }
            .font(.caption)
            .foregroundStyle(processor.trajectories.isEmpty ? .orange : .green)
            .padding()
        }
    }
}
