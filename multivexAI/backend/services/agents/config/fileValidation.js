import fs from "fs"

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export const TYPE_ERROR_MESSAGE = "Only PDF, Word, PowerPoint, Excel, image, and text files are supported."
export const SIZE_ERROR_MESSAGE = "Each file must be 10 MB or smaller."

// Supported file types mapped to their allowed extensions and MIME types.
// The MIME check rejects spoofed Content-Type headers; the magic-byte check
// (validateFileSignature) rejects files renamed to a allowed extension.
export const ALLOWED_FILE_TYPES = {
    pdf:  ["application/pdf"],
    doc:  ["application/msword"],
    docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ppt:  ["application/vnd.ms-powerpoint"],
    pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    xls:  ["application/vnd.ms-excel"],
    xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    jpg:  ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png:  ["image/png"],
    gif:  ["image/gif"],
    webp: ["image/webp"],
    txt:  ["text/plain"],
}

export const getExtension = (filename) => {
    const name = filename || ""
    const dot = name.lastIndexOf(".")
    return dot === -1 ? "" : name.slice(dot + 1).toLowerCase()
}

// Checks the file name extension and the client-declared MIME type.
// Returns an error message, or null when the file is allowed.
export const validateFileMeta = (file) => {
    if (!file) return null

    const ext = getExtension(file.originalname)
    const allowedMimes = ALLOWED_FILE_TYPES[ext]

    if (!allowedMimes) {
        return TYPE_ERROR_MESSAGE
    }

    // Strip parameters like "; charset=UTF-8" before comparing.
    const mimetype = (file.mimetype || "").split(";")[0].trim().toLowerCase()
    if (!allowedMimes.includes(mimetype)) {
        return TYPE_ERROR_MESSAGE
    }

    if (file.size !== undefined && file.size > MAX_FILE_SIZE) {
        return SIZE_ERROR_MESSAGE
    }

    return null
}

// Magic-byte signatures for each supported binary format.
const SIGNATURES = {
    pdf:  [[0x25, 0x50, 0x44, 0x46]],                                    // %PDF
    doc:  [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],            // OLE2 (doc/ppt/xls)
    ppt:  [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
    xls:  [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
    docx: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06], [0x50, 0x4B, 0x07, 0x08]], // ZIP (OOXML)
    pptx: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06], [0x50, 0x4B, 0x07, 0x08]],
    xlsx: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06], [0x50, 0x4B, 0x07, 0x08]],
    jpg:  [[0xFF, 0xD8, 0xFF]],
    jpeg: [[0xFF, 0xD8, 0xFF]],
    png:  [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    gif:  [[0x47, 0x49, 0x46, 0x38]],                                    // GIF8
}

const startsWith = (buffer, signature) =>
    signature.every((byte, i) => buffer[i] === byte)

// Reads the file from disk and verifies its magic bytes match its extension,
// so a renamed executable (or any mismatched content) is rejected.
// Returns an error message, or null when the content matches the type.
export const validateFileSignature = (filePath, originalname) => {
    const ext = getExtension(originalname)
    const signatures = SIGNATURES[ext]

    // Plain text has no signature — instead reject files containing NUL bytes,
    // which binary content renamed to .txt would almost always have.
    if (ext === "txt") {
        const head = fs.readFileSync(filePath).subarray(0, 4096)
        for (const byte of head) {
            if (byte === 0) return TYPE_ERROR_MESSAGE
        }
        return null
    }

    if (!signatures) return null

    const head = fs.readFileSync(filePath).subarray(0, 16)

    // WEBP: "RIFF" at 0 and "WEBP" at offset 8.
    if (ext === "webp") {
        const isRiff = startsWith(head, [0x52, 0x49, 0x46, 0x46])
        const isWebp = head.length >= 12 &&
            [0x57, 0x45, 0x42, 0x50].every((byte, i) => head[8 + i] === byte)
        return isRiff && isWebp ? null : TYPE_ERROR_MESSAGE
    }

    const matches = signatures.some((signature) => startsWith(head, signature))
    return matches ? null : TYPE_ERROR_MESSAGE
}
