const express = require('express');
const Author = require('../models/Author');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { nome, nacionalidade, anoNascimento, biografia } = req.body;
    
    if (!nome || !nacionalidade) {
      return res.status(400).json({ 
        erro: 'Nome e nacionalidade são obrigatórios' 
      });
    }

    const author = await Author.create({
      nome,
      nacionalidade,
      anoNascimento,
      biografia
    });

    res.status(201).json({
      mensagem: 'Autor criado com sucesso',
      autor: author
    });
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao criar autor', 
      detalhes: error.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const authors = await Author.findAll();
    res.json(authors);
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao buscar autores', 
      detalhes: error.message 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    
    if (!author) {
      return res.status(404).json({ erro: 'Autor não encontrado' });
    }

    res.json(author);
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao buscar autor', 
      detalhes: error.message 
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nome, nacionalidade, anoNascimento, biografia } = req.body;
    
    const result = await Author.update(req.params.id, {
      nome,
      nacionalidade,
      anoNascimento,
      biografia
    });

    if (result.matchedCount === 0) {
      return res.status(404).json({ erro: 'Autor não encontrado' });
    }

    res.json({ mensagem: 'Autor atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao atualizar autor', 
      detalhes: error.message 
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Author.delete(req.params.id);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ erro: 'Autor não encontrado' });
    }

    res.json({ mensagem: 'Autor removido com sucesso' });
  } catch (error) {
    if (error.message.includes('livros associados')) {
      return res.status(400).json({ erro: error.message });
    }
    res.status(500).json({ 
      erro: 'Erro ao remover autor', 
      detalhes: error.message 
    });
  }
});

module.exports = router;