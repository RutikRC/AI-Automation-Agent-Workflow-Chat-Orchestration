const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const documentRepository = require("./document.repository");
const AppError = require("../../utils/AppError");

const computeChecksum = (filePath) =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("error", (error) => reject(error));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });

const parseMetadata = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new AppError("Metadata must be valid JSON", 400);
  }
};

const parseTags = (value) => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return trimmed.split(",").map((tag) => tag.trim()).filter(Boolean);
    }
  }

  return null;
};

const uploadDocument = async (file, body, userId) => {
  const checksum = await computeChecksum(file.path);

  const documentData = {
    id: crypto.randomUUID(),
    uuid: crypto.randomUUID(),
    user_id: userId,
    title: body.title,
    original_name: file.originalname,
    stored_name: file.filename,
    mime_type: file.mimetype,
    extension: path.extname(file.originalname).replace(".", ""),
    size: file.size,
    path: path.relative(path.resolve(__dirname, "../../../"), file.path).replace(/\\/g, "/"),
    version: body.version ? Number(body.version) : 1,
    status: body.status || "uploaded",
    processing_stage: body.processing_stage || "pending",
    checksum,
    description: body.description || null,
    tags: parseTags(body.tags),
    metadata: parseMetadata(body.metadata),
  };

  const document = await documentRepository.createDocument(documentData);
  return document;
};

const listDocuments = async ({
  page = 1,
  limit = 20,
  search,
  status,
  processing_stage,
  sort_by = "created_at",
  order = "desc",
  user_id,
}) => {
  return documentRepository.listDocuments({
    page,
    limit,
    search,
    status,
    processing_stage,
    sort_by,
    order,
    user_id,
  });
};

const getDocumentById = async (id) => {
  return documentRepository.getDocumentById(id);
};

const updateDocumentMetadata = async (id, metadata) => {
  const parsedMetadata = parseMetadata(metadata);
  return documentRepository.updateDocumentMetadata(id, parsedMetadata);
};

const softDeleteDocument = async (id) => {
  return documentRepository.softDeleteDocument(id);
};

const restoreDocument = async (id) => {
  return documentRepository.restoreDocument(id);
};

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentById,
  updateDocumentMetadata,
  softDeleteDocument,
  restoreDocument,
};
