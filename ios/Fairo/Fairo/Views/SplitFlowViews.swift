import SwiftUI

struct ParticipantsView: View {
    @Binding var path: [FlowRoute]
    @Environment(SplitFlowViewModel.self) private var model
    @State private var name = ""
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Who's splitting?").font(.title2.bold())
                HStack {
                    TextField("Name", text: $name)
                        .textFieldStyle(.roundedBorder)
                    Button("Add") {
                        model.addParticipant(name: name)
                        name = ""
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(theme.accentDeep)
                }

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 72))], spacing: 16) {
                    ForEach(model.activeSplit?.participants ?? []) { p in
                        VStack(spacing: 6) {
                            AvatarView(name: p.displayName, colorHex: p.avatarColorHex)
                            Text(p.displayName).font(.caption).lineLimit(1)
                        }
                    }
                }

                FairoPrimaryButton(title: "Continue") {
                    path.append(.splitMode)
                }
                .disabled((model.activeSplit?.participants.count ?? 0) == 0)
                .opacity((model.activeSplit?.participants.count ?? 0) == 0 ? 0.5 : 1)
            }
            .padding(20)
        }
        .background(theme.background)
        .navigationTitle("Participants")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct SplitModeView: View {
    @Binding var path: [FlowRoute]
    @Environment(SplitFlowViewModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        VStack(spacing: 16) {
            modeCard(title: "By Item", subtitle: "Assign each line item to people.") {
                model.updateSplit { $0.splitMode = .byItem }
                path.append(.assignItems)
            }
            modeCard(title: "Even", subtitle: "Split the total equally.", secondary: true) {
                model.updateSplit { $0.splitMode = .even }
                path.append(.tip)
            }
            modeCard(title: "Percentage", subtitle: "Custom % per person.", secondary: true) {
                model.updateSplit { $0.splitMode = .percentage }
                path.append(.percentageSplit)
            }
            Spacer()
        }
        .padding(20)
        .background(theme.background)
        .navigationTitle("Split mode")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func modeCard(title: String, subtitle: String, secondary: Bool = false, action: @escaping () -> Void) -> some View {
        FairoCard {
            VStack(alignment: .leading, spacing: 12) {
                Text(title).font(.headline)
                Text(subtitle).foregroundStyle(theme.textSecondary)
                FairoPrimaryButton(title: title, secondary: secondary, action: action)
            }
        }
    }
}

struct AssignItemsView: View {
    @Binding var path: [FlowRoute]
    @Environment(SplitFlowViewModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Assign items").font(.title2.bold())
                    Text("Tap an item, then tap people below.")
                        .foregroundStyle(theme.textSecondary)

                    if let split = model.activeSplit {
                        ForEach(ReconciliationService.activeItems(split)) { item in
                            Button {
                                model.selectedItemId = item.id
                            } label: {
                                LineItemRowView(
                                    item: item,
                                    split: split,
                                    selected: model.selectedItemId == item.id
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(20)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("ASSIGN TO")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(theme.textSecondary)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(model.activeSplit?.participants ?? []) { p in
                            Button {
                                model.toggleAssignment(participantId: p.id)
                            } label: {
                                VStack(spacing: 6) {
                                    AvatarView(
                                        name: p.displayName,
                                        colorHex: p.avatarColorHex,
                                        selected: isAssigned(p.id)
                                    )
                                    Text(p.displayName).font(.caption2).lineLimit(1)
                                }
                                .frame(width: 64)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(theme.card)
            .overlay(alignment: .top) { Divider() }

            FairoPrimaryButton(title: "Continue") {
                model.runReconciliation()
                if case .balanced = model.activeSplit?.reconciliationStatus {
                    path.append(.tip)
                } else {
                    path.append(.reconciliation)
                }
            }
            .padding(20)
        }
        .background(theme.background)
        .navigationTitle("Assign items")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if model.selectedItemId == nil {
                model.selectedItemId = model.activeSplit.flatMap { ReconciliationService.activeItems($0).first?.id }
            }
        }
    }

    private func isAssigned(_ participantId: UUID) -> Bool {
        guard let itemId = model.selectedItemId,
              let item = model.activeSplit?.items.first(where: { $0.id == itemId }) else { return false }
        return item.assignedShares.contains { $0.participantId == participantId }
    }
}

struct ReconciliationView: View {
    @Binding var path: [FlowRoute]
    @Environment(SplitFlowViewModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Almost balanced").font(.title2.bold())
            if let split = model.activeSplit {
                FairoCard {
                    ForEach(ReconciliationService.unassignedItems(split)) { item in
                        Text("• \(item.name) — \(MoneyService.format(item.lineTotal, currencyCode: split.currencyCode))")
                            .foregroundStyle(theme.textSecondary)
                    }
                }
                FairoPrimaryButton(title: "Split evenly across everyone") {
                    model.resolveEvenly()
                    if case .balanced = model.activeSplit?.reconciliationStatus {
                        path.append(.tip)
                    }
                }
                FairoPrimaryButton(title: "Back to assign items", secondary: true) {
                    path.removeLast()
                }
            }
            Spacer()
        }
        .padding(20)
        .background(theme.background)
        .navigationTitle("Reconcile")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct PercentageSplitView: View {
    @Binding var path: [FlowRoute]
    @Environment(SplitFlowViewModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        VStack(spacing: 12) {
            if let split = model.activeSplit {
                Text("Total allocated: \(TipCalculatorService.percentageSum(split))%")
                    .foregroundStyle(theme.textSecondary)
                ForEach(split.participants) { p in
                    FairoCard {
                        HStack {
                            Text(p.displayName)
                            Spacer()
                            Stepper(
                                "\(Int(truncating: (split.percentageAllocations[p.id] ?? 0) as NSDecimalNumber))%",
                                onIncrement: { adjust(p.id, by: 5) },
                                onDecrement: { adjust(p.id, by: -5) }
                            )
                        }
                    }
                }
                FairoPrimaryButton(title: "Continue") {
                    path.append(.tip)
                }
                .disabled(abs(TipCalculatorService.percentageSum(split) - 100) > 0.01)
            }
            Spacer()
        }
        .padding(20)
        .background(theme.background)
        .navigationTitle("Percentages")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func adjust(_ id: UUID, by delta: Int) {
        model.updateSplit { split in
            let current = split.percentageAllocations[id] ?? 0
            split.percentageAllocations[id] = max(0, min(100, current + Decimal(delta)))
        }
    }
}

struct TipView: View {
    @Binding var path: [FlowRoute]
    @Environment(SplitFlowViewModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                if let split = model.activeSplit {
                    HStack {
                        ForEach([0, 10, 15, 20], id: \.self) { pct in
                            Button("\(pct == 0 ? "None" : "\(pct)%")") {
                                model.updateSplit { s in
                                    if pct == 0 { s.tip.mode = .none }
                                    else {
                                        s.tip.mode = .percentage
                                        s.tip.percentage = Decimal(pct)
                                    }
                                }
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                    FairoCard {
                        Text("Tip: \(MoneyService.format(TipCalculatorService.tipAmount(for: split), currencyCode: split.currencyCode))")
                            .font(.title3.bold())
                    }
                    ForEach(TipCalculatorService.totals(for: split)) { pt in
                        FairoCard {
                            HStack {
                                Text(pt.displayName)
                                Spacer()
                                Text(MoneyService.format(pt.total, currencyCode: split.currencyCode))
                                    .font(.headline)
                            }
                        }
                    }
                    FairoPrimaryButton(title: "View summary") {
                        path.append(.summary(readonly: false, splitId: nil))
                    }
                }
            }
            .padding(20)
        }
        .background(theme.background)
        .navigationTitle("Tip")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct SummaryView: View {
    @Binding var path: [FlowRoute]
    let readonly: Bool
    @Environment(SplitFlowViewModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if let split = model.activeSplit {
                    HeroCard {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Total").font(.subheadline.weight(.semibold)).foregroundStyle(.white.opacity(0.85))
                            Text(MoneyService.format(split.total + TipCalculatorService.tipAmount(for: split), currencyCode: split.currencyCode))
                                .font(.system(size: 36, weight: .bold))
                                .foregroundStyle(.white)
                            Text("\(split.title) · \(split.date.formatted(date: .abbreviated, time: .omitted))")
                                .foregroundStyle(.white.opacity(0.85))
                            if case .balanced = split.reconciliationStatus {
                                PopBadge(label: "Balanced")
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    ForEach(ReconciliationService.activeItems(split)) { item in
                        LineItemRowView(item: item, split: split)
                    }

                    ForEach(TipCalculatorService.totals(for: split)) { pt in
                        FairoCard {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(pt.displayName).font(.headline)
                                Text(MoneyService.format(pt.total, currencyCode: split.currencyCode))
                                    .font(.title2.bold())
                                    .foregroundStyle(theme.accentDeep)
                                Text("items \(MoneyService.format(pt.itemsTotal, currencyCode: split.currencyCode)) + tax \(MoneyService.format(pt.taxShare, currencyCode: split.currencyCode)) + tip \(MoneyService.format(pt.tipShare, currencyCode: split.currencyCode))")
                                    .font(.caption)
                                    .foregroundStyle(theme.textSecondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }

                    ShareLink(item: ShareTextBuilder.build(for: split)) {
                        Text("Share breakdown")
                            .font(.system(size: 16, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(FairoGradient())
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: FairoTheme.buttonRadius, style: .continuous))
                    }

                    if !readonly {
                        FairoPrimaryButton(title: "Save to History") {
                            model.saveToHistory()
                            path.removeAll()
                        }
                        FairoPrimaryButton(title: "Discard", secondary: true) {
                            model.discardSplit()
                            path.removeAll()
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(theme.background)
        .navigationTitle("Summary")
        .navigationBarTitleDisplayMode(.inline)
    }
}
