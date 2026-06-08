/**
 * LectoPlay — Controlador de Módulos de Aprendizaje
 * Grupo 10 (usando BD JSON)
 */

const db = require('../config/database');
const { createError } = require('../middleware/error.middleware');

const getAllModules = (req, res, next) => {
  try {
    const modules = db.find('learning_modules', m => m.is_active)
      .sort((a, b) => a.order_index - b.order_index);

    if (req.user.role === 'child') {
      const modulesWithProgress = modules.map((mod) => {
        const activities = db.find('activities', a => a.module_id === mod.id && a.is_active);
        const total      = activities.length;
        const progRecs   = activities.map(a => db.findOne('progress', p => p.user_id === req.user.id && p.activity_id === a.id)).filter(Boolean);
        const completed  = progRecs.filter(p => p.completed).length;
        const totalScore = progRecs.reduce((s, p) => s + (p.score || 0), 0);
        const maxStars   = progRecs.length ? Math.max(...progRecs.map(p => p.stars || 0)) : 0;

        return {
          ...mod,
          progress: { total_activities: total, completed_activities: completed, total_score: totalScore, max_stars: maxStars },
        };
      });
      return res.json({ success: true, data: { modules: modulesWithProgress } });
    }

    res.json({ success: true, data: { modules } });
  } catch (error) { next(error); }
};

const getModuleBySlug = (req, res, next) => {
  try {
    const { slug } = req.params;
    const module = db.findOne('learning_modules', m => m.slug === slug && m.is_active);
    if (!module) throw createError('Módulo no encontrado.', 404);

    const activities = db.find('activities', a => a.module_id === module.id && a.is_active)
      .sort((a, b) => a.difficulty - b.difficulty || a.order_index - b.order_index);

    if (req.user.role === 'child') {
      const withProgress = activities.map(act => ({
        ...act,
        userProgress: db.findOne('progress', p => p.user_id === req.user.id && p.activity_id === act.id) || null,
      }));
      return res.json({ success: true, data: { module, activities: withProgress } });
    }

    res.json({ success: true, data: { module, activities } });
  } catch (error) { next(error); }
};

module.exports = { getAllModules, getModuleBySlug };
