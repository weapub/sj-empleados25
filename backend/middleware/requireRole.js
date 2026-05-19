// requireAdmin — permite admin y superadmin
exports.requireAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role === 'admin' || role === 'superadmin') return next();
  return res.status(403).json({ message: 'Acceso restringido: se requiere rol admin' });
};

// requireSuperAdmin — solo superadmin
exports.requireSuperAdmin = (req, res, next) => {
  if (req.user?.role === 'superadmin') return next();
  return res.status(403).json({ message: 'Acceso restringido: se requiere rol superadmin' });
};
