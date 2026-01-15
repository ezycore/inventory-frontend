import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data;
    if (isJson) {
      data = await response.json();
    } else {
      // Handle non-JSON responses (HTML error pages, plain text, etc.)
      const text = await response.text();
      console.error('❌ Backend returned non-JSON response:', text.substring(0, 200));
      
      return NextResponse.json(
        {
          success: false,
          error: 'Backend error',
          message: `Backend returned ${response.status}: ${text.substring(0, 100)}`,
        },
        { status: response.status }
      );
    }
    
    // Get the Set-Cookie header from backend response
    const setCookieHeader = response.headers.get('set-cookie');

    // Create the response
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Forward the Set-Cookie header from backend to client
    if (setCookieHeader) {
      nextResponse.headers.set('Set-Cookie', setCookieHeader);
    }

    return nextResponse;
    
  } catch (error: any) {
    console.error('❌ Error in login API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process login request',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
