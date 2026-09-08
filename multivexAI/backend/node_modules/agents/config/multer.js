import fs from "fs"
import path from "path"
import multer from "multer"
import { MAX_FILE_SIZE, validateFileMeta } from "./fileValidation.js"

const uploadDir = path.resolve("./temp")

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir)
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()} - ${file.originalname}`)
    },
})

const fileFilter = (req, file, cb) => {
    const error = validateFileMeta(file)
    if (error) {
        // Pass the message on the error so the express error handler can
        // surface it to the client verbatim.
        const err = new Error(error)
        err.status = 400
        return cb(err)
    }
    cb(null, true)
}

export default multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } })
