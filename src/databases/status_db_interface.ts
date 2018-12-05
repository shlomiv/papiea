// [[file:~/work/papiea-js/Papiea-design.org::*/src/databases/status_db_interface.ts][/src/databases/status_db_interface.ts:1]]
// [[file:~/work/papiea-js/Papiea-design.org::status-db-interface][status-db-interface]]

interface Status_DB{

    // Update the status in the status db. As long as the input is
    // correct this always succeeds.
    update_status(entity_uuid:uuid4, status:Status):boolean;

    // Gets the status of a particular entity from the db. Returns
    // both current metadata and status of the entity.
    get_status(entity_uuid:uuid4):Status;

    // List all status that have their fields match the ones given in
    // fields_map. E.g. we could look for all specs for `vm` kind that
    // have a certain ip:
    // list_status({"metadata": {"kind": "vm"},
    //              "status":   {"ip":   "10.0.0.10"}})
    //
    // We could come up with command such as greater-than etc at some
    // later point, or we could use a similar dsl to mongodb search
    // dsl.
    list_status(fields_map: any): [uuid4, Status][];
}

// status-db-interface ends here
// /src/databases/status_db_interface.ts:1 ends here
