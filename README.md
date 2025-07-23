# Gestor de Livros e Avaliações - API MongoDB

API NoSQL desenvolvida com MongoDB para gestão de livros, autores e avaliações de utilizadores.

## Funcionalidades Implementadas

### Requisitos Obrigatórios ✅

1. **Criar autores e livros** - Endpoints para criação de autores e livros
2. **Listar todos os livros com nome do autor incluído** - Join entre coleções usando aggregation
3. **Adicionar avaliação a um livro** - Sistema de avaliações com pontuação de 1-5
4. **Listar livros com média de pontuação ordenados** - Ranking de livros por avaliação
5. **Pesquisar livros por género, ano ou palavra-chave** - Sistema de pesquisa avançada
6. **Remover livro ou autor (com validação de dependências)** - Validação de integridade referencial

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de dados NoSQL
- **MongoDB Driver** - Cliente oficial MongoDB para Node.js

## Estrutura do Projeto

```
gestor-livros-avaliacoes/
├── config/
│   └── database.js          # Configuração da conexão MongoDB
├── models/
│   ├── Author.js            # Model para autores
│   ├── Book.js              # Model para livros
│   └── Review.js            # Model para avaliações
├── routes/
│   ├── authors.js           # Rotas para autores
│   ├── books.js             # Rotas para livros
│   └── reviews.js           # Rotas para avaliações
├── .env                     # Variáveis de ambiente
├── package.json             # Dependências e scripts
├── server.js                # Servidor principal
└── README.md                # Documentação
```

## Instalação e Execução

### Pré-requisitos
- Node.js (versão 14 ou superior)
- MongoDB (local ou MongoDB Atlas)
- npm ou yarn

### Passos

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar variáveis de ambiente:**
Edite o arquivo `.env` com suas configurações:
```
MONGODB_URI=mongodb://localhost:27017/gestor_livros
PORT=3000
```

3. **Iniciar o servidor:**
```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

4. **Aceder à API:**
- URL base: `http://localhost:3000`
- Documentação: `http://localhost:3000` (mostra endpoints disponíveis)

## Endpoints da API

### Autores (`/api/autores`)

- `POST /api/autores` - Criar autor
- `GET /api/autores` - Listar todos os autores
- `GET /api/autores/:id` - Buscar autor por ID
- `PUT /api/autores/:id` - Atualizar autor
- `DELETE /api/autores/:id` - Remover autor (valida dependências)

### Livros (`/api/livros`)

- `POST /api/livros` - Criar livro
- `GET /api/livros` - Listar todos os livros (com nome do autor)
- `GET /api/livros/rankings` - Listar livros ordenados por avaliação
- `GET /api/livros/search` - Pesquisar livros (por género, ano, palavra-chave)
- `GET /api/livros/:id` - Buscar livro por ID
- `PUT /api/livros/:id` - Atualizar livro
- `DELETE /api/livros/:id` - Remover livro (remove avaliações associadas)

### Avaliações (`/api/avaliacoes`)

- `POST /api/avaliacoes` - Criar avaliação
- `GET /api/avaliacoes` - Listar todas as avaliações
- `GET /api/avaliacoes/livro/:livroId` - Avaliações de um livro específico
- `GET /api/avaliacoes/livro/:livroId/estatisticas` - Estatísticas de um livro
- `GET /api/avaliacoes/:id` - Buscar avaliação por ID
- `PUT /api/avaliacoes/:id` - Atualizar avaliação
- `DELETE /api/avaliacoes/:id` - Remover avaliação

## Exemplos de Uso

### Criar Autor
```json
POST /api/autores
{
  "nome": "José Saramago",
  "nacionalidade": "Português",
  "anoNascimento": 1922,
  "biografia": "Escritor português, Prémio Nobel da Literatura"
}
```

### Criar Livro
```json
POST /api/livros
{
  "titulo": "Ensaio sobre a Cegueira",
  "autorId": "ObjectId_do_autor",
  "genero": "Ficção",
  "anoPublicacao": 1995,
  "isbn": "978-0151002511",
  "resumo": "Romance sobre uma epidemia de cegueira",
  "palavrasChave": ["ficção", "sociedade", "cegueira"]
}
```

### Adicionar Avaliação
```json
POST /api/avaliacoes
{
  "livroId": "ObjectId_do_livro",
  "nomeUtilizador": "João Silva",
  "pontuacao": 5,
  "comentario": "Livro extraordinário, muito recomendado!"
}
```

### Pesquisar Livros
```
GET /api/livros/search?genero=Ficção&ano=1995&palavraChave=cegueira
```

## Conceitos NoSQL Implementados

- **Modelagem sem esquemas fixos** - Documentos flexíveis
- **Consultas CRUD** - Create, Read, Update, Delete
- **Relações entre coleções** - Referencias entre autores, livros e avaliações
- **Operações de agregação** - Joins, grouping, sorting para relatórios complexos
- **Validação de integridade** - Verificação de dependências antes de remoções

## Status da API

Aceda a `/api/status` para verificar o estado da API.