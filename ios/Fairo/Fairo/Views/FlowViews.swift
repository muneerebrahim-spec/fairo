import SwiftUI

struct CaptureView: View {
    @Binding var path: [FlowRoute]
    @Environment(SplitFlowViewModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    @State private var showScanner = false
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        ZStack {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Scan receipt")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(theme.textPrimary)
                    Text("Capture one or more pages with your camera. We'll read the line items automatically.")
                        .font(.system(size: 15))
                        .foregroundStyle(theme.textSecondary)
                }

                HeroCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Image(systemName: "doc.viewfinder")
                            .font(.system(size: 32, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.9))
                        Text("Point at the receipt")
                            .font(.headline)
                            .foregroundStyle(.white)
                        Text("Good lighting helps OCR accuracy.")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.85))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                FairoPrimaryButton(title: "Scan with Camera") {
                    if DocumentScannerSupport.isAvailable {
                        showScanner = true
                    } else {
                        model.scanError = "Document scanning requires a physical iPhone. Use Sample Receipt in the simulator."
                    }
                }
                .disabled(!DocumentScannerSupport.isAvailable)
                .opacity(DocumentScannerSupport.isAvailable ? 1 : 0.5)

                if !DocumentScannerSupport.isAvailable {
                    Text("Camera scan is unavailable in the simulator — use Sample Receipt below.")
                        .font(.footnote)
                        .foregroundStyle(theme.textSecondary)
                }

                FairoPrimaryButton(title: "Use Sample Receipt", secondary: true) {
                    model.processSampleReceipt()
                    path.append(.correctionMode)
                }

                if let error = model.scanError {
                    FairoCard {
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(theme.pop)
                            Text(error)
                                .font(.subheadline)
                                .foregroundStyle(theme.textSecondary)
                        }
                    }
                }

                Spacer()
            }
            .padding(20)
            .background(theme.background)

            if model.isProcessingReceipt {
                Color.black.opacity(0.35).ignoresSafeArea()
                VStack(spacing: 16) {
                    ProgressView()
                        .tint(.white)
                        .scaleEffect(1.2)
                    Text("Reading receipt…")
                        .font(.headline)
                        .foregroundStyle(.white)
                }
                .padding(28)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            }
        }
        .navigationTitle("New Split")
        .navigationBarTitleDisplayMode(.inline)
        .fullScreenCover(isPresented: $showScanner) {
            DocumentScannerView(
                onComplete: { images in
                    showScanner = false
                    Task {
                        await model.processScannedImages(images)
                        if model.scanError == nil {
                            path.append(.correctionMode)
                        }
                    }
                },
                onCancel: { showScanner = false }
            )
            .ignoresSafeArea()
        }
    }
}

struct CorrectionModeView: View {
    @Binding var path: [FlowRoute]
    @Environment(SplitFlowViewModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("How do you want to review this scan?")
                .font(.title3.bold())
                .foregroundStyle(theme.textPrimary)
            Text("This choice applies to this receipt only.")
                .foregroundStyle(theme.textSecondary)

            if let split = model.activeSplit {
                FairoCard {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(split.title)
                                .font(.headline)
                            Text("\(ReconciliationService.activeItems(split).count) items · \(MoneyService.format(split.total, currencyCode: split.currencyCode))")
                                .font(.subheadline)
                                .foregroundStyle(theme.textSecondary)
                        }
                        Spacer()
                        PopBadge(label: "Scanned")
                    }
                }
            }

            FairoCard {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Review items one at a time").font(.headline)
                    Text("Confirm, edit, or disregard each line.").foregroundStyle(theme.textSecondary)
                    FairoPrimaryButton(title: "Step-through") {
                        model.updateSplit { $0.correctionMode = .stepThrough }
                        path.append(.reviewStepThrough)
                    }
                }
            }

            FairoCard {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Show full list to edit").font(.headline)
                    Text("See every item at once and edit inline.").foregroundStyle(theme.textSecondary)
                    FairoPrimaryButton(title: "Full list edit", secondary: true) {
                        model.updateSplit { $0.correctionMode = .fullListEdit }
                        path.append(.reviewFullList)
                    }
                }
            }
            Spacer()
        }
        .padding(20)
        .background(theme.background)
        .navigationTitle("Review mode")
        .navigationBarTitleDisplayMode(.inline)
    }
}

@MainActor
private func continueAfterReview(path: Binding<[FlowRoute]>, model: SplitFlowViewModel) {
    if let adj = model.nextUnresolvedAdjustment() {
        path.wrappedValue.append(.adjustment(adj.id))
    } else {
        path.wrappedValue.append(.participants)
    }
}

