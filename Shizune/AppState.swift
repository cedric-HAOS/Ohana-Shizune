import Foundation
import UIKit

extension Notification.Name {
    static let shizuneAPNsToken = Notification.Name("shizuneAPNsToken")
}

@MainActor
final class AppState: ObservableObject {
    @Published private(set) var session: CompanionSession?
    @Published private(set) var pairing: PairingState?
    @Published private(set) var summary: KonohaSummary?
    @Published private(set) var requests: [TsunadeRequest] = []
    @Published private(set) var activity: [CompanionActivity] = []
    @Published var notificationsEnabled = true
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let keychain = KeychainStore()
    private var pairingTask: Task<Void, Never>?
    private var notificationObserver: NSObjectProtocol?
    private var apnsDeviceToken: String?
    private let defaults = UserDefaults.standard

    var deviceId: String {
        if let existing = defaults.string(forKey: "companion-device-id") {
            return existing
        }
        let created = UUID().uuidString.lowercased()
        defaults.set(created, forKey: "companion-device-id")
        return created
    }

    init() {
        do {
            let loaded = try keychain.load()
            session = ((loaded?.tokenExpiresAt ?? .distantPast) > Date()) ? loaded : nil
            if loaded != nil, session == nil { keychain.delete() }
        } catch {
            errorMessage = error.localizedDescription
        }
        notificationsEnabled = defaults.object(forKey: "notifications-enabled") as? Bool ?? true
        notificationObserver = NotificationCenter.default.addObserver(
            forName: .shizuneAPNsToken,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let token = notification.object as? String else { return }
            Task { @MainActor in
                self?.apnsDeviceToken = token
                await self?.registerNotificationsIfPossible()
            }
        }
        if session != nil {
            Task {
                await refresh()
                await registerNotificationsIfPossible()
            }
        }
    }

    deinit {
        pairingTask?.cancel()
        if let notificationObserver {
            NotificationCenter.default.removeObserver(notificationObserver)
        }
    }

    func startPairing(address: String) async {
        errorMessage = nil
        guard let url = normalizedURL(address) else {
            errorMessage = ShizuneError.invalidAddress.localizedDescription
            return
        }
        isLoading = true
        defer { isLoading = false }
        do {
            let created = try await ShizuneAPIClient.pairing(baseURL: url).createPairing(
                deviceId: deviceId,
                deviceName: UIDevice.current.name
            )
            let state = PairingState(
                baseURL: url,
                deviceId: deviceId,
                pairingId: created.pairingId,
                pollingSecret: created.pollingSecret,
                verificationCode: created.verificationCode,
                expiresAt: created.expiresAt,
                tlsCaSha256: created.tlsCaSha256,
                tlsCaCertificatePem: created.tlsCaCertificatePem
            )
            pairing = state
            pairingTask?.cancel()
            pairingTask = Task { [weak self] in
                await self?.pollPairing(state)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func cancelPairing() {
        pairingTask?.cancel()
        pairingTask = nil
        pairing = nil
    }

    func refresh() async {
        guard let session else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let client = ShizuneAPIClient.authenticated(session)
            async let loadedSummary = client.summary()
            async let loadedRequests = client.requests()
            async let loadedActivity = client.activity()
            let (summary, requests, activity) = try await (
                loadedSummary, loadedRequests, loadedActivity
            )
            self.summary = summary
            self.requests = requests.requests
            self.activity = activity.activity
            errorMessage = nil
        } catch ShizuneError.sessionExpired {
            disconnect(message: ShizuneError.sessionExpired.localizedDescription)
        } catch {
            errorMessage = "Konoha est inaccessible. Les données seront actualisées au retour de la connexion."
        }
    }

    func respond(to request: TsunadeRequest, choice: TsunadeChoice) async {
        guard let session else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            _ = try await ShizuneAPIClient.authenticated(session).respond(
                requestId: request.requestId,
                choice: choice
            )
            await refresh()
        } catch ShizuneError.sessionExpired {
            disconnect(message: ShizuneError.sessionExpired.localizedDescription)
        } catch {
            errorMessage = error.localizedDescription
            await refresh()
        }
    }

    func setNotifications(enabled: Bool) async {
        notificationsEnabled = enabled
        defaults.set(enabled, forKey: "notifications-enabled")
        await registerNotificationsIfPossible()
    }

    func disconnect(message: String? = nil) {
        keychain.delete()
        session = nil
        summary = nil
        requests = []
        activity = []
        errorMessage = message
    }

    private func pollPairing(_ state: PairingState) async {
        let client = ShizuneAPIClient(
            baseURL: state.baseURL,
            pinnedFingerprint: state.tlsCaSha256,
            pinnedCertificatePEM: state.tlsCaCertificatePem
        )
        while !Task.isCancelled, Date() < state.expiresAt {
            do {
                let result = try await client.pollPairing(state)
                if result.status == "CONSUMED",
                   let token = result.companionToken,
                   let expiresAt = result.tokenExpiresAt
                {
                    let session = CompanionSession(
                        baseURL: state.baseURL,
                        deviceId: state.deviceId,
                        token: token,
                        tokenExpiresAt: expiresAt,
                        tlsCaSha256: state.tlsCaSha256,
                        tlsCaCertificatePem: state.tlsCaCertificatePem
                    )
                    try keychain.save(session)
                    self.session = session
                    pairing = nil
                    await refresh()
                    await registerNotificationsIfPossible()
                    return
                }
                if ["EXPIRED", "REJECTED"].contains(result.status) {
                    pairing = nil
                    errorMessage = "L’association a expiré ou a été refusée."
                    return
                }
            } catch {
                errorMessage = "En attente de Konoha…"
            }
            try? await Task.sleep(for: .seconds(3))
        }
        if pairing?.pairingId == state.pairingId {
            pairing = nil
            errorMessage = "La demande d’association a expiré."
        }
    }

    private func registerNotificationsIfPossible() async {
        guard let session else { return }
        let token = apnsDeviceToken
        do {
            try await ShizuneAPIClient.authenticated(session).registerNotifications(
                deviceToken: token,
                enabled: notificationsEnabled && token != nil,
                environment: Self.apnsEnvironment
            )
        } catch {
            // APNs is informative only; synchronization and decisions keep working.
        }
    }

    private func normalizedURL(_ value: String) -> URL? {
        guard var components = URLComponents(string: value.trimmingCharacters(in: .whitespaces)),
              components.scheme?.lowercased() == "https",
              components.host != nil
        else { return nil }
        if components.port == nil { components.port = 8767 }
        components.path = ""
        components.query = nil
        components.fragment = nil
        return components.url
    }

    private static var apnsEnvironment: String {
        #if DEBUG
        "development"
        #else
        "production"
        #endif
    }
}
