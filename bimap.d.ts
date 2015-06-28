declare type KeyType = number | string;

declare class BiMap<K extends KeyType,V> {
    push(key : K, value: any) : any;
    key(key : K) : any;
    value(value : any) : K;
    removeKey(key : K) : any;
    removeVal(val : any) : any;
    kv : { keys() : K[]; hasOwnProperty(prop: K) : boolean};
    vk : { keys() : V[]; hasOwnProperty(prop: V) : boolean};
}

export = BiMap;