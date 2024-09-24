document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email.endsWith('@laplateforme.io')) {
        alert("L'email doit appartenir au domaine 'laplateforme.io'");
        return;
    }

    // Logique pour enregistrer l'utilisateur
    console.log("Email et mot de passe acceptés");

    // Simuler l'ajout de données dans un fichier JSON
    fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    }).then(response => {
        if (response.ok) {
            alert('Inscription réussie');
        } else {
            alert('Erreur lors de l\'inscription');
        }
    });
});
