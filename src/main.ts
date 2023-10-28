import { NestFactory } from '@nestjs/core';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { AppModule } from './app.module';
import { LanceDB } from 'langchain/vectorstores/lancedb';
import { connect } from 'vectordb';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import OpenAI from 'openai';

async function genDatabase() {
  const loader = new TextLoader('data/expression.txt');
  const docs = await loader.load();

  const dir = 'data/vector-database';

  const db = await connect(dir);
  const table = await db.createTable('vectors', [
    { vector: Array(1536), text: 'Hello', source: 'a' },
  ]);

  const vectorStore = await LanceDB.fromDocuments(
    docs,
    new OpenAIEmbeddings({
      openAIApiKey: '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',
    }),
    { table },
  );

  console.dir(vectorStore);

  console.log('TEST: Search 전세사기');
  const testResult = await vectorStore.similaritySearch('전세사기', 1);
  console.log(testResult);
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

  console.log('TEST: Search 깡통전세란?');
  let testResult = await vectorStore.similaritySearch('확정일자란?', 1);
  console.log(testResult);

  console.log('TEST: Search 전세사기란?');
  testResult = await vectorStore.similaritySearch('전세사기란?', 1);
  console.log(testResult);

  console.log('TEST: Search 선순위 대출이란?');
  testResult = await vectorStore.similaritySearch('선순위 대출이란?', 1);
  console.log(testResult);
}

async function bootstrap() {
  await genDatabase();

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
