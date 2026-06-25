const pool = require("../../config/db");
const AppError = require("../../utils/AppError");

const createDocument = async (document) => {
  const query = `
    INSERT INTO documents (
      id,
      uuid,
      user_id,
      title,
      original_name,
      stored_name,
      mime_type,
      extension,
      size,
      path,
      version,
      status,
      processing_stage,
      checksum,
      description,
      tags,
      metadata,
      is_deleted
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14, $15, $16,
      $17, $18
    )
    RETURNING *;
  `;

  const values = [
    document.id,
    document.uuid,
    document.user_id,
    document.title,
    document.original_name,
    document.stored_name,
    document.mime_type,
    document.extension,
    document.size,
    document.path,
    document.version,
    document.status,
    document.processing_stage,
    document.checksum,
    document.description,
    document.tags ? JSON.stringify(document.tags) : null,
    document.metadata ? JSON.stringify(document.metadata) : null,
    false,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

const listDocuments = async ({
  page = 1,
  limit = 20,
  search,
  status,
  processing_stage,
  sort_by = "created_at",
  order = "desc",
  user_id = null,
}) => {
  const offset = (page - 1) * limit;
  const where = ["is_deleted = false"];
  const values = [];

  if (user_id) {
    values.push(user_id);
    where.push(`user_id = $${values.length}`);
  }

  if (status) {
    values.push(status);
    where.push(`status = $${values.length}`);
  }

  if (processing_stage) {
    values.push(processing_stage);
    where.push(`processing_stage = $${values.length}`);
  }

  if (search) {
    const searchTerm = `%${search}%`;
    values.push(searchTerm, searchTerm, searchTerm);
    where.push(`(title ILIKE $${values.length - 2} OR original_name ILIKE $${values.length - 1} OR description ILIKE $${values.length})`);
  }

  const allowedSortBy = new Set([
    "created_at",
    "updated_at",
    "title",
    "size",
    "version",
    "status",
    "processing_stage",
  ]);
  const sortColumn = allowedSortBy.has(sort_by) ? sort_by : "created_at";
  const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

  values.push(limit);
  values.push(offset);

  const query = `
    SELECT *, COUNT(*) OVER() AS total_count
    FROM documents
    WHERE ${where.join(" AND ")}
    ORDER BY ${sortColumn} ${sortOrder}
    LIMIT $${values.length - 1}
    OFFSET $${values.length};
  `;

  const { rows } = await pool.query(query, values);
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

  return {
    data: rows.map(({ total_count, ...rest }) => rest),
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

const getDocumentById = async (id) => {
  const query = `
    SELECT *
    FROM documents
    WHERE id = $1
      AND is_deleted = false;
  `;

  const { rows } = await pool.query(query, [id]);

  if (!rows[0]) {
    throw new AppError("Document not found", 404);
  }

  return rows[0];
};

const updateDocumentMetadata = async (id, metadata) => {
  const query = `
    UPDATE documents
    SET metadata = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
      AND is_deleted = false
    RETURNING *;
  `;

  const values = [metadata ? JSON.stringify(metadata) : null, id];

  const { rows } = await pool.query(query, values);

  if (!rows[0]) {
    throw new AppError("Document not found", 404);
  }

  return rows[0];
};

const softDeleteDocument = async (id) => {
  const query = `
    UPDATE documents
    SET is_deleted = true,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND is_deleted = false
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [id]);

  if (!rows[0]) {
    throw new AppError("Document not found", 404);
  }

  return rows[0];
};

const restoreDocument = async (id) => {
  const query = `
    UPDATE documents
    SET is_deleted = false,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND is_deleted = true
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [id]);

  if (!rows[0]) {
    throw new AppError("Document not found or not deleted", 404);
  }

  return rows[0];
};

module.exports = {
  createDocument,
  listDocuments,
  getDocumentById,
  updateDocumentMetadata,
  softDeleteDocument,
  restoreDocument,
};
