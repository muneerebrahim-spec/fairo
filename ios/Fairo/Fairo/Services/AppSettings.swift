import Foundation

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
