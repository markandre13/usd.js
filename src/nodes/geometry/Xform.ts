import { Specifier } from "../../crate/Specifier.js"
import { SpecType } from "../../crate/SpecType.js"
import type { UsdNode } from "../usd/UsdNode.js"
import { Xformable } from "./Xformable.js"

/**
 * Concrete prim schema for a transform, which implements Xformable
 *
 * defined in pxr/usd/usdGeom/schema.usda
 */
export class Xform extends Xformable {
    constructor(parent: UsdNode, name: string) {
        super(parent.crate, parent, -1, name, true)
        this.spec_type = SpecType.Prim
        this.specifier = Specifier.Def
        this.typeName = "Xform"
    }
}
