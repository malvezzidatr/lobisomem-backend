import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { generateLobby } from './util';
import { Lobby } from './lobby';
import { Player } from './Player';

type LobbyPayload = {
  name: string;
  lobbyID: string;
  userID?: string;
}

@WebSocketGateway(3333, { cors: true })
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');
  private lobbies: { [lobbyId: string]: Lobby } = {};

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(`createLobby`)
  handleCreateLobby(client: Socket, payload: LobbyPayload): void {
    const lobbyId = payload.lobbyID;
    const lobby = new Lobby(lobbyId);
    const newPlayer = new Player(payload.name, payload.userID);
    lobby.players.push(newPlayer);
    this.lobbies[lobbyId] = lobby;
    client.join(lobbyId);
    client.emit('lobby', lobby);
    this.server.emit(`lobby_${payload.lobbyID}`, lobby)
  }

  @SubscribeMessage('connectToLobby')
  handleConnectToLobby(client: Socket, payload: LobbyPayload): void {
    const mappedLobbies = Object.entries(this.lobbies).map(([lobbyId, lobby]) => {
      return {
          data: lobby
      };
    });
    mappedLobbies.map(lobby => {
      if(lobby.data.id === payload.lobbyID) {
        const newPlayer = new Player(payload.name, payload.userID)
        
        lobby.data.players.push(newPlayer);
        this.server.emit(`lobby_${payload.lobbyID}`, lobby.data);
        this.server.emit(payload.userID, lobby.data);
      }
    })
  }
}
