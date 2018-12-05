// [[file:~/work/papiea-js/Papiea-design.org::*/src/tasks/task_manager_interface.ts][/src/tasks/task_manager_interface.ts:1]]
// [[file:~/work/papiea-js/Papiea-design.org::task-manager-interface][task-manager-interface]]
interface Task_Manager {
    wait():any;
    register_delta(Diff[]);
} 

function new_task (): Task;
function new_intentful_task (papiea: Papiea, entity: Entity_Reference, kind: Kind, spec: Spec): Task;
// task-manager-interface ends here
// /src/tasks/task_manager_interface.ts:1 ends here
