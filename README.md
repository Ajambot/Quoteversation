# Quoteversation

## Description

Quoteversation is a full-stack MERN application written in Typescript and hosted on AWS. It allows users to read, share and like quotes and their respective sources. Quoteversation is my learning project which has taught me more about full-stack development, MERN, Bootstrap, Docker, AWS deployment, DevOps and more!

## Getting Started

### Prerequisites

- Node.js
- npm
- Vite

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/ajambot/quoteversation.git
   ```
2. Install global NPM packages
   ```sh
   npm install
   ```
3. Install NPM packages for the backend
   ```sh
   cd api && npm install
   ```
4. Install NPM packages for the frontend
   ```sh
   cd ../client && npm install
   ```
5. Create a .env file in the root directory with the following variables:
   ```env
    NODE_ENV=development
    PROD_ATLAS_URI=yourProductionMongoDbURI
    DEV_ATLAS_URI=yourDevelopmentMongoDbURI
    PORT=yourBackendPort
    VITE_API_PORT=yourBackendPort
    SECRET=randomSecretForSessions
   ```

### Usage
To start the backend and frontend in development mode, navigate to the `root` directory and run
```sh
   npm run dev
```

### Deployment
This project is set up with GitHub Actions workflows for deployment to AWS EC2 + Nginx proxy (backend) and S3 + Cloudfront (frontend). See the workflows in .github/workflows/ for more details.

## Built With
- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [MongoDB Atlas](https://www.mongodb.com/atlas/database)
- [NodeJS](https://nodejs.org/en)
- [Bootstrap](https://getbootstrap.com/)
- [Vite](https://vitejs.dev/)

## Contributing
I'm still figuring things out over here. Pull requests are open and welcome!

## Contact
Martin Morales - mmorale5@lakeheadu.ca