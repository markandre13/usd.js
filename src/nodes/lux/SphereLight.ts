import { Specifier } from "../../crate/Specifier.ts"
import { SpecType } from "../../crate/SpecType.ts"
import type { UsdNode } from "../../crate/UsdNode.ts"
import { Attribute } from "../attributes/Attribute.ts"
import { BoundableLightBase } from "./BoundableLightBase.ts"

/**
 * Light emitted outward from a sphere.
 *
 * defined in pxr/usd/usdLux/schema.usda
 */
export class SphereLight extends BoundableLightBase {
    constructor(parent: UsdNode, name: string) {
        super(parent.crate, parent, -1, name, true)
        this.spec_type = SpecType.Prim
        this.specifier = Specifier.Def
        this.typeName = "SphereLight"

    }

    /**
     * Radius of the sphere.
     */
    set radius(value: number | undefined) {
        this.deleteChild("inputs:radius")
        if (value !== undefined) {
            new Attribute(this, "inputs:radius", (node) => {
                node.setToken("typeName", "float")
                node.setFloat("default", value)
            })
        }
    }
}
