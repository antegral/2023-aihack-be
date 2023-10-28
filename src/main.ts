import { NestFactory } from '@nestjs/core';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { AppModule } from './app.module';
import { LanceDB } from 'langchain/vectorstores/lancedb';
import { connect } from 'vectordb';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { readFile, rm } from 'fs/promises';

async function genDatabase() {
  await rm('data/vector-database', { recursive: true });
  const dir = 'data/vector-database';

  const text = await readFile('data/unvectorized_database.txt', 'utf8');

  const splitter = new CharacterTextSplitter({
    separator: '\n\n',
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const db = await connect(dir);
  const table = await db.createTable('vectors', [
    { vector: Array(1536), text: 'sample', loc: { lines: { from: 0, to: 0 } } },
  ]);

  const output = await splitter.createDocuments([text]);

  const vectorStore = await LanceDB.fromDocuments(
    output,
    new OpenAIEmbeddings({
      openAIApiKey: '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',
    }),
    { table },
  );
}

async function testDatabase() {
  const dir = 'data/vector-database';

  const db = await connect(dir);
  const table = await db.openTable('vectors');

  const vectorStore = new LanceDB(
    new OpenAIEmbeddings({
      openAIApiKey: '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',
    }),
    { table },
  );

  console.log('TEST: Search Q1');
  let testResult = await vectorStore.similaritySearch(
    '깡통주택이 문제인 이유',
    1,
  );
  console.log(testResult);

  console.log('TEST: Search Q2');
  testResult = await vectorStore.similaritySearch(
    '경기도에서 전세사기 관련해서 법률 상담을 할 수 있는 연락처',
    1,
  );
  console.log(testResult);

  console.log('TEST: Search Q3');
  testResult = await vectorStore.similaritySearch(
    '깡통주택을 예방하기 위해 할 수 있는 일',
    1,
  );
  console.log(testResult);

  console.log('TEST: Search Q4');
  testResult = await vectorStore.similaritySearch(
    '보증금을 돌려주지 않을 때 사용할 수 있는 방법',
    1,
  );
  console.log(testResult);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(7000);
}
bootstrap();
