class AppError extends Error{

    constructor(){
        super(); 
    }
    create(message, code, status){
        this.message = message;
        this.statusCode = code;
        this.status = status;
        return this;
    }
}

module.exports = new AppError();