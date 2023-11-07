import { NextApiRequest, NextApiResponse } from 'next';
import { initPinecone } from '@/utils/pinecone-client';
import mysql, {Pool, PoolConnection} from "mysql";

type NamespaceSummary = {
  vectorCount: number;
};

const getNamespaces = async (req: NextApiRequest, res: NextApiResponse) => {
  const pineconeApiKey = req.headers['x-api-key'];
  const targetIndex = req.headers['x-index-name'] as string;
  const pineconeEnvironment = req.headers['x-environment'];

  const pinecone = await initPinecone(
    pineconeApiKey as string,
    pineconeEnvironment as string,
  );

  if (pinecone == null) {
    res.status(500).json({ message: "Invalid pinecone." });    
    return;
  }
  
  try {
    const index = pinecone.Index(targetIndex);

    const describeIndexStatsQuery = {
      describeIndexStatsRequest: {
        filter: {},
      },
    };

    const indexStatsResponse = await index.describeIndexStats(
      describeIndexStatsQuery,
    );

    const pool: Pool = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "",
      database: "chatbot_namespaces"
    });

    let namespace: any[] = [];
    pool.getConnection((error: Error, connection: PoolConnection) => {
      if (error) {
        console.log("error occoured", error);
        return;
      }
      const query = "SELECT namespace from namespaces";
      connection.query(query, (_error: Error | null, results:any[], fields: any) => {

        if (_error) {
          console.log("error occoured>>>", _error);
          return;
        }

        console.log("result>>>",results[0].namespace);
        if (results.length> 0) {
          results.flatMap(result => {

            console.log(result.namespace);
            namespace.push(result.namespace);
          })
        }
        console.log("namesapces>>>", namespace);
        
        connection.release();
        res.status(200).json(namespace);
        // namespace = results;
      })
    })


    // const namespaces = Object.keys(
    //   indexStatsResponse.namespaces as { [key: string]: NamespaceSummary },
    // );

    // res.status(200).json(namespace);
  } catch (error) {
    console.log('Error fetching namespaces', error);
    res.status(500).json({ message: 'Error fetching namespaces' });
  }
};

export default getNamespaces;
