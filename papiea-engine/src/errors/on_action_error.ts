export class OnActionError extends Error {
    static ON_CREATE_ACTION_MSG = "On Create couldn't be called;"
    static ON_DELETE_ACTION_MSG = "On Delete couldn't be called;"
    static UNKNOWN_ACTION_MSG = "Unknown action couldn't be called;"

    message: string;

    constructor(message: string) {
        super(message)
        this.message = message
    }

    public static create(reason: string, procedure_name: string, kind_name?: string) {
        if (kind_name === undefined || kind_name === null) {
            return new OnActionError(`${this.UNKNOWN_ACTION_MSG} ${reason}`)
        }
        const on_create = OnActionError.onCreateName(kind_name)
        const on_delete = OnActionError.onDeleteName(kind_name)
        let message: string
        if (procedure_name === on_create) {
            message = `${this.ON_CREATE_ACTION_MSG} ${reason}`
        } else if (procedure_name === on_delete) {
            message = `${this.ON_DELETE_ACTION_MSG} ${reason}`
        } else {
            message = `${this.UNKNOWN_ACTION_MSG} ${reason}`
        }
        return new OnActionError(message)
    }

    private static onCreateName(kind_name: string) {
        return `__${kind_name}_create`
    }

    private static onDeleteName(kind_name: string) {
        return `__${kind_name}_delete`
    }
}
