import { SmartContract, State } from 'o1js';
declare const Bytes50_base: typeof import("o1js/dist/node/lib/provable/bytes.js").Bytes;
declare class Bytes50 extends Bytes50_base {
}
export declare class bpmnCircuit extends SmartContract {
    accepted: State<import("o1js/dist/node/lib/provable/bool.js").Bool>;
    init(): void;
    verifyTrace(trace: Bytes50): Promise<void>;
}
export {};
