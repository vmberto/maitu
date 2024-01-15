import type { NextApiRequest, NextApiResponse } from 'next';
import * as ListsService from 'src/api/services/lists.service';
import { HttpCodes } from 'src/lib/enums';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === HttpCodes.PUT) {
    const response = await ListsService.updateOrder(
      req.body as { initialIndex: number; destinationIndex: number },
    );
    res.status(200).send(response);
  }
}
