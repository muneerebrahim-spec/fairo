import SwiftData
import SwiftUI

@main
struct FairoApp: App {
    private let modelContainer: ModelContainer

    init() {
        let schema = Schema([SavedPersonEntity.self, PersistedSplitEntity.self])
        do {
            modelContainer = try ModelContainer(for: schema)
        } catch {
            // Fall back to in-memory storage so the app still launches.
            let memory = ModelConfiguration(isStoredInMemoryOnly: true)
            modelContainer = try! ModelContainer(for: schema, configurations: memory)
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(modelContainer)
    }
}
