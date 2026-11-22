import type { DataSource, EntityManager } from 'typeorm';
import { messages } from '../../messages';

/**
 * Requires an active transaction on the expected data source.
 *
 * Prevents writes from accidentally using the default entity manager
 * or a transaction owned by a different data source.
 *
 * @param tx - The manager supplied by the transaction owner.
 * @param dataSource - The data source used by the repository.
 * @throws Error If the manager does not belong to an active transaction
 * on the expected data source.
 */
export function assertActiveTransaction(
    tx: EntityManager,
    dataSource: DataSource,
): void {
    if (tx.connection !== dataSource || !tx.queryRunner?.isTransactionActive) {
        throw new Error(messages.transaction.ACTIVE_TRANSACTION_REQUIRED);
    }
}
