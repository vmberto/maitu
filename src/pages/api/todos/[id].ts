import type { NextApiRequest, NextApiResponse } from 'next';
import * as TodosService from 'src/api/services/todos.service';
import { HttpCodes } from 'src/lib/enums';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query as { id: string };

  if (req.method === HttpCodes.DELETE) {
    const response = TodosService.remove(id);
    res.status(200).send(response);
  }

  if (req.method === HttpCodes.PUT) {
    const response = TodosService.update(id, req.body);
    res.status(200).send(response);
  }
}
