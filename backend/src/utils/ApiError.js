class ApiError extends Error{
    constructor(
        statuCode,
        message = "Something Went Wrong",
        error = [],
        stack = ""
    ){
        super(message)
        this.statuCode = statuCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = error

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
    
}
export {ApiError}