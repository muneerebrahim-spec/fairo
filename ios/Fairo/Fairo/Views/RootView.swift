import SwiftData
import SwiftUI

enum FlowRoute: Hashable {
    case capture
    case correctionMode
    case reviewStepThrough
    case reviewFullList
    case adjustment(UUID)
    case participants
    case splitMode
    case assignItems
    case reconciliation
    case tip
    case percentageSplit
    case summary(readonly: Bool, splitId: UUID?)
}

struct RootView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var model = SplitFlowViewModel()
    @State private var path: [FlowRoute] = []

    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        NavigationStack(path: $path) {
            HomeView(path: $path)
                .navigationDestination(for: FlowRoute.self) { route in
                    switch route {
                    case .capture:
                        CaptureView(path: $path)
                    case .correctionMode:
                        CorrectionModeView(path: $path)
                    case .reviewStepThrough:
                        ReviewStepThroughView(path: $path)
                    case .reviewFullList:
                        ReviewFullListView(path: $path)
                    case .adjustment(let id):
                        AdjustmentPromptView(adjustmentId: id, path: $path)
                    case .participants:
                        ParticipantsView(path: $path)
                    case .splitMode:
                        SplitModeView(path: $path)
                    case .assignItems:
                        AssignItemsView(path: $path)
                    case .reconciliation:
                        ReconciliationView(path: $path)
                    case .tip:
                        TipView(path: $path)
                    case .percentageSplit:
                        PercentageSplitView(path: $path)
                    case .summary(let readonly, _):
                        SummaryView(path: $path, readonly: readonly)
                    }
                }
        }
        .environment(model)
        .background(theme.background.ignoresSafeArea())
        .onAppear {
            model.configure(context: modelContext)
        }
    }
}

struct HomeView: View {
    @Binding var path: [FlowRoute]
    @Environment(SplitFlowViewModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Fairo")
                        .font(.system(size: 34, weight: .bold))
                        .foregroundStyle(theme.textPrimary)
                    Text("Split bills fairly")
                        .font(.system(size: 15))
                        .foregroundStyle(theme.textSecondary)
                }
                .padding(.top, 8)

                HeroCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Scan. Assign. Done.")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(.white)
                        Text("Snap a receipt, assign items to friends, and share who owes what.")
                            .font(.system(size: 15))
                            .foregroundStyle(.white.opacity(0.88))
                            .fixedSize(horizontal: false, vertical: true)
                        Button {
                            model.startNewSplit()
                            path.append(.capture)
                        } label: {
                            Text("New Split")
                                .font(.system(size: 16, weight: .semibold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 15)
                                .background(Color.white)
                                .foregroundStyle(theme.accentDeep)
                                .clipShape(RoundedRectangle(cornerRadius: FairoTheme.buttonRadius, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        .padding(.top, 4)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                Text("HISTORY")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(theme.textSecondary)
                    .tracking(0.8)

                if model.history.isEmpty {
                    FairoCard {
                        VStack(alignment: .leading, spacing: 8) {
                            Image(systemName: "clock.arrow.circlepath")
                                .font(.title2)
                                .foregroundStyle(theme.textSecondary)
                            Text("No saved splits yet")
                                .font(.headline)
                                .foregroundStyle(theme.textPrimary)
                            Text("Scan a receipt to get started.")
                                .foregroundStyle(theme.textSecondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                } else {
                    ForEach(model.history) { split in
                        Button {
                            model.activeSplit = split
                            path.append(.summary(readonly: true, splitId: split.id))
                        } label: {
                            FairoCard {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(split.title)
                                            .font(.system(size: 17, weight: .semibold))
                                            .foregroundStyle(theme.textPrimary)
                                        Text(split.date.formatted(date: .abbreviated, time: .omitted))
                                            .font(.system(size: 14))
                                            .foregroundStyle(theme.textSecondary)
                                        Text("\(split.participants.count) people · \(ReconciliationService.activeItems(split).count) items")
                                            .font(.caption)
                                            .foregroundStyle(theme.textSecondary)
                                    }
                                    Spacer()
                                    Text(MoneyService.format(split.total, currencyCode: split.currencyCode))
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundStyle(theme.accentDeep)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(20)
        }
        .background(theme.background)
        .navigationBarHidden(true)
    }
}
