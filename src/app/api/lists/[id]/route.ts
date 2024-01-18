import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { basename } from 'path';

import * as TodoListsService from '@/src/app/api/services/lists.service';

export async function PUT(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const id = basename(pathname);
  const data = await req.json();
  const response = await TodoListsService.update(id, data.todoList);

  return NextResponse.json({ response });
}

export async function DELETE(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const id = basename(pathname);
  const response = await TodoListsService.remove(id);

  return NextResponse.json({ response });
}
