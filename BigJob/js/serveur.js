const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');

// Middleware pour parser les requêtes JSON
app.use(bodyParser.json());
app.use(express.static('public'));  // Servir les fichiers statiques

// Port du serveur
const port = 3000;

// Route d'exemple pour récupérer les données du fichier JSON
app.get('/api/students', (req, res) => {
    fs.readFile('./data/students.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Erreur de lecture des données');
        } else {
            res.send(JSON.parse(data));
        }
    });
});

// Lancer le serveur
app.listen(port, () => {
    console.log(`Serveur lancé sur le port ${port}`);
});
