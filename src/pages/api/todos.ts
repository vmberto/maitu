import { NextApiRequest, NextApiResponse } from 'next';
import { getTodos, deleteTodo, updateTodo, createTodo } from '@/lib/mongo/todos';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { result, error } = await getTodos(req.query.listId as string);
      if (error) throw error;
      return res.status(200).json({ result });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { todo, error } = await createTodo(req.body);
      if (error) throw error;

      return res.status(200).json({ todo });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { todo, error } = await updateTodo(req.body);
      if (error) throw error;

      return res.status(200).json({ todo });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { todo, error } = await deleteTodo(req.query.listId as string);
      if (error) throw error;

      return res.status(200).json({ todo });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
