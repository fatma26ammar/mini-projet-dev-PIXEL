# PIXEL — Creative Digital Studio

PIXEL est une landing page responsive réalisée en HTML5, CSS3 et JavaScript
vanilla. Elle présente un studio créatif qui réunit stratégie de marque,
design d'interface et développement web dans un même processus.

## Fonctionnalités de l'assignement

### Obligatoires

- **Menu dynamique (apparition/disparition au scroll)** : le header se masque
  à la descente et réapparaît à la remontée. Il reste visible au début de la
  page, lorsque le menu mobile est ouvert et lorsque l'utilisateur navigue au
  clavier.
- **Carrousel de témoignages avec transitions fluides** : les boutons, les
  indicateurs, les touches gauche/droite et le swipe tactile permettent de
  parcourir quatre témoignages. Le changement de contenu utilise une transition
  d'opacité et de déplacement.
- **Validation avancée du formulaire de contact** : les champs nom, email,
  type de projet et message sont validés en direct et à la soumission. Les
  erreurs sont affichées avec `aria-invalid`, `aria-describedby` et un focus
  automatique sur le premier champ invalide.
- **Modal pour call-to-action** : le bouton **Start a project** ouvre une
  `dialog` native. Le choix du projet est ensuite prérempli dans le formulaire
  de contact.

### Bonus

- **Animations au scroll (reveal effects)** : les éléments portant la classe
  `reveal` apparaissent avec `IntersectionObserver`. Si JavaScript est
  désactivé, le contenu reste visible.
- **Compteurs animés (stats, clients, etc.)** : les statistiques de projets,
  clients, années et pays s'animent lorsqu'elles entrent dans la fenêtre.

## Exécution

Aucune installation, dépendance npm ou étape de build n'est nécessaire.

1. Ouvrir [index.html](index.html) dans un navigateur moderne.
2. Si le navigateur bloque les ressources distantes depuis un fichier local,
   lancer un serveur HTTP statique dans ce dossier.

## Structure du projet

```text
pixel/
├── index.html          # Structure sémantique, formulaire, modal et SVG
├── style.css           # Mise en page, responsive design et animations CSS
├── script.js           # Menu, carrousel, validation, modal, reveal et compteurs
├── README.md           # Documentation du projet
└── assets/
    └── favicon.svg     # Icône de l'onglet
```

## Sections de la page

`index.html` contient :

- un lien d'accès rapide et un header fixe avec navigation responsive ;
- un hero avec artwork abstrait animé et call-to-action ;
- un bandeau de services animé ;
- une section About PIXEL et le processus Strategy, Brand, Interface, Code ;
- une section Services pour Brand identity and strategy, UI/UX design et Web
  Development ;
- un carrousel Testimonials ;
- une section Team avec Yasmine Trabelsi, Karim Ben Salah et Lina Haddad ;
- une section Contact avec formulaire de démonstration ;
- un footer et le modal **Start a project**.

## Rôle de `script.js`

Le fichier `script.js` est chargé à la fin de `index.html` et ne dépend
d'aucune bibliothèque. Il ajoute la classe `js` au document uniquement lorsque
JavaScript est disponible, puis initialise séparément :

1. `initDynamicNav()` pour le menu dynamique au scroll ;
2. `initCarousel()` pour le carrousel de témoignages ;
3. `initFormValidation()` pour la validation avancée du formulaire ;
4. `initModal()` pour le modal du call-to-action ;
5. `initScrollReveal()` pour les reveal effects ;
6. `initCounters()` pour les compteurs animés.

Chaque fonctionnalité est isolée afin qu'une erreur éventuelle ne bloque pas
les autres. La préférence `prefers-reduced-motion` est respectée pour limiter
les animations et conserver une navigation confortable.

## Design et accessibilité

- Fraunces est utilisée pour les titres et DM Sans pour le texte courant.
- La palette utilise notamment plum, berry, pink, mint, blue et paper.
- Le layout est fluide avec `clamp()`, CSS Grid, Flexbox et des breakpoints
  tablette/mobile.
- Les landmarks, titres, labels de formulaire, états de focus, descriptions
  ARIA et lien skip-to-content sont présents.
- Le contenu reste utilisable sans JavaScript : navigation mobile CSS,
  témoignage initial, validation native de base et lien CTA vers Contact.
- Les portraits de l'équipe utilisent des images Unsplash distantes ; les
  polices Google Fonts sont également chargées à distance.

## Validation

Tester la page sur desktop et mobile, avec JavaScript activé et désactivé,
ainsi qu'avec la réduction des animations activée. Pour valider le code :

- HTML : <https://validator.w3.org/nu/>
- CSS : <https://jigsaw.w3.org/css-validator/>

