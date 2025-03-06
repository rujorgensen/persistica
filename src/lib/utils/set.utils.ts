/**
 * Returns true if setA fully contains setB.
 * 
 * Here until Set.prototype.difference has wider support.
 *
 * @typedef T
 *
 * @param { Set<T> }   setA
 * @param { Set<T> }   setB
 *
 * @returns { boolean }
 */
export function setContainsSet<T>(
    setA: Set<T>,
    setB: Set<T>,
): boolean {
    return setB.size === 0 ? true : ![...setB].some((element: T) => !setA.has(element));
}