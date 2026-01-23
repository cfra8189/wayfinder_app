import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'creator',
        business_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(100) DEFAULT 'single',
        status VARCHAR(50) DEFAULT 'concept',
        description TEXT,
        collaborators JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        copyright_info JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS project_documents (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        doc_type VARCHAR(100) NOT NULL,
        title VARCHAR(255),
        content TEXT,
        file_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS studio_clients (
        id SERIAL PRIMARY KEY,
        studio_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        client_name VARCHAR(255) NOT NULL,
        client_email VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Database tables initialized");
  } finally {
    client.release();
  }
}

export async function createUser(email, passwordHash, name, role = "creator", businessName = null) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, role, business_name) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, business_name, created_at`,
    [email, passwordHash, name, role, businessName]
  );
  return result.rows[0];
}

export async function getUserByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
}

export async function getUserById(id) {
  const result = await pool.query(
    "SELECT id, email, name, role, business_name, created_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

export async function createProject(userId, title, type = "single", description = "") {
  const result = await pool.query(
    `INSERT INTO projects (user_id, title, type, description) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, title, type, description]
  );
  return result.rows[0];
}

export async function getProjectsByUser(userId) {
  const result = await pool.query(
    "SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC",
    [userId]
  );
  return result.rows;
}

export async function getProjectById(projectId, userId) {
  const result = await pool.query(
    "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
    [projectId, userId]
  );
  return result.rows[0];
}

export async function updateProject(projectId, userId, updates) {
  const { title, type, status, description, collaborators, metadata } = updates;
  const result = await pool.query(
    `UPDATE projects 
     SET title = COALESCE($1, title),
         type = COALESCE($2, type),
         status = COALESCE($3, status),
         description = COALESCE($4, description),
         collaborators = COALESCE($5, collaborators),
         metadata = COALESCE($6, metadata),
         updated_at = NOW()
     WHERE id = $7 AND user_id = $8
     RETURNING *`,
    [title, type, status, description, 
     collaborators ? JSON.stringify(collaborators) : null,
     metadata ? JSON.stringify(metadata) : null,
     projectId, userId]
  );
  return result.rows[0];
}

export async function deleteProject(projectId, userId) {
  await pool.query("DELETE FROM projects WHERE id = $1 AND user_id = $2", [projectId, userId]);
}

export async function addProjectDocument(projectId, docType, title, content, fileUrl = null) {
  const result = await pool.query(
    `INSERT INTO project_documents (project_id, doc_type, title, content, file_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [projectId, docType, title, content, fileUrl]
  );
  return result.rows[0];
}

export async function getProjectDocuments(projectId) {
  const result = await pool.query(
    "SELECT * FROM project_documents WHERE project_id = $1 ORDER BY created_at DESC",
    [projectId]
  );
  return result.rows;
}

export async function addStudioClient(studioId, clientName, clientEmail, notes = "") {
  const result = await pool.query(
    `INSERT INTO studio_clients (studio_id, client_name, client_email, notes)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [studioId, clientName, clientEmail, notes]
  );
  return result.rows[0];
}

export async function getStudioClients(studioId) {
  const result = await pool.query(
    "SELECT * FROM studio_clients WHERE studio_id = $1 ORDER BY created_at DESC",
    [studioId]
  );
  return result.rows;
}

export default pool;
