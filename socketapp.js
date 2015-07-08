/// <reference path="./typings/tsd.d.ts" />
/// <reference path="./bimap.d.ts" />
var BiMap = require("bimap");
var events = require("./events");
var SocketApp = (function () {
    function SocketApp(io, config) {
        var _this = this;
        this.io = io;
        this.config = config;
        this.map = new BiMap();
        this.lastId = 0;
        io.on("connection", function (socket) {
            console.log("Someone connected");
            var doPing = function () {
                var responded = false;
                socket.emit("ping", function () {
                    responded = true;
                });
                setTimeout(function () {
                    if (!responded) {
                        console.log("Ping timed out");
                        socket.disconnect(false);
                    }
                    else {
                        doPing();
                    }
                }, SocketApp.PING_INTERVAL);
            };
            doPing();
            var peerId = -1;
            socket.on("disconnect", function () {
                if (_this.map.key(peerId) === socket.id) {
                    _this.clientGone(peerId);
                }
            });
            socket.on(events.AUDIO_DATA, function (msg) {
                _this.route(events.AUDIO_DATA, msg);
            });
            socket.on(events.BYTE_DATA, function (msg) {
                _this.route(events.BYTE_DATA, msg);
            });
            socket.on(events.CHIRP_DATA, function (msg) {
                _this.noticeChirpMessage(msg);
                _this.route(events.CHIRP_DATA, msg);
            });
            socket.on(events.ASSIGN_ID_REQUEST, function () {
                if (_this.lastId == SocketApp.MAX_ASSIGN_ID)
                    _this.lastId = 0;
                var newId = _this.lastId++;
                peerId = newId;
                _this.assignId(socket, newId);
            });
            socket.on(events.LOGIN_REQUEST, function (id) {
                console.log("Client id " + id + " logged in");
                if (id < SocketApp.MAX_ASSIGN_ID) {
                    var message = "Client tried to log in with id " + id + " which is below the allowed value!";
                    console.warn(message);
                    socket.emit(events.CLIENT_ERROR_RESPONSE, message);
                }
                peerId = id;
                _this.assignId(socket, id);
            });
            socket.on(events.LIST_PEERS, function () {
                var keys = new Array();
                for (var key in _this.map.kv) {
                    if (!_this.map.kv.hasOwnProperty(key))
                        continue;
                    keys.push(key);
                }
                socket.emit(events.LIST_PEERS, keys);
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
        this.io.sockets.emit(events.PEER_DISCONNECTED_RESPONSE, clientId);
    };
    SocketApp.prototype.assignId = function (socket, id) {
        console.log("Assigning an client id of " + id);
        this.map.push(id, socket.id);
        socket.emit(events.ASSIGN_ID_RESPONSE, id);
        socket.emit(events.SET_NODE_INFO, this.config.nodes[id]);
        socket.emit(events.RECEIVE_PEER_NODE_INFOS_EVENT, this.config.nodes);
        socket.broadcast.emit(events.NEW_PEER_RESPONSE, id);
    };
    SocketApp.MAX_ASSIGN_ID = 50;
    SocketApp.PING_INTERVAL = 30000;
    return SocketApp;
})();
module.exports = SocketApp;
//# sourceMappingURL=socketapp.js.map