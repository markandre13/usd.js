import type { ListOp } from "../../crate/Fields.ts"
import { SpecType } from "../../crate/SpecType.ts"
import { UsdNode } from "../../crate/UsdNode.ts"
import { Variability } from "../../crate/Variability.ts"

export class Relationship extends UsdNode {
    value: ListOp<UsdNode>
    constructor(parent: UsdNode, name: string, value: ListOp<UsdNode>) {
        super(parent.crate, parent, -1, name, false)
        this.spec_type = SpecType.Relationship
        this.value = value
    }

    override encodeFields() {
        super.encodeFields()
        const crate = this.crate

        crate.fieldsets.fieldset_indices.push(
            crate.fields.setVariability("variability", Variability.Uniform)
        )
        crate.fieldsets.fieldset_indices.push(
            crate.fields.setPathListOp("targetPaths", this.value)
        )
    }
}
