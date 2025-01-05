
import { BaseModel, PersistenceWrapper } from '../../lib/core';
import type { DemoInterface } from './demo.interface';

export class DemoModel extends BaseModel<'DemoModel', DemoInterface> {

    constructor(
        private readonly _store: PersistenceWrapper,
    ) {
        super(
            'id',
            'DemoModel',
            _store,
        );
    }
}