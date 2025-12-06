import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('='.repeat(60));
    console.log('🔄 NEXT.JS API ROUTE - Proxying login request to backend...');
    console.log('📍 Backend URL:', `${BACKEND_URL}/auth/login`);
    console.log('📧 Email:', body.email);
    console.log('='.repeat(60));
    
    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log('✅ Backend Response Status:', response.status);
    console.log('📨 Success:', data.success);
    console.log('='.repeat(60));

    // Return the response from backend
    return NextResponse.json(data, { status: response.status });
    
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
