// src/app/api/cron/check-prices/route.ts - FIXED COMPLETE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { backgroundPriceChecker } from '@/lib/background-price-checker';

export async function GET(request: NextRequest) {
  console.log('⏰ CRON: Starting scheduled price check...');
  
  try {
    const result = await backgroundPriceChecker.runPriceCheck();
    
    return NextResponse.json({
      message: `Scheduled price check completed: ${result.checked} flights checked, ${result.notifications} notifications sent`,
      ...result, // This includes success, checked, notifications, results
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ CRON: Price check failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Price check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}