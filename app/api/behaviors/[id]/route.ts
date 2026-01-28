import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      );
    }

    const behavior = await prisma.behavior.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color !== undefined && { color: color || null }),
      },
    });

    return NextResponse.json(behavior);
  } catch (error) {
    console.error('Failed to update behavior:', error);
    return NextResponse.json(
      { error: 'Failed to update behavior' },
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
    // Soft delete by setting archivedAt
    const behavior = await prisma.behavior.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    return NextResponse.json(behavior);
  } catch (error) {
    console.error('Failed to delete behavior:', error);
    return NextResponse.json(
      { error: 'Failed to delete behavior' },
      { status: 500 }
    );
  }
}
