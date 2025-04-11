import type {
    PersistenceWrapper,
} from 'src/lib/core/engine/persistence.wrapper.ts';
import type { DemoInterface } from './demo.interface.ts';
import { BaseModel } from 'src/lib/core/base.model.js';

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