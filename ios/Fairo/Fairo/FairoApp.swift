import SwiftData
import SwiftUI

@main
struct FairoApp: App {
    private let modelContainer: ModelContainer

    init() {
        do {
            modelContainer = try ModelContainer(
                for: SavedPersonEntity.self, PersistedSplitEntity.self
            )
        } catch {
            fatalError("Failed to create SwiftData container: \(error.localizedDescription)")
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(modelContainer)
    }
}
