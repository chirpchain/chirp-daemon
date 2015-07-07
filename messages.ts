/// <reference path="./typings/tsd.d.ts" />


export = messages;

module messages {
    export interface AddressableMessage {
        from : number;
        to: number;
    }
    export interface AudioMessage extends AddressableMessage {
        data: Buffer;
        sampleRate: number;
    }
    export interface ByteMessage extends AddressableMessage {
        bytes: Buffer;
    }
    export interface ChirpMessage extends AddressableMessage {
        chirpFrom : number;
        chirpTo : number;
        flag : number;
        sender: string;
        recipient : string;
        message : string;
    }
    export interface ChirpNodeInfo {
        id : number;
        name : string;
        acoustic : boolean;
        forwardAcousticNodeId : number;
        backwardAcousticNodeId : number;
    }
 }