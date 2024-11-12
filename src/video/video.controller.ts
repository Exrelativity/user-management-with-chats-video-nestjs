import { Controller, Post, Body } from '@nestjs/common';

@Controller('video')
export class VideoController {
  @Post('offer')
  handleOffer(@Body() offerData: { roomId: string; offer: any }) {
    // Store the offer in memory or forward it to another user in the specified room
    console.log('Received offer:', offerData);
  }

  @Post('answer')
  handleAnswer(@Body() answerData: { roomId: string; answer: any }) {
    // Store the answer or forward it to the specified room
    console.log('Received answer:', answerData);
  }

  @Post('ice-candidate')
  handleIceCandidate(
    @Body() candidateData: { roomId: string; candidate: any },
  ) {
    // Store the ICE candidate or forward it to the specified room
    console.log('Received ICE candidate:', candidateData);
  }
}
