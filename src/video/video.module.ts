import { Module } from '@nestjs/common';
import { VideoGateway } from './video/video.gateway';
import { VideoController } from './video/video.controller';

@Module({
  controllers: [VideoController],
  providers: [VideoGateway],
})
export class VideoModule {}
