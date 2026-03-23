import type { TokenIndex } from "../compression/compress"
import { Crate } from "./Crate"
import type { ValueRep } from "./ValueRep"

export class Field {
    tokenIndex: TokenIndex
    valueRep: ValueRep
    constructor(tokenIndex: number, valueRep: ValueRep) {
        this.tokenIndex = tokenIndex
        this.valueRep = valueRep
    }
    toString(tokens?: string[], crate?: Crate) {
        return `{ token_index = ${this.tokenIndex} ${tokens ? ` (${tokens[this.tokenIndex]})` : ''}}, value_rep=${this.valueRep.toString(crate)} }`
    }
}
