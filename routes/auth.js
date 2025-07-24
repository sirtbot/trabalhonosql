const express = require('express');
const User = require('../models/User');
const { generateToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Registar novo utilizador
router.post('/registar', async (req, res) => {
  try {
    const { nome, email, password, confirmPassword } = req.body;

    // Validações básicas
    if (!nome || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        erro: 'Todos os campos são obrigatórios',
        codigo: 'MISSING_FIELDS'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        erro: 'As passwords não coincidem',
        codigo: 'PASSWORD_MISMATCH'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        erro: 'Password deve ter pelo menos 6 caracteres',
        codigo: 'PASSWORD_TOO_SHORT'
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        erro: 'Formato de email inválido',
        codigo: 'INVALID_EMAIL'
      });
    }

    // Criar utilizador
    const user = await User.create({
      nome,
      email,
      password,
      tipo: 'user' // Por defeito, novos utilizadores são do tipo 'user'
    });

    // Gerar tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      mensagem: 'Utilizador registado com sucesso',
      utilizador: user,
      token,
      refreshToken
    });

  } catch (error) {
    if (error.message === 'Email já está em uso') {
      return res.status(409).json({ 
        erro: error.message,
        codigo: 'EMAIL_EXISTS'
      });
    }

    console.error('Erro no registo:', error);
    res.status(500).json({ 
      erro: 'Erro interno do servidor',
      codigo: 'INTERNAL_ERROR'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({ 
        erro: 'Email e password são obrigatórios',
        codigo: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar utilizador
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        erro: 'Credenciais inválidas',
        codigo: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar password
    const isValidPassword = await User.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        erro: 'Credenciais inválidas',
        codigo: 'INVALID_CREDENTIALS'
      });
    }

    // Remover password do objeto utilizador
    const { password: _, ...userWithoutPassword } = user;

    // Gerar tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      mensagem: 'Login realizado com sucesso',
      utilizador: userWithoutPassword,
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      erro: 'Erro interno do servidor',
      codigo: 'INTERNAL_ERROR'
    });
  }
});

// Obter perfil do utilizador autenticado
router.get('/perfil', authenticateToken, async (req, res) => {
  try {
    res.json({
      utilizador: req.user
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ 
      erro: 'Erro interno do servidor',
      codigo: 'INTERNAL_ERROR'
    });
  }
});

// Atualizar perfil
router.put('/perfil', authenticateToken, async (req, res) => {
  try {
    const { nome, email } = req.body;

    if (!nome && !email) {
      return res.status(400).json({ 
        erro: 'Pelo menos um campo deve ser fornecido',
        codigo: 'NO_FIELDS'
      });
    }

    // Validar email se fornecido
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          erro: 'Formato de email inválido',
          codigo: 'INVALID_EMAIL'
        });
      }
    }

    const updated = await User.updateProfile(req.user._id, { nome, email });
    
    if (!updated) {
      return res.status(404).json({ 
        erro: 'Utilizador não encontrado',
        codigo: 'USER_NOT_FOUND'
      });
    }

    // Buscar dados atualizados
    const updatedUser = await User.findById(req.user._id);

    res.json({
      mensagem: 'Perfil atualizado com sucesso',
      utilizador: updatedUser
    });

  } catch (error) {
    if (error.message === 'Email já está em uso') {
      return res.status(409).json({ 
        erro: error.message,
        codigo: 'EMAIL_EXISTS'
      });
    }

    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ 
      erro: 'Erro interno do servidor',
      codigo: 'INTERNAL_ERROR'
    });
  }
});

// Alterar password
router.put('/alterar-password', authenticateToken, async (req, res) => {
  try {
    const { passwordAtual, novaPassword, confirmarPassword } = req.body;

    // Validações
    if (!passwordAtual || !novaPassword || !confirmarPassword) {
      return res.status(400).json({ 
        erro: 'Todos os campos são obrigatórios',
        codigo: 'MISSING_FIELDS'
      });
    }

    if (novaPassword !== confirmarPassword) {
      return res.status(400).json({ 
        erro: 'As novas passwords não coincidem',
        codigo: 'PASSWORD_MISMATCH'
      });
    }

    if (novaPassword.length < 6) {
      return res.status(400).json({ 
        erro: 'Nova password deve ter pelo menos 6 caracteres',
        codigo: 'PASSWORD_TOO_SHORT'
      });
    }

    // Verificar password atual
    const user = await User.findByEmail(req.user.email);
    const isValidPassword = await User.validatePassword(passwordAtual, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        erro: 'Password atual incorreta',
        codigo: 'WRONG_PASSWORD'
      });
    }

    // Alterar password
    const updated = await User.changePassword(req.user._id, novaPassword);
    
    if (!updated) {
      return res.status(404).json({ 
        erro: 'Utilizador não encontrado',
        codigo: 'USER_NOT_FOUND'
      });
    }

    res.json({
      mensagem: 'Password alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar password:', error);
    res.status(500).json({ 
      erro: 'Erro interno do servidor',
      codigo: 'INTERNAL_ERROR'
    });
  }
});

// Verificar se token é válido
router.get('/verificar', authenticateToken, (req, res) => {
  res.json({
    valido: true,
    utilizador: req.user
  });
});

// Logout (opcional - pode ser feito apenas no frontend)
router.post('/logout', authenticateToken, (req, res) => {
  // Em sistemas JWT, o logout é normalmente feito no frontend
  // removendo o token do armazenamento local
  res.json({
    mensagem: 'Logout realizado com sucesso'
  });
});

module.exports = router;