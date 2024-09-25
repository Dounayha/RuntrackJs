const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const session = require('express-session');
const { insertUser, findUserByEmail, insertReservation, getAllUsers, getDemandesReservation, approuverDemandeReservation, refuserDemandeReservation, ajouterReservationJson, insertDemandeReservation, updateUserRole } = require('./database');
const adminRoutes = require('./routes/admin'); // Importer les routes admin

const app = express();

// Configuration de la session
app.use(session({
    secret: 'Hy8$Xp2#Zq9!Wm7@Lc6^Td5&Sf4*Bg3(Nh',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Mettez à true si vous utilisez HTTPS
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Fonction pour vérifier et créer le fichier reservations.json si nécessaire
async function verifierEtCreerFichierReservations() {
    const filePath = path.join(__dirname, 'reservations.json');
    try {
        await fs.access(filePath);
    } catch (error) {
        // Le fichier n'existe pas, le créer
        const initialData = [];
        await fs.writeFile(filePath, JSON.stringify(initialData, null, 2));
        console.log('Fichier reservations.json créé');
    }
}

// Appeler la fonction pour vérifier et créer le fichier au démarrage du serveur
verifierEtCreerFichierReservations();

// Route pour servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour l'inscription
app.post('/api/inscription', async (req, res) => {
    const { prenom, nom, email, password } = req.body;
    
    // Vérification du domaine de l'email
    if (!email.endsWith('@laplateforme.io')) {
        return res.status(400).json({ error: 'Seules les adresses email de La Plateforme_ sont autorisées.' });
    }

    try {
        await insertUser({ prenom, nom, email, password });
        res.status(201).json({ message: 'Utilisateur inscrit avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
});

// Nouvelle route pour la connexion
app.post('/api/connexion', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await findUserByEmail(email);
        if (user && user.password === password) {
            req.session.user = {
                id: user.id,
                prenom: user.prenom,
                nom: user.nom,
                email: user.email,
                role: user.role
            };
            res.json({ 
                message: 'Connexion réussie', 
                user: { 
                    id: user.id, 
                    prenom: user.prenom, 
                    nom: user.nom, 
                    email: user.email, 
                    role: user.role 
                } 
            });
        } else {
            res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
});

// Route pour la déconnexion
app.post('/api/deconnexion', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
        }
        res.json({ message: 'Déconnexion réussie' });
    });
});

// Middleware pour vérifier si l'utilisateur est connecté
function estConnecte(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Non autorisé' });
    }
}

// Exemple de route protégée
app.get('/api/profil', estConnecte, (req, res) => {
    res.json({ user: req.session.user });
});

// Middleware pour vérifier si l'utilisateur est connecté
function estAuthentifie(req, res, next) {
    if (req.session.utilisateur) {
        next();
    } else {
        res.redirect('/connexion');
    }
}

// Route pour les réservations
app.get('/api/reservations', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'reservations.json');
        const data = await fs.readFile(filePath, 'utf8');
        const reservations = JSON.parse(data);
        
        // Assurez-vous que reservations est un tableau
        if (Array.isArray(reservations)) {
            res.json(reservations);
        } else {
            res.status(500).json({ error: 'Les données de réservation ne sont pas un tableau' });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des réservations:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des réservations' });
    }
});

// Route pour vérifier l'état de connexion
app.get('/api/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({ isAuthenticated: true, user: req.session.user });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// Middleware pour vérifier les droits d'administrateur ou de modérateur
function isAdminOrModerator(req, res, next) {
    if (req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'moderator')) {
        next();
    } else {
        res.status(403).json({ error: 'Accès non autorisé' });
    }
}

// Utilisation du middleware pour la route admin
app.use('/admin', isAdminOrModerator, adminRoutes); // Utiliser les routes admin

// Route pour récupérer tous les utilisateurs (accessible uniquement aux admins et modérateurs)
app.get('/api/users', isAdminOrModerator, async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Nouvelle route pour les demandes de réservation
app.get('/api/demandes-reservation', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'reservations.json');
        const data = await fs.readFile(filePath, 'utf8');
        const reservations = JSON.parse(data);
        res.json(reservations);
    } catch (error) {
        console.error('Erreur lors de la lecture des réservations:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des demandes de réservation' });
    }
});

