import { currentUser } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET - Get all friends and pending requests
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ error: "Email not found" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get accepted friends (both sent and received)
    const friends = await prisma.user.findMany({
      where: {
        OR: [
          {
            friendsSent: {
              some: {
                receiverId: dbUser.id,
                status: "accepted",
              },
            },
          },
          {
            friendsReceived: {
              some: {
                senderId: dbUser.id,
                status: "accepted",
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        streak: true,
      },
    });

    // Get pending friend s (received)
    const pendingRequests = await prisma.user.findMany({
      where: {
        friendsSent: {
          some: {
            receiverId: dbUser.id,
            status: "pending",
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        streak: true,
      },
    });

    // Get sent friend requests (pending)
    const sentRequests = await prisma.user.findMany({
      where: {
        friendsReceived: {
          some: {
            senderId: dbUser.id,
            status: "pending",
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        streak: true,
      },
    });

    return NextResponse.json({
      friends,
      pendingRequests,
      sentRequests,
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json(
      { error: "Failed to fetch friends" },
      { status: 500 },
    );
  }
}

// POST - Send friend request
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ error: "Email not found" }, { status: 400 });
    }

    const { receiverEmail } = await request.json();

    if (!receiverEmail) {
      return NextResponse.json(
        { error: "Receiver email is required" },
        { status: 400 },
      );
    }

    const sender = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    const receiver = await prisma.user.findUnique({
      where: { email: receiverEmail },
    });

    if (!sender || !receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (sender.id === receiver.id) {
      return NextResponse.json(
        { error: "Cannot add yourself as a friend" },
        { status: 400 },
      );
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: sender.id, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: sender.id },
        ],
      },
    });

    if (existingFriendship) {
      return NextResponse.json(
        { error: "Friendship already exists" },
        { status: 400 },
      );
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        senderId: sender.id,
        receiverId: receiver.id,
        status: "pending",
      },
    });

    return NextResponse.json(friendship);
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json(
      { error: "Failed to send friend request" },
      { status: 500 },
    );
  }
}
