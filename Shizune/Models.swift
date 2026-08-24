import Foundation

enum KonohaHealth: String, Codable {
    case healthy
    case degraded
    case critical
    case unavailable

    var label: String {
        switch self {
        case .healthy: "SAIN"
        case .degraded: "DÉGRADÉ"
        case .critical: "CRITIQUE"
        case .unavailable: "INDISPONIBLE"
        }
    }
}

struct AttentionIncident: Codable, Identifiable, Equatable {
    let incidentId: String
    let equipment: String
    let capability: String
    let severity: String
    let message: String
    let startedAt: Date

    var id: String { incidentId }
}

struct KonohaSummary: Codable, Equatable {
    let schemaVersion: Int
    let konohaState: KonohaHealth
    let tsunadeMessage: String
    let pendingRequests: Int
    let lastCheckedAt: Date?
    let attention: [AttentionIncident]
}

enum TsunadeChoice: String, Codable, CaseIterable {
    case yes = "YES"
    case no = "NO"
    case authorize = "AUTHORIZE"
    case refuse = "REFUSE"
    case later = "LATER"
    case confirm = "CONFIRM"

    var label: String {
        switch self {
        case .yes: "Oui"
        case .no: "Non"
        case .authorize: "Autoriser"
        case .refuse: "Refuser"
        case .later: "Plus tard"
        case .confirm: "Confirmer"
        }
    }

    var destructive: Bool { self == .refuse }
}

struct TsunadeRequest: Codable, Identifiable, Equatable {
    let requestId: String
    let incidentId: String
    let origin: String
    let kind: String
    let context: String
    let question: String
    let choices: [TsunadeChoice]
    let risk: String?
    let state: String
    let createdAt: Date
    let expiresAt: Date
    let deferredUntil: Date?
    let answeredAt: Date?
    let answer: TsunadeChoice?

    var id: String { requestId }
}

struct TsunadeRequestCollection: Codable, Equatable {
    let schemaVersion: Int
    let requests: [TsunadeRequest]
}

struct CompanionActivity: Codable, Identifiable, Equatable {
    let activityId: String
    let occurredAt: Date
    let kind: String
    let title: String
    let detail: String?
    let incidentId: String?

    var id: String { activityId }
}

struct CompanionActivityCollection: Codable, Equatable {
    let schemaVersion: Int
    let activity: [CompanionActivity]
}

struct PairingCreated: Codable, Equatable {
    let protocolVersion: Int
    let pairingId: String
    let pollingSecret: String
    let verificationCode: String
    let expiresAt: Date
    let tlsCaSha256: String
    let tlsCaCertificatePem: String
}

struct PairingResult: Codable, Equatable {
    let protocolVersion: Int
    let pairingId: String
    let status: String
    let expiresAt: Date
    let companionToken: String?
    let tokenExpiresAt: Date?
}

struct CompanionSession: Codable, Equatable {
    let baseURL: URL
    let deviceId: String
    let token: String
    let tokenExpiresAt: Date
    let tlsCaSha256: String
    let tlsCaCertificatePem: String
}

struct PairingState: Equatable {
    let baseURL: URL
    let deviceId: String
    let pairingId: String
    let pollingSecret: String
    let verificationCode: String
    let expiresAt: Date
    let tlsCaSha256: String
    let tlsCaCertificatePem: String

    var shortTLSFingerprint: String {
        stride(from: 0, to: min(16, tlsCaSha256.count), by: 4).map { offset in
            let start = tlsCaSha256.index(tlsCaSha256.startIndex, offsetBy: offset)
            let end = tlsCaSha256.index(
                start,
                offsetBy: min(4, tlsCaSha256.distance(from: start, to: tlsCaSha256.endIndex))
            )
            return String(tlsCaSha256[start..<end])
        }.joined(separator: " ")
    }
}

enum ShizuneError: LocalizedError, Equatable {
    case invalidAddress
    case invalidResponse
    case sessionExpired
    case server(String)
    case secureStorage

    var errorDescription: String? {
        switch self {
        case .invalidAddress:
            "L’adresse de Konoha doit utiliser HTTPS."
        case .invalidResponse:
            "La réponse de Konoha est invalide."
        case .sessionExpired:
            "La session Shizune a expiré ou a été révoquée."
        case let .server(message):
            message
        case .secureStorage:
            "Le trousseau sécurisé iOS est indisponible."
        }
    }
}

extension JSONDecoder {
    static var ohana: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = formatter.date(from: value) {
                return date
            }
            formatter.formatOptions = [.withInternetDateTime]
            guard let date = formatter.date(from: value) else {
                throw DecodingError.dataCorruptedError(
                    in: container,
                    debugDescription: "Invalid ISO 8601 date"
                )
            }
            return date
        }
        return decoder
    }
}
