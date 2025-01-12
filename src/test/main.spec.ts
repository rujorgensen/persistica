import 'fake-indexeddb/auto';
import { Demo } from './_mocks/demo.class';
import { subscribeSpyTo } from '@hirez_io/observer-spy';
import { it, describe, expect } from 'bun:test';

describe('persistica', () => {
    it('should exist', () => {
        const demo: Demo = new Demo();


        expect(demo).toBeTruthy();
    });

    it('emits the current value when new elements are created locally', async () => {
        const demo: Demo = new Demo();

        const demoModelSpy = subscribeSpyTo(demo.demoModel.read$$({}));

        // The value should be emitted internally
        expect(demoModelSpy.receivedNext()).toEqual(false);
        expect(demoModelSpy.getLastValue()).toEqual(undefined);
        expect(demoModelSpy.receivedComplete()).toEqual(false);

        // * Act
        await demo.demoModel.create({
            id: 'uniqu-id',
            createdAt: new Date('2020-01-01'),
        });

        expect(demoModelSpy.receivedNext()).toEqual(true);
        expect(demoModelSpy.getLastValue()).toEqual([{
            id: "uniqu-id",
            createdAt: new Date('2020-01-01T00:00:00.000Z'),
        }]);
    });
});