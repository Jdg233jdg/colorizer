import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `colorized artwork, ${prompt}, vibrant colors, high quality, detailed illustration`,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HuggingFace error:', errorText);
      if (response.status === 503) {
        return NextResponse.json(
          { error: 'AI model is warming up — please wait 20 seconds and try again.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: `API error: ${response.status}. Please try again.` },
        { status: response.status }
      );
    }

    const imageData = await response.arrayBuffer();
    const base64Image = Buffer.from(imageData).toString('base64');

    return NextResponse.json({
      image: `data:image/jpeg;base64,${base64Image}`,
    });
  } catch (error) {
    console.error('Colorize error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
