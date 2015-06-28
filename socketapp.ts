/// <reference path="./typings/tsd.d.ts" />
/// <reference path="./bimap.d.ts" />

export = SocketApp;

import messages = require("./messages");
import BiMap = require("bimap");

class SocketApp {
    map = new BiMap<number,string>();
    lastId = 0;
    constructor(private io : SocketIO.Server) {
        var self = this;
        io.on("connection", function(socket : SocketIO.Socket) {
            console.log("Someone connected");

            socket.on("audioData", function(msg : messages.AudioMessage) {
                //console.log("Got an audio message.  Message was from: %s, to: %s, length %d samples at rate %d", msg.from, msg.to, (msg.data.length / 2), msg.sampleRate);
                var targetSocketId = self.map.key(msg.to);
                var targetSocket = io.sockets.connected[targetSocketId];
                if (! targetSocket) {
                    console.log("Oops, that client isn't connected");
                    self.clientGone(msg.to);
                }
                else {
                    targetSocket.emit("audioData", msg);
                }
            });
            socket.on("assignMeAnId", function() {
                var newId = self.lastId++;
                self.assignId(socket, newId);
            });
            socket.on("listPeers", function() {
                var keys = new Array<number>();
                for(var key in self.map.kv) {
                    if (! self.map.kv.hasOwnProperty(key)) continue;
                    keys.push(key);
                }
                socket.emit("listPeers", keys);
            });
        });
        io.on("disconnect", function(socket : SocketIO.Socket) {
            var clientId = self.map.value(socket);
            self.clientGone(clientId);
        });
    }

    clientGone(clientId : number) : void {
        var socketId : string = this.map.key(clientId);
        console.log("Client with id " + clientId + " and socket id " + socketId + " disconnected");
        this.map.removeKey(clientId);
        this.io.sockets.emit("peerDisconnected", clientId);
    }

    assignId(socket : SocketIO.Socket, id : number) {
        this.map.push(id, socket.id);
        socket.emit("setClientId", id);
        socket.broadcast.emit("newPeer", id);
    }
}