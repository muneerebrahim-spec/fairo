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

    /// Sort top-to-bottom, group by row, and join left/right columns (item name + price).
    private static func linesFromObservations(_ observations: [VNRecognizedTextObservation]) -> [String] {
        let sorted = observations.sorted { lhs, rhs in
            let ly = 1 - lhs.boundingBox.midY
            let ry = 1 - rhs.boundingBox.midY
            if abs(ly - ry) > 0.02 { return ly < ry }
            return lhs.boundingBox.minX < rhs.boundingBox.minX
        }

        var groups: [[VNRecognizedTextObservation]] = []
        for observation in sorted {
            if let lastGroup = groups.last,
               let lastObservation = lastGroup.last,
               abs(observation.boundingBox.midY - lastObservation.boundingBox.midY) <= 0.02 {
                groups[groups.count - 1].append(observation)
            } else {
                groups.append([observation])
            }
        }

        return groups.compactMap { assembleLine(from: $0) }
    }

    /// Merges fragments on the same row. Wide horizontal gaps become column joins:
    /// e.g. "1 Med Plate" + "75.00" → "1 Med Plate 75.00"
    private static func assembleLine(from group: [VNRecognizedTextObservation]) -> String? {
        let sorted = group.sorted { $0.boundingBox.minX < $1.boundingBox.minX }
        guard !sorted.isEmpty else { return nil }

        var columns: [String] = []
        var current: [String] = []
        var lastMaxX: CGFloat = -1

        for observation in sorted {
            guard let text = observation.topCandidates(1).first?.string,
                  !text.trimmingCharacters(in: .whitespaces).isEmpty else { continue }

            let minX = observation.boundingBox.minX
            if lastMaxX >= 0, minX - lastMaxX > 0.12 {
                columns.append(current.joined(separator: " "))
                current = []
            }
            current.append(text)
            lastMaxX = observation.boundingBox.maxX
        }
        if !current.isEmpty {
            columns.append(current.joined(separator: " "))
        }

        let line = columns.joined(separator: " ").trimmingCharacters(in: .whitespaces)
        return line.isEmpty ? nil : line
    }
}
