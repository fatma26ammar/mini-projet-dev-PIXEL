# PIXEL — Creative Digital Studio

PIXEL est un site de studio créatif (landing page) réalisé en HTML5, CSS3 et
JavaScript vanilla, avec une partie serveur en PHP 8.1+ et MySQL/MariaDB.
Le site présente un studio qui réunit stratégie de marque, design d'interface et
développement web. Le formulaire de contact enregistre les messages en base de
données, prévient le studio par email, et les clics sur les boutons principaux
sont comptés côté serveur.

## Fonctionnalités

### Partie front-end (obligatoire)

Menu dynamique : le header se masque à la descente et réapparaît à la
remontée. Il reste visible en haut de page, lorsque le menu mobile est ouvert
et lors de la navigation au clavier.
Carrousel de témoignages : boutons, indicateurs, flèches gauche/droite et
swipe tactile pour parcourir quatre témoignages, avec transition d'opacité et
de déplacement.
Validation avancée du formulaire : nom, email, type de projet et message
sont validés en direct et à l'envoi (`aria-invalid`, `aria-describedby`, focus
automatique sur le premier champ invalide).
Modal « Start a project » : `dialog` native. Le choix du projet est
ensuite prérempli dans le formulaire de contact.

### Bonus front-end

Animations au scroll (`IntersectionObserver`). Sans JavaScript, le contenu
reste visible.
Compteurs animés pour les statistiques (projets, clients, années, pays).

### Partie serveur (PHP + MySQL)

Enregistrement des messages du formulaire dans la table `messages`.
Notification par email au studio (ou écriture dans un fichier de log en
mode démo, voir plus bas).
Compteurs de clics sur 5 boutons (table `click\_counters`) et affichage des
chiffres en direct dans le pied de page.
Page d'administration protégée par mot de passe (`php/admin.php`).
Protections anti-spam et sécurité :
méthode HTTP vérifiée ;
contrôle de l'origine de la requête (même site uniquement) ;
token CSRF lié à la session ;
champ piège (honeypot) `hp\_field` : s'il est rempli, le message est ignoré ;
délai minimum de 3 secondes entre le chargement de la page et l'envoi ;
limite de 5 messages par visiteur toutes les 10 minutes ;
validation complète côté serveur (les mêmes règles que le JavaScript) ;
requêtes SQL préparées, adresses IP stockées uniquement sous forme de hash
SHA-256 salé, sortie HTML échappée dans l'administration.

## Installation avec XAMPP (Windows)

Prérequis : XAMPP avec PHP 8.1 ou plus récent (vérifiable sur
`http://localhost/dashboard/phpinfo.php`).
Copier le dossier du projet dans `C:\\xampp\\htdocs\\pixel`. Le fichier
`index.html` doit se trouver directement dans `htdocs\\pixel\\`, et non dans
`htdocs\\pixel\\pixel\\`.
Démarrer Apache et MySQL dans le panneau de contrôle XAMPP.
Ouvrir `http://localhost/phpmyadmin`, onglet Importer, choisir
`database/schema.sql`, puis valider. La base `pixel` est créée avec les
tables `messages` et `click\_counters`.
Ouvrir le site sur `http://localhost/pixel/` (et pas en double-cliquant
sur `index.html`, car PHP doit être exécuté par Apache).
WAMP et MAMP fonctionnent de la même façon (dossiers `www` ou `htdocs`).
Si le port 80 est déjà utilisé, passer Apache sur 8080 et utiliser
`http://localhost:8080/pixel/`.
> GitHub Pages ne peut pas exécuter PHP : le site s'y affiche, mais le
> formulaire montre une erreur claire et les chiffres en direct restent
> cachés.

## Configuration

Les réglages sont dans `php/inc/config.php` (valeurs par défaut de XAMPP).
Pour les modifier sans toucher à ce fichier et sans publier de secrets sur
GitHub, créer `php/inc/config.local.php` (ignoré par Git) qui ne retourne que
les clés à changer :

``` php
<?php
return \[
    'db\_pass'    => 'mon-mot-de-passe-mysql',
    'admin\_pass' => 'un-mot-de-passe-solide',
    'ip\_salt'    => 'une-longue-chaine-aleatoire',
    'debug'      => false,
];
```

\---

Clé                         Rôle                                       Défaut

\---

`db\_host`                   Serveur MySQL                              `localhost`

`db\_name`                   Nom de la base                             `pixel`

`db\_user`/`db\_pass`         Identifiants MySQL                         `root` / vide

`mail\_mode`                 `log` (fichier) ou `mail` (envoi réel)     `log`

