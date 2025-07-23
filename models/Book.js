const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

class Book {
  constructor(data) {
    this.titulo = data.titulo;
    this.autorId = new ObjectId(data.autorId);
    this.genero = data.genero;
    this.anoPublicacao = data.anoPublicacao;
    this.isbn = data.isbn;
    this.resumo = data.resumo;
    this.palavrasChave = data.palavrasChave || [];
    this.criadoEm = new Date();
  }

  static async create(bookData) {
    const db = getDB();
    const book = new Book(bookData);
    const result = await db.collection('livros').insertOne(book);
    return { ...book, _id: result.insertedId };
  }

  static async findAll() {
    const db = getDB();
    return await db.collection('livros').aggregate([
      {
        $lookup: {
          from: 'autores',
          localField: 'autorId',
          foreignField: '_id',
          as: 'autor'
        }
      },
      {
        $unwind: '$autor'
      },
      {
        $addFields: {
          nomeAutor: '$autor.nome'
        }
      },
      {
        $project: {
          titulo: 1,
          genero: 1,
          anoPublicacao: 1,
          isbn: 1,
          resumo: 1,
          palavrasChave: 1,
          nomeAutor: 1,
          autorId: 1,
          criadoEm: 1
        }
      }
    ]).toArray();
  }

  static async findById(id) {
    const db = getDB();
    const result = await db.collection('livros').aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'autores',
          localField: 'autorId',
          foreignField: '_id',
          as: 'autor'
        }
      },
      {
        $unwind: '$autor'
      },
      {
        $addFields: {
          nomeAutor: '$autor.nome'
        }
      }
    ]).toArray();
    
    return result.length > 0 ? result[0] : null;
  }

  static async findWithRatings() {
    const db = getDB();
    return await db.collection('livros').aggregate([
      {
        $lookup: {
          from: 'autores',
          localField: 'autorId',
          foreignField: '_id',
          as: 'autor'
        }
      },
      {
        $unwind: '$autor'
      },
      {
        $lookup: {
          from: 'avaliacoes',
          localField: '_id',
          foreignField: 'livroId',
          as: 'avaliacoes'
        }
      },
      {
        $addFields: {
          nomeAutor: '$autor.nome',
          mediaPontuacao: {
            $cond: {
              if: { $gt: [{ $size: '$avaliacoes' }, 0] },
              then: { $avg: '$avaliacoes.pontuacao' },
              else: 0
            }
          },
          totalAvaliacoes: { $size: '$avaliacoes' }
        }
      },
      {
        $sort: { mediaPontuacao: -1 }
      },
      {
        $project: {
          titulo: 1,
          genero: 1,
          anoPublicacao: 1,
          nomeAutor: 1,
          mediaPontuacao: 1,
          totalAvaliacoes: 1
        }
      }
    ]).toArray();
  }

  static async search(filters) {
    const db = getDB();
    const query = {};

    if (filters.genero) {
      query.genero = new RegExp(filters.genero, 'i');
    }

    if (filters.ano) {
      query.anoPublicacao = parseInt(filters.ano);
    }

    if (filters.palavraChave) {
      query.$or = [
        { titulo: new RegExp(filters.palavraChave, 'i') },
        { resumo: new RegExp(filters.palavraChave, 'i') },
        { palavrasChave: { $in: [new RegExp(filters.palavraChave, 'i')] } }
      ];
    }

    return await db.collection('livros').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'autores',
          localField: 'autorId',
          foreignField: '_id',
          as: 'autor'
        }
      },
      {
        $unwind: '$autor'
      },
      {
        $addFields: {
          nomeAutor: '$autor.nome'
        }
      },
      {
        $project: {
          titulo: 1,
          genero: 1,
          anoPublicacao: 1,
          nomeAutor: 1,
          resumo: 1,
          palavrasChave: 1
        }
      }
    ]).toArray();
  }

  static async update(id, updateData) {
    const db = getDB();
    if (updateData.autorId) {
      updateData.autorId = new ObjectId(updateData.autorId);
    }
    const result = await db.collection('livros').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, atualizadoEm: new Date() } }
    );
    return result;
  }

  static async delete(id) {
    const db = getDB();
    
    await db.collection('avaliacoes').deleteMany({ livroId: new ObjectId(id) });
    
    const result = await db.collection('livros').deleteOne({ _id: new ObjectId(id) });
    return result;
  }

  static async exists(id) {
    const db = getDB();
    const count = await db.collection('livros').countDocuments({ _id: new ObjectId(id) });
    return count > 0;
  }
}

module.exports = Book;