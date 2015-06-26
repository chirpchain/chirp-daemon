/// <reference path="./typings/tsd.d.ts" />


export = messages;

module messages {
    export interface AddressableMessage {
        from : string;
        to: string;
    }
    export interface BinaryMessage  extends AddressableMessage {
        data: Buffer;
    }
    export interface AudioMessage extends AddressableMessage {
        data: Buffer;
        sampleRate: number;
    }
}