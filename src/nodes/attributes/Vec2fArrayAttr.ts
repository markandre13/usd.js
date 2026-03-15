import type { Crate } from "../../crate/Crate.ts"
import { SpecType } from "../../crate/SpecType.ts"
import { UsdNode } from "../../crate/UsdNode.ts"

export class Vec2fArrayAttr extends UsdNode {
    value: ArrayLike<number>
    typeName: string
    interpolation?: string
    constructor(
        crate: Crate,
        parent: UsdNode,
        name: string,
        value: ArrayLike<number>,
        typeName: "texCoord2f[]"
    ) {
        super(crate, parent, -1, name, false)
        this.spec_type = SpecType.Attribute
        this.value = value
        this.typeName = typeName
    }

    override encodeFields() {
        super.encodeFields()
        const crate = this.crate

        crate.fieldsets.fieldset_indices.push(
            crate.fields.setToken("typeName", this.typeName)
        )
        if (this.interpolation !== undefined) {
            crate.fieldsets.fieldset_indices.push(
                crate.fields.setToken("interpolation", this.interpolation)
            )
        }
        crate.fieldsets.fieldset_indices.push(
            crate.fields.setVec2fArray("default", this.value)
        )
    }
}
