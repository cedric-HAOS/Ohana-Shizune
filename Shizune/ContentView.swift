import SwiftUI

extension Color {
    static let ohanaTeal = Color(red: 0.10, green: 0.79, blue: 0.72)
    static let ohanaBackground = Color(red: 0.025, green: 0.075, blue: 0.09)
    static let ohanaCard = Color(red: 0.055, green: 0.12, blue: 0.14)
}

struct ContentView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        Group {
            if state.session == nil {
                PairingView()
            } else {
                TabView {
                    NavigationStack { HomeView() }
                        .tabItem { Label("Accueil", systemImage: "house.fill") }
                    NavigationStack { RequestsView() }
                        .tabItem { Label("Demandes", systemImage: "checkmark.bubble.fill") }
                        .badge(state.requests.count)
                    NavigationStack { ActivityView() }
                        .tabItem { Label("Activité", systemImage: "clock.fill") }
                    NavigationStack { SettingsView() }
                        .tabItem { Label("Réglages", systemImage: "gearshape.fill") }
                }
            }
        }
        .preferredColorScheme(.dark)
        .alert(
            "Shizune",
            isPresented: Binding(
                get: { state.errorMessage != nil },
                set: { if !$0 { state.errorMessage = nil } }
            )
        ) {
            Button("OK", role: .cancel) { state.errorMessage = nil }
        } message: {
            Text(state.errorMessage ?? "")
        }
    }
}

struct PairingView: View {
    @EnvironmentObject private var state: AppState
    @State private var address = "https://192.168.1.10:8767"

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()
                Image("OhanaSymbol")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 88, height: 88)
                    .accessibilityHidden(true)
                VStack(spacing: 8) {
                    Text("Shizune")
                        .font(.largeTitle.bold())
                    Text("Votre lien personnel avec Tsunade")
                        .foregroundStyle(.secondary)
                }
                if let pairing = state.pairing {
                    pairingStatus(pairing)
                } else {
                    connectionForm
                }
                Spacer()
                Text("Shizune n’accède jamais directement aux équipements de Konoha.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(24)
            .background(Color.ohanaBackground.ignoresSafeArea())
        }
    }

    private var connectionForm: some View {
        VStack(spacing: 16) {
            TextField("Adresse de Konoha", text: $address)
                .textInputAutocapitalization(.never)
                .keyboardType(.URL)
                .textContentType(.URL)
                .padding()
                .background(Color.ohanaCard, in: RoundedRectangle(cornerRadius: 14))
            Button {
                Task { await state.startPairing(address: address) }
            } label: {
                Label("Associer cet iPhone", systemImage: "link.badge.plus")
                    .frame(maxWidth: .infinity)
                    .padding()
            }
            .buttonStyle(.borderedProminent)
            .disabled(state.isLoading)
            if state.isLoading { ProgressView() }
            Text("Sur le réseau local ou à distance via WireGuard.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private func pairingStatus(_ pairing: PairingState) -> some View {
        VStack(spacing: 16) {
            Text("Vérifiez ce code dans Vision")
                .font(.headline)
            Text(pairing.verificationCode)
                .font(.system(size: 34, weight: .bold, design: .monospaced))
                .foregroundStyle(Color.ohanaTeal)
                .accessibilityLabel("Code \(pairing.verificationCode)")
            VStack(spacing: 4) {
                Text("Empreinte TLS")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(pairing.shortTLSFingerprint)
                    .font(.system(.body, design: .monospaced, weight: .semibold))
                    .accessibilityLabel("Empreinte TLS \(pairing.shortTLSFingerprint)")
            }
            Text("Le code et l’empreinte doivent être identiques dans Vision.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            ProgressView("En attente de votre validation…")
            Text("L’association expire à \(pairing.expiresAt.formatted(date: .omitted, time: .shortened)).")
                .font(.caption)
                .foregroundStyle(.secondary)
            Button("Annuler", role: .cancel) { state.cancelPairing() }
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(Color.ohanaCard, in: RoundedRectangle(cornerRadius: 20))
    }
}

struct HomeView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if let summary = state.summary {
                    healthCard(summary)
                    if !summary.attention.isEmpty {
                        attentionCard(summary.attention)
                    }
                    recentActivity
                } else if state.isLoading {
                    ProgressView("Tsunade vérifie Konoha…")
                        .frame(maxWidth: .infinity, minHeight: 240)
                } else {
                    ContentUnavailableView(
                        "Konoha inaccessible",
                        systemImage: "wifi.slash",
                        description: Text("Shizune réessaiera lors de l’actualisation.")
                    )
                }
            }
            .padding()
        }
        .background(Color.ohanaBackground)
        .navigationTitle("Konoha")
        .toolbar {
            Button { Task { await state.refresh() } } label: {
                Image(systemName: "arrow.clockwise")
            }
            .disabled(state.isLoading)
        }
        .refreshable { await state.refresh() }
    }

    private func healthCard(_ summary: KonohaSummary) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("ÉTAT GÉNÉRAL")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            HStack(spacing: 12) {
                Circle()
                    .fill(healthColor(summary.konohaState))
                    .frame(width: 16, height: 16)
                Text(summary.konohaState.label)
                    .font(.title.bold())
            }
            Divider()
            Label(summary.tsunadeMessage, systemImage: "cross.case.fill")
            if let checked = summary.lastCheckedAt {
                Text("Dernière vérification : \(checked.formatted(date: .abbreviated, time: .shortened))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(20)
        .background(Color.ohanaCard, in: RoundedRectangle(cornerRadius: 20))
    }

    private func attentionCard(_ incidents: [AttentionIncident]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Votre attention")
                .font(.headline)
            ForEach(incidents) { incident in
                VStack(alignment: .leading, spacing: 4) {
                    Text(incident.equipment).bold()
                    Text(incident.message)
                    Text(incident.capability)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                if incident.id != incidents.last?.id { Divider() }
            }
        }
        .padding(20)
        .background(Color.ohanaCard, in: RoundedRectangle(cornerRadius: 20))
    }

    private var recentActivity: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Activité récente").font(.headline)
            ForEach(state.activity.prefix(4)) { item in
                Label(item.title, systemImage: activityIcon(item.kind))
                    .font(.subheadline)
            }
        }
        .padding(20)
        .background(Color.ohanaCard, in: RoundedRectangle(cornerRadius: 20))
    }

    private func healthColor(_ health: KonohaHealth) -> Color {
        switch health {
        case .healthy: .green
        case .degraded: .orange
        case .critical: .red
        case .unavailable: .gray
        }
    }
}

