
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
        if(!isString(username)) throw new Error(`username must be a string ${username}`);
        if(isShortString(username as string) ) throw new Error('username must be at least 3 characters long');
    }

    static password (password : unknown): void {
        if(!isString(password)) throw new Error('password must be a string');
        if(isShortString(password as string) ) throw new Error('password must be at least 3 characters long');
    }

}

export default Validation;

