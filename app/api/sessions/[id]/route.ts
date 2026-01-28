import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dataSession = await prisma.session.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            behaviors: {
              where: { archivedAt: null },
            },
          },
        },
        enteredBy: {
          select: { id: true, name: true, email: true },
        },
        intervals: true,
      },
    });

    if (!dataSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(dataSession);
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { notes, intervals } = body;

    const userId = (session.user as { id: string }).id;

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        userId, // Update who last edited
      },
    });

    // Update intervals if provided
    if (intervals && Array.isArray(intervals)) {
      for (const interval of intervals) {
        if (interval.value === '' || interval.value === null) {
          // Delete interval if value is empty
          await prisma.interval.deleteMany({
            where: {
              sessionId: id,
              behaviorId: interval.behaviorId,
              intervalIndex: interval.intervalIndex,
            },
          });
        } else {
          // Upsert interval
          await prisma.interval.upsert({
            where: {
              sessionId_behaviorId_intervalIndex: {
                sessionId: id,
                behaviorId: interval.behaviorId,
                intervalIndex: interval.intervalIndex,
              },
            },
            update: { value: interval.value },
            create: {
              sessionId: id,
              behaviorId: interval.behaviorId,
              intervalIndex: interval.intervalIndex,
              value: interval.value,
            },
          });
        }
      }
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete session and all related intervals (cascade)
    await prisma.session.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