// Nouvelle route pour la demande de réservation
app.post('/api/demande-reservation', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Utilisateur non connecté' });
    }

    const { dates } = req.body;
    try {
        const filePath = path.join(__dirname, 'reservations.json');
        const data = await fs.readFile(filePath, 'utf8');
        const reservations = JSON.parse(data);

        // Vérifier les doublons avant d'ajouter les nouvelles réservations
        const newReservations = dates.map(date => ({
            userId: req.session.user.id,
            date: date,
            statut: 'en_attente'
        }));

        const filteredReservations = newReservations.filter(newRes => 
            !reservations.some(existingRes => 
                existingRes.userId === newRes.userId && existingRes.date === newRes.date
            )
        );

        // Ajouter les nouvelles réservations filtrées
        reservations.push(...filteredReservations);

        await fs.writeFile(filePath, JSON.stringify(reservations, null, 2));
        res.json({ success: true, message: 'Demande de réservation enregistrée' });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la demande:', error);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la demande' });
    }
});

// Route pour valider une demande de réservation
app.post('/api/valider-demande-reservation', isAdminOrModerator, async (req, res) => {
    const { userId, date } = req.body;

    try {
        const filePath = path.join(__dirname, 'reservations.json');
        const data = await fs.readFile(filePath, 'utf8');
        const reservations = JSON.parse(data);

        // Trouver la demande de réservation et mettre à jour son statut
        const reservation = reservations.find(r => r.userId === userId && r.date === date);
        if (reservation) {
            reservation.statut = 'confirmé';
            await fs.writeFile(filePath, JSON.stringify(reservations, null, 2));
            res.json({ success: true, message: 'Demande de réservation confirmée' });
        } else {
            res.status(404).json({ error: 'Demande de réservation non trouvée' });
        }
    } catch (error) {
        console.error('Erreur lors de la validation de la demande de réservation:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la validation de la demande de réservation' });
    }
});

// Route pour refuser une demande de réservation
app.post('/api/refuser-demande-reservation', isAdminOrModerator, async (req, res) => {
    const { userId, date } = req.body;

    try {
        const filePath = path.join(__dirname, 'reservations.json');
        const data = await fs.readFile(filePath, 'utf8');
        let reservations = JSON.parse(data);

        // Filtrer les réservations pour supprimer celle qui correspond à userId et date
        const initialLength = reservations.length;
        reservations = reservations.filter(r => !(r.userId === userId && r.date === date));

        if (reservations.length === initialLength) {
            return res.status(404).json({ error: 'Demande de réservation non trouvée' });
        }

        await fs.writeFile(filePath, JSON.stringify(reservations, null, 2));
        res.json({ success: true, message: 'Demande de réservation refusée et supprimée' });
    } catch (error) {
        console.error('Erreur lors du refus de la demande de réservation:', error);
        res.status(500).json({ error: 'Erreur serveur lors du refus de la demande de réservation' });
    }
});

// Route pour vérifier les conflits de réservation
app.post('/api/verifier-reservation', async (req, res) => {
    const { date } = req.body;

    try {
        const filePath = path.join(__dirname, 'reservations.json');
        const data = await fs.readFile(filePath, 'utf8');
        const reservations = JSON.parse(data);

        // Vérifier s'il existe déjà une réservation confirmée pour la date donnée
        const conflit = reservations.some(r => r.date === date && r.statut === 'confirmé');

        if (conflit) {
            res.json({ conflict: true, message: 'Il existe déjà une réservation confirmée pour cette date.' });
        } else {
            res.json({ conflict: false, message: 'Aucune réservation confirmée pour cette date.' });
        }
    } catch (error) {
        console.error('Erreur lors de la vérification des réservations:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la vérification des réservations' });
    }
});

// Route pour mettre à jour le rôle d'un utilisateur (accessible uniquement aux admins)
app.put('/api/users/:id/role', isAdminOrModerator, async (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;

    console.log(`Mise à jour du rôle de l'utilisateur ${userId} en ${role}`);

    try {
        // Assurez-vous que la fonction updateUserRole existe dans votre fichier database.js
        await updateUserRole(userId, role);
        res.json({ success: true, message: 'Rôle mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du rôle' });
    }
});

module.exports = app;