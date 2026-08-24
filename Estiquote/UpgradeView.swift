import SwiftUI
import StoreKit

struct UpgradeView: View {
    @EnvironmentObject private var subscriptions: SubscriptionStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header

                    if subscriptions.currentTier != .free {
                        currentPlanCard
                    }

                    valueCard
                    planContent
                    messages
                    purchaseFooter
                }
                .padding(20)
                .padding(.bottom, 30)
            }
            .scrollIndicators(.hidden)
            .background(Brand.navy.ignoresSafeArea())
            .navigationTitle("Membership")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Brand.tealLight)
                }
            }
        }
        .task {
            await subscriptions.loadProducts()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("KNOWLEDGE THAT EARNS ITS KEEP")
                .appFont(11, weight: .bold, design: .rounded)
                .tracking(2.0)
                .foregroundStyle(Brand.teal)
            Text("Make expensive decisions with better numbers.")
                .appFont(30, weight: .bold, design: .rounded)
                .tracking(-0.6)
                .foregroundStyle(.white)
            Text("Unlock one homeowner project with a single Apple purchase, or choose Trade when estimating is part of your work.")
                .appFont(14, design: .rounded)
                .foregroundStyle(Brand.inkMuted)
                .lineSpacing(4)
        }
    }

    private var currentPlanCard: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.seal.fill")
                .appFont(24, weight: .semibold, design: .default)
                .foregroundStyle(Brand.tealLight)

            VStack(alignment: .leading, spacing: 3) {
                Text("\(subscriptions.currentTier.name) is active")
                    .appFont(15, weight: .bold, design: .rounded)
                    .foregroundStyle(.white)
                Text("Your paid tools are unlocked on this Apple ID.")
                    .appFont(11, design: .rounded)
                    .foregroundStyle(Brand.inkMuted)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Brand.teal.opacity(0.11))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Brand.teal.opacity(0.35), lineWidth: 1)
        }
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var valueCard: some View {
        VStack(alignment: .leading, spacing: 13) {
            valueRow("See where labour, materials and prelims go", icon: "chart.bar.fill")
            valueRow("Unlock one active homeowner project", icon: "folder.fill", badge: "PASS")
            valueRow("Share a clean summary before quotes arrive", icon: "square.and.arrow.up.fill")
            valueRow("Add markup and your logo to client PDFs", icon: "briefcase.fill", badge: "TRADE")
            valueRow("Compare written quotes against your guide", icon: "doc.text.magnifyingglass", badge: "TRADE")
        }
        .padding(17)
        .background(Brand.navy2)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    @ViewBuilder
    private var planContent: some View {
        if subscriptions.isLoading {
            ProgressView("Loading Apple plans…")
                .tint(Brand.tealLight)
                .foregroundStyle(Brand.inkMuted)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 26)
        } else if subscriptions.products.isEmpty {
            VStack(spacing: 10) {
                Image(systemName: "wifi.exclamationmark")
                    .appFont(24, design: .default)
                    .foregroundStyle(Brand.inkMuted)
                Text("Plans aren’t available right now")
                    .appFont(16, weight: .bold, design: .rounded)
                    .foregroundStyle(.white)
                Text("Check your connection, then try loading the Apple purchase options again.")
                    .appFont(12, design: .rounded)
                    .foregroundStyle(Brand.inkMuted)
                    .multilineTextAlignment(.center)
                Button("Try again") {
                    Task { await subscriptions.loadProducts() }
                }
                .buttonStyle(.bordered)
                .tint(Brand.tealLight)
            }
            .frame(maxWidth: .infinity)
            .padding(22)
            .background(Brand.navy2)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        } else {
            ForEach(subscriptions.products, id: \.id) { product in
                planCard(product)
            }
        }
    }

    private func planCard(_ product: Product) -> some View {
        let tier = SubscriptionTier(productID: product.id)
        let isCurrent = subscriptions.currentTier == tier
        let isIncluded = subscriptions.currentTier > tier

        return VStack(alignment: .leading, spacing: 15) {
            planHeader(product, tier: tier)

            VStack(alignment: .leading, spacing: 9) {
                ForEach(features(for: tier), id: \.self) { feature in
                    Label(feature, systemImage: "checkmark.circle.fill")
                        .appFont(12, weight: .medium, design: .rounded)
                        .foregroundStyle(Brand.inkMuted)
                        .symbolRenderingMode(.hierarchical)
                }
            }

            Button {
                Task { await subscriptions.purchase(product) }
            } label: {
                HStack {
                    Text(buttonTitle(isCurrent: isCurrent, isIncluded: isIncluded, tier: tier))
                    Spacer()
                    if subscriptions.isPurchasing && !isCurrent && !isIncluded {
                        ProgressView().tint(Brand.navy)
                    } else {
                        Image(systemName: isCurrent || isIncluded ? "checkmark" : "arrow.right")
                    }
                }
                .appFont(15, weight: .bold, design: .rounded)
                .foregroundStyle(isCurrent || isIncluded ? Brand.inkMuted : Brand.navy)
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(isCurrent || isIncluded ? Color.white.opacity(0.06) : Brand.tealLight)
                .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
            }
            .buttonStyle(.plain)
            .disabled(isCurrent || isIncluded || subscriptions.isPurchasing)
            .accessibilityIdentifier("purchase.\(tier.badgeName.lowercased())")
        }
        .padding(18)
        .background(tier == .projectPass ? Brand.teal.opacity(0.08) : Brand.navy2)
        .overlay {
            RoundedRectangle(cornerRadius: 19, style: .continuous)
                .stroke(tier == .projectPass ? Brand.teal.opacity(0.45) : .white.opacity(0.08), lineWidth: 1)
        }
        .clipShape(RoundedRectangle(cornerRadius: 19, style: .continuous))
    }

    @ViewBuilder
    private func planHeader(_ product: Product, tier: SubscriptionTier) -> some View {
        if dynamicTypeSize.isAccessibilitySize {
            VStack(alignment: .leading, spacing: 10) {
                planIdentity(product, tier: tier)
                planPrice(product, tier: tier, alignment: .leading)
            }
        } else {
            HStack(alignment: .firstTextBaseline) {
                planIdentity(product, tier: tier)
                Spacer()
                planPrice(product, tier: tier, alignment: .trailing)
            }
        }
    }

    private func planIdentity(_ product: Product, tier: SubscriptionTier) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("ESTIQUOTE \(tier.name.uppercased())")
                .appFont(11, weight: .bold, design: .rounded)
                .tracking(1.7)
                .foregroundStyle(Brand.teal)
            Text(product.displayName)
                .appFont(21, weight: .bold, design: .rounded)
                .foregroundStyle(.white)
        }
    }

    private func planPrice(_ product: Product, tier: SubscriptionTier, alignment: HorizontalAlignment) -> some View {
        VStack(alignment: alignment, spacing: 2) {
            Text(product.displayPrice)
                .appFont(22, weight: .bold, design: .rounded)
                .foregroundStyle(Brand.tealLight)
            Text(tier == .projectPass ? "one-time purchase" : "per month")
                .appFont(11, design: .rounded)
                .foregroundStyle(Brand.inkDim)
        }
    }

    @ViewBuilder
    private var messages: some View {
        if let statusMessage = subscriptions.statusMessage {
            Label(statusMessage, systemImage: "checkmark.circle.fill")
                .appFont(12, design: .rounded)
                .foregroundStyle(Brand.tealLight)
        }

        if let errorMessage = subscriptions.errorMessage {
            Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                .appFont(12, design: .rounded)
                .foregroundStyle(.orange.opacity(0.9))
        }
    }

    private var purchaseFooter: some View {
        VStack(spacing: 13) {
            Button("Restore purchases") {
                Task { await subscriptions.restorePurchases() }
            }
            .appFont(13, weight: .semibold, design: .rounded)
            .foregroundStyle(Brand.tealLight)

            if subscriptions.hasTrade {
                Link("Manage Trade subscription", destination: URL(string: "https://apps.apple.com/account/subscriptions")!)
                    .appFont(13, weight: .semibold, design: .rounded)
                    .foregroundStyle(Brand.inkMuted)
            }

            if dynamicTypeSize.isAccessibilitySize {
                VStack(spacing: 10) {
                    legalLinks
                }
            } else {
                HStack(spacing: 18) {
                    legalLinks
                }
            }

            Text("Project Pass is a one-time purchase. Trade is a monthly subscription charged to your Apple ID and renews unless cancelled at least 24 hours before the end of the current period. Manage Trade in your App Store account settings.")
                .appFont(11, design: .rounded)
                .foregroundStyle(Brand.inkDim)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
    }

    @ViewBuilder
    private var legalLinks: some View {
        NavigationLink("Terms of Use") { LegalView(document: .terms) }
            .appFont(11, weight: .semibold, design: .rounded)
            .foregroundStyle(Brand.inkMuted)
        NavigationLink("Privacy") { LegalView(document: .privacy) }
            .appFont(11, weight: .semibold, design: .rounded)
            .foregroundStyle(Brand.inkMuted)
    }

    private func valueRow(_ title: String, icon: String, badge: String? = nil) -> some View {
        HStack(spacing: 11) {
            Image(systemName: icon)
                .appFont(14, weight: .semibold, design: .default)
                .foregroundStyle(Brand.tealLight)
                .frame(width: 30, height: 30)
                .background(Brand.teal.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            Text(title)
                .appFont(13, weight: .medium, design: .rounded)
                .foregroundStyle(.white.opacity(0.84))
            Spacer(minLength: 8)
            if let badge {
                Text(badge)
                    .appFont(11, weight: .bold, design: .rounded)
                    .tracking(1)
                    .foregroundStyle(Brand.navy)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 4)
                    .background(Brand.tealLight)
                    .clipShape(Capsule())
            }
        }
    }

    private func features(for tier: SubscriptionTier) -> [String] {
        switch tier {
        case .free: []
        case .projectPass:
            ["Full breakdown for one active project", "Country-adjusted material guide", "Share-ready estimate summary", "No recurring homeowner charge"]
        case .trade:
            ["Everything in Project Pass", "Unlimited saved projects", "Adjustable contractor markup", "Your logo on client PDF reports", "Written quote comparison"]
        }
    }

    private func buttonTitle(isCurrent: Bool, isIncluded: Bool, tier: SubscriptionTier) -> String {
        if isCurrent { return "Current plan" }
        if isIncluded { return "Included in \(subscriptions.currentTier.name)" }
        return "Choose \(tier.name)"
    }
}

