import { connectToDatabase } from "@/lib/database/mongoose";
import { openai } from '@/lib/openai'
import { getPineconeClient } from '@/lib/pinecone'
import { SendMessageValidator } from '@/lib/validators/SendMessageValidator'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { NextRequest } from 'next/server'
import { SignedIn, auth } from "@clerk/nextjs";
import { getUserById } from "@/lib/actions/user.actions";

import File from "@/lib/database/models/file.model";
import Message from "@/lib/database/models/message.model"

import { OpenAIStream, StreamingTextResponse } from 'ai'

export const POST = async (req: NextRequest) => {
  // endpoint for asking a question to a pdf file

  const body = await req.json()

  const { userId } = auth();
  const user = await getUserById(userId);

  if (!userId)
    return new Response('Unauthorized', { status: 401 })

  const { fileId, message } =
    SendMessageValidator.parse(body)

  await connectToDatabase();
  const file = await File.findOne({
    where: {
      id: fileId,
      userId,
    },
  })

  if (!file)
    return new Response('Not found', { status: 404 })

  await Message.create({
    data: {
      text: message,
      isUserMessage: true,
      userId,
      fileId,
    },
  })

  // 1: vectorize message
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const pinecone = await getPineconeClient()
  const pineconeIndex = pinecone.Index('quill')

  const vectorStore = await PineconeStore.fromExistingIndex(
    embeddings,
    {
      pineconeIndex,
      namespace: file.id,
    }
  )

  const results = await vectorStore.similaritySearch(
    message,
    4
  )

  const prevMessages = await Message.find({
    where: {
      fileId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: 6,
  })

  const formattedPrevMessages = prevMessages.map((msg: any) => ({
    role: msg.isUserMessage
      ? ('user' as const)
      : ('assistant' as const),
    content: msg.text,
  }))

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0,
    stream: true,
    messages: [
      {
        role: 'system',
        content:
          'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
      },
      {
        role: 'user',
        content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedPrevMessages.map((message: any) => {
          if (message.role === 'user')
            return `User: ${message.content}\n`
          return `Assistant: ${message.content}\n`
        })}
  
  \n----------------\n
  
  CONTEXT:
  ${results.map((r) => r.pageContent).join('\n\n')}
  
  USER INPUT: ${message}`,
      },
    ],
  })

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await Message.create({
        data: {
          text: completion,
          isUserMessage: false,
          fileId,
          userId,
        },
      })
    },
  })

  return new StreamingTextResponse(stream)
}
