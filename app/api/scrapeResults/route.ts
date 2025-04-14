import { NextResponse } from 'next/server';
import { fetchResult } from '@/utils/scrapeResults';

export async function GET() {
  return NextResponse.json({ message: 'API is working' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hallTicketNos } = body;
    
    if (!Array.isArray(hallTicketNos)) {
      return NextResponse.json({ error: 'hallTicketNos should be an array' }, { status: 400 });
    }

    const results = [];
    for (const hallTicketNo of hallTicketNos) {
      try {
        const result = await fetchResult(hallTicketNo);
        results.push({ hallTicketNo, result });
      } catch (individualError) {
        results.push({ 
          hallTicketNo, 
          result: { 
            error: 'Failed to process this hall ticket',
            errorDetails: individualError.message || String(individualError)
          }
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ 
      error: 'Failed to process request', 
      details: error.message || String(error)
    }, { status: 500 });
  }
}