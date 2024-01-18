import { NextResponse } from 'next/server';

import * as TodosService from '@/src/app/api/services/todos.service';
import type { Todo } from '@/types/main';

export async function POST(req: Request) {
  const data = (await req.json()) as Todo;
  const response = await TodosService.add(data);

  return NextResponse.json(response);
}
