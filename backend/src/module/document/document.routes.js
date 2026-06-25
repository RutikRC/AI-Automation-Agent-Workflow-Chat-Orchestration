const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const documentController = require("./document.controller");
const documentValidator = require("./document.validator");
const validate = require("../../middlewares/validate.middleware");

const uploadsDir = path.resolve(__dirname, "../../../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "");
    const extension = path.extname(safeName);
    const name = path.basename(safeName, extension);
    cb(null, `${name}-${timestamp}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error("Only PDF, DOC and DOCX files are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

const router = express.Router();

router.post(
  "/upload",
  upload.single("file"),
  documentValidator.uploadDocumentValidator,
  validate,
  documentController.uploadDocument
);

router.get("/", documentController.listDocuments);
router.get("/:id/download", documentController.downloadDocument);
router.patch("/:id/restore", documentController.restoreDocument);
router.patch(
  "/:id",
  documentValidator.patchMetadataValidator,
  validate,
  documentController.updateDocumentMetadata
);
router.delete("/:id", documentController.deleteDocument);
router.get("/:id", documentController.getDocumentById);

module.exports = router;
