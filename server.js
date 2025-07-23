const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');

const authorsRoutes = require('./routes/authors');
const booksRoutes = require('./routes/books');
const reviewsRoutes = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/autores', authorsRoutes);
app.use('/api/livros', booksRoutes);
app.use('/api/avaliacoes', reviewsRoutes);

app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Gestor de Livros e Avaliações',
    versao: '1.0.0',
    endpoints: {
      autores: '/api/autores',
      livros: '/api/livros',
      avaliacoes: '/api/avaliacoes'
    },
    funcionalidades: [
      'Criar autores e livros',
      'Listar todos os livros com nome do autor incluído',
      'Adicionar avaliação a um livro',
      'Listar livros com média de pontuação ordenados',
      'Pesquisar livros por género, ano ou palavra-chave',
      'Remover livro ou autor (com validação de dependências)'
    ]
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ativo',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use((req, res) => {
  res.status(404).json({ erro: 'Endpoint não encontrado' });
});

app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ 
    erro: 'Erro interno do servidor',
    detalhes: error.message 
  });
});

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Documentação da API: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();