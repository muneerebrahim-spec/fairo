import SwiftUI

struct FairoColors {
    let background: Color
    let card: Color
    let textPrimary: Color
    let textSecondary: Color
    let accentDeep: Color
    let accentBright: Color
    let pop: Color
    let border: Color

    static let light = FairoColors(
        background: Color(hex: "#F6F7F2"),
        card: Color(hex: "#FFFFFF"),
        textPrimary: Color(hex: "#10201A"),
        textSecondary: Color(hex: "#7A8A7F"),
        accentDeep: Color(hex: "#047857"),
        accentBright: Color(hex: "#10B981"),
        pop: Color(hex: "#D97706"),
        border: Color(hex: "#E2E9E0")
    )

    static let dark = FairoColors(
        background: Color(hex: "#0A130E"),
        card: Color(hex: "#12201A"),
        textPrimary: Color(hex: "#EEF5EF"),
        textSecondary: Color(hex: "#8FA396"),
        accentDeep: Color(hex: "#10B981"),
        accentBright: Color(hex: "#34D399"),
        pop: Color(hex: "#F59E0B"),
        border: Color(hex: "#1D3327")
    )
}

enum FairoTheme {
    static let cardRadius: CGFloat = 20
    static let heroRadius: CGFloat = 22
    static let buttonRadius: CGFloat = 15
    static let avatarRadius: CGFloat = 12
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: Double
        switch hex.count {
        case 6:
            r = Double((int >> 16) & 0xFF) / 255
            g = Double((int >> 8) & 0xFF) / 255
            b = Double(int & 0xFF) / 255
        default:
            r = 0; g = 0; b = 0
        }
        self.init(red: r, green: g, blue: b)
    }

    init(hexString: String) {
        self.init(hex: hexString)
    }
}

struct FairoGradient: View {
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let colors = scheme == .dark ? FairoColors.dark : FairoColors.light
        LinearGradient(
            colors: [colors.accentDeep, colors.accentBright],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}
