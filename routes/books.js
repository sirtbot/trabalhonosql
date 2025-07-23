const express = require('express');
const Book = require('../models/Book');
const Author = require('../models/Author');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { titulo, autorId, genero, anoPublicacao, isbn, resumo, palavrasChave } = req.body;
    
    if (!titulo || !autorId || !genero) {
      return res.status(400).json({ 
        erro: 'Título, autor e género são obrigatórios' 
      });
    }

    const authorExists = await Author.exists(autorId);
    if (!authorExists) {
      return res.status(400).json({ erro: 'Autor não encontrado' });
    }

    const book = await Book.create({
      titulo,
      autorId,
      genero,
      anoPublicacao,
      isbn,
      resumo,
      palavrasChave
    });

    res.status(201).json({
      mensagem: 'Livro criado com sucesso',
      livro: book
    });
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao criar livro', 
      detalhes: error.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const books = await Book.findAll();
    res.json(books);
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao buscar livros', 
      detalhes: error.message 
    });
  }
});

router.get('/rankings', async (req, res) => {
  try {
    const booksWithRatings = await Book.findWithRatings();
    res.json(booksWithRatings);
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao buscar rankings de livros', 
      detalhes: error.message 
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { genero, ano, palavraChave } = req.query;
    
    const filters = {};
    if (genero) filters.genero = genero;
    if (ano) filters.ano = ano;
    if (palavraChave) filters.palavraChave = palavraChave;

    const books = await Book.search(filters);
    res.json(books);
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao pesquisar livros', 
      detalhes: error.message 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ erro: 'Livro não encontrado' });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao buscar livro', 
      detalhes: error.message 
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { titulo, autorId, genero, anoPublicacao, isbn, resumo, palavrasChave } = req.body;
    
    if (autorId) {
      const authorExists = await Author.exists(autorId);
      if (!authorExists) {
        return res.status(400).json({ erro: 'Autor não encontrado' });
      }
    }

    const result = await Book.update(req.params.id, {
      titulo,
      autorId,
      genero,
      anoPublicacao,
      isbn,
      resumo,
      palavrasChave
    });

    if (result.matchedCount === 0) {
      return res.status(404).json({ erro: 'Livro não encontrado' });
    }

    res.json({ mensagem: 'Livro atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao atualizar livro', 
      detalhes: error.message 
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Book.delete(req.params.id);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ erro: 'Livro não encontrado' });
    }

    res.json({ mensagem: 'Livro e avaliações associadas removidos com sucesso' });
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao remover livro', 
      detalhes: error.message 
    });
  }
});

module.exports = router;