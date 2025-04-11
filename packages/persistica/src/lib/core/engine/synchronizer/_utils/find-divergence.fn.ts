
export const findDivergence = async (
    tableName: string,
    tableSizes: {
        localRowCount: number;
        remoteRowCount: number,
    },
    readTableRowHashA: (tableName: string, index: number) => Promise<string | undefined>,
    readTableRowHashB: (tableName: string, index: number) => Promise<string | undefined>,
): Promise<number> => {
    const lowestCommonRowCount = Math.min(tableSizes.localRowCount, tableSizes.remoteRowCount);

    let start = 0;
    let end = lowestCommonRowCount - 1;
    let divergenceIndex = lowestCommonRowCount; // assume no divergence in shared range

    while (start <= end) {
        const mid = Math.floor((start + end) / 2);
        const localHash = await readTableRowHashA(tableName, mid);
        const remoteHash = await readTableRowHashB(tableName, mid);

        if (localHash === remoteHash) {
            start = mid + 1;
        } else {
            divergenceIndex = mid; // found divergence
            end = mid - 1;
        }
    }

    // If lists differ in length and no divergence in common range, divergence starts after the shorter list
    if (
        (tableSizes.localRowCount !== tableSizes.remoteRowCount) &&
        (divergenceIndex === lowestCommonRowCount)) {
        divergenceIndex = lowestCommonRowCount;
    }

    return divergenceIndex;
};