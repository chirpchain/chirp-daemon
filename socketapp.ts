/// <reference path="./typings/tsd.d.ts" />
/// <reference path="./bimap.d.ts" />

export = SocketApp;

import messages = require("./messages");
import BiMap = require("bimap");
import events = require("./events");

class SocketApp {
    static MAX_ASSIGN_ID = 64;


    map = new BiMap<number,string>();
    lastId = 0;
    constructor(private io : SocketIO.Server) {
        io.on("connection", (socket : SocketIO.Socket) => {
            console.log("Someone connected");

            socket.on(events.AUDIO_DATA, (msg : messages.AudioMessage) => {
                this.route(events.AUDIO_DATA, msg);
            });
            socket.on(events.BYTE_DATA, (msg : messages.AudioMessage) => {
                this.route(events.BYTE_DATA, msg);
            });
            socket.on(events.CHIRP_DATA, (msg : messages.ChirpMessage) => {
                this.noticeChirpMessage(msg);
                this.route(events.CHIRP_DATA, msg);
            });
            socket.on(events.ASSIGN_ID_REQUEST, () => {
                if (this.lastId == SocketApp.MAX_ASSIGN_ID) this.lastId = 0;
                var newId = this.lastId++;
                this.assignId(socket, newId);
            });
            socket.on(events.LOGIN_REQUEST, (id : number) => {
                console.log("Client id " + id + " logged in");
                if (id < SocketApp.MAX_ASSIGN_ID) {
                    var message = "Client tried to log in with id " + id + " which is below the allowed value!";
                    console.warn();
                    socket.emit(events.CLIENT_ERROR_RESPONSE, message);
                }
                this.assignId(socket, id);
            });
            socket.on(events.LIST_PEERS, () => {
                var keys = new Array<number>();
                for(var key in this.map.kv) {
                    if (! this.map.kv.hasOwnProperty(key)) continue;
                    keys.push(key);
                }
                socket.emit(events.LIST_PEERS, keys);
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
        this.io.sockets.emit(events.PEER_DISCONNECTED_RESPONSE, clientId);
    }

    assignId(socket : SocketIO.Socket, id : number) {
        console.log("Assigning an client id of " + id);
        this.map.push(id, socket.id);
        socket.emit(events.ASSIGN_ID_RESPONSE, id);
        socket.broadcast.emit(events.NEW_PEER_RESPONSE, id);
    }
}