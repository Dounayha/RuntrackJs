const app = require('./app');

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur le port ${port}`);
});