import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.BACKEND_REGION ?? 'us-east-1';
const COMMUNITY_TABLE = process.env.COMMUNITY_TABLE ?? 'trinitect-community';
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

export async function POST(req: Request) {
  try {
    const body = await req.json() as { pk: string; sk: string; delta: number };
    const { pk, sk, delta } = body;

    if (!pk || !sk || (delta !== 1 && delta !== -1)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const { Attributes } = await db.send(new UpdateCommand({
      TableName: COMMUNITY_TABLE,
      Key: { pk, sk },
      UpdateExpression: 'SET #hearts = if_not_exists(#hearts, :zero) + :delta',
      ExpressionAttributeNames: { '#hearts': 'hearts' },
      ExpressionAttributeValues: { ':delta': delta, ':zero': 0 },
      ConditionExpression: 'if_not_exists(#hearts, :zero) + :delta >= :zero',
      ReturnValues: 'UPDATED_NEW',
    }));

    return NextResponse.json({ hearts: Attributes?.hearts ?? 0 });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ hearts: 0 });
    }
    console.error('POST /api/community/heart', err);
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
