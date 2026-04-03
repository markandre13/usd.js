import { CrateDataType } from "./CrateDataType.js"
import { TimeSamples } from "../types/TimeSamples.js"

export interface TypedTimeSamples extends TimeSamples {
    sampleType: CrateDataType.Int | CrateDataType.Float | CrateDataType.Vec3h | CrateDataType.Vec3f | CrateDataType.Vec3d | CrateDataType.Quatf | undefined
}
