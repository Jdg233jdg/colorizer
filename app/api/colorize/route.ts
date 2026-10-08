import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image, prompt } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Strip the base64 header and convert to binary
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Send the raw image binary to the colorization model
    const response = await fetch(
      'https://api-inference.huggingface.co/models/leonelhs/colorizer',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HuggingFace error:', response.status, errorText);

      if (response.status === 503) {
        return NextResponse.json(
          { error: 'AI model is warming up — wait 20 seconds and try again.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Colorization failed. Please try again.' },
        { status: response.status }
      );
    }

    const imageData = await response.arrayBuffer();
    const base64Image = Buffer.from(imageData).toString('base64');

    return NextResponse.json({
      image: `data:image/png;base64,${base64Image}`,
    });

  } catch (error) {
    console.error('Colorize error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}