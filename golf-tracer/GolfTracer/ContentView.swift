import SwiftUI
import PhotosUI

struct ContentView: View {
    @State private var pickedItem: PhotosPickerItem?
    @State private var videoURL: URL?
    @State private var importError: String?

    var body: some View {
        NavigationStack {
            Group {
                if let videoURL {
                    TracerView(videoURL: videoURL) {
                        self.videoURL = nil
                        self.pickedItem = nil
                    }
                } else {
                    landing
                }
            }
            .navigationTitle("Golf Tracer")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onChange(of: pickedItem) { _, newItem in
            guard let newItem else { return }
            Task { await importVideo(newItem) }
        }
        .alert("Could not load video",
               isPresented: Binding(get: { importError != nil },
                                    set: { if !$0 { importError = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(importError ?? "")
        }
    }

    private var landing: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "figure.golf")
                .font(.system(size: 64))
                .foregroundStyle(.green)
            Text("Pick a golf swing video to draw the ball trajectory.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 40)
            PhotosPicker(selection: $pickedItem, matching: .videos) {
                Label("Choose Video", systemImage: "video.badge.plus")
                    .font(.headline)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(.tint, in: .capsule)
                    .foregroundStyle(.white)
            }
            Text("Tip: 1080p slo-mo with a clear sky/background works best.")
                .font(.footnote)
                .foregroundStyle(.tertiary)
                .padding(.horizontal, 40)
                .multilineTextAlignment(.center)
            Spacer()
        }
    }

    private func importVideo(_ item: PhotosPickerItem) async {
        do {
            guard let movie = try await item.loadTransferable(type: Movie.self) else {
                importError = "The selected item was not a video."
                return
            }
            videoURL = movie.url
        } catch {
            importError = error.localizedDescription
        }
    }
}

#Preview {
    ContentView()
}
