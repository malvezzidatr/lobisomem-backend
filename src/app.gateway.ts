import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { generateLobby } from './util';
import { Lobby } from './lobby';

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
    for (const lobbyId in this.lobbies) {
      const lobby = this.lobbies[lobbyId];
      if (lobby.players.includes(client.id)) {
        // Remover o cliente da sala se ele estiver conectado a alguma sala
        const index = lobby.players.indexOf(client.id);
        lobby.players.splice(index, 1);
        break;
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(`createLobby`)
  handleCreateLobby(client: Socket, teste: string): void {
    const lobbyId = client.id + '_lobby';
    const lobby = new Lobby(generateLobby());
    lobby.players.push(client.id);
    this.lobbies[lobbyId] = lobby;
    client.join(lobbyId);
    client.emit('lobby', lobby);
    console.log(teste)
    this.server.emit(`lobby_${teste}`, lobby)
  }

  @SubscribeMessage('connectToLobby')
  handleConnectToLobby(client: Socket, lobbyId: string): void {
    if (this.lobbies[lobbyId]) {

      this.lobbies[lobbyId].players.push(client.id);
      client.join(lobbyId);
      this.server.to(lobbyId).emit('lobby', this.lobbies[lobbyId]);
    }
  }
}
