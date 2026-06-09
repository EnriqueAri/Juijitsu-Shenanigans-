const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("JJS Socket.IO Server Running");
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const players = {};

io.on("connection", (socket) => {

    console.log("Player connected:", socket.id);

    socket.on("join", (data) => {

        players[socket.id] = {
            id: socket.id,
            name: data.name || "Player",
            char: data.char || "gojo",
            pos: data.pos || { x: 0, y: 0, z: 0 },
            hp: data.hp || 100,
            maxHp: data.maxHp || 100,
            yaw: 0
        };

        socket.emit("currentPlayers", players);

        socket.broadcast.emit("playerJoined", {
            id: socket.id,
            ...players[socket.id]
        });

        console.log("Joined:", players[socket.id].name);
    });

    socket.on("move", (data) => {

        if (!players[socket.id]) return;

        if (data.pos)
            players[socket.id].pos = data.pos;

        if (typeof data.yaw === "number")
            players[socket.id].yaw = data.yaw;

        if (typeof data.hp === "number")
            players[socket.id].hp = data.hp;

        socket.broadcast.emit("playerMoved", {
            id: socket.id,
            pos: players[socket.id].pos,
            yaw: players[socket.id].yaw,
            hp: players[socket.id].hp
        });

        if (data.respawned) {
            socket.broadcast.emit("playerRespawned", {
                id: socket.id,
                pos: players[socket.id].pos,
                hp: players[socket.id].hp
            });
        }

        if (data.isUlt) {
            io.emit("ultUsed", {
                id: socket.id
            });
        }
    });

    socket.on("hitPlayer", (data) => {

        if (!data || !data.targetId) return;

        io.to(data.targetId).emit("playerHit", {
            targetId: data.targetId,
            dmg: data.dmg || 0,
            moveName: data.moveName || "Attack",
            color: data.color || "#ffffff"
        });
    });

    socket.on("playerDied", () => {

        socket.broadcast.emit("playerDied", {
            id: socket.id
        });
    });

    socket.on("ping_jjs", (timestamp) => {

        socket.emit("pong_jjs", timestamp);
    });

    socket.on("disconnect", () => {

        console.log("Player disconnected:", socket.id);

        delete players[socket.id];

        io.emit("playerLeft", socket.id);
    });

});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
