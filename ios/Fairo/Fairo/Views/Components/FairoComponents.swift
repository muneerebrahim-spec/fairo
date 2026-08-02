import SwiftUI

struct AvatarView: View {
    let name: String
    let colorHex: String
    var size: CGFloat = 44
    var selected = false

    private var initials: String {
        name.split(separator: " ").prefix(2).compactMap(\.first).map(String.init).joined().uppercased()
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: FairoTheme.avatarRadius, style: .continuous)
                .fill(Color(hex: colorHex))
                .frame(width: size - (selected ? 6 : 0), height: size - (selected ? 6 : 0))
            Text(initials)
                .font(.system(size: size * 0.32, weight: .bold))
                .foregroundStyle(.white)
        }
        .padding(selected ? 3 : 0)
        .overlay {
            if selected {
                RoundedRectangle(cornerRadius: FairoTheme.avatarRadius + 2, style: .continuous)
                    .stroke(theme.pop, lineWidth: 2.5)
            }
        }
        .frame(width: size, height: size)
    }

    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }
}

struct HeroCard<Content: View>: View {
    @ViewBuilder var content: Content
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        ZStack {
            if scheme == .dark {
                RoundedRectangle(cornerRadius: FairoTheme.heroRadius, style: .continuous)
                    .fill((scheme == .dark ? FairoColors.dark : FairoColors.light).accentBright.opacity(0.28))
                    .blur(radius: 48)
                    .offset(y: -10)
            }
            RoundedRectangle(cornerRadius: FairoTheme.heroRadius, style: .continuous)
                .fill(.clear)
                .background(FairoGradient())
                .clipShape(RoundedRectangle(cornerRadius: FairoTheme.heroRadius, style: .continuous))
                .shadow(color: FairoColors.light.accentDeep.opacity(0.25), radius: 16, y: 8)
                .overlay {
                    content.padding(24)
                }
        }
    }
}

struct FairoPrimaryButton: View {
    let title: String
    var secondary = false
    let action: () -> Void

    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        Button(action: action) {
            Group {
                if secondary {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(theme.card)
                        .foregroundStyle(theme.textPrimary)
                        .overlay {
                            RoundedRectangle(cornerRadius: FairoTheme.buttonRadius, style: .continuous)
                                .stroke(theme.border, lineWidth: 1)
                        }
                } else {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(FairoGradient())
                        .foregroundStyle(.white)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: FairoTheme.buttonRadius, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

struct FairoCard<Content: View>: View {
    @ViewBuilder var content: Content
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        content
            .padding(20)
            .background(theme.card)
            .clipShape(RoundedRectangle(cornerRadius: FairoTheme.cardRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: FairoTheme.cardRadius, style: .continuous)
                    .stroke(theme.border, lineWidth: 1)
            }
    }
}

struct PopBadge: View {
    let label: String
    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        Text(label)
            .font(.system(size: 12, weight: .bold))
            .padding(.horizontal, 12)
            .padding(.vertical, 5)
            .background(theme.pop)
            .foregroundStyle(.white)
            .clipShape(Capsule())
    }
}

struct LineItemRowView: View {
    let item: LineItem
    let split: Split
    var selected = false

    @Environment(\.colorScheme) private var scheme
    private var theme: FairoColors { scheme == .dark ? .dark : .light }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(item.name)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(theme.textPrimary)
                    if let conf = item.ocrConfidence, conf < 0.75 {
                        Text("?")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(theme.pop)
                            .padding(4)
                            .background(theme.pop.opacity(0.15))
                            .clipShape(Circle())
                    }
                }
                Text("x\(item.quantity) · \(MoneyService.format(item.lineTotal, currencyCode: split.currencyCode))")
                    .font(.system(size: 13))
                    .foregroundStyle(theme.textSecondary)
            }
            Spacer()
            if item.assignedShares.isEmpty {
                Circle().fill(theme.pop).frame(width: 10, height: 10)
            } else {
                HStack(spacing: -8) {
                    ForEach(item.assignedShares.prefix(3), id: \.id) { share in
                        if let p = split.participants.first(where: { $0.id == share.participantId }) {
                            AvatarView(name: p.displayName, colorHex: p.avatarColorHex, size: 28)
                        }
                    }
                }
            }
        }
        .padding(16)
        .background(selected ? theme.pop.opacity(0.08) : theme.card)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(selected ? theme.pop : theme.border, lineWidth: 1)
        }
        .opacity(item.isDisregarded ? 0.45 : 1)
    }
}
