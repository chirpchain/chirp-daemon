/// <reference path="./typings/tsd.d.ts" />

export = SocketApp;

import messages = require("messages");

class SocketApp {
    constructor(private io : SocketIO.Server) {
        io.on("connection", function(socket) {
            console.log("Someone connected");
            socket.on("binaryData", function(msg : messages.BinaryMessage) {
                console.log("Got a binary message.  Message was from: %s, to: %s, data length %d", msg.from, msg.to, msg.data.length);
                // send it back...
                msg.to = "androidClient";
                msg.from = "server";
                msg.data.fill(1, 0, msg.data.length);
                socket.emit("binaryData", msg);
            });
            socket.on("audioData", function(msg : messages.AudioMessage) {
                console.log("Got an audio message.  Message was from: %s, to: %s, length %d samples at rate %d", msg.from, msg.to, (msg.data.length / 2), msg.sampleRate);
                // send it back...
                msg.to = "androidClient";
                msg.from = "server";
                msg.data.fill(1, 0, msg.data.length);
                socket.emit("binaryData", msg);
            });
        });
    }
}