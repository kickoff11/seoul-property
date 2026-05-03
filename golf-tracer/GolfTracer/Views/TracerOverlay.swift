import SwiftUI

struct TracerOverlay: View {
    let trajectories: [DetectedTrajectory]

    var body: some View {
        Canvas { ctx, size in
            for traj in trajectories {
                let pts = traj.normalizedPoints.map {
                    CGPoint(x: $0.x * size.width, y: $0.y * size.height)
                }
                guard pts.count >= 2 else { continue }
                var path = Path()
                path.move(to: pts[0])
                for p in pts.dropFirst() { path.addLine(to: p) }

                var glow = ctx
                glow.addFilter(.blur(radius: 8))
                glow.stroke(
                    path,
                    with: .color(.yellow.opacity(0.6)),
                    lineWidth: 10
                )
                ctx.stroke(
                    path,
                    with: .color(.yellow),
                    style: StrokeStyle(
                        lineWidth: 3,
                        lineCap: .round,
                        lineJoin: .round
                    )
                )
            }
        }
    }
}
