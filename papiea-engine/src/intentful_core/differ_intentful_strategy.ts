import { IntentfulStrategy } from "./intentful_strategy_interface"
import { Spec_DB } from "../databases/spec_db_interface"
import { Status_DB } from "../databases/status_db_interface"

export class DifferIntentfulStrategy extends IntentfulStrategy {
    constructor(specDb: Spec_DB, statusDb: Status_DB) {
        super(specDb, statusDb)
    }
}