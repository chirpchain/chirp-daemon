/// <reference path="./typings/tsd.d.ts" />
/// <reference path="./bimap.d.ts" />

export = SocketApp;

import messages = require("./messages");
import BiMap = require("bimap");

class SocketApp {
    static MAX_ASSIGN_ID = 64;

    map = new BiMap<number,string>();
    lastId = 0;
    constructor(private io : SocketIO.Server) {
        io.on("connection", (socket : SocketIO.Socket) => {
            console.log("Someone connected");

            socket.on("audioData", (msg : messages.AudioMessage) => {
                this.route("audioData", msg);
            });
            socket.on("byteData", (msg : messages.AudioMessage) => {
                this.route("byteData", msg);
            });
            socket.on("chirpData", (msg : messages.ChirpMessage) => {
                this.noticeChirpMessage(msg);
                this.route("chirpData", msg);
            });
            socket.on("assignMeAnId", () => {
                if (this.lastId == SocketApp.MAX_ASSIGN_ID) this.lastId = 0;
                var newId = this.lastId++;
                this.assignId(socket, newId);
            });
            socket.on("login", (id : number) => {
                console.log("Client id " + id + " logged in");
                if (id < SocketApp.MAX_ASSIGN_ID) {
                    var message = "Client tried to log in with id " + id + " which is below the allowed value!";
                    console.warn();
                    socket.emit("clientError", message);
                }
                this.assignId(socket, id);
            });
            socket.on("listPeers", () => {
                var keys = new Array<number>();
                for(var key in this.map.kv) {
                    if (! this.map.kv.hasOwnProperty(key)) continue;
                    keys.push(key);
                }
                socket.emit("listPeers", keys);
            });
        });
        io.on("disconnect", (socket : SocketIO.Socket) => {
            var clientId = this.map.value(socket);
            this.clientGone(clientId);
        });
    }

    noticeChirpMessage(msg : messages.ChirpMessage) : void {
        console.info("Chirp message received: '" + msg.message + "' to " + msg.to);
    }

    route(event : string, msg : messages.AddressableMessage) : boolean {
        var targetSocketId = this.map.key(msg.to);
        var targetSocket = this.io.sockets.connected[targetSocketId];
        if (! targetSocket) {
            console.log("Oops, that client isn't connected");
            this.clientGone(msg.to);
            return false;
        }
        else {
            targetSocket.emit(event, msg);
        }
        return true;
    }

    clientGone(clientId : number) : void {
        var socketId : string = this.map.key(clientId);
        console.log("Client with id " + clientId + " and socket id " + socketId + " disconnected");
        this.map.removeKey(clientId);
        this.io.sockets.emit("peerDisconnected", clientId);
    }

    assignId(socket : SocketIO.Socket, id : number) {
        console.log("Assigning an client id of " + id);
        this.map.push(id, socket.id);
        socket.emit("setClientId", id);
        socket.broadcast.emit("newPeer", id);
    }
}