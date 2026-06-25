const pool = require("../../config/db");

/**
 * Create a new user
 */
const createUser = async (username, email, password) => {
    const query = `
        INSERT INTO users (username, email, password)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, created_at;
    `;

    const values = [username, email, password];

    const { rows } = await pool.query(query, values);

    return rows[0];
};

/**
 * Find user by email
 */
const findUserByEmail = async (email) => {
    const query = `
        SELECT *
        FROM users
        WHERE email = $1;
    `;

    const { rows } = await pool.query(query, [email]);

    return rows[0];
};

/**
 * Find user by ID
 */
const findUserById = async (id) => {
    const query = `
        SELECT id, username, email
        FROM users
        WHERE id = $1;
    `;

    const { rows } = await pool.query(query, [id]);

    return rows[0];
};

/**
 * Save refresh token
 */
const updateRefreshToken = async (userId, refreshToken) => {
    const query = `
        UPDATE users
        SET refresh_token = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2;
    `;

    await pool.query(query, [refreshToken, userId]);
};

/**
 * Find user by refresh token
 */
const findUserByRefreshToken = async (refreshToken) => {
    const query = `
        SELECT *
        FROM users
        WHERE refresh_token = $1;
    `;

    const { rows } = await pool.query(query, [refreshToken]);

    return rows[0];
};

/**
 * Remove refresh token (Logout)
 */
const removeRefreshToken = async (userId) => {
    const query = `
        UPDATE users
        SET refresh_token = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
    `;

    await pool.query(query, [userId]);
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    updateRefreshToken,
    findUserByRefreshToken,
    removeRefreshToken,
};