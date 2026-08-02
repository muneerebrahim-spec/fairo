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

            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            try handler.perform([request])

            let lines = (request.results ?? []).compactMap { observation in
                observation.topCandidates(1).first?.string
            }
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
}
