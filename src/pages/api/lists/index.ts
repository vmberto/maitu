import type { NextApiRequest, NextApiResponse } from 'next';
import * as ListsService from 'src/api/services/lists.service';
import { HttpCodes } from 'src/lib/enums';

import type { TodoList } from '../../../../types/main';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === HttpCodes.POST) {
    const response = await ListsService.add(req.body as TodoList);
    res.status(200).send(response);
  }
}
