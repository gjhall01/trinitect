import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getTokenFromRequest, verifyToken } from '@/lib/auth-server';
import crypto from 'crypto';

const REGION = process.env.BACKEND_REGION ?? 'us-east-1';
const COMMUNITY_TABLE = process.env.COMMUNITY_TABLE ?? 'trinitect-community';
const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

export async function GET() {
  try {
    const { Items = [] } = await db.send(new QueryCommand({
      TableName: COMMUNITY_TABLE,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: { '#pk': 'pk' },
      ExpressionAttributeValues: { ':pk': 'FEED' },
      ScanIndexForward: false,
      Limit: 60,
    }));
    return NextResponse.json({ posts: Items });
  } catch (err) {
    console.error('GET /api/community', err);
    return NextResponse.json({ posts: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      authorName?: string;
      category?: string;
      domain?: string[];
      fromPattern?: string;
      toPattern?: string;
      impact?: string;
    };

    const { authorName, category, domain, fromPattern, toPattern, impact } = body;

    if (!impact || typeof impact !== 'string' || impact.trim().length < 10) {
      return NextResponse.json({ error: 'Share what changed — at least a sentence.' }, { status: 400 });
    }

    const token = getTokenFromRequest(req);
    const claims = token ? verifyToken(token) : null;
    const userId = claims?.userId ?? null;

    const postId = crypto.randomUUID();
    const now = new Date().toISOString();

    const item = {
      pk: 'FEED',
      sk: `${now}#${postId}`,
      postId,
      userId,
      authorName: (authorName?.trim() || 'Anonymous').slice(0, 30),
      category: category || 'personal',
      domain: Array.isArray(domain) ? domain.slice(0, 3) : [],
      fromPattern: (fromPattern?.trim() || '').slice(0, 200),
      toPattern: (toPattern?.trim() || '').slice(0, 200),
      impact: impact.trim().slice(0, 600),
      hearts: 0,
      createdAt: now,
    };

    await db.send(new PutCommand({ TableName: COMMUNITY_TABLE, Item: item }));
    return NextResponse.json({ post: item }, { status: 201 });
  } catch (err) {
    console.error('POST /api/community', err);
    return NextResponse.json({ error: 'Could not save your story.' }, { status: 500 });
  }
}
