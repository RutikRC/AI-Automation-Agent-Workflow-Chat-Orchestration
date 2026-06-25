const axios = require("axios");
const AppError = require("../../../utils/AppError");
const logger = require("../../../utils/logger");

const DEFAULT_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || "60000", 10);
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Reusable AI Service HTTP client.
 *
 * Centralises all outbound calls to the Python AI micro-service so that
 * connection configuration (base URL, timeout, error handling) lives in
 * one place.  Add new methods here as the pipeline grows.
 */
class AIClient {
  constructor() {
    this.client = axios.create({
      baseURL: AI_SERVICE_URL,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => this._handleError(error)
    );
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Call the FastAPI extraction endpoint.
   *
   * @param {object} params
   * @param {string} params.documentId        – UUID of the document
   * @param {string} params.filePath          – absolute or relative path to the file
   * @param {string} [params.traceId]         – optional correlation id
   * @returns {Promise<{documentId, fileType, pages, characters, text}>}
   */
  async callExtraction({ documentId, filePath, traceId }) {
    const startTime = Date.now();

    logger.info("Calling AI extraction service", {
      documentId,
      traceId,
      filePath,
    });

    const response = await this.client.post("/api/v1/extraction/extract", {
      documentId,
      filePath,
    });

    const duration = Date.now() - startTime;
    const body = response.data;

    if (!body || !body.success) {
      throw new AppError(
        body?.message || "AI extraction service returned unsuccessful response",
        response.status
      );
    }

    const { data } = body;

    logger.info("AI extraction completed", {
      documentId,
      traceId,
      httpStatus: response.status,
      executionTimeMs: duration,
      pages: data?.pages,
      characters: data?.characters,
      fileType: data?.fileType,
    });

    return {
      documentId: data.documentId,
      fileType: data.fileType,
      pages: data.pages,
      characters: data.characters,
      text: data.text,
    };
  }

  // ---------------------------------------------------------------------------
  // Chunking
  // ---------------------------------------------------------------------------

  /**
   * Call the FastAPI chunking endpoint.
   *
   * @param {string} text  – The full extracted text to be split into chunks.
   * @returns {Promise<{chunks: Array<{chunk_index, text, character_count, token_count}>}>}
   */
  async callChunking(text) {
    const startTime = Date.now();

    logger.info("Calling AI chunking service", {
      inputChars: text?.length || 0,
    });

    const response = await this.client.post("/api/v1/chunking/chunk", {
      text,
    });

    const duration = Date.now() - startTime;
    const body = response.data;

    if (!body || !body.success) {
      throw new AppError(
        body?.message || "AI chunking service returned unsuccessful response",
        response.status
      );
    }

    const { data } = body;
    const chunks = data?.chunks || [];

    logger.info("AI chunking completed", {
      httpStatus: response.status,
      executionTimeMs: duration,
      chunkCount: chunks.length,
    });

    return { chunks };
  }

  // ---------------------------------------------------------------------------
  // Placeholder stubs for future pipeline stages (no implementation)
  // ---------------------------------------------------------------------------

  async callEmbedding() {
    throw new AppError("Embedding not implemented", 501);
  }

  async callRag() {
    throw new AppError("RAG not implemented", 501);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Centralised Axios error handler.
   * Converts network / timeout / HTTP errors into a consistent AppError.
   */
  _handleError(error) {
    if (error.code === "ECONNABORTED") {
      logger.error("AI service request timed out", {
        timeout: this.client.defaults.timeout,
      });
      return Promise.reject(
        new AppError("AI service request timed out", 504)
      );
    }

    if (error.code === "ECONNREFUSED") {
      logger.error("AI service connection refused", {
        baseURL: this.client.defaults.baseURL,
      });
      return Promise.reject(
        new AppError("AI service is unavailable (connection refused)", 503)
      );
    }

    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.message ||
        `AI service responded with status ${status}`;
      return Promise.reject(new AppError(message, status));
    }

    // Network or unknown error
    logger.error("AI service network error", {
      message: error.message,
    });
    return Promise.reject(
      new AppError(`AI service network error: ${error.message}`, 502)
    );
  }
}

// Singleton export
const aiClient = new AIClient();

module.exports = aiClient;