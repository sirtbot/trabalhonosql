const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

class Review {
  constructor(data) {
    this.livroId = new ObjectId(data.livroId);
    this.nomeUtilizador = data.nomeUtilizador;
    this.pontuacao = data.pontuacao;
    this.comentario = data.comentario;
    this.criadoEm = new Date();
  }

  static async create(reviewData) {
    const db = getDB();
    
    if (reviewData.pontuacao < 1 || reviewData.pontuacao > 5) {
      throw new Error('A pontuação deve estar entre 1 e 5.');
    }

    const review = new Review(reviewData);
    const result = await db.collection('avaliacoes').insertOne(review);
    return { ...review, _id: result.insertedId };
  }

  static async findAll() {
    const db = getDB();
    return await db.collection('avaliacoes').aggregate([
      {
        $lookup: {
          from: 'livros',
          localField: 'livroId',
          foreignField: '_id',
          as: 'livro'
        }
      },
      {
        $unwind: '$livro'
      },
      {
        $addFields: {
          tituloLivro: '$livro.titulo'
        }
      },
      {
        $project: {
          nomeUtilizador: 1,
          pontuacao: 1,
          comentario: 1,
          tituloLivro: 1,
          criadoEm: 1
        }
      },
      {
        $sort: { criadoEm: -1 }
      }
    ]).toArray();
  }

  static async findByBookId(bookId) {
    const db = getDB();
    return await db.collection('avaliacoes').find({ 
      livroId: new ObjectId(bookId) 
    }).sort({ criadoEm: -1 }).toArray();
  }

  static async findById(id) {
    const db = getDB();
    return await db.collection('avaliacoes').findOne({ _id: new ObjectId(id) });
  }

  static async update(id, updateData) {
    const db = getDB();
    
    if (updateData.pontuacao && (updateData.pontuacao < 1 || updateData.pontuacao > 5)) {
      throw new Error('A pontuação deve estar entre 1 e 5.');
    }

    const result = await db.collection('avaliacoes').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, atualizadoEm: new Date() } }
    );
    return result;
  }

  static async delete(id) {
    const db = getDB();
    const result = await db.collection('avaliacoes').deleteOne({ _id: new ObjectId(id) });
    return result;
  }

  static async getBookStats(bookId) {
    const db = getDB();
    const stats = await db.collection('avaliacoes').aggregate([
      { $match: { livroId: new ObjectId(bookId) } },
      {
        $group: {
          _id: null,
          mediaPontuacao: { $avg: '$pontuacao' },
          totalAvaliacoes: { $sum: 1 },
          pontuacaoMaxima: { $max: '$pontuacao' },
          pontuacaoMinima: { $min: '$pontuacao' }
        }
      }
    ]).toArray();

    return stats.length > 0 ? stats[0] : {
      mediaPontuacao: 0,
      totalAvaliacoes: 0,
      pontuacaoMaxima: 0,
      pontuacaoMinima: 0
    };
  }
}

module.exports = Review;