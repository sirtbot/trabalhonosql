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
        $unwind: { path: '$autor', preserveNullAndEmptyArrays: true }
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
          nome_autor: { $ifNull: ['$autor.nome', 'Autor desconhecido'] },
          nomeAutor: { $ifNull: ['$autor.nome', 'Autor desconhecido'] },
          media_avaliacoes: {
            $cond: {
              if: { $gt: [{ $size: '$avaliacoes' }, 0] },
              then: { $avg: '$avaliacoes.pontuacao' },
              else: 0
            }
          },
          total_avaliacoes: { $size: '$avaliacoes' }
        }
      },
      {
        $project: {
          titulo: 1,
          genero: 1,
          anoPublicacao: 1,
          ano_publicacao: '$anoPublicacao',
          isbn: 1,
          resumo: 1,
          descricao: '$resumo',
          palavrasChave: 1,
          nome_autor: 1,
          nomeAutor: 1,
          autorId: 1,
          criadoEm: 1,
          media_avaliacoes: 1,
          total_avaliacoes: 1
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

  // NEW FEATURE 1: Book Statistics and Analytics
  static async getStatistics() {
    const db = getDB();
    console.log('Getting statistics...');
    
    try {
      // Total number of books
      const totalBooks = await db.collection('livros').countDocuments();
      
      // Total number of unique genres
      const genres = await db.collection('livros').distinct('genero');
      const totalGenres = genres.length;
      
      // Average rating across all books
      const avgResult = await db.collection('avaliacoes').aggregate([
        { $group: { _id: null, avgRating: { $avg: '$pontuacao' } } }
      ]).toArray();
      const averageRating = avgResult[0]?.avgRating || 0;
      
      // Genre distribution
      const genreDistribution = await db.collection('livros').aggregate([
        { $group: { _id: '$genero', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      // Recent books (last 5 added)
      const recentBooks = await db.collection('livros').aggregate([
        {
          $lookup: {
            from: 'autores',
            localField: 'autorId',
            foreignField: '_id',
            as: 'autor'
          }
        },
        { $unwind: { path: '$autor', preserveNullAndEmptyArrays: true } },
        { $sort: { criadoEm: -1 } },
        { $limit: 5 },
        {
          $project: {
            titulo: 1,
            nomeAutor: { $ifNull: ['$autor.nome', 'Autor desconhecido'] },
            genero: 1,
            criadoEm: 1
          }
        }
      ]).toArray();

      // Top rated books
      const topRatedBooks = await db.collection('livros').aggregate([
        {
          $lookup: {
            from: 'avaliacoes',
            localField: '_id',
            foreignField: 'livroId',
            as: 'avaliacoes'
          }
        },
        {
          $lookup: {
            from: 'autores',
            localField: 'autorId',
            foreignField: '_id',
            as: 'autor'
          }
        },
        { $unwind: { path: '$autor', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            avgRating: {
              $cond: {
                if: { $gt: [{ $size: '$avaliacoes' }, 0] },
                then: { $avg: '$avaliacoes.pontuacao' },
                else: 0
              }
            },
            totalRatings: { $size: '$avaliacoes' }
          }
        },
        { $match: { totalRatings: { $gte: 1 } } },
        { $sort: { avgRating: -1, totalRatings: -1 } },
        { $limit: 5 },
        {
          $project: {
            titulo: 1,
            nomeAutor: { $ifNull: ['$autor.nome', 'Autor desconhecido'] },
            avgRating: 1,
            totalRatings: 1
          }
        }
      ]).toArray();

      // Year distribution
      const yearDistribution = await db.collection('livros').aggregate([
        { $group: { _id: '$anoPublicacao', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 10 }
      ]).toArray();

      return {
        overview: {
          totalBooks,
          totalGenres,
          averageRating: Math.round(averageRating * 10) / 10
        },
        topRatedBooks,
        genreDistribution,
        yearDistribution,
        recentBooks
      };
    } catch (error) {
      console.error('Error in getStatistics:', error);
      throw error;
    }
  }

  // NEW FEATURE 2: Advanced Recommendations
  static async getRecommendations(bookId, limit = 5) {
    const db = getDB();
    console.log('Getting recommendations for book:', bookId);
    
    try {
      // Get the target book details
      const targetBook = await this.findById(bookId);
      if (!targetBook) {
        throw new Error('Livro não encontrado');
      }

      // Find similar books based on genre and author (simplified)
      const recommendations = await db.collection('livros').aggregate([
        // Exclude the target book
        { $match: { _id: { $ne: new ObjectId(bookId) } } },
        
        // Lookup author
        {
          $lookup: {
            from: 'autores',
            localField: 'autorId',
            foreignField: '_id',
            as: 'autor'
          }
        },
        { $unwind: { path: '$autor', preserveNullAndEmptyArrays: true } },
        
        // Lookup ratings
        {
          $lookup: {
            from: 'avaliacoes',
            localField: '_id',
            foreignField: 'livroId',
            as: 'avaliacoes'
          }
        },
        
        // Calculate similarity score and ratings
        {
          $addFields: {
            avgRating: {
              $cond: {
                if: { $gt: [{ $size: '$avaliacoes' }, 0] },
                then: { $avg: '$avaliacoes.pontuacao' },
                else: 0
              }
            },
            totalRatings: { $size: '$avaliacoes' },
            similarityScore: {
              $add: [
                // Same genre bonus
                { $cond: [{ $eq: ['$genero', targetBook.genero] }, 3, 0] },
                // Same author bonus
                { $cond: [{ $eq: ['$autorId', targetBook.autorId] }, 2, 0] },
                // Random bonus for diversity
                { $literal: Math.random() }
              ]
            },
            reason: {
              $switch: {
                branches: [
                  {
                    case: { $and: [
                      { $eq: ['$genero', targetBook.genero] },
                      { $eq: ['$autorId', targetBook.autorId] }
                    ]},
                    then: 'Mesmo autor e género'
                  },
                  {
                    case: { $eq: ['$genero', targetBook.genero] },
                    then: 'Mesmo género'
                  },
                  {
                    case: { $eq: ['$autorId', targetBook.autorId] },
                    then: 'Mesmo autor'
                  }
                ],
                default: 'Livro similar'
              }
            }
          }
        },
        
        // Sort by similarity score and average rating
        { $sort: { similarityScore: -1, avgRating: -1, totalRatings: -1 } },
        { $limit: limit },
        
        {
          $project: {
            titulo: 1,
            genero: 1,
            anoPublicacao: 1,
            nomeAutor: { $ifNull: ['$autor.nome', 'Autor desconhecido'] },
            avgRating: 1,
            totalRatings: 1,
            similarityScore: 1,
            reason: 1
          }
        }
      ]).toArray();

      return {
        targetBook: {
          titulo: targetBook.titulo,
          nomeAutor: targetBook.nomeAutor || 'Autor desconhecido',
          genero: targetBook.genero
        },
        recommendations
      };
    } catch (error) {
      console.error('Error in getRecommendations:', error);
      throw error;
    }
  }
}

module.exports = Book;