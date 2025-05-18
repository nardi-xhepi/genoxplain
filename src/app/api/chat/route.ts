import { NextResponse } from 'next/server';
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';

const { AWS_REGION, BEDROCK_MODEL_ID } = process.env;

if (!AWS_REGION) {
  console.error("AWS_REGION environment variable is not set.");
}
if (!BEDROCK_MODEL_ID) {
  console.error("BEDROCK_MODEL_ID environment variable is not set.");
}

const bedrockClient = new BedrockRuntimeClient({
  region: AWS_REGION,
});

// Helper to transform our frontend message format to Bedrock Messages API format for Claude 3
const transformMessagesForClaude3 = (messages: { sender: 'user' | 'ai', text: string }[], initialContext: string | null) => {
  const bedrockMessages: { role: string, content: { type: string, text: string }[] }[] = [];
  
  // Prepend initial context as the first assistant message if provided and if history doesn't already have it.
  // This assumes the context is meant to set up the AI's knowledge before the user's first *real* query.
  if (initialContext) {
    // A simple check: if the history already contains the context (e.g. from a previous turn), don't add again.
    // This check might need to be more sophisticated depending on use case.
    const historyAlreadyHasContext = messages.some(msg => msg.sender === 'ai' && msg.text.includes("PCSA Score Definitions"));
    if (!historyAlreadyHasContext) {
        bedrockMessages.push({ 
            role: 'assistant', // Present context as something the assistant already knows/stated.
            content: [{ type: 'text', text: initialContext }]
        });
    }
  }

  let currentRole: string | null = null;
  let currentContentBlocks: { type: string, text: string }[] = [];

  // Process the main messages from the frontend
  for (const message of messages) {
    const role = message.sender === 'user' ? 'user' : 'assistant';
    
    // If context was just added as an assistant message, and the first real message is also assistant,
    // we need to merge or handle appropriately. For now, this simplified logic assumes user queries follow context.
    if (bedrockMessages.length > 0 && bedrockMessages[bedrockMessages.length -1].role === 'assistant' && role === 'assistant') {
        // If the last message pushed was context (as assistant) and current message is also assistant (e.g. initial AI greeting from frontend)
        // Append to the existing assistant message content if its the same role, otherwise create new turn.
        // This might be too simplistic. A better way is to structure frontend messages so context isn't needed here.
        // For now, we just add the new assistant message as a new turn if it is different from the context.
        if (message.text !== initialContext) { // Avoid duplicating context if it was already part of messages
             bedrockMessages.push({ role: role, content: [{ type: 'text', text: message.text }] });
        }
        currentRole = role; // ensure currentRole is updated
        currentContentBlocks = []; // reset blocks
        continue;
    }

    if (role !== currentRole && currentRole !== null) {
      if (currentContentBlocks.length > 0) {
        bedrockMessages.push({ role: currentRole, content: currentContentBlocks });
      }
      currentContentBlocks = [];
    }
    currentRole = role;
    if (message.text.trim() !== '') { // Avoid adding empty text blocks
        currentContentBlocks.push({ type: 'text', text: message.text });
    }
  }

  // Add the last role's messages if any content exists
  if (currentRole && currentContentBlocks.length > 0) {
    bedrockMessages.push({ role: currentRole, content: currentContentBlocks });
  }
  return bedrockMessages;
};

