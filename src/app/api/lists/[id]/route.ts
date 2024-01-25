import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { basename } from 'path';

import * as ListsService from '@/src/app/api/services/lists.service';

export async function PUT(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const id = basename(pathname);
  const data = await req.json();
  const response = await ListsService.update(id, data.list);

  return NextResponse.json({ response });
}

export async function DELETE(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const id = basename(pathname);
  const response = await ListsService.remove(id);

  return NextResponse.json({ response });
}