struct ReviewFullListView: View {
    @Binding var path: [FlowRoute]
    @Environment(SplitFlowViewModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ForEach(model.activeSplit?.items ?? []) { item in
                    FairoCard {
                        VStack(alignment: .leading, spacing: 8) {
                            TextField("Name", text: nameBinding(for: item.id))
                            TextField("Total", text: amountBinding(for: item.id))
                                .keyboardType(.decimalPad)
                            Button(item.isDisregarded ? "Restore" : "Disregard") {
                                model.updateSplit { split in
                                    guard let i = split.items.firstIndex(where: { $0.id == item.id }) else { return }
                                    split.items[i].isDisregarded.toggle()
                                }
                            }
                            .foregroundStyle(theme.pop)
                        }
                    }
                }
                FairoPrimaryButton(title: "Continue") {
                    continueAfterReview(path: $path, model: model)
                }
            }
            .padding(20)
        }
        .background(theme.background)
        .navigationTitle("Review items")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func nameBinding(for id: UUID) -> Binding<String> {
        Binding(
            get: { model.activeSplit?.items.first { $0.id == id }?.name ?? "" },
            set: { newValue in
                model.updateSplit { split in
                    guard let i = split.items.firstIndex(where: { $0.id == id }) else { return }
                    split.items[i].name = newValue
                }
            }
        )
    }

    private func amountBinding(for id: UUID) -> Binding<String> {
        Binding(
            get: {
                guard let item = model.activeSplit?.items.first(where: { $0.id == id }) else { return "" }
                return "\(item.lineTotal)"
            },
            set: { newValue in
                model.updateSplit { split in
                    guard let i = split.items.firstIndex(where: { $0.id == id }) else { return }
                    split.items[i].lineTotal = Decimal(string: newValue) ?? 0
                    split.items[i].unitPrice = split.items[i].lineTotal / Decimal(max(split.items[i].quantity, 1))
                }
            }
        )
    }
}

struct ReviewStepThroughView: View {
    @Binding var path: [FlowRoute]
    @Environment(SplitFlowViewModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    private var visibleItems: [LineItem] {
        model.activeSplit?.items.filter { !$0.isDisregarded } ?? []
    }

    var body: some View {
        let item = visibleItems[safe: model.stepThroughIndex]
        VStack(spacing: 20) {
            if let item, let split = model.activeSplit {
                Text("Item \(model.stepThroughIndex + 1) of \(visibleItems.count)")
                    .foregroundStyle(theme.textSecondary)
                FairoCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(item.name).font(.title2.bold())
                        Text(MoneyService.format(item.lineTotal, currencyCode: split.currencyCode))
                            .font(.system(size: 28, weight: .bold))
                            .foregroundStyle(theme.textPrimary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                FairoPrimaryButton(title: "Confirm") {
                    if model.stepThroughIndex < visibleItems.count - 1 {
                        model.stepThroughIndex += 1
                    } else {
                        continueAfterReview(path: $path, model: model)
                    }
                }
                FairoPrimaryButton(title: "Disregard", secondary: true) {
                    model.updateSplit { split in
                        guard let i = split.items.firstIndex(where: { $0.id == item.id }) else { return }
                        split.items[i].isDisregarded = true
                    }
                    if model.stepThroughIndex >= visibleItems.count - 1 {
                        continueAfterReview(path: $path, model: model)
                    }
                }
            } else {
                Text("No items to review").onAppear {
                    continueAfterReview(path: $path, model: model)
                }
            }
            Spacer()
        }
        .padding(20)
        .background(theme.background)
        .navigationTitle("Review item")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct AdjustmentPromptView: View {
    let adjustmentId: UUID
    @Binding var path: [FlowRoute]
    @Environment(SplitFlowViewModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        let adj = model.activeSplit?.adjustments.first { $0.id == adjustmentId }
        VStack(alignment: .leading, spacing: 16) {
            Text("Adjustment found").font(.title2.bold())
            if let adj, let split = model.activeSplit {
                Text("We found \"\(adj.label)\" — how should this be applied?")
                    .foregroundStyle(theme.textSecondary)
                FairoCard {
                    Text(MoneyService.format(adj.amount, currencyCode: split.currencyCode))
                        .font(.title.bold())
                }
                FairoPrimaryButton(title: "Treat as its own line item") {
                    model.resolveAdjustment(id: adjustmentId, handling: .ownLine)
                    advance()
                }
                FairoPrimaryButton(title: "Apply proportionally", secondary: true) {
                    model.resolveAdjustment(id: adjustmentId, handling: .proportional)
                    advance()
                }
            }
            Spacer()
        }
        .padding(20)
        .background(theme.background)
        .navigationTitle("Adjustment")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func advance() {
        if let next = model.nextUnresolvedAdjustment() {
            path.append(.adjustment(next.id))
        } else {
            path.append(.participants)
        }
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
