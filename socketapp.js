/// <reference path="./typings/tsd.d.ts" />
/// <reference path="./bimap.d.ts" />
var BiMap = require("bimap");
var SocketApp = (function () {
    function SocketApp(io) {
        var _this = this;
        this.io = io;
        this.map = new BiMap();
        this.lastId = 0;
        io.on("connection", function (socket) {
            console.log("Someone connected");
            socket.on("audioData", function (msg) {
                _this.route("audioData", msg);
            });
            socket.on("byteData", function (msg) {
                _this.route("byteData", msg);
            });
            socket.on("chirpData", function (msg) {
                _this.noticeChirpMessage(msg);
                _this.route("chirpData", msg);
            });
            socket.on("assignMeAnId", function () {
                if (_this.lastId == SocketApp.MAX_ASSIGN_ID)
                    _this.lastId = 0;
                var newId = _this.lastId++;
                _this.assignId(socket, newId);
            });
            socket.on("login", function (id) {
                console.log("Client id " + id + " logged in");
                if (id < SocketApp.MAX_ASSIGN_ID) {
                    var message = "Client tried to log in with id " + id + " which is below the allowed value!";
                    console.warn();
                    socket.emit("clientError", message);
                }
                _this.assignId(socket, id);
            });
            socket.on("listPeers", function () {
                var keys = new Array();
                for (var key in _this.map.kv) {
                    if (!_this.map.kv.hasOwnProperty(key))
                        continue;
                    keys.push(key);
                }
                socket.emit("listPeers", keys);
            });
        });
        io.on("disconnect", function (socket) {
            var clientId = _this.map.value(socket);
            _this.clientGone(clientId);
        });
    }
    SocketApp.prototype.noticeChirpMessage = function (msg) {
        console.info("Chirp message received: '" + msg.message + "' to " + msg.to);
    };
    SocketApp.prototype.route = function (event, msg) {
        var targetSocketId = this.map.key(msg.to);
        var targetSocket = this.io.sockets.connected[targetSocketId];
        if (!targetSocket) {
            console.log("Oops, that client isn't connected");
            this.clientGone(msg.to);
            return false;
        }
        else {
            targetSocket.emit(event, msg);
        }
        return true;
    };
    SocketApp.prototype.clientGone = function (clientId) {
        var socketId = this.map.key(clientId);
        console.log("Client with id " + clientId + " and socket id " + socketId + " disconnected");
        this.map.removeKey(clientId);
        this.io.sockets.emit("peerDisconnected", clientId);
    };
    SocketApp.prototype.assignId = function (socket, id) {
        console.log("Assigning an client id of " + id);
        this.map.push(id, socket.id);
        socket.emit("setClientId", id);
        socket.broadcast.emit("newPeer", id);
    };
    SocketApp.MAX_ASSIGN_ID = 64;
    return SocketApp;
})();
module.exports = SocketApp;
//# sourceMappingURL=socketapp.js.map