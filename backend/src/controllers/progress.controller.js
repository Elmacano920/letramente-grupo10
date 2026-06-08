/**
 * LectoPlay — Controlador de Progreso y Gamificación
 * Grupo 10 (usando BD JSON)
 */

const db = require('../config/database');
const { createError } = require('../middleware/error.middleware');

// ─── Constantes de Gamificación ───────────────────────────────────────────────
const POINTS_PER_ACTIVITY = 10;
const BONUS_PERFECT       = 15;
const BONUS_FAST          = 5;
const BONUS_FIRST_TIME    = 5;

const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500];
const LEVEL_NAMES = ['Aprendiz', 'Explorador', 'Lector', 'Escritor', 'Maestro'];

const calculateStars = (score) => {
  if (score >= 95) return 3;
  if (score >= 75) return 2;
  if (score >= 50) return 1;
  return 0;
};

const calculateLevel = (experience) => {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (experience >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return Math.min(level, 5);
};

const checkAndAwardBadges = (userId) => {
  const awarded = [];
  const allBadges = db.find('badges', b => b.is_active);

  allBadges.forEach((badge) => {
    if (db.findOne('user_badges', ub => ub.user_id === userId && ub.badge_id === badge.id)) return;

    const condition = JSON.parse(badge.condition);
    let shouldAward = false;

    switch (condition.type) {
      case 'activity_complete': {
        const modObj = db.findOne('learning_modules', m => m.slug === condition.module);
        if (modObj) {
          const acts   = db.find('activities', a => a.module_id === modObj.id);
          const doneCount = acts.filter(a => db.findOne('progress', p => p.user_id === userId && p.activity_id === a.id && p.completed)).length;
          shouldAward = doneCount >= condition.count;
        }
        break;
      }
      case 'stars': {
        shouldAward = !!db.findOne('progress', p => p.user_id === userId && (p.stars || 0) >= condition.count);
        break;
      }
      case 'points': {
        const user = db.findOne('users', u => u.id === userId);
        shouldAward = (user?.points || 0) >= condition.amount;
        break;
      }
    }

    if (shouldAward) {
      db.insert('user_badges', { user_id: userId, badge_id: badge.id });
      awarded.push({ slug: badge.slug, title: badge.title, icon: badge.icon });
    }
  });

  return awarded;
};

/**
 * POST /api/progress
 */
const saveProgress = (req, res, next) => {
  try {
    const { activityId, score, timeSecs = 0 } = req.body;
    const userId = req.user.id;

    if (!activityId || score === undefined) throw createError('activityId y score son requeridos.', 400);
    if (score < 0 || score > 100) throw createError('El score debe estar entre 0 y 100.', 400);

    const activity = db.findOne('activities', a => a.id === activityId);
    if (!activity) throw createError('Actividad no encontrada.', 404);

    const stars     = calculateStars(score);
    const completed = score >= 50;
    const existing  = db.findOne('progress', p => p.user_id === userId && p.activity_id === activityId);

    let pointsEarned = 0;
    const isFirstTime = !existing;

    if (existing) {
      if (score > existing.score) {
        pointsEarned = Math.max(0, Math.round((score - existing.score) / 10));
        db.update('progress', p => p.user_id === userId && p.activity_id === activityId, {
          score, stars, completed,
          attempts: (existing.attempts || 0) + 1,
          time_spent_secs: timeSecs,
          ...(completed && !existing.completed ? { completed_at: new Date().toISOString() } : {}),
        });
      } else {
        db.update('progress', p => p.user_id === userId && p.activity_id === activityId, {
          attempts: (existing.attempts || 0) + 1,
        });
      }
    } else {
      pointsEarned = POINTS_PER_ACTIVITY;
      if (stars === 3) pointsEarned += BONUS_PERFECT;
      if (timeSecs > 0 && timeSecs < 30) pointsEarned += BONUS_FAST;
      pointsEarned += BONUS_FIRST_TIME;

      db.insert('progress', {
        user_id: userId,
        module_id: activity.module_id,
        activity_id: activityId,
        score, stars, completed,
        attempts: 1,
        time_spent_secs: timeSecs,
        ...(completed ? { completed_at: new Date().toISOString() } : {}),
      });
    }

    // Actualizar usuario
    if (pointsEarned > 0) {
      const user    = db.findOne('users', u => u.id === userId);
      const newExp  = (user?.experience || 0) + pointsEarned;
      const newLvl  = calculateLevel(newExp);
      db.update('users', u => u.id === userId, {
        points:     (user?.points || 0) + pointsEarned,
        experience: newExp,
        level:      newLvl,
      });
    }

    const newBadges = checkAndAwardBadges(userId);
    const updatedUser = db.findOne('users', u => u.id === userId);

    res.json({
      success: true,
      message: completed ? '¡Actividad completada! 🎉' : '¡Sigue intentando! 💪',
      data: {
        score, stars, pointsEarned, completed,
        newBadges,
        user: {
          id:         updatedUser.id,
          points:     updatedUser.points,
          level:      updatedUser.level,
          experience: updatedUser.experience,
          levelName:  LEVEL_NAMES[(updatedUser.level || 1) - 1],
          nextLevelXP: LEVEL_THRESHOLDS[updatedUser.level] || null,
        },
      },
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/progress/me
 */
const getMyProgress = (req, res, next) => {
  try {
    const userId   = req.user.id;
    const progress = db.find('progress', p => p.user_id === userId);

    const modules = db.find('learning_modules', m => m.is_active);
    const moduleSummary = modules.map((mod) => {
      const activities   = db.find('activities', a => a.module_id === mod.id && a.is_active);
      const progRecs     = db.find('progress', p => p.user_id === userId && activities.some(a => a.id === p.activity_id));
      const completed    = progRecs.filter(p => p.completed).length;
      const avgScore     = progRecs.length ? Math.round(progRecs.reduce((s, p) => s + (p.score || 0), 0) / progRecs.length) : 0;
      const totalStars   = progRecs.reduce((s, p) => s + (p.stars || 0), 0);

      return {
        slug: mod.slug, title: mod.title, icon: mod.icon, color: mod.color,
        total_activities:      activities.length,
        activities_attempted:  progRecs.length,
        activities_completed:  completed,
        avg_score:             avgScore,
        total_stars:           totalStars,
      };
    });

    res.json({ success: true, data: { progress, moduleSummary } });
  } catch (error) { next(error); }
};

/**
 * GET /api/progress/user/:userId
 */
const getUserProgress = (req, res, next) => {
  try {
    const userId  = parseInt(req.params.userId);
    const user    = db.findOne('users', u => u.id === userId && u.role === 'child');
    if (!user) throw createError('Estudiante no encontrado.', 404);

    const { password: _, ...userSafe } = user;
    const badges = db.find('user_badges', ub => ub.user_id === userId).map(ub => {
      const b = db.findOne('badges', b => b.id === ub.badge_id);
      return b ? { slug: b.slug, title: b.title, icon: b.icon, unlocked_at: ub.created_at } : null;
    }).filter(Boolean);

    const modules = db.find('learning_modules', m => m.is_active);
    const moduleSummary = modules.map((mod) => {
      const activities  = db.find('activities', a => a.module_id === mod.id && a.is_active);
      const progRecs    = db.find('progress', p => p.user_id === userId && activities.some(a => a.id === p.activity_id));
      const completed   = progRecs.filter(p => p.completed).length;
      const avgScore    = progRecs.length ? Math.round(progRecs.reduce((s, p) => s + (p.score || 0), 0) / progRecs.length) : 0;
      const totalStars  = progRecs.reduce((s, p) => s + (p.stars || 0), 0);

      return {
        slug: mod.slug, title: mod.title, icon: mod.icon, color: mod.color,
        total_activities:     activities.length,
        activities_completed: completed,
        avg_score:            avgScore,
        total_stars:          totalStars,
      };
    });

    res.json({
      success: true,
      data: { student: { ...userSafe, badges }, moduleSummary },
    });
  } catch (error) { next(error); }
};

module.exports = { saveProgress, getMyProgress, getUserProgress, LEVEL_NAMES, LEVEL_THRESHOLDS };
