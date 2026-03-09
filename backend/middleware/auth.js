// middleware/auth.js - Middleware de autenticação JWT
const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica se o token JWT é válido
 * Adiciona o usuário decodificado à requisição (req.usuario)
 */
const autenticar = (req, res, next) => {
    // Pega o token do header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    }

    try {
        // Verifica e decodifica o token
        const usuario = jwt.verify(token, process.env.JWT_SECRET || 'chave_secreta_padrao');
        req.usuario = usuario;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ erro: 'Token expirado. Faça login novamente.' });
        }
        return res.status(403).json({ erro: 'Token inválido.' });
    }
};

/**
 * Middleware que verifica se o usuário é do tipo secretário
 * Deve ser usado APÓS o middleware autenticar
 */
const apenasSecretario = (req, res, next) => {
    if (req.usuario.tipo !== 'secretario') {
        return res.status(403).json({ erro: 'Acesso restrito a secretários.' });
    }
    next();
};

module.exports = { autenticar, apenasSecretario };
