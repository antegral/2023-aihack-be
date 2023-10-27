import { ConsoleLogger } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { readFileSync } from 'fs';
import OpenAI from 'openai';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server } from 'socket.io';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  openai: OpenAI;
  system_prompt: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: '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', // defaults to process.env["OPENAI_API_KEY"]
    });

    this.system_prompt = readFileSync('data/docs.txt', 'utf8');
  }

  @SubscribeMessage('chat')
  async onEvent(client: any, data: any) {
    const req = JSON.parse(data);
    const session_id = uuidv4();
    console.log(`\n[${session_id}] > Start of Chatting`);

    const messages = await this.openai.chat.completions.create({
      messages: [
        { role: 'system', content: this.system_prompt },
        {
          role: 'user',
          content: req.message,
        },
      ],
      model: 'gpt-3.5-turbo-16k',
      stream: true,
    });
    for await (const message of messages) {
      process.stdout.write(message.choices[0]?.delta?.content || '');
      this.server.emit('chat', {
        session: session_id,
        message: message.choices[0]?.delta?.content || '',
      });
    }

    this.server.emit('chat', {
      session: session_id,
      message: -1,
    });

    console.log(`\n[${session_id}] > End of Chatting`);

    // return {
    //   session: '7a4f3fcf-35a6-4150-bb2a-67ffb03e8f7b',
    //   response: data.message,
    // };
  }
}
