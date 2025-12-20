import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Proxying logout request to backend...');
    
    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies from the request
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    const data = await response.json();

    console.log('✅ Logout response:', data);

    // Create response and clear cookie on frontend too
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // Clear the cookie on the client side
    nextResponse.cookies.delete('auth_token');

    return nextResponse;
    
  } catch (error: any) {
    console.error('❌ Error in logout API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process logout request',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
