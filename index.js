
const express = require('express')
const app = express()
const port = 8080
const swaggerUi = require('swagger-ui-express')
const yamljs = require('yamljs')
const swaggerDocument = yamljs.load('./docs/swagger.yaml')
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const PORT = process.env.PORT || port

app.use(express.json())

// Game model
const gameSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }
})

const Game = mongoose.model('Game', gameSchema)

// User model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true }
})

const User = mongoose.model('User', userSchema)

// Connect to MongoDB and start the API
async function startServer() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is missing from .env')
        process.exit(1)
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Connected to MongoDB Atlas')

        await seedDatabase()

        app.listen(PORT, () => {
            console.log(`GamesAPI running at http://localhost:${PORT}`)
            console.log(`Swagger UI: http://localhost:${PORT}/docs`)
        })
    } catch (error) {
        console.error('Failed to start API:', error.message)
        process.exit(1)
    }
}

// Create demo users and initial games
async function seedDatabase() {
    const demoUsers = [
        { username: 'user', password: 'user123', role: 'User' },
        { username: 'admin', password: 'admin123', role: 'Admin' }
    ]

    for (const demoUser of demoUsers) {
        const existingUser = await User.findOne({
            username: demoUser.username
        })

        if (!existingUser) {
            const hashedPassword = await bcrypt.hash(
                demoUser.password,
                10
            )

            await User.create({
                username: demoUser.username,
                password: hashedPassword,
                role: demoUser.role
            })
        }
    }

    const gameCount = await Game.countDocuments()

    if (gameCount === 0) {
        await Game.insertMany([
            { id: 1, name: 'Valorant', price: 0 },
            { id: 2, name: 'Minecraft', price: 20 },
            { id: 3, name: 'GTA 6', price: 90 },
            { id: 4, name: 'GTA 5', price: 10 },
            { id: 5, name: 'Red Dead Redemption 2', price: 30 },
            { id: 6, name: 'Half Life 2', price: 9 },
            { id: 7, name: 'Fortnite', price: 0 }
        ])
    }

    console.log('Database seed completed')
}

// Get all games
app.get('/games', async (req, res) => {
    try {
        const games = await Game.find().sort({ id: 1 })
        res.send(games)
    } catch (error) {
        res.status(500).send({ error: 'Database error' })
    }
})

// Get game by ID
app.get('/games/:id', async (req, res) => {
    try {
        const game = await Game.findOne({
            id: Number(req.params.id)
        })

        if (!game) {
            return res.status(404).send({ error: 'Game not found' })
        }

        res.send(game)
    } catch (error) {
        res.status(500).send({ error: 'Database error' })
    }
})

// Create game
app.post('/games', async (req, res) => {
    if (!req.body.name || !req.body.price) {
        return res.status(400).send({
            error: 'One or all params are missing'
        })
    }

    try {
        const lastGame = await Game.findOne().sort({ id: -1 })

        const game = {
            id: lastGame ? lastGame.id + 1 : 1,
            price: req.body.price,
            name: req.body.name
        }

        await Game.create(game)

        res.status(201)
            .location(`${getBaseUrl(req)}/games/${game.id}`)
            .send(game)
    } catch (error) {
        res.status(500).send({ error: 'Database error' })
    }
})

// Delete game
app.delete('/games/:id', async (req, res) => {
    try {
        const game = await Game.findOneAndDelete({
            id: Number(req.params.id)
        })

        if (!game) {
            return res.status(404).send({ error: 'Game not found' })
        }

        res.status(204).send({ error: 'No content' })
    } catch (error) {
        res.status(500).send({ error: 'Database error' })
    }
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

function getBaseUrl(req) {
    return req.connection && req.connection.encrypted
        ? 'https' : 'http' + `://${req.headers.host}`
}

startServer()
