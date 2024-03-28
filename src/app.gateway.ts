import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Lobby } from './Lobby';
import { Player } from './Player';

type LobbyPayload = {
  name: string;
  lobbyID: string;
  userID?: string;
  admin?: boolean;
}

@WebSocketGateway(3333, { cors: true })
export class AppGateway {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');
  private lobbies: { [lobbyId: string]: Lobby } = {};


  @SubscribeMessage(`createLobby`)
  handleCreateLobby(client: Socket, payload: LobbyPayload): void {
    const lobbyId = payload.lobbyID;
    const lobby = new Lobby(lobbyId);
    const newPlayer = new Player(payload.name, payload.userID, payload.admin);
    lobby.players.push(newPlayer);
    this.lobbies[lobbyId] = lobby;
    client.join(lobbyId);
    client.emit('lobby', lobby);
    this.logger.log(`Created a new lobby: Lobby ID: ${lobby.id} - Admin ID: ${newPlayer.userID}`)
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

  @SubscribeMessage('disconnectFromLobby')
  handleDisconnectFromLobby(client: Socket, payload: LobbyPayload): void {
    this.logger.log(`User disconnected from lobby ${payload.lobbyID} - name: ${payload.name} - id: ${payload.userID}`)
    this.lobbies[payload.lobbyID].players = this.lobbies[payload.lobbyID].players.filter(player => player.userID !== payload.userID)
    this.server.emit(`lobby_${payload.lobbyID}`, this.lobbies[payload.lobbyID])
  }
}
