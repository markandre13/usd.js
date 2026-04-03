import { Crate } from "../../crate/Crate.js"
import { SpecType } from "../../crate/SpecType.js"
import { UsdNode } from "./UsdNode.js"

// blender mesh options and how they map to usd
//   shade: flat | smooth
//     'normals' are not per 'points' but 'faceVertexIndices'
//     and the flat/smooth is encoded via those
//   edge > mark sharp
//   edge > mark seam (i guess this is for uv?)
//   edge > bevel weight
//   edge > edge crease
//
//   materials
//     multiple materials for one mesh
//       via GeomSubset which lists the faces
//       viewport display is not stored but taken from color itself during import
//   armature, weights
//   blendshape
//   subdivision modifier becomes part of the Mesh... but might loose sharp edges (?)

export class PseudoRoot extends UsdNode {
    metersPerUnit?: number = 1;
    documentation?: string
    timeCodesPerSecond?: number
    startTimeCode?: number
    endTimeCode?: number
    upAxis?: "X" | "Y" | "Z" = "Z";
    defaultPrim?: string

    // timeCodesPerSecond = 24
    // framesPerSecond = 12
    // endTimeCode = 240
    // startTimeCode = 1

    constructor(crate: Crate) {
        super(crate, undefined, -1, "/", true)
        this.spec_type = SpecType.PseudoRoot
    }

    override encodeFields(): void {
        super.encodeFields()
        this.setDouble("metersPerUnit", this.metersPerUnit)
        this.setString("documentation", this.documentation)
        this.setDouble("timeCodesPerSecond", this.timeCodesPerSecond)
        this.setDouble("startTimeCode", this.startTimeCode)
        this.setDouble("endTimeCode", this.endTimeCode)
        this.setToken("upAxis", this.upAxis)
        this.setToken("defaultPrim", this.defaultPrim)
    }
}
