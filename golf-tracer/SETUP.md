# Setup

These steps assume Xcode is installed and you have a free Apple ID.

## 1. Create the Xcode project

1. Open Xcode → **File → New → Project…**
2. Choose **iOS → App**, click **Next**.
3. Fill in:
   - Product Name: `GolfTracer`
   - Team: select your Apple ID (add via *Xcode → Settings → Accounts* if missing)
   - Organization Identifier: anything reverse-DNS, e.g. `com.yourname`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage: **None**
   - Include Tests: optional
4. Save into your local clone of the `golf-tracer` repo. Xcode will create a
   `GolfTracer/` folder containing `GolfTracerApp.swift`, `ContentView.swift`,
   `Assets.xcassets`, etc.

## 2. Drop in the scaffolded source

Replace Xcode's auto-generated `GolfTracerApp.swift` and `ContentView.swift`
with the versions from this scaffold, and add the new files (`Movie.swift`,
`VideoProcessor.swift`, `TracerView.swift`, `TracerOverlay.swift`).

In Xcode's Project Navigator, right-click the `GolfTracer` group → **Add Files
to "GolfTracer"…** → select the files. Make sure **"Copy items if needed"** is
unchecked if you've already placed them on disk in the right location.

Group them into `Models/`, `ViewModels/`, `Views/` folders inside Xcode for
organization (right-click → New Group → drag files in).

## 3. Set deployment target & permissions

1. Select the project file in the navigator → **GolfTracer** target → **General**:
   - **Minimum Deployments → iOS 17.0**
2. Switch to the **Info** tab and add a new key:
   - Key: **Privacy - Photo Library Usage Description**
     (`NSPhotoLibraryUsageDescription`)
   - Value: `Pick a golf swing video to add a tracer line.`

## 4. Sign for sideload (free)

1. Project → target **GolfTracer** → **Signing & Capabilities**.
2. Check **Automatically manage signing**.
3. Team: select your Personal Team (your Apple ID).
4. Bundle Identifier must be unique — Xcode will warn if not. Use something
   like `com.yourname.golftracer`.

## 5. Run on your iPhone

1. Plug the iPhone into the iMac with a Lightning/USB-C cable.
2. On the iPhone: trust the computer when prompted.
3. In Xcode, top toolbar → device dropdown → select your iPhone (not a simulator).
4. Press **Run** (⌘R). First build takes a minute.
5. On the iPhone the first time: **Settings → General → VPN & Device Management
   → [your Apple ID] → Trust**. Then re-launch the app.
6. After install, you can unplug; Xcode can re-deploy wirelessly while the
   iPhone is on the same Wi-Fi.

## 6. Refresh every 7 days

Free-tier signed apps expire after 7 days. To keep using:

- Plug the iPhone back in, hit **Run** in Xcode again. Done.

## Capture tips for best detection

- Shoot **1080p @ 240fps slow-mo** (Camera app → Slo-Mo).
- Frame the camera so the ball flight stays in view (tripod helps).
- Plain background is best: sky, single-colour wall, even fairway.
- The first 1–2 seconds of flight detect most reliably.

## Common gotchas

- **No trajectories detected.** Background too cluttered, or ball never moves
  in a clean parabola within frame. Re-record from further back so more of the
  arc is visible. A future manual-tap mode will help here.
- **"Could not launch ..." after 7 days.** Re-run from Xcode.
- **Bundle identifier already in use.** Change it to something globally unique.
