import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Logout request received');
    
    // No need to call backend for token-based auth
    // Token is cleared on client side by auth store
    const data = {
      success: true,
      message: 'Logged out successfully'
    };

    console.log('✅ Logout successful');

    return NextResponse.json(data, { status: 200 });
    
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
