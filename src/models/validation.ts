
const isString = (string: unknown): boolean => {
    if(typeof string !== 'string') return false;
    return true;
};

const isShortString = (string: string): boolean => {
    if(string.length < 3) return true;
    return false;
};


class Validation {
    static username (username : unknown): void {
        if(!username) throw new Error(`No user provided`);
        if(!isString(username)) throw new Error(`username must be a string ${username}`);
        if(isShortString(username as string) ) throw new Error('username must be at least 3 characters long');
    }

    static password (password : unknown): void {
        if(!password) throw new Error(`No password provided`);
        if(!isString(password)) throw new Error('password must be a string');
        if(isShortString(password as string) ) throw new Error('password must be at least 3 characters long');
    }

    static email (email : unknown): void {
        if(!email) throw new Error(`No email provided`);
        if(!isString(email)) throw new Error('email must be a string');
        if(isShortString(email as string) ) throw new Error('email must be at least 3 characters long');
    }

    static refreshToken (token: unknown): void {
        if(!token) throw new Error(`No refresh Token provided`);
        if(!isString(token)) throw new Error('token must be a string');
        if(isShortString(token as string) ) throw new Error('token miss match');
    }

}

export default Validation;

