import SwiftData
import SwiftUI

@main
struct FairoApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(for: [SavedPersonEntity.self, PersistedSplitEntity.self])
    }
}
