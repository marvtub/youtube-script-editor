import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { sceneId, originalContent, originalTag, userPrompt } = await request.json();
    
    const systemMessage = {
      role: 'system',
      content: `You are an expert video script editor. Follow the user's specific instructions 
      for improving the scene. If no specific instructions 
      are given, make the content more engaging and impactful.
      Keep the original tag - only modify the content.`
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        systemMessage,
        {
          role: 'user',
          content: `${userPrompt}
          
          Scene to modify:
          Tag (for context): ${originalTag}
          Content: ${originalContent}
          
          Respond in this format only:
          {
            "content": "modified content",
            "reasoning": "explanation of changes"
          }`
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    // Parse the response and add back the original tag
    const improvement = JSON.parse(response.choices[0].message.content);
    improvement.tag = originalTag;

    return new Response(JSON.stringify(improvement), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}