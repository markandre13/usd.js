import { Specifier } from "../../crate/Specifier.js"
import { SpecType } from "../../crate/SpecType.js"
import type { UsdNode } from "../usd/UsdNode.js"
import { Boundable } from "../geometry/Boundable.js"

/**
 * Concrete prim schema for a transform, which implements Xformable
 *
 * defined in pxr/usd/usdSkel/schema.usda
 */
export class SkelRoot extends Boundable {
    constructor(parent: UsdNode, name: string) {
        super(parent.crate, parent, -1, name, true)
        this.spec_type = SpecType.Prim
        this.specifier = Specifier.Def
        this.typeName = "SkelRoot"
    }
}
