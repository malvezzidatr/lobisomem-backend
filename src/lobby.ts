type player = {
    name: string;
}

export class Lobby {
    public id: string;
    public players: player[] = [];

    constructor(id: string) {
        this.id = id;
    }
}