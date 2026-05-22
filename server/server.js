import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3001;

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());
app.use(express.json());

/* =========================
   PATHS
========================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   NEON / POSTGRES CONNECTION
========================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log('NeonDB conectado correctamente'))
  .catch(err => console.error('Error conectando NeonDB:', err));

/* =========================
   CREAR TABLA
========================= */

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bis_records (
        id SERIAL PRIMARY KEY,
        patient_name TEXT,
        edad INTEGER,
        nurse_name TEXT,
        score INTEGER,
        aciertos INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tabla verificada correctamente');
  } catch (err) {
    console.error('Error creando tabla:', err);
  }
};

initDB();

/* =========================
   OBTENER REGISTROS
========================= */

app.get('/api/records', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM bis_records ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo registros:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GUARDAR REGISTRO
========================= */

app.post('/api/records', async (req, res) => {
  const {
    patient_name,
    edad,
    nurse_name,
    score,
    aciertos
  } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO bis_records
      (patient_name, edad, nurse_name, score, aciertos)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        patient_name,
        edad,
        nurse_name,
        score,
        aciertos
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Error insertando registro:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   ELIMINAR REGISTRO
========================= */

app.delete('/api/records/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `DELETE FROM bis_records WHERE id = $1`,
      [id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error('Error eliminando registro:', err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   FRONTEND VITE
========================= */

const distPath = path.join(__dirname, '../dist');

app.use(express.static(distPath));

app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});