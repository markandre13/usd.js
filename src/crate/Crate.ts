import { BootStrap } from "./BootStrap.js"
import type { Reader } from "./Reader.js"
import { TableOfContents } from "./TableOfContents.js"
import { UsdNode } from "../nodes/usd/UsdNode.js"
import { Tokens } from "./Tokens.js"
import { Fields } from "./Fields.js"
import { JUMP_NEXT_IS_CHILD_NO_SIBLINGS, JUMP_NO_CHILD_NEXT_IS_SIBLING, JUMP_NO_CHILD_NO_SIBLINGS, Paths } from "./Paths.js"
import { Specs } from "./Specs.js"
import { FieldSets } from "./FieldSets.js"
import { Strings } from "./Strings.js"
import type { ValueRep } from "./ValueRep.js"
import { SectionName } from "./SectionName.js"
import { Writer } from "./Writer.js"
import { Section } from "./Section.js"
import { SpecType } from "./SpecType.js"

interface BuildNodeTreeArgs {
    pathIndexes: number[]
    tokenIndexes: number[]
    jumps: number[],
    depth: number
}

export class Crate {
    bootstrap: BootStrap
    toc: TableOfContents
    tokens: Tokens
    strings: Strings
    fields: Fields
    fieldsets: FieldSets
    paths: Paths
    specs: Specs

    reader!: Reader
    writer!: Writer

    root?: UsdNode

    constructor(reader?: Reader) {
        if (reader) {
            this.reader = reader
            this.bootstrap = new BootStrap(reader)
            this.bootstrap.seekTOC()
            this.toc = new TableOfContents(reader)
            this.toc.seek(SectionName.TOKENS)
            this.tokens = new Tokens(reader)
            this.toc.seek(SectionName.STRINGS)
            this.strings = new Strings(reader, this.tokens)
            this.toc.seek(SectionName.FIELDS)
            this.fields = new Fields(reader)
            this.toc.seek(SectionName.FIELDSETS)
            this.fieldsets = new FieldSets(reader)
            this.toc.seek(SectionName.PATHS)
            this.paths = new Paths(reader)
            this.toc.seek(SectionName.SPECS)
            this.specs = new Specs(reader)

            // build node tree
            this.paths._nodes = new Array<UsdNode>(this.paths.num_nodes)

            // for(let i = 0; i<this.paths.pathIndexes.length; ++i) {
            //     const idx = this.paths.pathIndexes[i]
            //     let tkn = this.paths.tokenIndexes[i]
            //     if (tkn < 0) {
            //         tkn = -tkn
            //     }
            //     const jmp = this.paths.jumps[i]
            //     console.log(`    ${i} ${idx} ${this.tokens.get(tkn)} ${jmp} `)
            // }

            const node = this.buildNodeTree({
                pathIndexes: this.paths.pathIndexes,
                tokenIndexes: this.paths.tokenIndexes,
                jumps: this.paths.jumps,
                depth: 0
            })
            this.root = node

            //
            // copy this.specs into this.paths._nodes[]
            //
            for (let i = 0; i < this.specs.pathIndexes.length; ++i) {
                const idx = this.specs.pathIndexes[i]
                if (this.paths._nodes[idx] === undefined) {
                    for (let j = 0; j < this.paths._nodes.length; ++j) {
                        if (this.paths._nodes[j] === undefined) {
                            console.log(`this.paths._nodes[${j}] === undefined`)
                        }
                    }
                    throw Error("yikes: Crate(reader): some paths._nodes[...] are undefined")
                }
                this.paths._nodes[idx].fieldset_index = this.specs.fieldsetIndexes[i]
                this.paths._nodes[idx].spec_type = this.specs.specTypeIndexes[i]
            }
        } else {
            this.writer = new Writer(undefined, "data    ")
            this.bootstrap = new BootStrap()
            this.toc = new TableOfContents()
            this.tokens = new Tokens()
            this.strings = new Strings(this.tokens)
            this.fields = new Fields(this.tokens, this.strings, this.writer)
            this.fieldsets = new FieldSets()
            this.paths = new Paths()
            this.specs = new Specs()
        }
    }

