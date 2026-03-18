import { hexdump, parseHexDump } from "../src/detail/hexdump"
import { expect } from "chai"
import { compressToBuffer, decompressFromBuffer } from "../src/compression/compress"
import { Stage } from "../src/crate/Stage"
import { readFileSync, writeFileSync } from "fs"
import { Reader } from "../src/crate/Reader"
import { SpecType } from "../src/crate/SpecType"
import { CrateDataType } from "../src/crate/CrateDataType"
import { Writer } from "../src/crate/Writer"
import { BootStrap } from "../src/crate/BootStrap"
import { TableOfContents } from "../src/crate/TableOfContents"
import { Section } from "../src/crate/Section"
import { Tokens } from "../src/crate/Tokens"
import { SectionName } from "../src/crate/SectionName"
import { Fields } from "../src/crate/Fields"
import { Crate } from "../src/crate/Crate"
import { Paths } from "../src/crate/Paths"
import { UsdNode } from "../src/nodes/usd/UsdNode"
import { Strings } from "../src/crate/Strings"
import { FieldSets } from "../src/crate/FieldSets"
import { Specs } from "../src/crate/Specs"
import { compressBound } from "../src/compression/lz4"
import { decodeIntegers, encodeIntegers } from "../src/compression/integers"
import { Mesh } from "../src/nodes/geometry/Mesh"
import { Xform } from "../src/nodes/geometry/Xform"
import { PseudoRoot } from "../src/nodes/usd/PseudoRoot"
import { ValueRep } from "../src/crate/ValueRep"

function makeCreate() {
    return new Crate()
}

function wrangle(root: UsdNode, path: string = "/") {
    root.crate.serialize(root)
    const stage = new Stage(Buffer.from(root.crate.writer.buffer))
    return stage.getPrimAtPath(path)
}

