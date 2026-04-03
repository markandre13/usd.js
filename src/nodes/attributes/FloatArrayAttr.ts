import { SpecType } from "../../crate/SpecType.js"
import { UsdNode } from "../usd/UsdNode.js"


export class FloatArrayAttr extends UsdNode {
    value: ArrayLike<number>
    constructor(parent: UsdNode, name: string, value: ArrayLike<number>) {
        super(parent.crate, parent, -1, name, false)
        this.spec_type = SpecType.Attribute
        this.value = value
    }

    override encodeFields() {
        super.encodeFields()
        const crate = this.crate
        crate.fieldsets.fieldset_indices.push(
            crate.fields.setToken("typeName", "float[]")
        )
        if (this.value.length > 0) {
            crate.fieldsets.fieldset_indices.push(
                crate.fields.setFloatArray("default", this.value)
            )
        }
    }
}
