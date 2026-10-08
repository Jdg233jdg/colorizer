import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    let imageBuffer: ArrayBuffer;
    let imageByteLength = 0;
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const image = formData.get('image');

      if (!(image instanceof File)) {
        return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
      }

      imageBuffer = await image.arrayBuffer();
      imageByteLength = imageBuffer.byteLength;
    } else {
      const body = await request.json().catch(() => null);
      const image = body?.image;

      if (typeof image !== 'string') {
        return NextResponse.json({ error: 'Image is required' }, { status: 400 });
      }

      const base64Data = image.replace(/^data:image\/\w+;base64,/, '').replace(/\s/g, '');
      if (!base64Data) {
        return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
      }

      const decodedBuffer = Buffer.from(base64Data, 'base64');
      imageBuffer = decodedBuffer.buffer.slice(
        decodedBuffer.byteOffset,
        decodedBuffer.byteOffset + decodedBuffer.byteLength
      ) as ArrayBuffer;
      imageByteLength = decodedBuffer.byteLength;
    }

    if (imageByteLength === 0) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }

    // Send the raw image binary to the colorization model
    const response = await fetch(
      'https://api-inference.huggingface.co/models/leonelhs/colorizer',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: Buffer.from(imageBuffer),
      }
    );

    if (!response.ok) {
      const responseType = response.headers.get('content-type') ?? '';
      const errorBody = responseType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : await response.text();

      console.error('HuggingFace error:', response.status, errorBody);

      if (response.status === 503) {
        const estimatedTime = typeof errorBody === 'object' ? errorBody?.estimated_time : undefined;
        const waitMessage =
          typeof estimatedTime === 'number'
            ? `AI model is warming up — wait ${Math.ceil(estimatedTime)} seconds and try again.`
            : 'AI model is warming up — wait 20 seconds and try again.';

        return NextResponse.json(
          { error: waitMessage },
          { status: 503 }
        );
      }

      const upstreamError =
        typeof errorBody === 'object' ? errorBody?.error ?? errorBody?.message : errorBody;
      const status = response.status >= 500 ? 502 : response.status;

      return NextResponse.json(
        { error: upstreamError || 'Colorization failed. Please try again.' },
        { status }
      );
    }

    const imageData = await response.arrayBuffer();
    const outputContentType = response.headers.get('content-type') ?? 'image/png';

    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': outputContentType.startsWith('image/') ? outputContentType : 'image/png',
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Colorize error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}