    /**
     * Serialize root into this.writer
     * 
     * NOTE: not idempotent
     * 
     * @param root 
     */
    serialize(root: UsdNode) {
        this.strings.add(";-)") // this seems to be by convention

        const writer = this.writer
        this.bootstrap.skip(writer) // leave room for bootstrap
        this.paths.encode(this.tokens, root)
        root.encode()

        // WRITE SECTIONS

        let start: number, size: number

        start = writer.tell()
        this.tokens.serialize(writer)
        size = writer.tell() - start
        this.toc.addSection(new Section({ name: SectionName.TOKENS, start, size }))

        start = writer.tell()
        this.strings.serialize(writer)
        size = writer.tell() - start
        this.toc.addSection(new Section({ name: SectionName.STRINGS, start, size }))

        start = writer.tell()
        this.fields.serialize(writer)
        size = writer.tell() - start
        this.toc.addSection(new Section({ name: SectionName.FIELDS, start, size }))

        start = writer.tell()
        this.fieldsets.serialize(writer)
        size = writer.tell() - start
        this.toc.addSection(new Section({ name: SectionName.FIELDSETS, start, size }))

        start = writer.tell()
        this.paths.serialize(writer)
        size = writer.tell() - start
        this.toc.addSection(new Section({ name: SectionName.PATHS, start, size }))

        start = writer.tell()
        this.specs.serialize(writer)
        size = writer.tell() - start
        this.toc.addSection(new Section({ name: SectionName.SPECS, start, size }))

        start = writer.tell()
        this.toc.serialize(writer)

        writer.seek(0)
        this.bootstrap.tocOffset = start
        this.bootstrap.serialize(writer)
    }

    forEachField(fieldSetIndex: number, block: (name: string, value: ValueRep) => void) {
        for (let i = fieldSetIndex; this.fieldsets.fieldset_indices[i] >= 0; ++i) {
            const fieldIndex = this.fieldsets.fieldset_indices[i]
            const field = this.fields.fields![fieldIndex]
            const token = this.tokens.get(field.tokenIndex)
            block(token, field.valueRep)
        }
    }

    private buildNodeTree(
        arg: BuildNodeTreeArgs,
        parentNode: UsdNode | undefined = undefined,
        curIndex: number = 0
    ) {
        let hasChild = true, hasSibling = true
        let root: UsdNode | undefined
        while (hasChild || hasSibling) {
            const thisIndex = curIndex++
            const idx = arg.pathIndexes[thisIndex]
            const jump = arg.jumps[thisIndex]
            let tokenIndex = arg.tokenIndexes[thisIndex]
            let isPrimPropertyPath: boolean
            if (tokenIndex < 0) {
                tokenIndex = -tokenIndex
                isPrimPropertyPath = false
            } else {
                isPrimPropertyPath = true
            }

            // console.log(`thisIndex = ${thisIndex}, pathIndexes.size = ${arg.pathIndexes.length}`)
            if (parentNode === undefined) {
                if (thisIndex >= arg.pathIndexes.length) {
                    throw Error("yikes: Index exceeds pathIndexes.size()")
                }
                root = parentNode = new UsdNode(this, undefined, idx, "/", true)
                root.depth = 0
                // console.log(`buildNodeTree(): this.paths._nodes![${idx}] := /`)
                this.paths._nodes![idx] = parentNode
            } else {
                if (thisIndex >= arg.tokenIndexes.length) {
                    throw Error(`Index ${thisIndex} exceeds tokenIndexes.length = ${arg.tokenIndexes.length}. $}`)
                }
                // console.log(`tokenIndex = ${tokenIndex}, _tokens.size = ${this.tokens!.length}`)
                const elemToken = this.tokens.get(tokenIndex)
                if (this.paths._nodes![idx] !== undefined) {
                    console.warn(`Crate.buildNodeTree(): node[${idx}] is already set at ${parentNode.getFullPathName()}, can't set ${elemToken}, already set to ${this.paths._nodes![idx].getFullPathName()}`)
                    // throw Error(`yikes: node[${idx}] is already set at ${parentNode.getFullPathName()}, can't set ${elemToken}, already set to ${this.paths._nodes![idx].name}`)
                } else {
                    this.paths._nodes![idx] = new UsdNode(this, parentNode, idx, elemToken, isPrimPropertyPath)
                    this.paths._nodes![idx].depth = parentNode.depth! + 1
                    // console.log(`buildNodeTree(): this.paths._nodes![${idx}] := ${"  ".repeat(parentNode.depth!+1)}${elemToken}`)
                }
            }
            // console.log(`${idx} ${"  ".repeat(this.paths._nodes![idx].depth!)} ${this.paths._nodes![idx].name}`)
            // if (this.tokens[tokenIndex] === undefined) {
            //     console.log(`BUMMER at tokenIndex ${tokenIndex}`)
            //     console.log(this.tokens)
            // }

            hasChild = jump > 0 || jump === -1
            hasSibling = jump >= 0

            if (hasChild) {
                if (hasSibling) {
                    const siblingIndex = thisIndex + jump
                    // ++arg.depth
                    this.buildNodeTree(arg, parentNode, siblingIndex)
                    // --arg.depth
                }
                parentNode = this.paths._nodes![idx] // reset parent path
            }
        }
        return root
    }

