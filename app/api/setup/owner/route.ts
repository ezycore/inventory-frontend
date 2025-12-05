import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api';


/*
The proxy is useful for: 
1. Hiding the backend URL from the client.
2. Handling CORS issues by making requests from the same origin.
3. Centralizing error handling and logging for API requests.   
4. Adding authentication headers before forwarding


Rate limiting at Next.js level
Environment-based routing (dev vs prod backends)

*/


console.log('Backend URL for setup owner route:', BACKEND_URL, process.env.NEXT_PUBLIC_API_URL);


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('='.repeat(60));
    console.log('🔄 NEXT.JS API ROUTE - Proxying owner setup request to backend...');
    console.log('📍 Backend URL:', `${BACKEND_URL}/setup/owner`);
    console.log('📦 Request Body:', JSON.stringify(body, null, 2));
    console.log('='.repeat(60));
    
    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/setup/owner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log('✅ Backend Response Status:', response.status);
    console.log('📨 Backend Response Data:', JSON.stringify(data, null, 2));
    console.log('='.repeat(60));

    // Return the response from backend
    return NextResponse.json(data, { status: response.status });
    
  } catch (error: any) {
    console.error('❌ Error in setup API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process setup request',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
