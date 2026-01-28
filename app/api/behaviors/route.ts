import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId, name, description, color } = body;

    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const behavior = await prisma.behavior.create({
      data: {
        clientId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null,
      },
    });

    return NextResponse.json(behavior, { status: 201 });
  } catch (error) {
    console.error('Failed to create behavior:', error);
    return NextResponse.json(
      { error: 'Failed to create behavior' },
      { status: 500 }
    );
  }
}
