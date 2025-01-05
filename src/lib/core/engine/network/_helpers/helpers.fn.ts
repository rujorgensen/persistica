import { IDeleted, TClientId } from '../network.interfaces';

export const syncDeletes = (
    clientAId: TClientId,
    clientBId: TClientId,
    netWorkADeletes: IDeleted[],
    netWorkBDeletes: IDeleted[],
): IDeleted[] => {

    const allDeletes: IDeleted[] = [
        ...netWorkADeletes,
        ...netWorkBDeletes,
    ]
        .map((deleted: IDeleted) => {
            return {
                ...deleted,
                synchronizedWith: [...new Set([
                    ...deleted.synchronizedWith,
                    clientAId,
                    clientBId,
                ])],
            };
        });

    const newList: Map<string, IDeleted> = new Map();

    for (const element of allDeletes) {
        const current: IDeleted | undefined = newList.get(element.cuid);

        if (current) {
            newList.set(element.cuid, {
                ...current,
                synchronizedWith: [...new Set([
                    ...current.synchronizedWith,
                    ...element.synchronizedWith,
                ])].sort(),
            });
        } else {
            element.synchronizedWith.sort();
            newList.set(element.cuid, element);
        }
    }

    return [...newList.values()]
        .sort((a: IDeleted, b: IDeleted) => (a.cuid > b.cuid ? 1 : -1));
};