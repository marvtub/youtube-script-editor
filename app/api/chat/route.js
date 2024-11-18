import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

function extractSceneId(message, referencedScenes) {
  // Handle @[Tag] format
  const tagMatch = message.match(/@\[(.*?)\]/);
  if (tagMatch) {
    const tag = tagMatch[1];
    const scene = referencedScenes.find(s => s.tag === tag);
    return scene?.id;
  }
  
  // Handle @Scene "Tag": format
  const sceneMatch = message.match(/@Scene "([^"]+)"/);
  if (sceneMatch) {
    const tag = sceneMatch[1];
    const scene = referencedScenes.find(s => s.tag === tag);
    return scene?.id;
  }
  
  return null;
}

export async function POST(request) {
  try {
    const { messages, referencedScenes } = await request.json();
    console.log('Received request:', { messages, referencedScenes });
    
    const systemMessage = {
      role: 'system',
      content: `You are a friendly AI video script editor assistant. When users mention a scene, 
      I will provide you with the correct sceneId to use. Simply use the provided ID in your function call.
      If you are unsure of the sceneId, ask the user to provide the scene again.

      You can only edit ONE scene at a time.
      `
    };

    const functions = [
      {
        name: 'editScene',
        description: 'Improve a video script scene using its exact UUID from referencedScenes',
        parameters: {
          type: 'object',
          properties: {
            sceneId: { 
              type: 'string',
              description: 'Copy and paste the exact id value from the matching scene in referencedScenes'
            },
            userPrompt: {
              type: 'string',
              description: 'The user\'s specific instructions for modifying the scene'
            }
          },
          required: ['sceneId']
        }
      }
    ];

    const processedMessages = messages.map(msg => {
      if (msg.role === 'user') {
        const sceneId = extractSceneId(msg.content, referencedScenes);
        if (sceneId) {
          return {
            ...msg,
            content: `${msg.content}\n[Use sceneId: ${sceneId}]`
          };
        }
      }
      return msg;
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...processedMessages],
      functions,
      function_call: 'auto',
      temperature: 0.8,
      stream: true
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        console.log('Stream started');
        let functionCallBuffer = {
          name: '',
          arguments: ''
        };
        let isProcessingFunctionCall = false;
        
        try {
          for await (const chunk of response) {
            // If we're getting a function call, don't stream the chunks
            if (chunk.choices?.[0]?.delta?.function_call) {
              isProcessingFunctionCall = true;
              const functionCall = chunk.choices[0].delta.function_call;
              
              if (functionCall.name) {
                functionCallBuffer.name = functionCall.name;
              }
              if (functionCall.arguments) {
                functionCallBuffer.arguments += functionCall.arguments;
              }
              continue; // Skip streaming function call chunks
            }

            // Only stream non-function-call content
            if (chunk.choices?.[0]?.delta?.content && !isProcessingFunctionCall) {
              controller.enqueue(encoder.encode(chunk.choices[0].delta.content));
            }

            // Process complete function call
            if (isProcessingFunctionCall && 
                functionCallBuffer.name && 
                functionCallBuffer.arguments.startsWith('{') && 
                functionCallBuffer.arguments.endsWith('}')) {
              try {
                const args = JSON.parse(functionCallBuffer.arguments);
                await processEditScene(args, referencedScenes, controller, request, encoder);
                functionCallBuffer = { name: '', arguments: '' };
                isProcessingFunctionCall = false;
              } catch (error) {
                console.error('Function call error:', error);
              }
            }
          }
          console.log('Stream complete');
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Route error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function processEditScene(args, referencedScenes, controller, request, encoder) {
  console.log('Processing edit scene:', { args, referencedScenes });
  
  if (!args.sceneId) {
    throw new Error('No sceneId provided');
  }

  const targetScene = referencedScenes.find(scene => scene.id === args.sceneId);
  console.log('Found target scene:', targetScene);
  
  if (!targetScene) {
    console.error('Scene not found. Available scenes:', referencedScenes);
    throw new Error(`Scene not found for ID: ${args.sceneId}`);
  }

  const editResponse = await fetch(new URL('/api/edit', request.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sceneId: targetScene.id,
      originalContent: targetScene.content,
      originalTag: targetScene.tag,
      userPrompt: args.userPrompt || 'improve this scene'
    })
  });

  const improvement = await editResponse.json();
  
  const responseMessage = JSON.stringify({
    type: 'suggestion',
    content: {
      sceneId: targetScene.id,
      original: {
        content: targetScene.content,
        tag: targetScene.tag
      },
      suggestion: improvement
    }
  });
  
  controller.enqueue(encoder.encode(responseMessage));
}