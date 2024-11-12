import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ namespace: '/chat', cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private onlineUsers: Map<string, string> = new Map(); // Stores userId and socketId
  constructor(private jwtService: JwtService) {}
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const user = this.jwtService.verify(token);
      client.data.user = user;
      const userId = user.id;
      if (userId) {
        this.onlineUsers.set(userId, client.id);
      }
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.onlineUsers.entries()].find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.onlineUsers.delete(userId);
    }

    client.disconnect();
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() room: string,
  ) {
    client.join(room);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { room: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const username = client.data.user.username;
    this.server
      .to(data.room)
      .emit('message', { user: username, message: data.message });
  }

  @SubscribeMessage('privateMessage')
  async handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string; message: string },
  ) {
    const toSocketId = this.onlineUsers.get(data.toUserId);
    if (toSocketId) {
      client.to(toSocketId).emit('privateMessage', {
        message: data.message,
        fromUserId: client.handshake.query.userId,
      });
    } else {
      client.emit('error', { message: 'User is offline or not available.' });
    }
  }
}