`mail\_to`                   Adresse qui reçoit les messages            `contact@pixel.example`

`mail\_from`                 Adresse expéditrice                        `no-reply@pixel.example`

`min\_fill\_seconds`          Délai minimum avant envoi (anti-robot)     `3`

`rate\_limit\_max`            Messages max par visiteur                  `5`

`rate\_limit\_window`         Fenêtre de la limite, en secondes          `600`

`ip\_salt`                   Sel du hash d'IP                           à changer

`admin\_user`/`admin\_pass`   Accès à `php/admin.php`                    `admin` / `pixel-admin`

## `debug`                     Détails techniques dans les erreurs JSON   `true`

Avant toute mise en ligne : changer `admin\_pass` et `ip\_salt`, et mettre
`debug` à `false`.
Si MySQL renvoie une erreur de connexion avec `localhost`, essayer
`'db\_host' => '127.0.0.1'`.

## Recevoir les messages par email

Par défaut (`mail\_mode = 'log'`), aucun email n'est envoyé : chaque message est
écrit dans `php/storage/mail.log`, ce qui suffit pour une démonstration.
Pour recevoir de vrais emails avec XAMPP, il faut passer en mode `mail` et
configurer l'envoi SMTP de XAMPP.

#### 1\. Activer le mode `mail`

Dans `php/inc/config.local.php` :

``` php
<?php
return \[
    'mail\_mode' => 'mail',
    'mail\_to'   => 'votre.adresse@gmail.com',   // qui reçoit les messages
    'mail\_from' => 'votre.adresse@gmail.com',   // doit être le compte SMTP utilisé
];
```

#### 2\. Créer un mot de passe d'application Gmail

Dans votre compte Google, activer la validation en deux étapes, puis créer un
« mot de passe d'application » (section Sécurité du compte). Google fournit un
mot de passe de 16 caractères : c'est lui qu'il faut utiliser, pas le mot de
passe habituel du compte.

#### 3\. Configurer `sendmail` de XAMPP

Éditer `C:\\xampp\\sendmail\\sendmail.ini` :

``` ini
\[sendmail]
smtp\_server=smtp.gmail.com
smtp\_port=587
smtp\_ssl=auto
error\_logfile=error.log
debug\_logfile=debug.log
auth\_username=votre.adresse@gmail.com
auth\_password=LE\_MOT\_DE\_PASSE\_D\_APPLICATION
force\_sender=votre.adresse@gmail.com
```

Vérifier dans `C:\\xampp\\php\\php.ini`, section `\[mail function]`, que
`sendmail\_path` pointe vers `sendmail.exe` :

``` ini
sendmail\_path = "\\"C:\\xampp\\sendmail\\sendmail.exe\\" -t"
```

#### 4\. Redémarrer Apache et tester

Redémarrer Apache, puis envoyer le formulaire. Le test rapide en ligne de
commande :

``` text
C:\\xampp\\php\\php.exe -r "var\_dump(mail('votre.adresse@gmail.com','Test PIXEL','Bonjour'));"
```

Si rien n'arrive, regarder dans cet ordre :
`C:\\xampp\\sendmail\\error.log`, `C:\\xampp\\sendmail\\debug.log`, le dossier
spam, puis `C:\\xampp\\apache\\logs\\error.log`.
Remarques :
La colonne « Email sent » de l'administration signifie seulement que PHP a
transmis le message à `sendmail`, pas que Gmail l'a accepté. Le détail se
trouve dans les logs de `sendmail`.
Ne publiez jamais `sendmail.ini` ni de mot de passe sur GitHub.
Pour un site en ligne, utiliser plutôt un hébergeur avec envoi d'email
configuré, ou une bibliothèque SMTP comme PHPMailer.

## Tester le projet

`http://localhost/pixel/php/stats.php` doit afficher du JSON avec
`"ok":true`.
Envoyer le formulaire vide, puis avec des données invalides : les erreurs
s'affichent sous chaque champ.
Envoyer un message valide plus de 3 secondes après le chargement de la page :
message de remerciement, nouvelle ligne dans `php/admin.php` et dans la table
`messages`, et entrée dans `php/storage/mail.log` (ou email reçu en mode
`mail`).
Cliquer sur « Let's talk », « Start a project », « Explore services » : les
compteurs du pied de page augmentent.
Envoyer 6 messages en moins de 10 minutes : le sixième est refusé. Pour
recommencer sans attendre, exécuter `DELETE FROM messages;` dans phpMyAdmin.
`http://localhost/pixel/php/storage/mail.log` doit répondre 403 (accès
interdit par `.htaccess`).

## Problèmes fréquents

