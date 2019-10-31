import { SFS, Entity_Reference, Spec, Status, Provider_Callback_URL, Kind, Differ, Diff, Provider } from "papiea-core";

// TODO: add d.ts for type annotations
const papi_clj = require("../../papiea-lib-clj/papiea-lib-clj.js").papiea_lib_clj;
const clj_str = (a: any) => papi_clj.core.clj_str(a);
const sfs_parser = (sfs_ast: string) => papi_clj.core.parse_sfs(sfs_ast);
const sfs_optimizer = (sfs_ast: string) => papi_clj.core.optimize_sfs_ast(sfs_ast);
const sfs_compiler = (sfs_signature: string) => papi_clj.core.compile_sfs(sfs_signature);
const run_compiled_sfs = (compiled_sfs: any, spec: any, status: any) =>
    papi_clj.core.run_compiled_sfs(compiled_sfs, spec, status);

export class SFSCompiler {
    static compile_sfs(signature: string): any {
        return sfs_compiler(signature)
    }

    static run_sfs(compiled_sfs: any, spec: any, status: any): any[] {
        return run_compiled_sfs(compiled_sfs, spec, status)
    }

    static compile_kind(kind: Kind): void {
        for (let i in kind.intentful_signatures) {
            kind.intentful_signatures[i].compiled_signature = SFSCompiler.compile_sfs(kind.intentful_signatures[i].signature).toString()
        }
    }

    static compile_provider_sfs(provider: Provider) {
        provider.kinds.forEach(kind => SFSCompiler.compile_kind(kind))
    }
}