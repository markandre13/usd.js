import { Specifier } from "../../crate/Specifier.js"
import { SpecType } from "../../crate/SpecType.js"
import { Variability } from "../../crate/Variability.js"
import { IntArrayAttr } from "../attributes/IntArrayAttr.js"
import { Vec3fArrayAttr } from "../attributes/Vec3fArrayAttr.js"
import { Typed } from "../usd/Typed.js"
import { UsdNode } from "../usd/UsdNode.js"

/**
 * Describes a target blend shape, possibly containing inbetween shapes.
 * 
 * defined in pxr/usd/usdSkel/schema.usda
 */
export class BlendShape extends Typed {
    constructor(parent: UsdNode, name: string) {
        super(parent.crate, parent, -1, name, true)
        this.spec_type = SpecType.Prim
        this.specifier = Specifier.Def
        this.typeName = "BlendShape"
    }

    /**
     * **Required property**. Position offsets which, when added to the
     * base pose, provides the target shape.
     */
    set offsets(value: ArrayLike<number> | undefined) {
        this.deleteChild("offsets")
        if (value !== undefined) {
            new Vec3fArrayAttr(this, "offsets", value, "vector3f[]", Variability.Uniform)
        }
    }
    /**
     * **Required property**. Normal offsets which, when added to the
     * base pose, provides the normals of the target shape.
     */
    set normalOffsets(value: ArrayLike<number> | undefined) {
        this.deleteChild("normalOffsets")
        if (value !== undefined) {
            new Vec3fArrayAttr(this, "normalOffsets", value, "vector3f[]", Variability.Uniform)
        }
    }
    set pointIndices(value: ArrayLike<number> | undefined) {
        this.deleteChild("pointIndices")
        if (value !== undefined) {
            new IntArrayAttr(this, "pointIndices", value, Variability.Uniform)
        }
    }
}