export async function POST(request: Request) {
  if (!AWS_REGION || !BEDROCK_MODEL_ID) {
    return NextResponse.json(
      { error: "AWS configuration is missing. Check server logs." },
      { status: 500 }
    );
  }

  try {
    // Destructure messages, context, and the stream flag
    const { messages: frontendMessages, context: initialContext, stream: streamRequested } = await request.json(); 

    // Default to true if stream parameter is not provided
    const shouldStream = streamRequested === undefined ? true : streamRequested;

    if (!frontendMessages || !Array.isArray(frontendMessages) || frontendMessages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    if (frontendMessages[frontendMessages.length - 1].sender !== 'user') {
      return NextResponse.json({ error: 'Last message in history must be from the user.' }, { status: 400 });
    }

    // Pass initialContext to the transformer
    const bedrockMessages = transformMessagesForClaude3(frontendMessages, initialContext);
    
    if (bedrockMessages.length === 0 || bedrockMessages[bedrockMessages.length -1].role !== 'user') {
        // After transformation, if the last message isn't user, or bedrockMessages is empty, something is wrong.
        // This might happen if frontendMessages only contained AI messages and context was also AI.
        // Claude needs a user turn to respond to.
        return NextResponse.json({ error: 'Processed message history must end with a user turn.' }, { status: 400 });
    }

    const payload = {
      anthropic_version: "bedrock-2023-05-31", 
      max_tokens: 2048, // Increased max_tokens slightly for potentially larger context + response
      messages: bedrockMessages,
      temperature: 0.7,
      top_p: 0.9,
      system: `You are a genomics assistant providing information to an oncologist. Your purpose is to support clinical decision-making by interpreting genomic data. You should:
      
1. Provide detailed and specific treatment considerations based on the genomic findings.
2. Be direct about therapeutic options, including relevant clinical trials, based on the genetic variants identified.
3. Explain connections between genetic variants and potential targeted therapies or resistance mechanisms.
4. Discuss prognostic implications of the genomic profile.
5. Include brief rationales for your suggestions based on the provided genomic data and established guidelines or research.
6. Focus on translating the genomic findings into actionable clinical insights for the oncologist.
      
Assume the oncologist is familiar with medical terminology and cancer genomics. Focus on delivering precise and relevant information.`
    };

    console.log("Bedrock Messages API Payload:", JSON.stringify(payload, null, 2));
    console.log("Streaming requested by client:", streamRequested, "Will stream:", shouldStream);

    if (shouldStream) {
      // Existing streaming logic
      const command = new InvokeModelWithResponseStreamCommand({
        modelId: BEDROCK_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const streamingResponse = await bedrockClient.send(command);
      console.log("Got streaming response from Bedrock");

      const stream = new ReadableStream({
        async start(controller) {
          try {
            if (streamingResponse.body) {
              console.log("Starting to process Bedrock stream");
              for await (const chunk of streamingResponse.body) {
                console.log("Raw chunk:", chunk);
                if (chunk.chunk?.bytes) {
                  const decodedChunk = new TextDecoder().decode(chunk.chunk.bytes);
                  console.log("Decoded chunk:", decodedChunk);
                  try {
                    const parsedChunk = JSON.parse(decodedChunk);
                    console.log("Parsed chunk:", parsedChunk);
                    if (parsedChunk.type === 'message_delta' && parsedChunk.delta && parsedChunk.delta.text) {
                      const token = parsedChunk.delta.text;
                      console.log("Sending token:", token);
                      controller.enqueue(new TextEncoder().encode(JSON.stringify({ token })));
                    } else if (parsedChunk.type === 'content_block_delta' && parsedChunk.delta && parsedChunk.delta.type === 'text_delta' && parsedChunk.delta.text) {
                      const token = parsedChunk.delta.text;
                      console.log("Sending content_block token:", token);
                      controller.enqueue(new TextEncoder().encode(JSON.stringify({ token })));
                    } else if (parsedChunk.completion) {
                      const token = parsedChunk.completion;
                      console.log("Sending completion token:", token);
                      controller.enqueue(new TextEncoder().encode(JSON.stringify({ token })));
                    } else {
                      console.log("Unknown chunk format:", parsedChunk);
                      if (parsedChunk.outputText) {
                        controller.enqueue(new TextEncoder().encode(JSON.stringify({ token: parsedChunk.outputText })));
                      }
                    }
                  } catch (e) {
                    console.error("Error parsing chunk:", e, decodedChunk);
                    if (decodedChunk && typeof decodedChunk === 'string' && decodedChunk.trim()) {
                      controller.enqueue(new TextEncoder().encode(JSON.stringify({ token: decodedChunk })));
                    }
                  }
                } else {
                  console.log("Chunk without bytes:", chunk);
                }
              }
              console.log("Finished processing Bedrock stream");
            } else {
              console.error("No response body from Bedrock");
              controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
                error: "No response stream available from the model" 
              })));
            }
            console.log("Sending done signal");
            controller.enqueue(new TextEncoder().encode(JSON.stringify({ done: true })));
            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            controller.enqueue(new TextEncoder().encode(JSON.stringify({ 
              error: `Streaming error: ${error instanceof Error ? error.message : 'Unknown error'}` 
            })));
            controller.error(error);
          }
        }
      });
      return new Response(stream, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // New non-streaming logic
      const command = new InvokeModelCommand({
        modelId: BEDROCK_MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      console.log("Sending non-streaming request to Bedrock");
      const response = await bedrockClient.send(command);
      console.log("Got non-streaming response from Bedrock");

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      console.log("Parsed non-streaming Bedrock response:", responseBody);

      // Ensure the response format matches what the frontend expects for non-streaming.
      // Based on ChatPanel.tsx, it expects a 'text', 'content', 'message', or 'response' field.
      // Claude 3 typically returns a 'content' array with text blocks.
      let aiText = "";
      if (responseBody.content && Array.isArray(responseBody.content) && responseBody.content.length > 0 && responseBody.content[0].type === 'text') {
        aiText = responseBody.content[0].text;
      } else if (responseBody.text) { // Fallback for other possible structures
        aiText = responseBody.text;
      } else if (responseBody.message) {
        aiText = responseBody.message;
      } else if (responseBody.response) {
         aiText = responseBody.response;
      } else {
        console.warn("Bedrock non-streaming response does not contain expected text fields. Full response:", responseBody);
        // Returning the whole body for the frontend to attempt to parse, or show an error.
        return NextResponse.json({ error: "Unexpected response structure from Bedrock model (non-streaming)", details: responseBody }, { status: 500 });
      }
      
      // The frontend ChatPanel.tsx expects an object with a `text` field (or content/message/response).
      return NextResponse.json({ text: aiText });
    }

  } catch (error: unknown) {
    console.error("Error invoking Bedrock model:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    let errorName: string | null = null;

    // Safely access name and $metadata properties
    if (typeof error === 'object' && error !== null) {
      if ('name' in error && typeof (error as {name: string}).name === 'string') {
        errorName = (error as {name: string}).name;
      }
    }

    if (errorName === 'AccessDeniedException') {
        return NextResponse.json({ error: "Access denied to Bedrock. Check IAM permissions.", details: errorMessage }, { status: 403 });
    }
    if (errorName === 'ResourceNotFoundException') {
        return NextResponse.json({ error: "Bedrock model not found. Check model ID and region.", details: errorMessage }, { status: 404 });
    }
    if (errorName === 'ValidationException') {
        let details = errorMessage;
        if (typeof error === 'object' && error !== null && '$metadata' in error && (error as { $metadata: unknown }).$metadata) {
            details = JSON.stringify((error as { $metadata: unknown }).$metadata) + " " + errorMessage;
        }
        console.error("Bedrock ValidationException details:", details);
        return NextResponse.json({ error: "Invalid request to Bedrock. Check payload, model parameters or API format.", details: details }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to get response from Bedrock", details: errorMessage }, { status: 500 });
  }
} 