const express = require('express');
const Review = require('../models/Review');
const Book = require('../models/Book');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // Support both frontend field names and original field names
    const { 
      livroId, livro_id = livroId,
      nomeUtilizador, reviewer = nomeUtilizador,
      pontuacao, 
      comentario 
    } = req.body;
    
    const finalLivroId = livro_id || livroId;
    const finalNomeUtilizador = reviewer || nomeUtilizador;
    
    if (!finalLivroId || !finalNomeUtilizador || !pontuacao) {
      return res.status(400).json({ 
        erro: 'Livro, nome do utilizador e pontuação são obrigatórios' 
      });
    }

    const bookExists = await Book.exists(finalLivroId);
    if (!bookExists) {
      return res.status(400).json({ erro: 'Livro não encontrado' });
    }

    const review = await Review.create({
      livroId: finalLivroId,
      nomeUtilizador: finalNomeUtilizador,
      pontuacao: parseInt(pontuacao),
      comentario
    });

    res.status(201).json({
      mensagem: 'Avaliação criada com sucesso',
      avaliacao: review
    });
  } catch (error) {
    if (error.message.includes('pontuação deve estar entre')) {
      return res.status(400).json({ erro: error.message });
    }
    res.status(500).json({ 
      erro: 'Erro ao criar avaliação', 
      detalhes: error.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const reviews = await Review.findAll();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao buscar avaliações', 
      detalhes: error.message 
    });
  }
});

router.get('/livro/:livroId', async (req, res) => {
  try {
    const reviews = await Review.findByBookId(req.params.livroId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao buscar avaliações do livro', 
      detalhes: error.message 
    });
  }
});

router.get('/livro/:livroId/estatisticas', async (req, res) => {
  try {
    const stats = await Review.getBookStats(req.params.livroId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao buscar estatísticas do livro', 
      detalhes: error.message 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ erro: 'Avaliação não encontrada' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao buscar avaliação', 
      detalhes: error.message 
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nomeUtilizador, pontuacao, comentario } = req.body;
    
    const result = await Review.update(req.params.id, {
      nomeUtilizador,
      pontuacao,
      comentario
    });

    if (result.matchedCount === 0) {
      return res.status(404).json({ erro: 'Avaliação não encontrada' });
    }

    res.json({ mensagem: 'Avaliação atualizada com sucesso' });
  } catch (error) {
    if (error.message.includes('pontuação deve estar entre')) {
      return res.status(400).json({ erro: error.message });
    }
    res.status(500).json({ 
      erro: 'Erro ao atualizar avaliação', 
      detalhes: error.message 
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await Review.delete(req.params.id);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ erro: 'Avaliação não encontrada' });
    }

    res.json({ mensagem: 'Avaliação removida com sucesso' });
  } catch (error) {
    res.status(500).json({ 
      erro: 'Erro ao remover avaliação', 
      detalhes: error.message 
    });
  }
});

module.exports = router;