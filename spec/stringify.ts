// this is a modified variant of https://github.com/lydell/json-stringify-pretty-compact
// * converted to typescript
// * print number[] in one line

const stringOrChar = /("(?:[^\\"]|\\.)*")|[:,]/g

export function stringify(passedObj: any, options: {
    indent?: number | string
    maxLength?: number
    replacer?: (this: any, key: string, value: any) => any
}) {
    const indent = JSON.stringify(
        [1],
        undefined,
        options.indent === undefined ? 2 : options.indent
    ).slice(2, -3)

    const maxLength =
        indent === ""
            ? Infinity
            : options.maxLength === undefined
                ? 80
                : options.maxLength

    let { replacer } = options

    function _stringify(obj: any, currentIndent: string, reserved: number): string {
        if (Array.isArray(obj)) {
            let isNumeric = true
            for (const e of obj) {
                if (typeof e !== 'number') {
                    isNumeric = false
                    break
                }
            }
            if (isNumeric) {
                return `[ ${obj.join(", ")} ]`
            }
        }
        if (obj && typeof obj.toJSON === "function") {
            obj = obj.toJSON()
        }

        const string = JSON.stringify(obj, replacer)

        if (string === undefined) {
            return string
        }

        const length = maxLength - currentIndent.length - reserved

        if (string.length <= length) {
            const prettified = string.replace(
                stringOrChar,
                (match, stringLiteral) => {
                    return stringLiteral || `${match} `
                }
            )
            if (prettified.length <= length) {
                return prettified
            }
        }

        if (replacer != null) {
            obj = JSON.parse(string)
            replacer = undefined
        }

        if (typeof obj === "object" && obj !== null) {
            const nextIndent = currentIndent + indent
            const items = []
            let index = 0
            let start
            let end

            if (Array.isArray(obj)) {
                start = "["
                end = "]"
                const { length } = obj
                for (; index < length; index++) {
                    items.push(
                        _stringify(obj[index], nextIndent, index === length - 1 ? 0 : 1) ||
                        "null"
                    )
                }
            } else {
                start = "{"
                end = "}"
                const keys = Object.keys(obj)
                const { length } = keys
                for (; index < length; index++) {
                    const key = keys[index]
                    const keyPart = `${JSON.stringify(key)}: `
                    const value = _stringify(
                        obj[key],
                        nextIndent,
                        keyPart.length + (index === length - 1 ? 0 : 1)
                    )
                    if (value !== undefined) {
                        items.push(keyPart + value)
                    }
                }
            }

            if (items.length > 0) {
                return [start, indent + items.join(`,\n${nextIndent}`), end].join(
                    `\n${currentIndent}`
                )
            }
        }

        return string
    }
    return _stringify(passedObj, "", 0)
}