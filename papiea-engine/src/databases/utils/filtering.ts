import { deepMerge, isEmpty } from "../../utils/utils"
import { dotnotation } from "papiea-backend-utils"
import { datestringToFilter } from "./date"

export function build_filter_query(fields_map: any, exact_match: boolean) {
    let filter: any = {}
    if (fields_map.metadata && fields_map.metadata.deleted_at) {
        filter["metadata.deleted_at"] = datestringToFilter(fields_map.metadata.deleted_at);
    } else {
        filter["metadata.deleted_at"] = null
    }

    for (let key in fields_map.metadata) {
        if (key === "deleted_at")
            continue;
        filter["metadata." + key] = fields_map.metadata[key];
    }
    if (exact_match) {
        if (!isEmpty(fields_map.spec)) {
            filter.spec = fields_map.spec
        }
        if (!isEmpty(fields_map.status)) {
            filter.status = fields_map.status
        }
    } else if (fields_map.spec && fields_map.status) {
        filter = deepMerge(
            filter,
            dotnotation({spec: fields_map.spec}),
            dotnotation({status: fields_map.status})
        )
    } else if (fields_map.spec) {
        filter = deepMerge(
            filter,
            dotnotation({spec: fields_map.spec}),
        )
    } else if (fields_map.status) {
        filter = deepMerge(
            filter,
            dotnotation({status: fields_map.status})
        )
    }
    return filter
}