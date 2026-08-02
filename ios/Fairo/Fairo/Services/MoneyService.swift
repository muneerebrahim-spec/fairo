import Foundation

enum MoneyService {
    static func round(_ amount: Decimal, currencyCode: String) -> Decimal {
        var value = amount
        var rounded = Decimal()
        NSDecimalRound(&rounded, &value, 2, .plain)
        return rounded
    }

    static func format(_ amount: Decimal, currencyCode: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currencyCode
        return formatter.string(from: round(amount, currencyCode: currencyCode) as NSDecimalNumber) ?? "\(amount)"
    }

    static func distributeWithRemainder(total: Decimal, weights: [Decimal]) -> [Decimal] {
        guard !weights.isEmpty else { return [] }
        let totalMinor = (total as NSDecimalNumber).multiplying(by: 100).intValue
        let weightSum = weights.reduce(0, +)
        guard weightSum > 0 else {
            let base = totalMinor / weights.count
            let remainder = totalMinor - base * weights.count
            return weights.enumerated().map { idx, _ in
                Decimal(base + (idx == 0 ? remainder : 0)) / 100
            }
        }

        var rawShares: [Double] = weights.map { w in
            Double(truncating: (total * w / weightSum) as NSDecimalNumber)
        }
        var minor = rawShares.map { Int($0 * 100) }
        var leftover = totalMinor - minor.reduce(0, +)
        let fractions = rawShares.enumerated().sorted { $0.element - Double(minor[$0.offset]) / 100 > $1.element - Double(minor[$1.offset]) / 100 }
        for (idx, _) in fractions where leftover > 0 {
            minor[idx] += 1
            leftover -= 1
        }
        return minor.map { Decimal($0) / 100 }
    }
}

enum AppSettings {
    private static let currencyKey = "fairo.preferredCurrency"

    static var preferredCurrencyCode: String {
        get {
            if let saved = UserDefaults.standard.string(forKey: currencyKey) {
                return saved
            }
            let seeded = localeDefaultCurrencyCode
            UserDefaults.standard.set(seeded, forKey: currencyKey)
            return seeded
        }
        set {
            UserDefaults.standard.set(newValue, forKey: currencyKey)
        }
    }

    static var localeDefaultCurrencyCode: String {
        Locale.current.currency?.identifier ?? "USD"
    }

    static func currencyLabel(for code: String) -> String {
        let name = Locale.current.localizedString(forCurrencyCode: code) ?? code
        return "\(name) (\(code))"
    }

    static let supportedCurrencyCodes: [String] = [
        "USD", "EUR", "GBP", "ZAR", "AUD", "CAD", "NZD",
        "CHF", "JPY", "INR", "AED", "SGD", "MXN", "BRL",
    ]
}
