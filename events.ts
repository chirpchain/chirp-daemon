var events = {
    AUDIO_DATA : "audioData",
    BYTE_DATA : "byteData",
    CHIRP_DATA : "chirpData",
    ASSIGN_ID_REQUEST : "assignMeAnId",
    LOGIN_REQUEST : "login",
    LIST_PEERS : "listPeers",
    ASSIGN_ID_RESPONSE : "setClientId",
    SET_NODE_INFO: "setNodeInfo",
    RECEIVE_PEER_NODE_INFOS_EVENT: "peerNodeInfos",
    CLIENT_ERROR_RESPONSE : "clientError",
    NEW_PEER_RESPONSE : "newPeer",
    PEER_DISCONNECTED_RESPONSE : "peerDisconnected"
};

export = events;