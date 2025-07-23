const { MongoClient } = require('mongodb');
require('dotenv').config();

let db;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('MongoDB conectado com sucesso!');
    return db;
  } catch (error) {
    console.error('Erro ao conectar com MongoDB:', error);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Base de dados não inicializada. Chame connectDB() primeiro.');
  }
  return db;
};

module.exports = { connectDB, getDB };