const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

class Author {
  constructor(data) {
    this.nome = data.nome;
    this.nacionalidade = data.nacionalidade;
    this.anoNascimento = data.anoNascimento;
    this.biografia = data.biografia;
    this.criadoEm = new Date();
  }

  static async create(authorData) {
    const db = getDB();
    const author = new Author(authorData);
    const result = await db.collection('autores').insertOne(author);
    return { ...author, _id: result.insertedId };
  }

  static async findAll() {
    const db = getDB();
    return await db.collection('autores').find({}).toArray();
  }

  static async findById(id) {
    const db = getDB();
    return await db.collection('autores').findOne({ _id: new ObjectId(id) });
  }

  static async update(id, updateData) {
    const db = getDB();
    const result = await db.collection('autores').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, atualizadoEm: new Date() } }
    );
    return result;
  }

  static async delete(id) {
    const db = getDB();
    
    const livrosComAutor = await db.collection('livros').findOne({ autorId: new ObjectId(id) });
    if (livrosComAutor) {
      throw new Error('Não é possível remover autor. Existem livros associados a este autor.');
    }
    
    const result = await db.collection('autores').deleteOne({ _id: new ObjectId(id) });
    return result;
  }

  static async exists(id) {
    const db = getDB();
    const count = await db.collection('autores').countDocuments({ _id: new ObjectId(id) });
    return count > 0;
  }
}

module.exports = Author;