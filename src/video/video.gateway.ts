import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ namespace: '/video', cors: true })
export class VideoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}
  // Track connected users by userId and socketId
  private onlineUsers: Map<string, string> = new Map();

  private rooms: Map<string, Set<string>> = new Map(); // Room name -> Set of socket IDs

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const user = this.jwtService.verify(token);
      client.data.user = user; // Attach user data to the socket
      // const userId = client.handshake.query.userId as string;
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

  // Handle receiving an offer from a user
  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string; offer: RTCSessionDescriptionInit },
  ) {
    const toSocketId = this.onlineUsers.get(data.toUserId);
    if (toSocketId) {
      client.to(toSocketId).emit('offer', {
        fromUserId: client.handshake.query.userId,
        offer: data.offer,
      });
    }
  }

  // Handle receiving an answer from a user
  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { toUserId: string; answer: RTCSessionDescriptionInit },
  ) {
    const toSocketId = this.onlineUsers.get(data.toUserId);
    if (toSocketId) {
      client.to(toSocketId).emit('answer', {
        fromUserId: client.handshake.query.userId,
        answer: data.answer,
      });
    }
  }

  // Handle receiving ICE candidates from a user
  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string; candidate: RTCIceCandidate },
  ) {
    const toSocketId = this.onlineUsers.get(data.toUserId);
    if (toSocketId) {
      client.to(toSocketId).emit('ice-candidate', {
        fromUserId: client.handshake.query.userId,
        candidate: data.candidate,
      });
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)?.add(client.id);
    client.join(room);

    // Notify others in the room
    client.to(room).emit('user-joined', { userId: client.id });
  }

  @SubscribeMessage('leaveVideoRoom')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    this.rooms.get(room)?.delete(client.id);
    if (this.rooms.get(room)?.size === 0) this.rooms.delete(room);
  }

  // Handle receiving an offer from a user
  @SubscribeMessage('room-offer')
  handleRoomOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; offer: RTCSessionDescriptionInit },
  ) {
    const roomExist = this.rooms.get(data.room);
    if (roomExist) {
      client.to(data.room).emit('room-offer', {
        fromUserId: client.handshake.query.userId,
        offer: data.offer,
      });
    }
  }

  // Handle receiving an answer from a user
  @SubscribeMessage('room-answer')
  handleRoomAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { room: string; answer: RTCSessionDescriptionInit },
  ) {
    const roomExist = this.onlineUsers.get(data.room);
    if (roomExist) {
      client.to(data.room).emit('room-answer', {
        fromUserId: client.handshake.query.userId,
        answer: data.answer,
      });
    }
  }

  // Handle receiving ICE candidates from a user
  @SubscribeMessage('room-ice-candidate')
  handleIceRoomCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string; candidate: RTCIceCandidate },
  ) {
    const roomExist = this.rooms.get(data.room);
    if (roomExist) {
      client.to(data.room).emit('room-ice-candidate', {
        fromUserId: client.handshake.query.userId,
        candidate: data.candidate,
      });
    }
  }
}
