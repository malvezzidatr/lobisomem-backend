export class Lobby {
    public id: string;
    public players: string[] = [];

    constructor(id: string) {
        this.id = id;
    }
}