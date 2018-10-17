// Provider handler registration
func (api_ctx papiea_api_ctx) register_intentful_callback(sf_sig sfs_signature, callback_url string) err {
    delta_analyzer.register(sf_sig, callback_url)
}

func (api_ctx papiea_api_ctx) register_procedural_callback(proc_sig proc_signature, callback_url string) err {
    procedures.register(proc_sig, callback_url)
}
