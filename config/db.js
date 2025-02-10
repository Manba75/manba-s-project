import pg from 'pg'
import  dotenv from 'dotenv'

dotenv.config();

const {Pool}=pg

const db = new Pool({
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
});

export default  db;