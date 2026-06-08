/**
 * LectoPlay — Controlador de Usuarios
 * Grupo 10 (usando BD JSON)
 */

const db = require('../config/database');
const { createError } = require('../middleware/error.middleware');

const getAllChildren = (req, res, next) => {
  try {
    const children = db.find('users', u => u.role === 'child')
      .map(({ password: _, ...u }) => u)
      .sort((a, b) => (b.points || 0) - (a.points || 0));

    res.json({ success: true, data: { children, total: children.length } });
  } catch (error) { next(error); }
};

const getUserById = (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.id !== parseInt(id) && req.user.role !== 'adult') {
      throw createError('No tienes permiso para ver este perfil.', 403);
    }

    const user = db.findOne('users', u => u.id === parseInt(id));
    if (!user) throw createError('Usuario no encontrado.', 404);

    const badges = db.find('user_badges', ub => ub.user_id === user.id).map(ub => {
      const b = db.findOne('badges', b => b.id === ub.badge_id);
      return b ? { slug: b.slug, title: b.title, icon: b.icon, description: b.description } : null;
    }).filter(Boolean);

    const { password: _, ...userSafe } = user;
    res.json({ success: true, data: { user: { ...userSafe, badges } } });
  } catch (error) { next(error); }
};

const updateAvatar = (req, res, next) => {
  try {
    const { id } = req.params;
    const { avatar } = req.body;
    if (req.user.id !== parseInt(id)) throw createError('Solo puedes cambiar tu propio avatar.', 403);

    const validAvatars = ['dino', 'cat', 'robot', 'bunny', 'owl', 'fox'];
    if (!validAvatars.includes(avatar)) throw createError('Avatar no válido.', 400);

    db.update('users', u => u.id === parseInt(id), { avatar });
    res.json({ success: true, message: '¡Avatar actualizado! 🎨', data: { avatar } });
  } catch (error) { next(error); }
};

const getLeaderboard = (req, res, next) => {
  try {
    const leaderboard = db.find('users', u => u.role === 'child')
      .map(({ password: _, ...u }) => u)
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10);

    res.json({ success: true, data: { leaderboard } });
  } catch (error) { next(error); }
};

module.exports = { getAllChildren, getUserById, updateAvatar, getLeaderboard };
