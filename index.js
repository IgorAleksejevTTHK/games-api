const app = require('express')()
const port = 8080
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./docs/swagger.json');

const games = [
    "Witcher 3",
    "Cyberpunk 2077",
    "Minecraft",
    "Counter-Strike: Global Offensive",
    "Roblox",
    "Grand Theft Auto V",
    "Valorant",
    "Forza Horizon 5"
]

app.get('/games', (req, res) => {
    res.send(games)
})

app.get('/games/:id', (req, res) => {
    res.send(games[req.params.id])
})
app.use ('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`)
})