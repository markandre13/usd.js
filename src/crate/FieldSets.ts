import type { Reader } from "./Reader.js"
import { Section } from "./Section.js"
import { SectionName } from "./SectionName.js"
import { Writer } from "./Writer.js"

export class FieldSets {
    fieldset_indices: number[]
    constructor(reader?: Reader) {
        if (reader) {
        this.fieldset_indices = reader.getCompressedIntegers()
        // console.log(`${SectionName.FIELDSETS} ${this.fieldset_indices.length} = ${JSON.stringify(this.fieldset_indices)}`)
        } else {
            this.fieldset_indices = []
        }
    }

    serialize(writer: Writer) {
        writer.writeCompressedIntegers(this.fieldset_indices)
    }
}
