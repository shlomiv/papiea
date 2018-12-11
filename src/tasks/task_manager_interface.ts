// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
import * as papiea from "../papiea";
import * as core from "../core";
import * as differ from "../intentful_core/differ_interface"

// [[file:~/work/papiea-js/Papiea-design.org::#h-Interface-766][task-manager-interface]]
export interface Task {
    wait():any;
    register_delta(diffs: differ.Diff[]):boolean;
} 

export interface Task_Creator {
    new_task (): Task;
    new_intentful_task (papiea: papiea.Papiea, entity: core.Entity_Reference, kind: papiea.Kind, spec: core.Spec): Task;
}

export interface Task_Manager {
// Not yet defined..
}

// task-manager-interface ends here
// /src/tasks/task_manager_interface.ts:1 ends here
