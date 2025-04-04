type FieldDef = {
    type: 'string' | 'boolean'
    optional?: true
    id?: true
}

type FieldType<T extends 'string' | 'boolean'> =
    T extends 'string' ? string :
    T extends 'boolean' ? boolean :
    never

type InferField<F extends FieldDef> =
    F['optional'] extends true ? FieldType<F['type']> | undefined : FieldType<F['type']>

type InferSchema<T extends Record<string, FieldDef>> = {
    [K in keyof T]: InferField<T[K]>
}

// --- Count how many fields have id: true ---
type IdKeys<T extends Record<string, FieldDef>> = {
    [K in keyof T]: T[K]['id'] extends true ? K : never
}[keyof T]

type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

type LastOf<T> =
    UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? R : never

type Push<T extends any[], V> = [...T, V]

type UnionToTuple<T, R extends any[] = []> = [T] extends [never]
    ? R
    : UnionToTuple<Exclude<T, LastOf<T>>, Push<R, LastOf<T>>>

type Length<T extends any[]> = T['length']

type IdCount<T extends Record<string, FieldDef>> = Length<UnionToTuple<IdKeys<T>>>

type ErrorIfInvalidIdCount<T extends Record<string, FieldDef>> =
    IdCount<T> extends 1 ? {} : {
        __ERROR__: IdCount<T> extends 0
        ? '❌ table(): You must define exactly ONE field with id: true.'
        : '❌ table(): You can only define ONE field with id: true.'
    }

const table = <
    T extends Record<string, FieldDef>
>(
    fields: T & ErrorIfInvalidIdCount<T>
) => {
    type Inferred = InferSchema<T>
    return {
        fields,
        Type: null as unknown as Inferred,
    }
}

// ✅ Valid cases
const TodoTable = table({
    id: { type: 'string', id: true },
    title: { type: 'string' },
    done: { type: 'boolean', optional: true },
})

// 🛑 Not valid
const TodoTable2 = table({
    id: { type: 'string', id: true },
    sid: { type: 'string', id: true },
    title: { type: 'string' },
    done: { type: 'boolean', optional: true },
})

// 🛑 Not valid
const TodoTable3 = table({
    id: { type: 'string' },
    title: { type: 'string' },
    done: { type: 'boolean', optional: true },
})

type Todo = typeof TodoTable.Type
