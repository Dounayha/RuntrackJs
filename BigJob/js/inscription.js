document.addEventListener('DOMContentLoaded', function() {
    // Sélectionner le formulaire d'inscription
    const registerForm = document.getElementById('registerForm');

    // Ajouter un écouteur d'événement pour la soumission du formulaire
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Empêcher la soumission par défaut du formulaire

        // Récupérer les valeurs des champs du formulaire
        const prenom = document.getElementById('prenom').value.trim();
        const nom = document.getElementById('nom').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validation côté client
        if (!prenom || !nom || !email || !password) {
            showError('Tous les champs sont obligatoires.');
            return;
        }

        // Vérification du domaine email
        if (!email.endsWith('@laplateforme.io')) {
            showError('Seuls les membres de La Plateforme_ peuvent s\'inscrire.');
            return;
        }

        // Vérification de la force du mot de passe (exemple simple)
        if (password.length < 8) {
            showError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        try {
            // Préparer les données pour l'envoi
            const userData = {
                prenom: prenom,
                nom: nom,
                email: email,
                password: password
            };

            // Envoyer les données au serveur
            const response = await fetch('http://localhost:3005/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de l\'inscription');
            }

            const data = await response.json();
            console.log('Inscription réussie:', data);
            showSuccess('Inscription réussie. Vous pouvez maintenant vous connecter.');
            // Rediriger vers la page de connexion après un délai
            setTimeout(() => {
                window.location.href = '/connexion';
            }, 2000);
        } catch (error) {
            console.error('Erreur détaillée:', error);
            showError(error.message || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
        }
    });

    // Fonction pour afficher les messages d'erreur
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.textContent = message;
        registerForm.insertAdjacentElement('afterend', errorDiv);
        
        // Supprimer le message après 5 secondes
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Fonction pour afficher les messages de succès
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success mt-3';
        successDiv.textContent = message;
        registerForm.insertAdjacentElement('afterend', successDiv);
    }
});