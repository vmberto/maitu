import { NextResponse } from 'next/server';

import * as ListsService from '@/src/app/api/services/lists.service';

export async function PUT(req: Request) {
  const data = (await req.json()) as {
    initialIndex: number;
    destinationIndex: number;
  };
  const response = await ListsService.updateOrder(data);
  return NextResponse.json({ response });
}
