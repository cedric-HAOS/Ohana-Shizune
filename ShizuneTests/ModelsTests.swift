import XCTest
@testable import OhanaShizune

final class ModelsTests: XCTestCase {
    func testDecodesSyntheticSummaryWithoutTechnicalPayloads() throws {
        let data = Data(
            """
            {
              "schema_version": 1,
              "konoha_state": "degraded",
              "tsunade_message": "1 décision attend votre réponse",
              "pending_requests": 1,
              "last_checked_at": "2026-08-24T12:00:00+00:00",
              "attention": [{
                "incident_id": "incident-1",
                "equipment": "ZWAVE-01",
                "capability": "zwave.communication",
                "severity": "degraded",
                "message": "Communication instable avec Node 17",
                "started_at": "2026-08-24T11:55:00+00:00"
              }]
            }
            """.utf8
        )

        let summary = try JSONDecoder.ohana.decode(KonohaSummary.self, from: data)

        XCTAssertEqual(summary.konohaState, .degraded)
        XCTAssertEqual(summary.pendingRequests, 1)
        XCTAssertEqual(summary.attention.first?.equipment, "ZWAVE-01")
    }

    func testDecodesOnlyStructuredTsunadeChoices() throws {
        let data = Data(
            """
            {
              "schema_version": 1,
              "requests": [{
                "request_id": "request-1",
                "incident_id": "incident-1",
                "origin": "tsunade",
                "kind": "repair_authorization",
                "context": "Le DNS est dégradé.",
                "question": "Autoriser la réparation ?",
                "choices": ["AUTHORIZE", "REFUSE", "LATER"],
                "risk": "low",
                "state": "pending",
                "created_at": "2026-08-24T12:00:00+00:00",
                "expires_at": "2026-08-31T12:00:00+00:00",
                "deferred_until": null,
                "answered_at": null,
                "answer": null
              }]
            }
            """.utf8
        )

        let collection = try JSONDecoder.ohana.decode(
            TsunadeRequestCollection.self,
            from: data
        )

        XCTAssertEqual(collection.requests.first?.choices, [.authorize, .refuse, .later])
        XCTAssertEqual(TsunadeChoice.authorize.label, "Autoriser")
    }

    func testSessionRoundTripPreservesPinnedKonohaAuthority() throws {
        let expected = CompanionSession(
            baseURL: try XCTUnwrap(URL(string: "https://192.168.1.10:8767")),
            deviceId: "iphone-cedric",
            token: "secret",
            tokenExpiresAt: Date(timeIntervalSince1970: 1_800_000_000),
            tlsCaSha256: String(repeating: "a", count: 64),
            tlsCaCertificatePem: "certificate"
        )

        let decoded = try JSONDecoder().decode(
            CompanionSession.self,
            from: JSONEncoder().encode(expected)
        )

        XCTAssertEqual(decoded, expected)
    }
}
