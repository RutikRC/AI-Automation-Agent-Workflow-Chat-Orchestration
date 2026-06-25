const pool = require("../../config/db");
const AppError = require("../../utils/AppError");

const CREATE_TABLE_IF_NOT_EXISTS = `
  CREATE TABLE IF NOT EXISTS document_chunks (
    id              UUID PRIMARY KEY,
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index     INTEGER NOT NULL,
    content         TEXT NOT NULL,
    character_count INTEGER NOT NULL DEFAULT 0,
    token_count     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

const CREATE_INDEX_IF_NOT_EXISTS = `
  CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
    ON document_chunks (document_id);
`;

const ensureTable = async () => {
  await pool.query(CREATE_TABLE_IF_NOT_EXISTS);
  await pool.query(CREATE_INDEX_IF_NOT_EXISTS);
};

/**
 * Insert (or replace) all chunks for a given document in a single transaction.
 *
 * Existing chunks for the same document are deleted first so that re-running
 * chunking always produces a clean slate.
 */
const saveChunks = async (chunks) => {
  await ensureTable();

  if (!chunks || chunks.length === 0) {
    throw new AppError("No chunks to save", 400);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Delete existing chunks for this document
    const documentId = chunks[0].documentId;
    await client.query(
      "DELETE FROM document_chunks WHERE document_id = $1",
      [documentId]
    );

    // Insert all chunks
    const insertQuery = `
      INSERT INTO document_chunks (id, document_id, chunk_index, content, character_count, token_count)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const chunk of chunks) {
      await client.query(insertQuery, [
        chunk.id,
        chunk.documentId,
        chunk.chunkIndex,
        chunk.content,
        chunk.characterCount,
        chunk.tokenCount,
      ]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getChunksByDocumentId = async (documentId) => {
  await ensureTable();

  const query = `
    SELECT *
    FROM document_chunks
    WHERE document_id = $1
    ORDER BY chunk_index ASC;
  `;

  const { rows } = await pool.query(query, [documentId]);
  return rows;
};

const countChunksByDocumentId = async (documentId) => {
  await ensureTable();

  const query = `
    SELECT COUNT(*)::int AS count
    FROM document_chunks
    WHERE document_id = $1;
  `;

  const { rows } = await pool.query(query, [documentId]);
  return rows[0]?.count || 0;
};

module.exports = {
  ensureTable,
  saveChunks,
  getChunksByDocumentId,
  countChunksByDocumentId,
};