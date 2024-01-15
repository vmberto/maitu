import type { NextApiRequest, NextApiResponse } from 'next';
import * as TodosService from 'src/api/services/todos.service';
import { HttpCodes } from 'src/lib/enums';

import type { Todo } from '../../../../types/main';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === HttpCodes.POST) {
    const response = await TodosService.add(req.body as Todo);
    res.status(200).send(response);
  }
}
