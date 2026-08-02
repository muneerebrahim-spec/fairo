import Foundation
import Vision
import UIKit

enum VisionOCRService {
    enum OCRError: LocalizedError {
        case noTextFound

        var errorDescription: String? {
            switch self {
            case .noTextFound: "No text could be read from the receipt."
            }
        }
    }

    static func recognizeText(in images: [UIImage]) async throws -> String {
        var sections: [String] = []

        for image in images {
            guard let cgImage = image.cgImage else { continue }
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            request.recognitionLanguages = ["en-US", "en-GB"]
            request.automaticallyDetectsLanguage = true

            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            try handler.perform([request])

            let lines = linesFromObservations(request.results ?? [])
            if !lines.isEmpty {
                sections.append(lines.joined(separator: "\n"))
            }
        }

        let combined = sections.joined(separator: "\n")
        guard !combined.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw OCRError.noTextFound
        }
        return combined
    }

    /// Vision returns observations in arbitrary order — sort top-to-bottom, left-to-right,
    /// and merge fragments on the same visual row into one line.
    private static func linesFromObservations(_ observations: [VNRecognizedTextObservation]) -> [String] {
        let sorted = observations.sorted { lhs, rhs in
            let ly = 1 - lhs.boundingBox.midY
            let ry = 1 - rhs.boundingBox.midY
            if abs(ly - ry) > 0.012 { return ly < ry }
            return lhs.boundingBox.minX < rhs.boundingBox.minX
        }

        var groups: [[VNRecognizedTextObservation]] = []
        for observation in sorted {
            if let lastGroup = groups.last,
               let lastObservation = lastGroup.last,
               abs(observation.boundingBox.midY - lastObservation.boundingBox.midY) <= 0.012 {
                groups[groups.count - 1].append(observation)
            } else {
                groups.append([observation])
            }
        }

        return groups.compactMap { group in
            let text = group
                .sorted { $0.boundingBox.minX < $1.boundingBox.minX }
                .compactMap { $0.topCandidates(1).first?.string }
                .joined(separator: " ")
                .trimmingCharacters(in: .whitespaces)
            return text.isEmpty ? nil : text
        }
    }
}
