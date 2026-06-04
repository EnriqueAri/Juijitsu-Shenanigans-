const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Juijitsu Shenanigans Multiplayer Server Running!");
});

const wss = new WebSocket.Server({ server });

const players = {};

wss.on("connection", (ws) => {

    const id =
        Math.random().toString(36).substring(2, 9);

    players[id] = {
        id,
        username: "Player",
        x: 0,
        y: 1,
        z: 0
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

        } catch (err) {
            console.error(err);
        }

    });

    ws.on("close", () => {
        delete players[id];
    });

});

setInterval(() => {

    const snapshot = JSON.stringify({
        type: "players",
        players
    });

    wss.clients.forEach(client => {

        if (
            client.readyState ===
            WebSocket.OPEN
        ) {
            client.send(snapshot);
        }

    });

}, 50);

server.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Server running on port ${PORT}`
    );
});
