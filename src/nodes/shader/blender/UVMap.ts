import { Variability } from "../../../crate/Variability"
import { Attribute } from "../../attributes/Attribute"
import { StringAttr } from "../../attributes/StringAttr"
import { TokenAttr } from "../../attributes/TokenAttr"
import { Shader } from "../Shader"

/**
 * Blender 'UV Map' input node: Retrieves a UV Map from the geometry
 */
export class UVMap extends Shader {
    set infoId(value: string | undefined) {
        this.deleteChild("info:id")
        if (value !== undefined) {
            new TokenAttr(this, "info:id", Variability.Uniform, value)
        }
    }
    set inputsVarname(value: string | undefined) {
        this.deleteChild("inputs:varname")
        if (value !== undefined) {
            new StringAttr(this, "inputs:varname", value)
        }
    }
    get outputsResult() {
        let node = this.findChild("outputs:result")
        if (node) {
            return node
        }
        return new Attribute(this, "outputs:result", node => {
            node.setToken("typeName", "float2")
        })
    }
}