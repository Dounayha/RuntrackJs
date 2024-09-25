const { exportDataToDatabase } = require('./js/database');

exportDataToDatabase()
  .then(() => console.log('Exportation terminée'))
  .catch(error => console.error('Erreur lors de l\'exportation:', error));