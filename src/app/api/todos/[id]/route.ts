import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { basename } from 'path';

import * as TodosService from '@/src/app/api/services/todos.service';

export async function PUT(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const id = basename(pathname);
  const data = await req.json();
  const response = await TodosService.update(id, data);

  return NextResponse.json({ response });
}

export async function DELETE(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const id = basename(pathname);
  const response = TodosService.remove(id);

  return NextResponse.json({ response });
}