import { NextApiRequest, NextApiResponse } from 'next';
import { createTodoList, getTodoLists } from '@/lib/mongo/todo-lists';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { todoLists, error } = await getTodoLists();
      if (error) throw error;

      return res.status(200).json({ todoLists });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { todoList, error } = await createTodoList(JSON.parse(req.body));
      if (error) throw error;

      return res.status(200).json({ todoList });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