struct RequestsView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        Group {
            if state.requests.isEmpty {
                ContentUnavailableView(
                    "Aucune décision en attente",
                    systemImage: "checkmark.circle",
                    description: Text("Tsunade n’a pas besoin de vous pour le moment.")
                )
            } else {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(state.requests) { request in
                            requestCard(request)
                        }
                    }
                    .padding()
                }
            }
        }
        .background(Color.ohanaBackground)
        .navigationTitle("Demandes")
        .refreshable { await state.refresh() }
    }

    private func requestCard(_ request: TsunadeRequest) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Tsunade", systemImage: "cross.case.fill")
                .font(.headline)
                .foregroundStyle(Color.ohanaTeal)
            Text(request.context)
                .foregroundStyle(.secondary)
            Text(request.question)
                .font(.title3.bold())
            if let risk = request.risk {
                Label("Risque : \(riskLabel(risk))", systemImage: "shield.lefthalf.filled")
                    .font(.subheadline)
            }
            ForEach(request.choices, id: \.self) { choice in
                if [.authorize, .yes, .confirm].contains(choice) {
                    Button {
                        Task { await state.respond(to: request, choice: choice) }
                    } label: {
                        Text(choice.label).frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(state.isLoading)
                } else {
                    Button(role: choice.destructive ? .destructive : nil) {
                        Task { await state.respond(to: request, choice: choice) }
                    } label: {
                        Text(choice.label).frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .disabled(state.isLoading)
                }
            }
            Text("Expire le \(request.expiresAt.formatted(date: .abbreviated, time: .shortened))")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(20)
        .background(Color.ohanaCard, in: RoundedRectangle(cornerRadius: 20))
    }

    private func riskLabel(_ risk: String) -> String {
        ["low": "faible", "medium": "moyen", "high": "élevé"][risk] ?? risk
    }
}

struct ActivityView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        List(state.activity) { item in
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: activityIcon(item.kind))
                    .foregroundStyle(Color.ohanaTeal)
                    .frame(width: 24)
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                    if let detail = item.detail {
                        Text(detail).font(.subheadline).foregroundStyle(.secondary)
                    }
                    Text(item.occurredAt.formatted(date: .abbreviated, time: .shortened))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .listRowBackground(Color.ohanaCard)
        }
        .scrollContentBackground(.hidden)
        .background(Color.ohanaBackground)
        .navigationTitle("Activité")
        .refreshable { await state.refresh() }
    }
}

struct SettingsView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        Form {
            Section("Konoha") {
                LabeledContent("Adresse", value: state.session?.baseURL.absoluteString ?? "—")
                LabeledContent("Session", value: "Associée")
                if let expiration = state.session?.tokenExpiresAt {
                    LabeledContent(
                        "Expiration",
                        value: expiration.formatted(date: .abbreviated, time: .omitted)
                    )
                }
            }
            Section("Notifications Shizune") {
                Toggle(
                    "Recevoir les alertes utiles",
                    isOn: Binding(
                        get: { state.notificationsEnabled },
                        set: { enabled in
                            Task { await state.setNotifications(enabled: enabled) }
                        }
                    )
                )
                Text("Les notifications sont envoyées directement par Agent via APNs, indépendamment de Home Assistant.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Section {
                Button("Dissocier cet iPhone", role: .destructive) {
                    state.disconnect()
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(Color.ohanaBackground)
        .navigationTitle("Réglages")
    }
}

private func activityIcon(_ kind: String) -> String {
    switch kind {
    case "incident": "exclamationmark.triangle.fill"
    case "investigation": "magnifyingglass"
    case "decision": "person.crop.circle.badge.checkmark"
    case "action": "wrench.and.screwdriver.fill"
    case "result": "checkmark.circle.fill"
    default: "info.circle"
    }
}
