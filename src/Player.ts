export class Player {
    public name: string;
    public userID: string;
    public admin: boolean;

    constructor(name: string, id: string, admin?: boolean) {
        this.name = name;
        this.userID = id;
        this.admin = admin ?? false;
    }
}