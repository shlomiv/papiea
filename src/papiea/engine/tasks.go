// Provider handler registration:
func (papiea papiea) newTask(entity entityReference, spec spec) {
    // Get the status of the entity we are trying to change.
    status,err = papiea.statusDb.getStatus(entity)


    // Calculate the delta between the spec and the status. calc_delta
    // will take into consideration all registered SFS for the
    // entity's kind in order to know how to diff on vector
    // elements. See more details in calc_delta. Each delta found will
    // record the corresponding SFS that could is registered which
    // should be able to resolve the diff
    delta = calc_delta(spec, status)

    // we are the task
    task = this

    // Register all the relevant deltas we could listen on
    task.registerDelta(delta)

    for (field in delta) {
        // TBD: define on, define context
        fieldListener = papiea.on(field.sfs, func(context, updatedEntity entityReference, status status){
            newValue = status.get(field.path)
            specValue = spec.get(field.path)

            if (newValue == specValue) {
                // Update the task that this field in the delta is a success
                task.updateFieldStatus(field, "Success")

                // Stopping this listener
                task.removeFieldListener(this)
            }
            else if (entity.metadata.specVersion == updatedEntity.metadata.specVersion) {
                // We got a different value, but still on the same spec version, dont do anything yet
                // Add to audit
                // Perhaps note this in some TTL
            }
            else {
                // We got a different value AND the spec version has increased (it can only increase)

                // update the task that this field is outdated by a particular spec version
                task.updateFieldStatus(field, "Outdated by " + updatedEntity.metadata.specVersion)

                // Stopping this listener
                task.removeFieldListener(this)
            }

            task.verifyCompletness()
        })

        task.addFieldListener(fieldListener)
    }
}

func (papiea papiea) verifyCompletness() {
    if (task.noMoreFieldListeners()) {
        if (task.specDidNotRegister()) {
            task.setStatus("Spec did not manage to be atomically committed. Try again.")
        }
        else if (task.hasFailedFields()) {
            task.setStatus("Partially Completed")
        } else {
            task.setStatus("Completed Successfully")
        }
    }
}
