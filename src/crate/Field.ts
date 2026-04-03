import type { TokenIndex } from "../compression/compress.js"
import { Crate } from "./Crate.js"
import type { ValueRep } from "./ValueRep.js"

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
