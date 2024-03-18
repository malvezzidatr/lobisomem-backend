import { Player } from "./Player";

export class Lobby {
    public id: string;
    public players: Player[] = [];

    constructor(id: string) {
        this.id = id;
    }
}