    printTree(node: UsdNode | undefined = this.root, depth = 0) {
        if (node === undefined) {
            return
        }
        let fields: number[] = []
        for(let i = node.fieldset_index!; this.fieldsets.fieldset_indices[i] > 0; ++i) {
            fields.push(this.fieldsets.fieldset_indices[i])
        }
        console.log(`${"  ".repeat(depth)}[${node.index}] ${node.name} fieldSetIndex=${node.fieldset_index}, fields=[${fields.join(", ")}]`)
        for(const field of fields) {
            const f = this.fields.fields![field]
            console.log(`${"  ".repeat(depth)}  ${f.toString(this.tokens.tokens, this)}`)
        }
        for(const child of node.children) {
            this.printTree(child, depth + 1)
        }
    }

    print() {
        console.log(`Path.print()`)
        const numEncodedPaths = this.paths.pathIndexes.length
        for (let i = 0; i < numEncodedPaths; ++i) {
            const node = this.paths._nodes[i]

            const jump = this.paths.jumps[i]
            let jumpName = "?"
            switch (jump) {
                case JUMP_NO_CHILD_NO_SIBLINGS:
                    jumpName = 'no child, no sibling'
                    break
                case JUMP_NEXT_IS_CHILD_NO_SIBLINGS:
                    jumpName = 'next is child, no sibling'
                    break
                case JUMP_NO_CHILD_NEXT_IS_SIBLING:
                    jumpName = 'no child, next is sibling'
                    break
                default:
                    jumpName = `next is child, sibling at ${i + jump}`
                    break
            }

            const idx = this.specs.pathIndexes[i]
            const fieldset_index = this.specs.fieldsetIndexes[idx]
            const spec_type = this.specs.specTypeIndexes[idx]

            let fields = ""
            // console.log(`fieldset indices lenght: ${this.fieldsets.fieldset_indices.length}`)
            for (let i = fieldset_index; this.fieldsets.fieldset_indices[i] >= 0; ++i) {
                const fieldIndex = this.fieldsets.fieldset_indices[i]
                fields=`${fields}${fieldIndex},`
// console.log(`  fieldIndex=${fieldIndex}`)
// console.log(this.fields)
                // const field = this.fields.fields![fieldIndex]
                // const token = this.tokens.get(field.tokenIndex)

                // fields = `${fields}${token},`
            }
            // for (let j = fieldset_index!; this.fieldsets.fieldset_indices[j] >= 0; ++j) {
            //     const fieldIndex = this.fieldsets.fieldset_indices[i]
            //     // const field = this.fields.fields![fieldIndex]
            //     // this.fields.tokenIndices[f]
            //     // const token = this.tokens.get(field.tokenIndex)
            //     fields = `${fieldIndex};`
            // }
            console.log(`    ${i} ${node.index} ${"  ".repeat(node.depth!)} ${node.name} (${jumpName}), ${SpecType[spec_type]}, fields @ ${fieldset_index}: ${fields}`)
        }
    }

}