| Symptôme | Cause probable / solution |
|---|---|
| « We could not reach the server » | Page ouverte hors Apache (`file://`, Live Server). Utiliser `localhost/pixel/`. |
| Erreur 500 avec `Access denied` | Mot de passe MySQL : définir `db\_pass` dans `config.local.php`. |
| Erreur 500 avec `Unknown database 'pixel'` | `schema.sql` non importé. |
| Erreur avec `mb\_strlen` | Activer `extension=mbstring` dans `php.ini`. |
| « That was very fast! » | Attendre 3 secondes après le chargement de la page. |
| « Your session expired » | Recharger la page puis renvoyer. |
| Message « envoyé » mais rien en base | Le champ piège a été rempli (remplissage automatique du navigateur). Vérifier que `hp\_field` a un nom que les navigateurs ne reconnaissent pas, dans `index.html` et `php/contact.php`. |

## Structure du projet

``` text
pixel/
├── index.html            # Structure sémantique, formulaire, modal et SVG
├── style.css             # Mise en page, responsive design, animations
├── script.js             # Fonctionnalités JavaScript (voir ci-dessous)
├── README.md             # Documentation
├── SETUP.txt             # Mémo d'installation XAMPP/WAMP/MAMP
├── HTML-CSS-CHANGES.txt  # Modifications apportées à index.html et style.css pour la partie PHP
├── .gitignore            # Ignore config.local.php et les logs
├── assets/
│   └── favicon.svg       # Icône de l'onglet
├── database/
│   └── schema.sql        # Base `pixel` : tables messages et click\_counters
└── php/
    ├── token.php         # GET  : token CSRF + démarrage du chronomètre anti-robot
    ├── contact.php       # POST : valide, enregistre le message et envoie l'email
    ├── track.php         # POST : ajoute 1 au compteur d'un bouton
    ├── stats.php         # GET  : chiffres en direct (messages, clics)
    ├── admin.php         # Page protégée : messages et clics
    ├── inc/
    │   ├── config.php    # Configuration (surchargeable par config.local.php)
    │   ├── db.php        # Connexion PDO
    │   └── helpers.php   # JSON, session, CSRF, validation
    └── storage/
        ├── .htaccess     # Interdit l'accès web à ce dossier
        └── mail.log      # Créé automatiquement en mode `log`
```

## Rôle de `script.js`

Le fichier est chargé à la fin de `index.html`, ne dépend d'aucune bibliothèque
et ajoute la classe `js` au document uniquement quand JavaScript est disponible.
Huit fonctions sont initialisées séparément, dans un `try/catch`, pour qu'une
erreur ne bloque pas les autres :
`initDynamicNav()` : menu dynamique au scroll ;
`initScrollReveal()` : reveal effects ;
`initCarousel()` : carrousel de témoignages ;
`initFormValidation()` : validation, récupération du token et envoi à
`php/contact.php` avec `fetch()` ;
`initModal()` : modal du call-to-action ;
`initCounters()` : compteurs animés ;
`initClickTracking()` : envoi des clics (`data-track`) à `php/track.php` ;
`initServerStats()` : lecture de `php/stats.php` pour le pied de page.
La préférence `prefers-reduced-motion` est respectée.

## Base de données

`messages` : `id`, `name`, `email`, `project` (`brand`, `uiux`, `web`,
`all`), `message`, `ip\_hash`, `mail\_sent`, `created\_at`.
`click\_counters` : `button\_id`, `label`, `total`, `last\_click`. Seuls les
cinq identifiants insérés par `schema.sql` sont acceptés : `nav-talk`,
`hero-start`, `hero-services`, `modal-continue`, `form-send`.
Pour suivre un nouveau bouton : ajouter `data-track="mon-id"` dans le HTML et
insérer `mon-id` dans `click\_counters`.

## Design et accessibilité

Fraunces pour les titres, DM Sans pour le texte courant.
Palette : plum, berry, pink, mint, blue et paper.
Layout fluide avec `clamp()`, CSS Grid, Flexbox et breakpoints tablette/mobile.
Landmarks, titres, labels, états de focus, descriptions ARIA et lien
« skip to content ».
Le contenu reste utilisable sans JavaScript (navigation mobile en CSS,
premier témoignage, lien CTA vers Contact).
Les portraits de l'équipe viennent d'Unsplash et les polices de Google Fonts :
une connexion internet est nécessaire pour les afficher.

## Validation

Tester sur ordinateur et mobile, avec JavaScript activé puis désactivé, et avec
la réduction des animations activée. Valider le code avec :
HTML : https://validator.w3.org/nu/
CSS : https://jigsaw.w3.org/css-validator/

