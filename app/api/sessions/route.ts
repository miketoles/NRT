import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (startDate || endDate) {
      where.sessionDate = {};
      if (startDate) {
        (where.sessionDate as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.sessionDate as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        client: true,
        enteredBy: {
          select: { id: true, name: true, email: true },
        },
        intervals: true,
      },
      orderBy: { sessionDate: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId, sessionDate, notes, intervals } = body;

    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!sessionDate) {
      return NextResponse.json(
        { error: 'Session date is required' },
        { status: 400 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const date = new Date(sessionDate);

    // Check if session already exists for this client/date
    const existingSession = await prisma.session.findUnique({
      where: {
        clientId_sessionDate: {
          clientId,
          sessionDate: date,
        },
      },
    });

    if (existingSession) {
      // Update existing session
      const updatedSession = await prisma.session.update({
        where: { id: existingSession.id },
        data: {
          notes: notes?.trim() || null,
          userId, // Update who last edited
        },
      });

      // Update intervals if provided
      if (intervals && Array.isArray(intervals)) {
        for (const interval of intervals) {
          await prisma.interval.upsert({
            where: {
              sessionId_behaviorId_intervalIndex: {
                sessionId: existingSession.id,
                behaviorId: interval.behaviorId,
                intervalIndex: interval.intervalIndex,
              },
            },
            update: { value: interval.value },
            create: {
              sessionId: existingSession.id,
              behaviorId: interval.behaviorId,
              intervalIndex: interval.intervalIndex,
              value: interval.value,
            },
          });
        }
      }

      return NextResponse.json(updatedSession);
    }

    // Create new session
    const newSession = await prisma.session.create({
      data: {
        clientId,
        sessionDate: date,
        userId,
        notes: notes?.trim() || null,
        intervals: intervals && Array.isArray(intervals) ? {
          create: intervals.map((interval: { behaviorId: string; intervalIndex: number; value: string }) => ({
            behaviorId: interval.behaviorId,
            intervalIndex: interval.intervalIndex,
            value: interval.value,
          })),
        } : undefined,
      },
      include: {
        intervals: true,
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error('Failed to create/update session:', error);
    return NextResponse.json(
      { error: 'Failed to create/update session' },
      { status: 500 }
    );
  }
}
