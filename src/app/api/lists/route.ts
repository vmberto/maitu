import { NextResponse } from 'next/server';

import * as ListsService from '@/src/app/api/services/lists.service';
import type { List } from '@/types/main';

export async function POST(req: Request) {
  const data = await req.json();
  const response = await ListsService.add(data as List);

  return NextResponse.json(response);
}
