import { Variability } from "../../crate/Variability.js"
import { Vec2fArrayAttr } from "../attributes/Vec2fArrayAttr.js"
import { Vec3fArrayAttr } from "../attributes/Vec3fArrayAttr.js"
import { VariabilityAttr } from "../attributes/VariabilityAttr.js"
import { Gprim } from "./Gprim.js"
import { Attribute } from "../attributes/Attribute.js"

// Cube size
// Sphere radius
// Cylinder
// Capsule
// Cone
// Cylinder_1
// Capsule_1
// Plane

export type SubdivisionScheme = "catmullClark" | "loop" | "bilinear" | "none"
export type InterpolateBoundary = "none" | "edgeOnly" | "edgeAndCorner"
export type FaceVaryingLinearInterpolation = "none" | "cornersOnly" | "cornersPlus1" | "cornersPlus2" | "boundaries" | "all"

/**
 * Base class for all UsdGeomGprims that possess points,
 * providing common attributes such as normals and velocities.
 */
export class PointBased extends Gprim {
    /**
     * The primary geometry attribute for all PointBased
     * primitives, describes points in (local) space.
     */
    set points(value: ArrayLike<number> | undefined) {
        this.deleteChild("points")
        if (value !== undefined) {
            new Vec3fArrayAttr(this, "points", value, "point3f[]")
        }
    }
    // vector3f[] velocities
    // vector3f[] accelerations
    /**
     * Provide an object-space orientation for individual points, 
     * which, depending on subclass, may define a surface, curve, or free 
     * points.  Note that 'normals' should not be authored on any Mesh that
     * is subdivided, since the subdivision algorithm will define its own
     * normals. 'normals' is not a generic primvar, but the number of elements
     * in this attribute will be determined by its 'interpolation'.  See
     * \\ref SetNormalsInterpolation() . If 'normals' and 'primvars:normals'
     * are both specified, the latter has precedence.
     */
    set normals(value: ArrayLike<number> | undefined) {
        this.deleteChild("normals")
        if (value !== undefined) {
            const attr = new Vec3fArrayAttr(this, "normals", value, "normal3f[]")
            attr.interpolation = "faceVarying"
        }
    }
    set texCoords(value: ArrayLike<number> | undefined) {
        this.deleteChild("primvars:st")
        if (value !== undefined) {
            const attr = new Vec2fArrayAttr(this.crate, this, "primvars:st", value, "texCoord2f[]")
            attr.interpolation = "faceVarying"
        }
    }
    set texIndices(value: ArrayLike<number> | undefined) {
        this.deleteChild("primvars:st:indices")
        if (value !== undefined) {
            new Attribute(this, "primvars:st:indices", (node) => {
                node.setToken("typeName", "int[]")
                node.setIntArray("default", value)
            })
            // const attr = new Vec2fArrayAttr(this.crate, this, "primvars:st:indices", value, "texCoord2f[]")
            // attr.interpolation = "faceVarying"
        }
    }
    interpolateBoundary: InterpolateBoundary = "edgeAndCorner";
    faceVaryingLinearInterpolation: FaceVaryingLinearInterpolation = "cornersPlus1";
}
