import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var scheme
    @State private var selectedCurrency: String = AppSettings.preferredCurrencyCode

    var onSave: (() -> Void)?

    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("New splits use this currency unless the receipt clearly shows another (e.g. $ or R on the bill).")
                        .font(.subheadline)
                        .foregroundStyle(theme.textSecondary)

                    FairoCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("DEFAULT CURRENCY")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(theme.textSecondary)
                                .tracking(0.6)

                            Picker("Currency", selection: $selectedCurrency) {
                                ForEach(AppSettings.supportedCurrencyCodes, id: \.self) { code in
                                    Text(AppSettings.currencyLabel(for: code)).tag(code)
                                }
                            }
                            .pickerStyle(.wheel)
                            .frame(height: 148)

                            Text("Preview: \(MoneyService.format(123.45, currencyCode: selectedCurrency))")
                                .font(.subheadline)
                                .foregroundStyle(theme.textPrimary)
                        }
                    }

                    FairoPrimaryButton(title: "Use device default (\(AppSettings.localeDefaultCurrencyCode))", secondary: true) {
                        selectedCurrency = AppSettings.localeDefaultCurrencyCode
                    }

                    Text("Device locale: \(AppSettings.currencyLabel(for: AppSettings.localeDefaultCurrencyCode))")
                        .font(.caption)
                        .foregroundStyle(theme.textSecondary)
                }
                .padding(20)
            }
            .background(theme.background)
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        AppSettings.preferredCurrencyCode = selectedCurrency
                        onSave?()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}
