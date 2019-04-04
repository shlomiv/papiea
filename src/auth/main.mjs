import casbin from "casbin"

async function main() {
  console.log("Starting enforcer")
  const enforcer = await casbin.newEnforcer('./model1.txt', './policy1.txt').catch(e=>console.error(e));
  try {

    process.stdout.write("Alice fails to write an imaged host of another user without rights: ") 
    console.log(enforcer.enforce({'owner':'alice','tenant':'1'}, {"metadata":{"owner" :"1alice1", "kind": "imaged_host"}}, 'write') == false ) // explicitly denied
    
    process.stdout.write("Alice fails to delete her own imaged_host, which is explicitly denied: ")
    console.log(enforcer.enforce({'owner':'alice','tenant':'1'}, {"metadata":{"owner" :"alice", "kind": "imaged_host"}}, 'delete') == false) // explicitly denied
    
    process.stdout.write("Alice succeeds reading her own imaged host which is explicitly allowed: ")
    console.log(enforcer.enforce({'owner':'alice','tenant':'1'}, {"metadata":{"owner" :"alice", "kind": "imaged_host"}}, 'read') == true) // explicitly allowed
    
    process.stdout.write("Bob succeeds reading alice's geolocation, which is allowed to read by everyone using the default 'reader_group': ")
    console.log(enforcer.enforce({'owner':'bob', 'tenant':'1'}, {"metadata":{"owner" :"alice", "kind": "geolocation"}}, 'read') == true) // implicitly allowed
    
    process.stdout.write("Bob fails to delete a geolocation since no rule allows for it: ")
    console.log(enforcer.enforce({'owner':'bob','tenant':'1'}, {"metadata":{"owner" :"alice", "kind": "geolocation"}}, 'delete') == false) // implicitly denied
    
    process.stdout.write("Alice succeeds reading a host_type owned by her since it was explicitly allowed: ")
    console.log(enforcer.enforce({'owner':'alice','tenant':'1'}, {"metadata":{"owner" :"alice", "kind": "host_type"}}, 'read') == true)  // allowed by default policy
    
    process.stdout.write("Bill succeeds reading alice's host_type since the reader_group allows it for everyone: ")
    console.log(enforcer.enforce({'owner':'bill','tenant':'1'}, {"metadata":{"owner" :"alice", "kind": "host_type"}}, 'read') == true) // allowed by standard user

    process.stdout.write("Bill fails deleting alice's host_type, since no rule allows it: ")
    console.log(enforcer.enforce({'owner':'bill','tenant':'1'}, {"metadata":{"owner" :"alice", "kind": "host_type"}}, 'delete') == false) // implicitly denied by default policy

    process.stdout.write("Bill fails deleting alice's imaged_type, since the standard_group only allows deleting to owners: ")
    console.log(enforcer.enforce({'owner':'bill','tenant':'1'}, {"metadata":{"owner" :"alice", "kind": "imaged_host"}}, 'delete') == false) // explicitly denied by default policy

    process.stdout.write("Bill succeeds deleting his own imaged_type, since the standard_group only allows deleting to owners: ")
    console.log(enforcer.enforce({'owner':'bill','tenant':'1'}, {"metadata":{"owner" :"bill", "kind": "imaged_host"}}, 'delete') == true) // explicitly denied by default policy

    process.stdout.write("Anonymous user is denied reading alice's host_type, by a rule denying anything of anyone's entity: ")
    console.log(enforcer.enforce({'owner':'anonymous'}, {"metadata":{"owner" :"alice", "kind": "host_type"}}, 'read') == false) // explicitly denied by anonymous policy

    process.stdout.write("Admin can delete alice's imaged_host since admin belongs to the admin's group: ")
    console.log(enforcer.enforce({'owner':'admin'}, {"metadata":{"owner" :"alice", "kind": "imaged_host"}}, 'delete') == true) // explicitly allowed by admin_group policy

    process.stdout.write("Rick can delete alice's imaged_host since he is in her tenant and is a part of tenant_group: ")
    console.log(enforcer.enforce({'owner':'rick', 'tenant':'1'}, {"metadata":{"owner" :"alice", 'tenant_uuid':'1', "kind": "imaged_host"}}, 'delete') == true) // explicitly allowed by admin_group policy

    process.stdout.write("Rick fails to delete alice's imaged_cluster since he is in her tenant and is a part of tenant_group but the rule denies deleteing: ")
    console.log(enforcer.enforce({'owner':'rick', 'tenant':'1'}, {"metadata":{"owner" :"alice", 'tenant_uuid':'1', "kind": "imaged_cluster"}}, 'delete') == false) // explicitly allowed by admin_group policy
    
    console.log(enforcer.enforce({'owner':'rick', 'tenant':'1'}, {"metadata":{"kind": "imaged_cluster"}}, 'delete') == false) // explicitly allowed by admin_group policy

    } catch (e) {
        console.error("Error", e)
    }
}

(async () => {
  try {
    console.log("load")
      
      await main();
    } catch (e) {
        // Deal with the fact the chain failed
    }
})();
