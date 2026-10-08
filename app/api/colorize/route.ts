import { NextRequest, NextResponse } from 'next/server';

const HF_MODEL_URL =
  'https://api-inference.huggingface.co/models/lllyasviel/sd-controlnet-scribble';

const POSITIVE_SUFFIX =
  ', crisp line art colorization, clean flat vibrant colors, digital masterpiece, high detail, professional illustration';

const NEGATIVE_PROMPT =
  'blurry, monochromatic, grayscale, desaturated, distorted lines, artifacts, low quality, ugly, duplicate';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const userPrompt = formData.get('prompt') as string | null;

    if (!imageFile || !userPrompt) {
      return NextResponse.json(
        { error: 'Missing image or prompt. Please fill in both fields.' },
        { status: 400 }
      );
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json(
        { error: 'Server configuration error. API key is missing.' },
        { status: 500 }
      );
    }

    const fullPrompt = `${userPrompt.trim()}${POSITIVE_SUFFIX}`;
    const imageBytes = await imageFile.arrayBuffer();
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const encodedNegative = encodeURIComponent(NEGATIVE_PROMPT);

    const hfResponse = await fetch(
      `${HF_MODEL_URL}?prompt=${encodedPrompt}&negative_prompt=${encodedNegative}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          'Content-Type': imageFile.type || 'image/png',
          'x-wait-for-model': 'true',
        },
        body: imageBytes,
      }
    );

    if (!hfResponse.ok) {
      let errorMessage = `Hugging Face returned an error (${hfResponse.status}).`;
      if (hfResponse.status === 503) {
        errorMessage = 'The AI model is warming up. Wait 20 seconds and try again.';
      } else if (hfResponse.status === 401) {
        errorMessage = 'Your Hugging Face API key is invalid. Check your .env.local file.';
      } else if (hfResponse.status === 429) {
        errorMessage = 'Free usage limit reached. Wait a few minutes and try again.';
      }
      return NextResponse.json({ error: errorMessage }, { status: hfResponse.status });
    }

    const imageData = await hfResponse.arrayBuffer();
    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': imageData.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error('Colorize API error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
