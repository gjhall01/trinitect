import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const REGION = process.env.BACKEND_REGION ?? 'us-east-1';
const USERS_TABLE = process.env.USERS_TABLE ?? 'trinitect-users';
const OTP_TABLE = process.env.OTP_TABLE ?? 'trinitect-otp';
const JWT_SECRET = process.env.JWT_SECRET ?? '';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const sns = new SNSClient({ region: REGION });

// ── OTP ──────────────────────────────────────────────────────────────────────

function generateOTP(): string {
  return String(crypto.randomInt(100000, 999999));
}

function hashOTP(otp: string, phone: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(`${phone}:${otp}`).digest('hex');
}

export async function createAndSendOTP(phone: string): Promise<void> {
  const otp = generateOTP();
  const hash = hashOTP(otp, phone);
  const expiresAt = Math.floor(Date.now() / 1000) + 600; // 10-min TTL

  await db.send(new PutCommand({
    TableName: OTP_TABLE,
    Item: { phone, otpHash: hash, expiresAt, attempts: 0 },
  }));

  await sns.send(new PublishCommand({
    PhoneNumber: phone,
    Message: `Your Trinitect code is ${otp}. Expires in 10 minutes.`,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
    },
  }));
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  const { Item: record } = await db.send(new GetCommand({
    TableName: OTP_TABLE,
    Key: { phone },
  }));

  if (!record) return false;
  if (record.expiresAt < Math.floor(Date.now() / 1000)) return false;
  if ((record.attempts ?? 0) >= 5) return false;

  // Increment attempt count before checking (prevents brute force timing attacks)
  await db.send(new UpdateCommand({
    TableName: OTP_TABLE,
    Key: { phone },
    UpdateExpression: 'SET attempts = attempts + :one',
    ExpressionAttributeValues: { ':one': 1 },
  }));

  const expected = hashOTP(otp, phone);
  const isValid = crypto.timingSafeEqual(
    Buffer.from(record.otpHash, 'hex'),
    Buffer.from(expected, 'hex'),
  );

  if (isValid) {
    await db.send(new DeleteCommand({ TableName: OTP_TABLE, Key: { phone } }));
  }

  return isValid;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function findOrCreateUser(phone: string): Promise<string> {
  const { Items } = await db.send(new QueryCommand({
    TableName: USERS_TABLE,
    IndexName: 'phone-index',
    KeyConditionExpression: 'phone = :p',
    ExpressionAttributeValues: { ':p': phone },
    Limit: 1,
  }));

  if (Items && Items.length > 0) return Items[0].userId as string;

  const userId = crypto.randomUUID();
  await db.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: {
      userId,
      phone,
      createdAt: new Date().toISOString(),
      profile: {
        name: '', values: [], primaryGoal: '',
        energyLevel: 3, onboarded: false,
        phone, smsPreferences: {
          loginConfirmation: true,
          dailyReminders: true,
          milestoneNotifications: true,
        },
      },
      domainScores: { physical: 40, mental: 35, spiritual: 25, metaphysical: 20 },
      streak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      todaysPlan: null,
      currentGoal: {
        id: 'phase0-foundation',
        title: '21-Day Foundation',
        description: 'Complete at least one action in each domain for 21 consecutive days.',
        targetDays: 21,
        completedDays: 0,
      },
    },
  }));

  return userId;
}

export async function getUser(userId: string) {
  const { Item } = await db.send(new GetCommand({
    TableName: USERS_TABLE,
    Key: { userId },
  }));
  return Item ?? null;
}

export async function updateUserFields(userId: string, updates: Record<string, unknown>): Promise<void> {
  const keys = Object.keys(updates);
  const setExpr = keys.map((k, i) => `#f${i} = :v${i}`).join(', ');
  const names = Object.fromEntries(keys.map((k, i) => [`#f${i}`, k]));
  const values = Object.fromEntries(keys.map((k, i) => [`:v${i}`, updates[k]]));

  await db.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { userId },
    UpdateExpression: `SET ${setExpr}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

// ── JWT ───────────────────────────────────────────────────────────────────────

export function signToken(userId: string, phone: string): string {
  return jwt.sign({ userId, phone }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): { userId: string; phone: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization');
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
}
