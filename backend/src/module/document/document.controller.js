const path = require("path");
const documentService = require("./document.service");
const { enqueueDocumentReceived } = require("../queues/producers/document.producer");
const AppError = require("../../utils/AppError");

const uploadDocument = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      throw new AppError("A file is required", 400);
    }

    const userId = req.user?.id || req.body.user_id || null;
    const document = await documentService.uploadDocument(file, req.body, userId);

    await enqueueDocumentReceived({
      documentId: document.id,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

const listDocuments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      processing_stage,
      sort_by = "created_at",
      order = "desc",
      user_id,
    } = req.query;

    const documents = await documentService.listDocuments({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
      processing_stage,
      sort_by,
      order,
      user_id,
    });

    return res.status(200).json({
      success: true,
      data: documents.data,
      meta: documents.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

const updateDocumentMetadata = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { metadata } = req.body;
    const document = await documentService.updateDocumentMetadata(id, metadata);

    return res.status(200).json({
      success: true,
      message: "Document metadata updated successfully",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);

    const downloadPath = path.resolve(__dirname, "../../../", document.path);

    return res.download(downloadPath, document.original_name);
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    await documentService.softDeleteDocument(id);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const restoreDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await documentService.restoreDocument(id);

    return res.status(200).json({
      success: true,
      message: "Document restored successfully",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  listDocuments,
  getDocumentById,
  updateDocumentMetadata,
  downloadDocument,
  deleteDocument,
  restoreDocument,
};
