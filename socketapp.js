/// <reference path="./typings/tsd.d.ts" />
var SocketApp = (function () {
    function SocketApp(io) {
        this.io = io;
        io.on("connection", function (socket) {
            console.log("Someone connected");
            socket.on("binaryData", function (msg) {
                console.log("Got a binary message.  Message was from: %s, to: %s, data length %d", msg.from, msg.to, msg.data.length);
                // send it back...
                msg.to = "androidClient";
                msg.from = "server";
                msg.data.fill(1, 0, msg.data.length);
                socket.emit("binaryData", msg);
            });
            socket.on("audioData", function (msg) {
                console.log("Got an audio message.  Message was from: %s, to: %s, length %d samples at rate %d", msg.from, msg.to, (msg.data.length / 2), msg.sampleRate);
                // send it back...
                msg.to = "androidClient";
                msg.from = "server";
                msg.data.fill(1, 0, msg.data.length);
                socket.emit("binaryData", msg);
            });
        });
    }
    return SocketApp;
})();
module.exports = SocketApp;
//# sourceMappingURL=socketapp.js.map