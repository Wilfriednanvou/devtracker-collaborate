# DevTracker

Une application moderne de gestion de projets et de tâches collaboratives conçue pour les équipes de développement et les gestionnaires de projets.

## 📋 À propos

DevTracker est une plateforme complète de gestion de projets qui permet aux équipes de collaborer efficacement, de suivre l'avancement des tâches et de gérer leurs workflows de manière intuitive. Avec une interface moderne et réactive, DevTracker facilite la coordination des équipes et l'atteinte des objectifs.

## ✨ Fonctionnalités principales

### Gestion de projets
- **Création et gestion de projets** : Organisez vos projets avec des descriptions détaillées
- **Tableau de bord interactif** : Vue d'ensemble de tous vos projets et leur progression
- **Statistiques en temps réel** : Suivez les métriques de performance de vos projets

### Gestion des tâches
- **Tableau Kanban** : Interface drag-and-drop pour organiser vos tâches (À faire, En cours, Terminé)
- **Priorités et statuts** : Système de priorisation (Basse, Moyenne, Haute, Urgente)
- **Échéances** : Définissez et suivez les dates limites
- **Tags personnalisés** : Organisez vos tâches avec des étiquettes
- **Estimation du temps** : Planifiez la charge de travail
- **Édition de tâches** : Modifiez les tâches non terminées à tout moment

### Collaboration
- **Système de commentaires** : Communiquez en temps réel sur les tâches
- **Mentions** : Notifiez les membres de l'équipe avec @
- **Notifications** : Restez informé des mises à jour importantes
- **Upload de fichiers** : Partagez des documents et images

### Visualisation
- **Vue calendrier** : Visualisez vos tâches dans un calendrier mensuel
- **Échéances à venir** : Widget des tâches urgentes
- **Statistiques des membres** : Suivez les contributions de chaque membre

### Gestion des utilisateurs
- **Authentification sécurisée** : Système de connexion/inscription
- **Rôles et permissions** : Admin, Manager de projet, Membre
- **Administration** : Panel d'administration pour gérer les utilisateurs

## 🛠️ Technologies utilisées

- **Frontend**
  - React 18.3.1
  - TypeScript
  - Vite
  - Tailwind CSS
  - shadcn/ui
  - React Router DOM

- **Backend & Base de données**
  - Lovable Cloud (Supabase)
  - PostgreSQL
  - Row Level Security (RLS)

- **Fonctionnalités temps réel**
  - Supabase Realtime
  - Mise à jour automatique des tâches et commentaires

- **Gestion d'état**
  - TanStack Query (React Query)
  - React Context API

- **UI/UX**
  - Radix UI Components
  - Lucide Icons
  - React Hook Form
  - Zod (validation)
  - date-fns (gestion des dates)
  - @dnd-kit (drag and drop)

## 📦 Installation

### Prérequis

- Node.js (version 18 ou supérieure)
- npm ou bun

### Étapes d'installation

1. **Cloner le dépôt**
```bash
git clone <URL_DU_DEPOT>
cd devtracker
```

2. **Installer les dépendances**
```bash
npm install
# ou
bun install
```

3. **Configuration de l'environnement**

Le fichier `.env` est automatiquement configuré avec Lovable Cloud. Les variables suivantes sont disponibles :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

4. **Lancer l'application en mode développement**
```bash
npm run dev
# ou
bun run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🚀 Déploiement

### Via Lovable

1. Ouvrez votre projet dans [Lovable](https://lovable.dev)
2. Cliquez sur le bouton **Publish** en haut à droite
3. Suivez les instructions pour déployer votre application

### Domaine personnalisé

Vous pouvez connecter un domaine personnalisé via les paramètres du projet dans Lovable :
`Projet > Paramètres > Domaines > Connecter un domaine`

## 📱 Utilisation

### Premiers pas

1. **Créer un compte**
   - Accédez à la page d'inscription
   - Remplissez le formulaire avec votre email et mot de passe
   - Connectez-vous avec vos identifiants

2. **Créer votre premier projet**
   - Cliquez sur "Nouveau Projet" depuis le tableau de bord
   - Renseignez le nom et la description du projet
   - Assignez un manager de projet

3. **Ajouter des tâches**
   - Ouvrez un projet
   - Cliquez sur "Nouvelle Tâche"
   - Définissez le titre, la description, la priorité et l'échéance
   - Assignez la tâche à un membre de l'équipe

4. **Organiser avec le Kanban**
   - Glissez-déposez les tâches entre les colonnes
   - Suivez la progression de votre projet

### Rôles et permissions

- **Admin** : Accès complet à tous les projets et gestion des utilisateurs
- **Manager de projet** : Gestion complète de ses projets assignés
- **Membre** : Accès aux projets auxquels il est assigné, peut modifier ses tâches

## 📂 Structure du projet

```
devtracker/
├── public/              # Fichiers statiques
├── src/
│   ├── components/      # Composants React
│   │   ├── ui/         # Composants UI de base (shadcn)
│   │   └── ...         # Composants métier
│   ├── contexts/       # Contextes React (Auth)
│   ├── hooks/          # Hooks personnalisés
│   ├── integrations/   # Intégrations externes (Supabase)
│   ├── lib/            # Utilitaires et helpers
│   ├── pages/          # Pages de l'application
│   ├── index.css       # Styles globaux et variables CSS
│   ├── main.tsx        # Point d'entrée
│   └── App.tsx         # Composant principal
├── supabase/
│   ├── migrations/     # Migrations de base de données
│   └── config.toml     # Configuration Supabase
└── package.json
```

## 🔐 Sécurité

- **Row Level Security (RLS)** : Toutes les tables sont protégées avec des politiques RLS
- **Authentification sécurisée** : Gestion des sessions avec Supabase Auth
- **Validation des données** : Validation côté client et serveur avec Zod
- **Protection des routes** : Routes protégées avec `ProtectedRoute`

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 Développement local

### Scripts disponibles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Prévisualisation du build
npm run preview

# Linting
npm run lint
```

## 🔧 Configuration avancée

### Tailwind CSS

Le design system est configuré dans `tailwind.config.ts` et `src/index.css`. Utilisez les tokens sémantiques définis pour maintenir la cohérence du design.

### Supabase

La configuration Supabase est gérée automatiquement par Lovable Cloud. Pour des modifications avancées, consultez la documentation de Lovable Cloud.

## 📄 Licence

Ce projet est sous licence MIT.

## 🔗 Liens utiles

- [Documentation Lovable](https://docs.lovable.dev/)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation React](https://react.dev/)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)

## 👥 Auteurs

Développé avec ❤️ par l'équipe DevTracker

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur le dépôt GitHub.

---

**DevTracker** - Gérez vos projets avec efficacité et simplicité
