const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Configuration de la connexion à la base de données
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Ajoutez un mot de passe si nécessaire
  database: 'bigjob'
};

// Fonction pour se connecter à la base de données
async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connecté à la base de données MySQL');
    return connection;
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    throw error;
  }
}

// Fonction pour insérer un utilisateur dans la base de données
async function insertUser(user) {
  const connection = await connectToDatabase();
  try {
    const [result] = await connection.execute(
      'INSERT INTO users (prenom, nom, email, password) VALUES (?, ?, ?, ?)',
      [user.prenom, user.nom, user.email, user.password]
    );
    console.log('Utilisateur inséré avec succès');
    return result;
  } catch (error) {
    console.error('Erreur lors de l\'insertion de l\'utilisateur:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Fonction pour exporter les données de data.json vers la base de données
async function exportDataToDatabase() {
  try {
    const data = await fs.readFile('data.json', 'utf8');
    const jsonData = JSON.parse(data);

    for (const user of jsonData.users) {
      await insertUser(user);
    }

    console.log('Données exportées avec succès vers la base de données');
  } catch (error) {
    console.error('Erreur lors de l\'exportation des données:', error);
  }
}

// Fonction pour trouver un utilisateur par email
async function findUserByEmail(email) {
  const connection = await connectToDatabase();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0]; // Retourne le premier utilisateur trouvé ou undefined si aucun n'est trouvé
  } catch (error) {
    console.error('Erreur lors de la recherche de l\'utilisateur:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Fonction pour récupérer tous les utilisateurs
async function getAllUsers() {
  const connection = await connectToDatabase();
  try {
    const [rows] = await connection.execute('SELECT id, prenom, nom, email, role FROM users');
    return rows;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Fonction pour mettre à jour le rôle d'un utilisateur
async function updateUserRole(userId, role) {
  const connection = await connectToDatabase();
  try {
    await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Fonction pour insérer les demandes de réservation
async function insertDemandeReservation(userId, dates) {
    const filePath = path.join(__dirname, 'reservations.json');
    try {
        // Lire le fichier existant
        let reservations = [];
        try {
            const data = await fs.readFile(filePath, 'utf8');
            reservations = JSON.parse(data);
        } catch (error) {
            // Si le fichier n'existe pas, on commence avec un tableau vide
            console.log('Création d\'un nouveau fichier reservations.json');
        }

        // Ajouter les nouvelles demandes
        for (const date of dates) {
            reservations.push({
                userId,
                date,
                statut: 'en_attente'
            });
        }

        // Écrire les données mises à jour dans le fichier
        await fs.writeFile(filePath, JSON.stringify(reservations, null, 2));
        console.log('Demandes de réservation enregistrées avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des demandes de réservation:', error);
        throw error;
    }
}

module.exports = {
  insertUser,
  exportDataToDatabase,
  findUserByEmail,
  getAllUsers,
  updateUserRole,
  insertDemandeReservation
};