import { Variability } from "../../crate/Variability.js"
import { BooleanAttr } from "../attributes/BooleanAttr.js"
import { Boundable } from "./Boundable.js"

/**
 * Base class for all geometric primitives.
 *
 * Gprim encodes basic graphical properties such as _doubleSided_ and
 * _orientation_, and provides primvars for "display color" and "display
 * opacity" that travel with geometry to be used as shader overrides.
 * 
 * defined in pxr/usd/usdGeom/schema.usda
 */
export class Gprim extends Boundable {
    // color3f[] primvars:displayColor
    // float[] primvars:displayOpacity
    
    /**
     * Although some renderers treat all parametric or polygonal
     * surfaces as if they were effectively laminae with outward-facing
     * normals on both sides, some renderers derive significant optimizations
     * by considering these surfaces to have only a single outward side,
     * typically determined by control-point winding order and/or 
     * \\em orientation.  By doing so they can perform "backface culling" to
     * avoid drawing the many polygons of most closed surfaces that face away
     * from the viewer.
     *
     * However, it is often advantageous to model thin objects such as paper
     * and cloth as single, open surfaces that must be viewable from both
     * sides, always.  Setting a gprim's \\em doubleSided attribute to 
     * \\c true instructs all renderers to disable optimizations such as
     * backface culling for the gprim, and attempt (not all renderers are able
     * to do so, but the USD reference GL renderer always will) to provide
     * forward-facing normals on each side of the surface for lighting
     * calculations.
     */
    set doubleSided(value: boolean | undefined) {
        this.deleteChild("doubleSided")
        if (value !== undefined) {
            new BooleanAttr(this, "doubleSided", value, {variability: Variability.Uniform})
        }
    }
}
