/// <reference path="./typings/tsd.d.ts" />
/// <reference path="./bimap.d.ts" />

export = SocketApp;

import messages = require("./messages");
import BiMap = require("bimap");
import events = require("./events");

class SocketApp {
    static MAX_ASSIGN_ID = 50;
    static PING_INTERVAL = 30000;


    map = new BiMap<number,string>();
    lastId = 0;
    constructor(private io : SocketIO.Server, private config : messages.Config) {
        io.on("connection", (socket : SocketIO.Socket) => {
            console.log("Someone connected");
            var doPing = () => {
                var responded = false;
                socket.emit("ping", () => {
                    responded = true;
                });
                setTimeout(() => {
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
            socket.on("disconnect", () => {
                if (this.map.key(peerId) === socket.id) {
                    this.clientGone(peerId);
                }
            });
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
                peerId = newId;
                this.assignId(socket, newId);
            });
            socket.on(events.LOGIN_REQUEST, (id : number) => {
                console.log("Client id " + id + " logged in");
                if (id < SocketApp.MAX_ASSIGN_ID) {
                    var message = "Client tried to log in with id " + id + " which is below the allowed value!";
                    console.warn(message);
                    socket.emit(events.CLIENT_ERROR_RESPONSE, message);
                }
                peerId = id;
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
        socket.emit(events.SET_NODE_INFO, this.config.nodes[id]);
        socket.emit(events.RECEIVE_PEER_NODE_INFOS_EVENT, this.config.nodes);
        socket.broadcast.emit(events.NEW_PEER_RESPONSE, id);
    }
}