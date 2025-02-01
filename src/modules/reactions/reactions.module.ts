/** @format */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReactionsService } from './reactions.service';
import {
  Reaction,
  ReactionSchema,
  MessageReactions,
  MessageReactionsSchema,
} from './entities/reaction.entity';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reaction.name, schema: ReactionSchema },
      { name: MessageReactions.name, schema: MessageReactionsSchema },
    ]),
    WebsocketModule,
  ],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
