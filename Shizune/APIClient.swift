import CryptoKit
import Foundation
import Security

final class ServerTrustDelegate: NSObject, URLSessionDelegate {
    private let pinnedFingerprint: String?
    private let pinnedCertificate: SecCertificate?
    private let permitsInitialPairing: Bool

    init(
        pinnedFingerprint: String?,
        pinnedCertificatePEM: String? = nil,
        permitsInitialPairing: Bool
    ) {
        self.pinnedFingerprint = pinnedFingerprint?.lowercased()
        self.permitsInitialPairing = permitsInitialPairing
        pinnedCertificate = Self.certificate(
            pem: pinnedCertificatePEM,
            expectedFingerprint: pinnedFingerprint
        )
    }

    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              let trust = challenge.protectionSpace.serverTrust
        else {
            completionHandler(.performDefaultHandling, nil)
            return
        }
        if permitsInitialPairing && pinnedFingerprint == nil {
            completionHandler(.useCredential, URLCredential(trust: trust))
            return
        }
        guard let certificate = pinnedCertificate
        else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        SecTrustSetAnchorCertificates(trust, [certificate] as CFArray)
        SecTrustSetAnchorCertificatesOnly(trust, true)
        let matches = SecTrustEvaluateWithError(trust, nil)
        completionHandler(
            matches ? .useCredential : .cancelAuthenticationChallenge,
            matches ? URLCredential(trust: trust) : nil
        )
    }

    private static func certificate(
        pem: String?, expectedFingerprint: String?
    ) -> SecCertificate? {
        guard let pem, let expectedFingerprint else { return nil }
        let base64 = pem
            .replacingOccurrences(of: "-----BEGIN CERTIFICATE-----", with: "")
            .replacingOccurrences(of: "-----END CERTIFICATE-----", with: "")
            .components(separatedBy: .whitespacesAndNewlines)
            .joined()
        guard let data = Data(base64Encoded: base64) else { return nil }
        let digest = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
        guard digest == expectedFingerprint.lowercased() else { return nil }
        return SecCertificateCreateWithData(nil, data as CFData)
    }
}

final class ShizuneAPIClient {
    private let baseURL: URL
    private let deviceId: String?
    private let token: String?
    private let delegate: ServerTrustDelegate
    private let session: URLSession

    init(
        baseURL: URL,
        deviceId: String? = nil,
        token: String? = nil,
        pinnedFingerprint: String? = nil,
        pinnedCertificatePEM: String? = nil,
        permitsInitialPairing: Bool = false,
        protocolClasses: [AnyClass]? = nil
    ) {
        self.baseURL = baseURL
        self.deviceId = deviceId
        self.token = token
        delegate = ServerTrustDelegate(
            pinnedFingerprint: pinnedFingerprint,
            pinnedCertificatePEM: pinnedCertificatePEM,
            permitsInitialPairing: permitsInitialPairing
        )
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 10
        configuration.timeoutIntervalForResource = 20
        if let protocolClasses {
            configuration.protocolClasses = protocolClasses
        }
        session = URLSession(configuration: configuration, delegate: delegate, delegateQueue: nil)
    }

    static func pairing(baseURL: URL) -> ShizuneAPIClient {
        ShizuneAPIClient(baseURL: baseURL, permitsInitialPairing: true)
    }

    static func authenticated(_ session: CompanionSession) -> ShizuneAPIClient {
        ShizuneAPIClient(
            baseURL: session.baseURL,
            deviceId: session.deviceId,
            token: session.token,
            pinnedFingerprint: session.tlsCaSha256,
            pinnedCertificatePEM: session.tlsCaCertificatePem
        )
    }

    func createPairing(deviceId: String, deviceName: String) async throws -> PairingCreated {
        try await request(
            path: "/v1/pairings/companions",
            method: "POST",
            body: [
                "protocol_version": 1,
                "device_id": deviceId,
                "device_name": deviceName,
                "platform": "ios",
                "app_version": Bundle.main.shortVersion,
            ]
        )
    }

    func pollPairing(_ pairing: PairingState) async throws -> PairingResult {
        try await request(
            path: "/v1/pairings/companions/\(pairing.pairingId)/poll",
            method: "POST",
            body: [
                "protocol_version": 1,
                "polling_secret": pairing.pollingSecret,
            ]
        )
    }

    func summary() async throws -> KonohaSummary {
        try await request(path: "/v1/incidents/summary")
    }

    func requests() async throws -> TsunadeRequestCollection {
        try await request(path: "/v1/incidents/requests")
    }

    func activity() async throws -> CompanionActivityCollection {
        try await request(path: "/v1/incidents/activity")
    }

    func respond(requestId: String, choice: TsunadeChoice) async throws -> TsunadeRequest {
        try await request(
            path: "/v1/incidents/requests/\(requestId)/response",
            method: "POST",
            body: ["choice": choice.rawValue]
        )
    }

    func registerNotifications(
        deviceToken: String?,
        enabled: Bool,
        environment: String
    ) async throws {
        var body: [String: Any] = [
            "enabled": enabled,
            "environment": environment,
        ]
        body["device_token"] = deviceToken ?? NSNull()
        let _: PushRegistrationResponse = try await request(
            path: "/v1/companions/notifications",
            method: "POST",
            body: body
        )
    }

    private func request<Response: Decodable>(
        path: String,
        method: String = "GET",
        body: [String: Any]? = nil
    ) async throws -> Response {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw ShizuneError.invalidAddress
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let deviceId {
            request.setValue(deviceId, forHTTPHeaderField: "X-Ohana-Companion-Id")
        }
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw ShizuneError.invalidResponse
        }
        if http.statusCode == 401 {
            throw ShizuneError.sessionExpired
        }
        guard (200..<300).contains(http.statusCode) else {
            let detail = (try? JSONDecoder().decode(ServerError.self, from: data).detail)
            throw ShizuneError.server(detail ?? "Konoha a refusé la demande.")
        }
        do {
            return try JSONDecoder.ohana.decode(Response.self, from: data)
        } catch {
            throw ShizuneError.invalidResponse
        }
    }
}

private struct ServerError: Codable {
    let detail: String
}

private struct PushRegistrationResponse: Codable {
    let schemaVersion: Int
    let enabled: Bool
    let environment: String
    let updatedAt: Date
}

private extension Bundle {
    var shortVersion: String {
        object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0.1.0"
    }
}
