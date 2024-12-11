# Project Setup and Local Deployment

## Prerequisites

1. **Node.js and npm**: Install Node.js (includes npm) from [Node.js official website](https://nodejs.org/).
2. **Docker**: Install Docker from [Docker official website](https://www.docker.com/).
3. **MySQL (if not using Docker)**: Install MySQL if you plan to initialize the database manually.

## Installation Steps

### 1. Install npm Packages
Run the command:
```bash
npm install
```

### 2. Set Up Environment Variables
Copy the `env.example` file to create a `.env` file:
```bash
cp env.example .env
```
Update `.env` with the required values to match your local setup.

### 3. Initialize the Database
You can initialize the database using one of the following methods:

#### Method 1: Using Docker (Recommended)
Run the following command to start the database and phpMyAdmin:
```bash
docker-compose -f db-docker-compose.yml up -d
```
This will:
- Set up a MySQL database.
- Install phpMyAdmin, accessible at [http://localhost:8080](http://localhost:8080).

#### Method 2: Manual Setup
1. Install MySQL on your machine and start the MySQL service.
2. Run the `create_database.js` script to initialize the database:
```bash
node create_database.js
```

### 4. Start the Application
Run the server:
```bash
node index.js
```
The server will start on the port specified in the `SERVER_PORT` variable in your `.env` file.

### 5. Access the Application
Open your browser and navigate to:
```
http://localhost:<SERVER_PORT>
```
Replace `<SERVER_PORT>` with the value defined in your `.env` file.