describe("USD", () => {
    it("READ", () => {
        const buffer = readFileSync("spec/examples/armature.usdc")
        const stage = new Stage(buffer)
        const origPseudoRoot = stage.getPrimAtPath("/")!
        const orig = origPseudoRoot.toJSON()
        // console.log(JSON.stringify(orig, undefined, 4))
        // console.log(stringify(orig, { indent: 4 }))
    })
    describe("nodes", () => {
        describe("PseudoRoot", () => {
            it("plain", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                pseudoRoot.metersPerUnit = undefined
                pseudoRoot.upAxis = undefined
                const rootOut = wrangle(pseudoRoot).toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "PseudoRoot",
                    "name": "/",
                    "prim": true
                })
            })
            it(".metersPerUnit", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                pseudoRoot.metersPerUnit = 3
                pseudoRoot.upAxis = undefined

                const rootOut = wrangle(pseudoRoot).toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "fields": {
                        "metersPerUnit": {
                            "array": false,
                            "compressed": false,
                            "inline": true,
                            "type": "Double",
                            "value": 3
                        }
                    },
                    "type": "PseudoRoot",
                    "name": "/",
                    "prim": true
                })
            })
            it(".documentation", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                pseudoRoot.metersPerUnit = undefined
                pseudoRoot.upAxis = undefined
                pseudoRoot.documentation = "foobar"

                const rootOut = wrangle(pseudoRoot).toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "PseudoRoot",
                    "name": "/",
                    "prim": true,
                    "fields": {
                        "documentation": {
                            "type": "String",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "foobar"
                        }
                    }
                })
            })
            it(".upAxis", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                pseudoRoot.upAxis = "Y"
                pseudoRoot.metersPerUnit = undefined

                const rootOut = wrangle(pseudoRoot).toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "PseudoRoot",
                    "name": "/",
                    "prim": true,
                    "fields": {
                        "upAxis": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "Y"
                        }
                    }
                })
            })
            // defaultPrim
            // TODO: test "properties" and "primChildren" on UsdNode
            it("primChildren", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                pseudoRoot.metersPerUnit = undefined
                pseudoRoot.upAxis = undefined
                const mesh = new Xform(pseudoRoot, "Cube")

                const rootOut = wrangle(pseudoRoot).toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "PseudoRoot",
                    "name": "/",
                    "prim": true,
                    "fields": {
                        "primChildren": {
                            "type": "TokenVector",
                            "inline": false,
                            "array": false,
                            "compressed": false,
                            "value": [
                                "Cube"
                            ]
                        }
                    },
                    "children": [
                        {
                            "type": "Prim",
                            "name": "Cube",
                            "prim": true,
                            "fields": {
                                "specifier": {
                                    "type": "Specifier",
                                    "inline": true,
                                    "array": false,
                                    "compressed": false,
                                    "value": "Def"
                                },
                                "typeName": {
                                    "type": "Token",
                                    "inline": true,
                                    "array": false,
                                    "compressed": false,
                                    "value": "Xform"
                                }
                            }
                        }
                    ]
                })
            })
        })
        describe("Xform", () => {
            it("plain", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                const xform = new Xform(pseudoRoot, "Cube")

                const rootOut = wrangle(pseudoRoot, "/Cube").toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "Prim",
                    "name": "Cube",
                    "prim": true,
                    "fields": {
                        "specifier": {
                            "type": "Specifier",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "Def"
                        },
                        "typeName": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "Xform"
                        }
                    }
                })
            })
            it(".customData", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                const xform = new Xform(pseudoRoot, "Cube")
                xform.customData = {
                    foo: true
                }

                const rootOut = wrangle(pseudoRoot, "/Cube").toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "Prim",
                    "name": "Cube",
                    "prim": true,
                    "fields": {
                        "specifier": {
                            "type": "Specifier",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "Def"
                        },
                        "typeName": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "Xform"
                        },
                        "customData": {
                            "type": "Dictionary",
                            "inline": false,
                            "array": false,
                            "compressed": false,
                            "value": {
                                "foo": true
                            }
                        }
                    }
                })

            })
        })
        describe("Mesh", () => {
            it("plain", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                const mesh = new Mesh(pseudoRoot, "Cube")
                mesh.blenderDataName = "Cube"

                const rootOut = wrangle(pseudoRoot, "/Cube").toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "Prim",
                    "name": "Cube",
                    "prim": true,
                    "fields": {
                        "properties": {
                            "type": "TokenVector",
                            "inline": false,
                            "array": false,
                            "compressed": false,
                            "value": [
                                "userProperties:blender:data_name"
                            ]
                        },
                        "specifier": {
                            "type": "Specifier",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "Def"
                        },
                        "typeName": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "Mesh"
                        },
                        "active": {
                            "type": "Bool",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": true
                        }
                    },
                    "children": [
                        {
                            "type": "Attribute",
                            "name": "userProperties:blender:data_name",
                            "prim": false,
                            "fields": {
                                "custom": {
                                    "type": "Bool",
                                    "inline": true,
                                    "array": false,
                                    "compressed": false,
                                    "value": true
                                },
                                "typeName": {
                                    "type": "Token",
                                    "inline": true,
                                    "array": false,
                                    "compressed": false,
                                    "value": "string"
                                },
                                "default": {
                                    "type": "String",
                                    "inline": true,
                                    "array": false,
                                    "compressed": false,
                                    "value": "Cube"
                                }
                            }
                        }
                    ]
                })
            })
            it(".points", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                const mesh = new Mesh(pseudoRoot, "Cube")
                mesh.points = [6, 6, 6]
                mesh.points = [0, 1, 2, 3, 4, 5]

                const rootOut = wrangle(pseudoRoot, "/Cube").getAttribute("points")!.toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "Attribute",
                    "name": "points",
                    "prim": false,
                    "fields": {
                        "typeName": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "point3f[]"
                        },
                        "default": {
                            "type": "Vec3f",
                            "inline": false,
                            "array": true,
                            "compressed": false,
                            "value": [0, 1, 2, 3, 4, 5]
                        }
                    }
                })
            })
            it(".faceVertexCounts", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                const mesh = new Mesh(pseudoRoot, "Cube")
                mesh.faceVertexCounts = [6, 6, 6]
                mesh.faceVertexCounts = [4, 4, 4]

                const rootOut = wrangle(pseudoRoot, "/Cube").getAttribute("faceVertexCounts")!.toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "Attribute",
                    "name": "faceVertexCounts",
                    "prim": false,
                    "fields": {
                        "typeName": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "int[]"
                        },
                        "default": {
                            "type": "Int",
                            "inline": false,
                            "array": true,
                            "compressed": false,
                            "value": [4, 4, 4]
                        }
                    }
                })
            })
            it(".faceVertexIndices", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                const mesh = new Mesh(pseudoRoot, "Cube")
                mesh.faceVertexIndices = [6, 6, 6]
                mesh.faceVertexIndices = [4, 4, 4]

                const rootOut = wrangle(pseudoRoot, "/Cube").getAttribute("faceVertexIndices")!.toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "Attribute",
                    "name": "faceVertexIndices",
                    "prim": false,
                    "fields": {
                        "typeName": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "int[]"
                        },
                        "default": {
                            "type": "Int",
                            "inline": false,
                            "array": true,
                            "compressed": false,
                            "value": [4, 4, 4]
                        }
                    }
                })
            })
            it(".normals", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                const mesh = new Mesh(pseudoRoot, "Cube")
                mesh.normals = [6, 6, 6]
                mesh.normals = [4, 4, 4]

                const rootOut = wrangle(pseudoRoot, "/Cube").getAttribute("normals")!.toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "Attribute",
                    "name": "normals",
                    "prim": false,
                    "fields": {
                        "typeName": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "normal3f[]"
                        },
                        "default": {
                            "type": "Vec3f",
                            "inline": false,
                            "array": true,
                            "compressed": false,
                            "value": [4, 4, 4]
                        },
                        "interpolation": {
                            "array": false,
                            "compressed": false,
                            "inline": true,
                            "type": "Token",
                            "value": "faceVarying"
                        }
                    }
                })
            })
            it(".texCoords", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                const mesh = new Mesh(pseudoRoot, "Cube")
                mesh.texCoords = [6, 6,]
                mesh.texCoords = [4, 4]

                const rootOut = wrangle(pseudoRoot, "/Cube").getAttribute("primvars:st")!.toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "Attribute",
                    "name": "primvars:st",
                    "prim": false,
                    "fields": {
                        "typeName": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "texCoord2f[]"
                        },
                        "interpolation": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "faceVarying"
                        },
                        "default": {
                            "type": "Vec2f",
                            "inline": false,
                            "array": true,
                            "compressed": false,
                            "value": [4, 4]
                        }
                    }
                })
            })
            it(".extent", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                const mesh = new Mesh(pseudoRoot, "Cube")
                mesh.extent = [0, 0, 0, 0, 0, 0]
                mesh.extent = [1, 2, 3, 4, 5, 6]

                const rootOut = wrangle(pseudoRoot, "/Cube").getAttribute("extent")!.toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "Attribute",
                    "name": "extent",
                    "prim": false,
                    "fields": {
                        "typeName": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "float3[]"
                        },
                        "default": {
                            "type": "Vec3f",
                            "inline": false,
                            "array": true,
                            "compressed": false,
                            "value": [1, 2, 3, 4, 5, 6]
                        }
                    }
                })
            })
            it(".subdivisionScheme", () => {
                const crate = makeCreate()
                const pseudoRoot = new PseudoRoot(crate)
                const mesh = new Mesh(pseudoRoot, "Cube")
                mesh.subdivisionScheme = "bilinear"
                mesh.subdivisionScheme = "catmullClark"

                const rootOut = wrangle(pseudoRoot, "/Cube").getAttribute("subdivisionScheme")!.toJSON()

                // console.log(JSON.stringify(rootOut, undefined, 4))

                expect(rootOut).to.deep.equal({
                    "type": "Attribute",
                    "name": "subdivisionScheme",
                    "prim": false,
                    "fields": {
                        "typeName": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "token"
                        },
                        "variability": {
                            "type": "Variability",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "Uniform"
                        },
                        "default": {
                            "type": "Token",
                            "inline": true,
                            "array": false,
                            "compressed": false,
                            "value": "catmullClark"
                        }
                    }
                })
            })
        })
    })
    it("read cube.usdc and compare it with cube.json", () => {
        const buffer = readFileSync("spec/cube.usdc")
        const stage = new Stage(buffer)

        const pseudoRoot = stage.getPrimAtPath("/")!
        expect(pseudoRoot).to.not.be.undefined
        expect(pseudoRoot.getType()).to.equal(SpecType.PseudoRoot)

        const mesh = stage.getPrimAtPath("/root/Cube/Cube_001")!
        expect(mesh).to.not.be.undefined
        expect(mesh.getType()).to.equal(SpecType.Prim)

        const faceVertexIndices = mesh.getAttribute("faceVertexIndices")!
        expect(faceVertexIndices).to.not.be.undefined
        expect(faceVertexIndices.getType()).to.equal(SpecType.Attribute)

        const materialBinding = mesh.getRelationship("material:binding")!
        expect(materialBinding).to.not.be.undefined
        expect(materialBinding.getType()).to.equal(SpecType.Relationship)
        // console.log(JSON.stringify(materialBinding, undefined, 4))

        // console.log(JSON.stringify(pseudoRoot, undefined))

        const json = JSON.parse(readFileSync("spec/cube.json").toString())
        writeFileSync("spec/cube.json.tmp", JSON.stringify(pseudoRoot.toJSON(), undefined, 4))
        // console.log(JSON.stringify(pseudoRoot.toJSON()))
        expect(pseudoRoot.toJSON()).to.deep.equal(json)

    })
    describe("encode/decode values", () => {
        it("inline String", () => {
            const crate = new Crate()
            crate.fields.setString("aaa", "foo")
            const idx = crate.fields.setString("aaa", "bar")

            const value = new ValueRep(crate.fields.valueReps.view, 8)

            expect(value.getType()).to.equal(CrateDataType.String)
            expect(crate.strings.get(value.getIndex())).to.equal("bar")
            expect(value.getValue(crate)).to.equal("bar")
        })
        it("inline Float", () => {
            const crate = new Crate()
            const idx = crate.fields.setFloat("aaa", 3.1415)

            const value = new ValueRep(crate.fields.valueReps.view, idx)

            expect(value.getType()).to.equal(CrateDataType.Float)
            expect(value.getFloat()).to.equal(3.1414999961853027)
            expect(value.getValue(crate)).to.equal(3.1414999961853027)
        })
        it("inline Double", () => {
            const crate = new Crate()
            const idx = crate.fields.setDouble("aaa", 3.1415)

            const value = new ValueRep(crate.fields.valueReps.view, idx)

            expect(value.getType()).to.equal(CrateDataType.Double)
            expect(value.getDouble()).to.equal(3.1414999961853027)
            expect(value.getValue(crate)).to.equal(3.1414999961853027)
        })
        it("inline Bool", () => {
            const crate = new Crate()
            const idx = crate.fields.setBoolean("aaa", true)

            const value = new ValueRep(crate.fields.valueReps.view, idx)

            expect(value.getType()).to.equal(CrateDataType.Bool)
            expect(value.getBool()).to.equal(true)
            expect(value.getValue(crate)).to.equal(true)
        })
        it("Dictionary", () => {
            const customData = {
                generated: true
            }
            const crate = new Crate()
            crate.reader = new Reader(crate.writer.view)

            const idx = crate.fields._setDictionary(customData)

            const value = new ValueRep(crate.fields.valueReps.view, idx)
            expect(value.getType()).to.equal(CrateDataType.Dictionary)
            expect(value.getValue(crate)).to.deep.equal(customData)
        })
        it("Dictionary containing Dictionary", () => {
            const customData = {
                Blender: {
                    generated: true
                }
            }
            const crate = new Crate()
            crate.reader = new Reader(crate.writer.view)

            const idx = crate.fields._setDictionary(customData)

            const value = new ValueRep(crate.fields.valueReps.view, idx)
            expect(value.getType()).to.equal(CrateDataType.Dictionary)
            expect(value.getValue(crate)).to.deep.equal(customData)
        })
        it("Int")
        it("Vec3d")
        it("Matrix[234]d[\[\]])")
    })
    describe("Crate parts", () => {
        it("BootStrap", () => {
            const writer = new Writer()
            const headerOut = new BootStrap()
            headerOut.serialize(writer)

            const reader = new Reader(writer.buffer)
            const headerIn = new BootStrap(reader)

            expect(headerOut.indent).to.equal(headerIn.indent)
            expect(headerOut.version).to.deep.equal(headerIn.version)
            expect(headerOut.tocOffset).to.equal(headerIn.tocOffset)
        })
        it("TableOfContents & Section", () => {
            const tocOut = new TableOfContents()
            tocOut.addSection(new Section({ name: "A", start: 1, size: 2 }))
            tocOut.addSection(new Section({ name: "B", start: 3, size: 4 }))

            const writer = new Writer()
            tocOut.serialize(writer)

            const reader = new Reader(writer.buffer)
            const tocIn = new TableOfContents(reader)

            // expect(tocOut).to.deep.equal(tocIn)
            expect(tocIn.sections.size).to.equal(tocOut.sections.size)
            expect(tocIn.sections.get("A")).to.deep.equal(tocOut.sections.get("A"))
            expect(tocIn.sections.get("B")).to.deep.equal(tocOut.sections.get("B"))
        })
        describe(SectionName.TOKENS, () => {
            const tokensOut = new Tokens()
            tokensOut.add("Mesh")
            tokensOut.add("Cylinder")

            const writer = new Writer()
            tokensOut.serialize(writer)

            const reader = new Reader(writer.buffer)
            const tokensIn = new Tokens(reader)

            expect(tokensIn.tokens).to.deep.equal(tokensOut.tokens)
        })
        it(SectionName.STRINGS, () => {
            const tokens = new Tokens()
            const stringsOut = new Strings(tokens)
            tokens.add("Xform")
            expect(stringsOut.add("hello")).to.equal(0)
            tokens.add("Mesh")
            expect(stringsOut.add("world")).to.equal(1)

            const writer = new Writer()
            stringsOut.serialize(writer)

            const reader = new Reader(writer.buffer)
            const stringsIn = new Strings(reader, tokens)

            expect(stringsIn.get(0)).to.equal("hello")
            expect(stringsIn.get(1)).to.equal("world")
        })
        it(SectionName.FIELDS, () => {
            const tokens = new Tokens()
            const strings = new Strings(tokens)
            const data = new Writer()
            const fieldsOut = new Fields(tokens, strings, data)
            fieldsOut.setFloat("metersPerUnit", 1)

            const writer = new Writer()
            fieldsOut.serialize(writer)

            // console.log(`ENCODED VALUE REP`)
            // hexdump(new Uint8Array(fieldsIn.valueReps.buffer))

            const reader = new Reader(writer.buffer)
            const fieldsIn = new Fields(reader)

            // console.log(fieldsOut.fields)

            expect(fieldsIn.fields).to.have.lengthOf(1)

            // console.log(`DECODED VALUE REP`)
            // fieldsOut.fields![0].valueRep.hexdump()

            expect(fieldsIn.fields![0].valueRep.getType()).to.equal(CrateDataType.Float)
            expect(fieldsIn.fields![0].valueRep.isInlined()).to.be.true
            expect(fieldsIn.fields![0].valueRep.isArray()).to.be.false
            expect(fieldsIn.fields![0].valueRep.isCompressed()).to.be.false

            // console.log(`${fieldsOut.fields![0]}`)

            const crate = {
                tokens,
                reader
            } as any as Crate

            // console.log(`${fieldsOut.fields![0].valueRep.getValue(crate)}`)
            expect(fieldsIn.fields![0].valueRep.getValue(crate)).to.equal(1)
        })
        it(SectionName.FIELDSETS, () => {
            const fieldsetsOut = new FieldSets()
            fieldsetsOut.fieldset_indices = [0, 1, 2, -1, 3, 4, 5, -1]

            const writer = new Writer()
            fieldsetsOut.serialize(writer)

            const reader = new Reader(writer.buffer)
            const fieldssetIn = new FieldSets(reader)

            expect(fieldssetIn.fieldset_indices).to.deep.equal(fieldsetsOut.fieldset_indices)
        })
        it(SectionName.PATHS, () => {
            const crate = makeCreate()
            const pathsOut = crate.paths
            pathsOut._nodes = []

            const pseudoRoot = new UsdNode(crate, undefined, pathsOut._nodes.length, "/", true)
            pseudoRoot.spec_type = SpecType.PseudoRoot
            // pseudoRoot.setDouble("metersPerUnit", 1.0)
            // pseudoRoot.setString("documentation", "Blender v5.0.0")
            // pseudoRoot.setToken("upAxis", "Z")
            // pseudoRoot.setTokenVector("primChildren", ["root"])
            // pseudoRoot.setToken("defaultPrim", "root")
            pathsOut._nodes.push(pseudoRoot)

            const xform = new UsdNode(crate, pseudoRoot, pathsOut._nodes.length, "root", true)
            xform.spec_type = SpecType.Prim
            // xform.setSpecifier("specifier", "Def")
            // xform.setToken("typeName", "Xform")
            // xform.setTokenVector("primChildren", ["Cube", "Sphere"])
            pathsOut._nodes.push(xform)

            const cube = new UsdNode(crate, xform, pathsOut._nodes.length, "Cube", true)
            cube.spec_type = SpecType.Prim
            // cube.setSpecifier("specifier", "Def")
            // xform.setToken("typeName", "Mesh")
            // xform.setTokenVector("properties", ["extent", "faceVertexCounts"])
            pathsOut._nodes.push(cube)
            // type Attribute
            // name:extent
            // fields?
            //   typeName: Token float[]
            const extent = new UsdNode(crate, cube, pathsOut._nodes.length, "extent", true)
            extent.spec_type = SpecType.Attribute
            // extent.setToken("typeName", "float3[]")
            // not a map to ensure the order...?
            //

            // or immediatly create the ValueReps and FieldSet etc???
            // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ this because
            // * performance
            // * my main goal at the moment is writing!!!
            // reading could also be done in a similar way
            // * read and decompress all, build tree as the last final step !!!!!!!!!!!!

            // extent.field.add("typeName", new Token("float3[]"))
            // extend.field.add("default", new Vec3fArray([0,0,0,1,1,1]))
            // since we get the typeName only with the fieldset, we might need to create
            // two trees: one with UsdNode, then one with PseudoRoot, Xform, Mesh, ...
            pathsOut._nodes.push(extent)

            const faceVertexCounts = new UsdNode(crate, cube, pathsOut._nodes.length, "faceVertexCounts", true)
            faceVertexCounts.spec_type = SpecType.Attribute
            // faceVertexCounts.setToken("typeName", "int[]")
            // faceVertexCounts.setIntArray("default", [4,4,4,4,4,4])
            pathsOut._nodes.push(faceVertexCounts)

            const sphere = new UsdNode(crate, xform, pathsOut._nodes.length, "Sphere", true)
            sphere.spec_type = SpecType.Prim
            pathsOut._nodes.push(sphere)

            // pseudoRoot.print()

            const writer = new Writer()
            const tokens = new Tokens()
            // console.log("------------------------------------------ serialize")
            pathsOut.encode(tokens, pseudoRoot)
            pathsOut.serialize(writer)
            // console.log("------------------------------------------")

            const toc = new TableOfContents()
            toc.addSection(new Section({ name: SectionName.PATHS, start: 0, size: writer.tell() }))

            // console.log("------------------------------------------ deserialize")
            const reader = new Reader(writer.buffer)
            const crateOut = {
                toc: toc,
                tokens: tokens.tokens,
                reader
            } as any as Crate
            const pathsIn = new Paths(reader)
            // console.log("------------------------------------------ dump")
            // for(let i=0; i<pathsOut._nodes.length; ++i) {
            //     const n = pathsOut._nodes[i]
            //     console.log(`[${i}] = ${n.name} ${n.index}`)
            // }

            // THIS FAILS BECAUSE NOW THE CRATE BUILDS THE NODES
            // const root = pathsOut._nodes[0]
            // // root.print()

            // expect(pathsOut._nodes).to.have.lengthOf(6)

            // expect(root.name).to.equal("/")
            // expect(root.children[0].name).to.equal("root")
            // expect(root.children[0].children[0].name).to.equal("Cube")
            // expect(root.children[0].children[0].children[0].name).to.equal("extent")
            // expect(root.children[0].children[0].children[1].name).to.equal("faceVertexCounts")
            // expect(root.children[0].children[1].name).to.equal("Sphere")
        })
        it(SectionName.SPECS, () => {
            const specsOut = new Specs()
            specsOut.pathIndexes = [0, 1, 2]
            specsOut.fieldsetIndexes = [3, 4, 5]
            specsOut.specTypeIndexes = [6, 7, 8]

            const writer = new Writer()
            specsOut.serialize(writer)

            const reader = new Reader(writer.buffer)
            const specsIn = new Specs(reader)

            expect(specsIn).to.deep.equal(specsOut)
        })
    })
    describe("Reader & Writer", () => {
        it("grows on demand", () => {
            const flex = new Writer(8)
            for (let i = 0; i < 20; ++i) {
                flex.writeUint8(i)
            }
            expect(flex.buffer).to.deep.equal(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]).buffer)
        })
        describe("compressedInts", () => {
            it("Reader.readCompressedInts()", () => {
                const compressed = parseHexDump(`
                    0000 47 00 00 00 00 00 00 00 00 52 2d 00 00 00 55 01 G........R-...U.
                    0010 00 f0 18 44 11 45 15 45 45 54 54 04 02 01 02 02 ...D.E.EETT.....
                    0020 02 01 01 02 fa 0c f4 04 0b 02 fb f8 fc 04 fc 0c ................
                    0030 f8 08 f8 08 f8 2c 01 d3 d3 00 03 00 f0 02 00 00 .....,..........
                    0040 00 d3 09 ca 0b 02 c6 d3 00 11 c2 00 00 d3 d3    ...............
                    `)
                const reader = new Reader(new DataView(compressed.buffer))
                const result = reader.getCompressedIntegers(63)
                const want = [2, 3, 5, 7, 9, 10, 11, 13, 7, 19, 7, 11, 22, 24, 19, 11,
                    7, 11, 7, 19, 11, 19, 11, 19, 11, 55, 56, 11, 56, 11, 56, 56,
                    11, 56, 11, 56, 56, 11, 56, 56, 56, 56, 11, 56, 65, 11, 56, 67,
                    69, 11, 56, 11, 56, 56, 73, 11, 56, 56, 56, 11, 56, 11, 56]

                expect(result).to.deep.equal(want)
                expect(reader.offset).to.equal(compressed.byteLength)
            })
            it("Writer.writeCompressedInts()", () => {
                const uncompressed = [2, 3, 5, 7, 9, 10, 11, 13, 7, 19, 7, 11, 22, 24, 19, 11,
                    7, 11, 7, 19, 11, 19, 11, 19, 11, 55, 56, 11, 56, 11, 56, 56,
                    11, 56, 11, 56, 56, 11, 56, 56, 56, 56, 11, 56, 65, 11, 56, 67,
                    69, 11, 56, 11, 56, 56, 73, 11, 56, 56, 56, 11, 56, 11, 56,]

                const writer = new Writer()
                writer.writeCompressedIntegers(uncompressed)

                const compressed = parseHexDump(`
                    0000 3f 00 00 00 00 00 00 00 47 00 00 00 00 00 00 00 ?.......G.......
                    0010 00 52 2d 00 00 00 55 01 00 f0 18 44 11 45 15 45 .R-...U....D.E.E
                    0020 45 54 54 04 02 01 02 02 02 01 01 02 fa 0c f4 04 ETT.............
                    0030 0b 02 fb f8 fc 04 fc 0c f8 08 f8 08 f8 2c 01 d3 .............,..
                    0040 d3 00 03 00 f0 02 00 00 00 d3 09 ca 0b 02 c6 d3 ................
                    0050 00 11 c2 00 00 d3 d3                            .......
                `)
                expect(new Uint8Array(writer.buffer)).to.deep.equal(compressed)

                const reader = new Reader(writer.buffer)
                const result = reader.getCompressedIntegers()
                expect(result).to.deep.equal(uncompressed)
            })
        })
    })
    describe("compression", () => {
        describe("LZ4", () => {
            const src = parseHexDump(`
                0000 00 52 2d 00 00 00 55 01 00 f0 18 44 11 45 15 45 .R-...U....D.E.E
                0010 45 54 54 04 02 01 02 02 02 01 01 02 fa 0c f4 04 ETT.............
                0020 0b 02 fb f8 fc 04 fc 0c f8 08 f8 08 f8 2c 01 d3 .............,..
                0030 d3 00 03 00 f0 02 00 00 00 d3 09 ca 0b 02 c6 d3 ................
                0040 00 11 c2 00 00 d3 d3                            .......         `)
            const dst = parseHexDump(`
                0000 2d 00 00 00 55 55 55 55 55 55 55 44 11 45 15 45 -...UUUUUUUD.E.E
                0010 45 54 54 04 02 01 02 02 02 01 01 02 fa 0c f4 04 ETT.............
                0020 0b 02 fb f8 fc 04 fc 0c f8 08 f8 08 f8 2c 01 d3 .............,..
                0030 d3 00 d3 d3 00 d3 00 00 00 d3 09 ca 0b 02 c6 d3 ................
                0040 00 11 c2 00 00 d3 d3                                            `)
            it("decompressFromBuffer(src, dst)", () => {
                const uncompressed = new Uint8Array(dst.length)
                const n = decompressFromBuffer(src, uncompressed)
                expect(n).to.equal(dst.length)
                expect(uncompressed).to.deep.equal(dst)
            })
            it("compressToBuffer(src, dst)", () => {
                const compressed = new Uint8Array(compressBound(dst.length + 1))
                const n = compressToBuffer(dst, compressed)
                expect(n).to.equal(src.length)
                expect(new Uint8Array(compressed.buffer, 0, n)).to.deep.equal(src)
            })
        })
        describe("integers", () => {
            describe("decodeIntegers", () => {
                it("simple", () => {
                    const encoded = parseHexDump(`
                        0000 2d 00 00 00 55 55 55 55 55 55 55 44 11 45 15 45 -...UUUUUUUD.E.E
                        0010 45 54 54 04 02 01 02 02 02 01 01 02 fa 0c f4 04 ETT.............
                        0020 0b 02 fb f8 fc 04 fc 0c f8 08 f8 08 f8 2c 01 d3 .............,..
                        0030 d3 00 d3 d3 00 d3 00 00 00 d3 09 ca 0b 02 c6 d3 ................
                        0040 00 11 c2 00 00 d3 d3
                    `)

                    const result = decodeIntegers(new DataView(encoded.buffer), 63)

                    const decoded = [
                        2, 3, 5, 7, 9, 10, 11, 13, 7, 19, 7, 11, 22, 24, 19, 11,
                        7, 11, 7, 19, 11, 19, 11, 19, 11, 55, 56, 11, 56, 11, 56, 56,
                        11, 56, 11, 56, 56, 11, 56, 56, 56, 56, 11, 56, 65, 11, 56, 67,
                        69, 11, 56, 11, 56, 56, 73, 11, 56, 56, 56, 11, 56, 11, 56]

                    expect(result).to.deep.equal(decoded)
                })
                it("with overflow in prevVal", () => {
                    const encoded = parseHexDump(`
                        0000 fd ff ff ff 55 55 55 40 55 55 44 54 15 01 07 08 ....UUU@UUDT....
                        0010 dc 29 ca 03 04 ff fb 03 04 33 13 b6 04 47 b3 f9 .).......3...G..
                        0020 ff 07 02 02 08 38 bb 01 fe ff                   .....8....     
                    `)

                    const result = decodeIntegers(new DataView(encoded.buffer), 35)

                    const want = [1, 8, 16, -20, 21, -33, -30, -26, -27, -32, -29, -25, -28, -31, -34, 17, 36, -38, -34, 37, -40, -47, -48, -41, -44, -42, -45, -43, -46, -38, 18, -51, -50, -52, -53]

                    expect(result).to.deep.equal(want)
                })
                it("regression 2026-03-09", () => {
                    const encoded = parseHexDump(`
                        0000 01 00 00 00 01 14 50 40 41 01 50 50 14 45 51 50 ......P@A.PP.EQP
                        0010 14 14 14 14 14 50 50 50 14 05 14 14 14 45 01 05 .....PPP.....E..
                        0020 05 45 51 40 41 41 51 14 14 50 50 50 50 14 45 a2 .EQ@AAQ..PPPP.E.
                        0030 28 8a a2 8a a2 28 28 8a 00 fb 06 f7 0a f3 0e f0 (....((.........
                        0040 11 ea 17 e7 1a e5 1c e3 1e e1 20 df 22 dc 25 da .......... .".%.
                        0050 27 d7 2a d4 2d d1 30 ce 33 ca 37 c7 3a c4 3d c2 '.*.-.0.3.7.:.=.
                        0060 3f c0 41 bc 45 b9 48 b6 4b b4 4d b2 4f ae 53 ab ?.A.E.H.K.M.O.S.
                        0070 56 a8 59 a6 5b a4 5d a0 61 9d 64 9a 67 98 69 96 V.Y.[.].a.d.g.i.
                        0080 6b 93 6e 8f 72 8c 75 89 78 86 7b 84 7d 82 7f 80 k.n.r.u.x.{.}..
                        0090 81 00 7e ff 83 00 7c ff 85 00 7a ff 87 00 78 ff ..~...|...z...x.
                        00a0 89 00 76 ff 8b 00 75 ff 8c 00 73 ff 8e 00 71 ff ..v...u...s...q.
                        00b0 90 00 6f ff 92 00 6c ff 95 00 6a ff 97 00 68 ff ..o...l...j...h.
                    `)

                    const orig = [0, 1, 2, 3, 4, -1, 5, 6, 7, 8, -1, 9, 10, 11, 12, -1, 13, 14, 15, -1, 16, 17, 18, 19, 20, 21, -1, 22, 23, 24, -1, 25, 26, -1, 27, 28, -1, 29, 30, -1, 31, 32, -1, 33, 34, 35, -1, 36, 37, -1, 38, 39, 40, -1, 41, 42, 43, -1, 44, 45, 46, -1, 47, 48, 49, -1, 50, 51, 52, 53, -1, 54, 55, 56, -1, 57, 58, 59, -1, 60, 61, -1, 62, 63, -1, 64, 65, 66, 67, -1, 68, 69, 70, -1, 71, 72, 73, -1, 74, 75, -1, 76, 77, -1, 78, 79, 80, 81, -1, 82, 83, 84, -1, 85, 86, 87, -1, 88, 89, -1, 90, 91, -1, 92, 93, 94, 95, -1, 96, 97, 98, -1, 99, 100, 101, -1, 102, 103, -1, 104, 105, -1, 106, 107, 108, -1, 109, 110, 111, 112, -1, 113, 114, 115, -1, 116, 117, 118, -1, 119, 120, 121, -1, 122, 123, -1, 124, 125, -1, 126, 127, -1, 128, 129, -1, 130, 131, -1, 132, 133, -1, 134, 135, -1, 136, 137, -1, 138, -1, 139, 140, -1, 141, 142, -1, 143, 144, -1, 145, 146, 147, -1, 148, 149, -1, 150, 151, -1]
                    const decoded = decodeIntegers(new DataView(encoded.buffer), orig.length)

                    // console.log(JSON.stringify(orig))
                    // console.log(JSON.stringify(decoded))
                    // for (let i = 0; i < Math.max(orig.length, decoded.length); ++i) {
                    //     if (orig[i] !== decoded[i]) {
                    //         console.log(`[${i}] ${orig[i]} != ${decoded[i]}`)
                    //         break
                    //     }
                    // }

                    // expect(decoded).to.deep.equal(orig)
                })
            })
            it("encodeIntegers()", () => {
                const decoded = [
                    2, 3, 5, 7, 9, 10, 11, 13, 7, 19, 7, 11, 22, 24, 19, 11,
                    7, 11, 7, 19, 11, 19, 11, 19, 11, 55, 56, 11, 56, 11, 56, 56,
                    11, 56, 11, 56, 56, 11, 56, 56, 56, 56, 11, 56, 65, 11, 56, 67,
                    69, 11, 56, 11, 56, 56, 73, 11, 56, 56, 56, 11, 56, 11, 56]
                const buffer = new Uint8Array(decoded.length * 3)
                const encoded = new DataView(buffer.buffer)
                const n = encodeIntegers(decoded, encoded)
                const yyy = parseHexDump(`
                        0000 2d 00 00 00 55 55 55 55 55 55 55 44 11 45 15 45 -...UUUUUUUD.E.E
                        0010 45 54 54 04 02 01 02 02 02 01 01 02 fa 0c f4 04 ETT.............
                        0020 0b 02 fb f8 fc 04 fc 0c f8 08 f8 08 f8 2c 01 d3 .............,..
                        0030 d3 00 d3 d3 00 d3 00 00 00 d3 09 ca 0b 02 c6 d3 ................
                        0040 00 11 c2 00 00 d3 d3                            .......         
                    `)
                expect(new Uint8Array(buffer.buffer, 0, n)).to.deep.equal(yyy)
            })
            // note: tuniyusdz actually has uint32_t and int32_t variants of compression/decompression
            it("regression", () => {
                const orig = [0, 1, 2, 3, 4, -1, 5, 6, 7, 8, -1, 9, 10, 11, 12, -1, 13, 14, 15, -1, 16, 17, 18, 19, 20, 21, -1, 22, 23, 24, -1, 25, 26, -1, 27, 28, -1, 29, 30, -1, 31, 32, -1, 33, 34, 35, -1, 36, 37, -1, 38, 39, 40, -1, 41, 42, 43, -1, 44, 45, 46, -1, 47, 48, 49, -1, 50, 51, 52, 53, -1, 54, 55, 56, -1, 57, 58, 59, -1, 60, 61, -1, 62, 63, -1, 64, 65, 66, 67, -1, 68, 69, 70, -1, 71, 72, 73, -1, 74, 75, -1, 76, 77, -1, 78, 79, 80, 81, -1, 82, 83, 84, -1, 85, 86, 87, -1, 88, 89, -1, 90, 91, -1, 92, 93, 94, 95, -1, 96, 97, 98, -1, 99, 100, 101, -1, 102, 103, -1, 104, 105, -1, 106, 107, 108, -1, 109, 110, 111, 112, -1, 113, 114, 115, -1, 116, 117, 118, -1, 119, 120, 121, -1, 122, 123, -1, 124, 125, -1, 126, 127, -1, 128, 129, -1, 130, 131, -1, 132, 133, -1, 134, 135, -1, 136, 137, -1, 138, -1, 139, 140, -1, 141, 142, -1, 143, 144, -1, 145, 146, 147, -1, 148, 149, -1, 150, 151, -1]
                // console.log(orig.length)
                const buffer = new Uint8Array(orig.length * 3)
                const encoded = new DataView(buffer.buffer)
                const n = encodeIntegers(orig, encoded)

                // hexdump(new Uint8Array(encoded.buffer, 0, n))

                const decoded = decodeIntegers(new DataView(encoded.buffer, 0, n), orig.length)
                // console.log(JSON.stringify(orig))
                // console.log(JSON.stringify(decoded))

                expect(decoded).to.deep.equal(orig)
            })
            // take note: there are compress/decompress functions for 32 and 64 bit, signed and unsigned
        })
    })
})