private enum LegalDocument {
    case terms
    case privacy

    var title: String { self == .terms ? "Terms of Use" : "Privacy" }
}

private struct LegalView: View {
    let document: LegalDocument

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text(document.title)
                    .appFont(30, weight: .bold, design: .rounded)
                    .foregroundStyle(.white)

                if document == .terms {
                    section("Estimates are guidance", "Estiquote provides indicative planning ranges, not a contractor quote, survey, valuation or professional advice. Actual costs vary with scope, access, specification, site conditions, local taxes and contractor rates.")
                    section("Use of the service", "Check important decisions with qualified professionals and obtain at least three written quotes. You remain responsible for contracts, budgets and project decisions.")
                    section("Apple purchases", "Project Pass is a one-time in-app purchase. Trade renews monthly through Apple unless cancelled. Your App Store account controls billing, cancellation and refunds.")
                } else {
                    section("Your project data", "Saved estimates, written quotes, markups, country preferences and an optional Trade business logo are stored on this device using Apple’s local app storage. Estiquote does not require an account in this version.")
                    section("Photos and reports", "Apple’s system photo picker only provides the logo image you choose. A shared client PDF can include that logo, project details and the indicative client total, but it excludes your internal markup percentage and saved comparison quotes. You choose the destination through Apple’s share sheet.")
                    section("Market data", "Country pricing factors are bundled with Estiquote and work offline. The app does not send your selected country to the World Bank or another market-data provider.")
                    section("Purchases", "Apple processes Project Pass and Trade payments and provides Estiquote with verified entitlement information. Estiquote does not receive your full payment-card details.")
                    section("Support", "For privacy or support questions, email estiquoteofficial@gmail.com or use the support page linked from Estiquote’s App Store listing.")
                }
            }
            .padding(20)
        }
        .background(Brand.navy.ignoresSafeArea())
        .navigationTitle(document.title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func section(_ title: String, _ body: String) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(title)
                .appFont(16, weight: .bold, design: .rounded)
                .foregroundStyle(.white)
            Text(body)
                .appFont(13, design: .rounded)
                .foregroundStyle(Brand.inkMuted)
                .lineSpacing(4)
        }
    }
}
