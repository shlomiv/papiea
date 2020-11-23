import {Spec_DB} from "../../databases/spec_db_interface"
import {Status_DB} from "../../databases/status_db_interface"
import {Graveyard_DB} from "../../databases/graveyard_db_interface"
import {IntentWatcher, Kind, Metadata, Spec, Status} from "papiea-core"
import {GraveyardConflictingEntityError} from "../../databases/utils/errors"
import {UserAuthInfo} from "../../auth/authn"
import {Watchlist_DB} from "../../databases/watchlist_db_interface"

export abstract class EntityCreationStrategy {
    protected readonly specDb: Spec_DB
    protected readonly statusDb: Status_DB
    protected readonly graveyardDb: Graveyard_DB
    protected watchlistDb: Watchlist_DB
    protected kind?: Kind
    protected user?: UserAuthInfo


    protected constructor(specDb: Spec_DB, statusDb: Status_DB, graveyardDb: Graveyard_DB, watchlistDb: Watchlist_DB) {
        this.specDb = specDb
        this.statusDb = statusDb
        this.graveyardDb = graveyardDb
        this.watchlistDb = watchlistDb
    }

    protected async check_spec_version(metadata: Metadata, spec_version: number, spec: Spec) {
        const exists = await this.graveyardDb.check_spec_version_exists(metadata, spec_version)
        if (exists) {
            const highest_spec_version = await this.graveyardDb.get_highest_spec_version(metadata)
            metadata.spec_version = spec_version
            throw new GraveyardConflictingEntityError(metadata, spec, highest_spec_version)
        }
    }

    protected async create_entity(metadata: Metadata, spec: Spec): Promise<[Metadata, Spec]> {
        // Create increments spec version so we should check already incremented one
        await this.check_spec_version(metadata, metadata.spec_version + 1, spec)
        const [updatedMetadata, updatedSpec] = await this.specDb.update_spec(metadata, spec);
        await this.statusDb.replace_status(metadata, spec)
        return [updatedMetadata, updatedSpec]
    }

    abstract async create(input: unknown): Promise<[IntentWatcher | null, [Metadata, Spec, Status]]>

    setKind(kind: Kind): void {
        this.kind = kind
    }

    setUser(user: UserAuthInfo) {
        this.user = user
    }
}
