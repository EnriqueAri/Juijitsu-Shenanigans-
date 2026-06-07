const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("JJS Multiplayer Server Running");
});

const wss = new WebSocket.Server({ server });

const players = {};

function broadcast(data) {
    const msg = JSON.stringify(data);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}

wss.on("connection", (ws) => {

    const id =
        Math.random().toString(36).substring(2, 9);

    players[id] = {
        id,
        username: "Player",
        x: 0,
        y: 1,
        z: 0,
        hp: 100
    };

    ws.send(JSON.stringify({
        type: "init",
        id
    }));

    ws.on("message", (message) => {

        try {

            const data =
                JSON.parse(message);

            if (data.type === "update") {

                players[id].username =
                    data.username;

                players[id].x = data.x;
                players[id].y = data.y;
                players[id].z = data.z;
            }

            if (
                data.type === "attack" ||
                data.type === "domain" ||
                data.type === "damage"
            ) {

                data.owner = id;

                broadcast(data);
            }

        } catch (err) {
            console.error(err);
        }

    });

    ws.on("close", () => {

        delete players[id];

    });

});

setInterval(() => {

    broadcast({
        type: "players",
        players
    });

}, 50);

server.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Server running on port ${PORT}`
    );

});
