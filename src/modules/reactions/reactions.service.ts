/** @format */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reaction } from './entities/reaction.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectModel(Reaction.name)
    private reactionModel: Model<Reaction>,
    private websocketGateway: WebsocketGateway
  ) {}

  async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<Reaction> {
    // Remove any existing reaction from this user on this message
    await this.reactionModel.findOneAndDelete({ messageId, userId });

    // Create new reaction
    const reaction = new this.reactionModel({
      messageId,
      userId,
      emoji,
    });

    const savedReaction = await reaction.save();

    // Notify clients about the new reaction
    this.websocketGateway.server
      .to(`message_${messageId}`)
      .emit('newReaction', {
        messageId,
        reaction: savedReaction,
      });

    return savedReaction;
  }

  async removeReaction(messageId: string, userId: string): Promise<void> {
    const reaction = await this.reactionModel.findOneAndDelete({
      messageId,
      userId,
    });

    if (reaction) {
      // Notify clients about the removed reaction
      this.websocketGateway.server
        .to(`message_${messageId}`)
        .emit('reactionRemoved', {
          messageId,
          userId,
        });
    }
  }

  async getReactionsByMessage(messageId: string): Promise<Reaction[]> {
    return this.reactionModel.find({ messageId }).exec();
  }

  async getReactionsForMessages(messageIds: string[]): Promise<{
    [messageId: string]: Reaction[];
  }> {
    const reactions = await this.reactionModel
      .find({
        messageId: { $in: messageIds },
      })
      .exec();

    return reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.messageId]) {
          acc[reaction.messageId] = [];
        }
        acc[reaction.messageId].push(reaction);
        return acc;
      },
      {} as { [messageId: string]: Reaction[] }
    );
  }

  async getUserReactionsCount(userId: string): Promise<number> {
    return this.reactionModel.countDocuments({ userId });
  }

  async getReactionsReceivedCount(userId: string): Promise<number> {
    // This assumes there's a way to link messages to users
    // You'll need to adjust this based on your message structure
    const messages = await this.getMessagesByUser(userId);
    const messageIds = messages.map((m) => m._id.toString());
    return this.reactionModel.countDocuments({
      messageId: { $in: messageIds },
    });
  }

  private async getMessagesByUser(userId: string): Promise<any[]> {
    // Implement this method based on your message structure
    // This should return all messages created by the user
    return [];
  }
}
