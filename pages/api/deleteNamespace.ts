import { initPinecone } from '@/utils/pinecone-client';
import { NextApiRequest, NextApiResponse } from 'next';
import process from 'process';
import fs from 'fs';
import mysql, {Pool, PoolConnection} from "mysql";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { namespace } = req.query as {
    namespace: string;
  };

  // delete local namespace
  const currentPath = process.cwd() + '\\namespace\\' + namespace;

  if (fs.existsSync(currentPath)) {
    // await fs.remove(currentPath);
    await fs.promises.unlink(currentPath);
  }

  const pineconeApiKey = req.headers['x-api-key'];
  const targetIndex = req.headers['x-index-name'] as string;
  const pineconeEnvironment = req.headers['x-environment'];

  const pinecone = await initPinecone(
    pineconeApiKey as string,
    pineconeEnvironment as string,
  );

  if (pinecone == null) {
    res.status(500).json({ error: "Invalid pinecone" });    
    return;
  }

  try {
    const index = pinecone.Index(targetIndex);

    const pool: Pool = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "",
      database: "chatbot_namespaces"
    });

    pool.getConnection((error: Error, connection: PoolConnection) => {
      if (error) {
        console.log("error occoured", error);
        return;
      }
      const query = "DELETE FROM namespaces where namespace = ?";
      connection.query(query, namespace, (_error: Error | null, results:any[], fields: any) => {

        if (_error) {
          console.log("error occoured>>>", _error);
          return;
        }
        
        res.status(200).json({ message: 'Namespace deleted successfully.' });
      })
    })
    // await index._delete({
    //   deleteRequest: {
    //     namespace,
    //     deleteAll: true,
    //   },
    // });

  } catch (error) {
    console.log('error', error);
    res.status(500).json({ error: 'Failed to delete namespace.' });
  }
}
