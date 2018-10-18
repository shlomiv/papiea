// Provider handler registration:
func (api_ctx papieaApiContext) registerIntentfulCallback(sig sfsSignature, callbackUrl string) err {
    deltaAnalyzer.register(sig, callbackUrl)
}

func (api_ctx papiea_api_ctx) registerProceduralCallback(sig procedureSignature, callbackUrl string) err {
    procedures.register(sig, callbackUrl)
}
