const express = require('express');
const path = require('path');
const router = express.Router();

// Middleware pour vérifier si l'utilisateur est admin ou modérateur
function verifierAdminOuModerateur(req, res, next) {
    if (req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'moderator')) {
        next();
    } else {
        res.status(403).send('Accès refusé');
    }
}

// Utilisation du middleware pour les routes admin
router.use(verifierAdminOuModerateur);

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/admin.html'));
});

module.exports = router;