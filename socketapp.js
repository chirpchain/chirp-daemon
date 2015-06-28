/// <reference path="./typings/tsd.d.ts" />
/// <reference path="./bimap.d.ts" />
var BiMap = require("bimap");
var SocketApp = (function () {
    function SocketApp(io) {
        this.io = io;
        this.map = new BiMap();
        this.lastId = 0;
        var self = this;
        io.on("connection", function (socket) {
            console.log("Someone connected");
            socket.on("audioData", function (msg) {
                //console.log("Got an audio message.  Message was from: %s, to: %s, length %d samples at rate %d", msg.from, msg.to, (msg.data.length / 2), msg.sampleRate);
                var targetSocketId = self.map.key(msg.to);
                var targetSocket = io.sockets.connected[targetSocketId];
                if (!targetSocket) {
                    console.log("Oops, that client isn't connected");
                    self.clientGone(msg.to);
                }
                else {
                    targetSocket.emit("audioData", msg);
                }
            });
            socket.on("assignMeAnId", function () {
                var newId = self.lastId++;
                self.assignId(socket, newId);
            });
            socket.on("listPeers", function () {
                var keys = new Array();
                for (var key in self.map.kv) {
                    if (!self.map.kv.hasOwnProperty(key))
                        continue;
                    keys.push(key);
                }
                socket.emit("listPeers", keys);
            });
        });
        io.on("disconnect", function (socket) {
            var clientId = self.map.value(socket);
            self.clientGone(clientId);
        });
    }
    SocketApp.prototype.clientGone = function (clientId) {
        var socketId = this.map.key(clientId);
        console.log("Client with id " + clientId + " and socket id " + socketId + " disconnected");
        this.map.removeKey(clientId);
        this.io.sockets.emit("peerDisconnected", clientId);
    };
    SocketApp.prototype.assignId = function (socket, id) {
        this.map.push(id, socket.id);
        socket.emit("setClientId", id);
        socket.broadcast.emit("newPeer", id);
    };
    return SocketApp;
})();
module.exports = SocketApp;
//# sourceMappingURL=socketapp.js.map