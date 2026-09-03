# yFrontend — Plateforme web institutionnelle (Angular)

Application web **single-page responsive** de la plateforme de l'organisation **yFrontend**, développée par **digiKUNTZ**.

Stack : **Angular 17** (Standalone Components, Signals, Router) · **TypeScript** · **SCSS**.

## Fonctionnalités

### Espace public
- **Accueil** : hero banner avec CTA, chiffres clés, présentation, dernières actualités, partenaires.
- **Actualités** : liste paginée + recherche, détail par slug.
- **Nos Actions** : grille des programmes et domaines d’intervention.
- **Partenaires** : grille des partenaires avec logos et sites web.
- **Ressources** : centre de téléchargement avec filtre par catégorie.
- **Contact** : formulaire relié à l'API avec validation visuelle des champs.
- **Pages légales** : mentions légales et politique de confidentialité.

### Back-office `/admin`
- **Login** protégé (JWT) avec `AuthGuard`.
- **Tableau de bord** : métriques de fréquentation (visiteurs, pages vues, séries 14 jours, top pages).
- **CRUD** : actualités, ressources, programmes, partenaires.
- **Messages** : consultation, marquage lu/non lu, suppression.
- **Textes & Réseaux sociaux** : configuration institutionnelle (identification, bannière, coordonnées, réseaux).

## Pré-requis

- Node.js **20.x** (ou supérieur)
- Le **backend** yFrontend démarré (voir `seed_backend/README.md`)
- Un cluster **MongoDB Atlas** accessible depuis le backend

## Installation & démarrage (local)

```bash
# 1. Installer les dépendances
npm install

# 2. Vérifier l'URL de l'API dans src/environments/environment.ts
#    (par défaut http://localhost:3000/api)

# 3. Lancer l'application en développement
npm start
# -> http://localhost:4200
```

Le back-office est accessible sur **http://localhost:4200/admin**
(identifiants par défaut : `admin@seedS.org` / `admin1234`, modifiables via le `.env` du backend).

## Configuration de l'environnement

L'URL de l'API est configurée dans `src/environments/` :

| Fichier                            | Usage                                            |
| ---------------------------------- | ------------------------------------------------ |
| `environment.ts`                   | Utilisé en développement (`npm start`)           |
| `environment.production.ts`        | Utilisé en production (`npm run build`)          |

## Scripts utiles

```bash
npm start      # Serveur de développement sur http://localhost:4200
npm run build  # Compilation optimisée -> dist/seed-frontend
npm run watch  # Build en continu (mode développement)
```

## Structure du projet

```
src/
├── environments/              # URL de l'API par environnement
├── app/
│   ├── core/
│   │   ├── models/            # Interfaces TypeScript des entités
│   │   ├── services/          # Services HTTP (auth, news, contact, stats…)
│   │   ├── interceptors/      # AuthInterceptor (JWT) + ErrorInterceptor
│   │   └── guards/            # AuthGuard (protection /admin)
│   ├── layouts/
│   │   ├── public-layout/     # En-tête + pied de page + contenu public
│   │   └── admin-layout/      # Sidebar + contenu back-office
│   ├── shared/
│   │   ├── components/        # Header, Footer réutilisables
│   │   └── utils/             # Conversion fichiers base64, formatage
│   └── features/
│       ├── home, news, programs, partners, resources, contact, legal, not-found
│       └── admin/             # login, dashboard, gestion-actualites, ressources,
│                              # programmes, partenaires, messages, réglages
```

## Remarque sur les médias

Pour ce prototype, les images, logos et fichiers PDF sont transmis au backend sous forme
**base64** (Data URI) et stockés dans MongoDB. En production, on pourra basculer vers un
stockage objet cloud (S3 / Cloudinary) et utiliser des URLs distantes.