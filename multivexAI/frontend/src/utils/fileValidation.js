export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export const TYPE_ERROR_MESSAGE = "Only PDF, Word, PowerPoint, Excel, image, and text files are supported."
export const SIZE_ERROR_MESSAGE = "Each file must be 10 MB or smaller."

// Mirrors the backend whitelist (config/fileValidation.js).
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

export const ACCEPT_ATTRIBUTE = Object.keys(ALLOWED_FILE_TYPES)
    .map((ext) => `.${ext}`)
    .join(",")

export const getExtension = (filename) => {
    const name = filename || ""
    const dot = name.lastIndexOf(".")
    return dot === -1 ? "" : name.slice(dot + 1).toLowerCase()
}

// Client-side validation for immediate feedback. The server independently
// re-validates extension, MIME type, and magic bytes — this is UX only.
export const validateFile = (file) => {
    if (!file) return null

    const ext = getExtension(file.name)
    const allowedMimes = ALLOWED_FILE_TYPES[ext]

    if (!allowedMimes) {
        return TYPE_ERROR_MESSAGE
    }

    const mimetype = (file.type || "").split(";")[0].trim().toLowerCase()
    if (!allowedMimes.includes(mimetype)) {
        return TYPE_ERROR_MESSAGE
    }

    if (file.size > MAX_FILE_SIZE) {
        return SIZE_ERROR_MESSAGE
    }

    return null
}
