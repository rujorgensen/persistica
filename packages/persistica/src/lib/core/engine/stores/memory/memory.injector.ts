const typeSizes = {
    "undefined": () => 0,
    "boolean": () => 4,
    "number": () => 8,
    "string": (item: string) => 2 * item.length,
    "object": (item: any) => !item ?
        0
        :
        Object.keys(item).reduce((total: number, key: string) => sizeOf(key) + sizeOf(item[key as any]) + total, 0)
};

const sizeOf: (value: any) => number = (value: any) => (<any>typeSizes)[(typeof value) as any](value);