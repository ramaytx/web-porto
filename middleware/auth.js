// Middleware untuk cek apakah user sudah login sebagai admin
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
}

module.exports = { requireAuth };
