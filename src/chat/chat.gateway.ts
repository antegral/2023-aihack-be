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

import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { connect } from 'vectordb';
import { LanceDB } from 'langchain/vectorstores/lancedb';

@WebSocketGateway(3630, {
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  openai: OpenAI;
  system_prompt: string;

  vectorStore: MemoryVectorStore;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env["OPENAI_API_KEY"],
    });

    this.system_prompt = readFileSync('data/unvectorized_database.txt', 'utf8');

    // this.vectorStore = MemoryVectorStore.fromTexts(
    //   ['Hello world', 'Bye bye', 'hello nice world'],
    //   [{ id: 2 }, { id: 1 }, { id: 3 }],
    //   new OpenAIEmbeddings(),
    // ).then((vectorStore) => {
    //   vectorStore.similaritySearch('', 10).then((result) => {
    //     console.log(result);
    //   }
    //   return vectorStore;
    // }
  }

  @SubscribeMessage('chat')
  async onEvent(client: any, data: any) {
    const dir = 'data/vector-database';

    const db = await connect(dir);
    const table = await db.openTable('vectors');
    const vectorStore = new LanceDB(
      new OpenAIEmbeddings({
        openAIApiKey: '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',
      }),
      { table },
    );

    const req = JSON.parse(data);
    const session_id = uuidv4();
    let resp_token = 0;
    console.log(`\n[${session_id}] > Start of Chatting`);

    const messages = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `나는 부동산 전세사기에 대해 고객에게 설명해주는 부동산 전문가다. 나는 다음과 같은 지식을 알고 있다.\n${this.system_prompt}\n나는 따라서, 고객에게 전세사기에 관해 설명할때 전문용어를 사용하여 정보를 알려줘야 한다. 피해 상황이라면 무조건 경찰에 신고하라는 말 대신, 상황에 맞는 실제 임대차 사기 관련 상담 연락처를 남겨주어야 한다.`,
        },
        // {
        //   role: 'user',
        //   content: '깡통전세(역전세)이 왜 문제인지 알려주세요.',
        // },
        // {
        //   role: 'assistant',
        //   content: (
        //     await vectorStore.similaritySearch('깡통주택이 문제인 이유', 1)
        //   )[0].pageContent,
        // },
        // {
        //   role: 'user',
        //   content:
        //     '경기도에서 전세사기 관련해서 법률 상담을 할 수 있는 연락처를 알려주세요.',
        // },
        // {
        //   role: 'assistant',
        //   content: (
        //     await vectorStore.similaritySearch(
        //       '경기도에서 전세사기 관련해서 법률 상담을 할 수 있는 연락처',
        //       1,
        //     )
        //   )[0].pageContent,
        // },
        // {
        //   role: 'user',
        //   content: '전세사기를 예방하기 위해서 어떻게 해야하는지 설명해주세요.',
        // },
        // {
        //   role: 'assistant',
        //   content: (
        //     await vectorStore.similaritySearch(
        //       '깡통주택을 예방하기 위해 할 수 있는 일',
        //       1,
        //     )
        //   )[0].pageContent,
        // },
        // {
        //   role: 'user',
        //   content: '보증금을 돌려주지 않는다면 어떻게 해야하나요?',
        // },
        // {
        //   role: 'assistant',
        //   content: (
        //     await vectorStore.similaritySearch(
        //       '보증금을 돌려주지 않을 때 사용할 수 있는 방법',
        //       1,
        //     )
        //   )[0].pageContent,
        // },
        // {
        //   role: 'user',
        //   content:
        //     '해커톤 오피스텔 세입자인데, 전세사기가 의심돼요. 전세금 1억 6,500만원 / 전세 기간 2022.01.08 ~ 2023.12.07 인데요 계약 시 부동산에서 개인주인집을 만나 계약을 했어요. 당시 근저당 잡혀있어 부동산 조약에 근저당 해소 특약 걸었고,잔금 입금 후 임대인이 채권 해제 후에 입주하고 전세권 설정도 하고 전입신고와 확정일자를 받았어요. 보험은 가입하지 않았어요. 전세 사기가 유행이라 혹시 몰라 등기를 떼어 보니 집주인이 2022년 2월에 어떤 법인회사로 변경되어 있었어요. 한 달 후에 바로 팔았어요. 아직 등기상 근저당은 없으나 법인이 소유주인데 전화번호도 없는 번호라고 떠요. 아직 만기까지 7개월 남았는데 제가 할 수 있는게 아무것도 없는 거 같아요. 어떻게 해야 할까요?',
        // },
        // {
        //   role: 'assistant',
        //   content:
        //     '전세사기 피해를 회복하기 위해 (1) 형사고소, (2) 보증금반환청구소송, (3) 채권추심/강제집행이 있습니다. 공인중개사가 전세사기에 적극 가담했다면 (4) 공인중개사 및 중개사협회에 대한 손해배상청구도 생각해볼 수 있습니다.\n이를 위해, 대한법률구조공단의 상담을 받을 수 있으며, 132로 전화하면 됩니다.\n경기도민이라면, 경기도 무료법률상담실 (031-120, 031-8008-2246)에 연락하여 도움을 구할 수 있습니다.',
        // },
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
      resp_token++;
    }

    this.server.emit('chat', {
      session: session_id,
      message: 'EOF',
    });

    console.log(
      `\n[${session_id}] > End of Chatting (response token: ${resp_token})`,
    );

    // return {
    //   session: '7a4f3fcf-35a6-4150-bb2a-67ffb03e8f7b',
    //   response: data.message,
    // };
  }
}
