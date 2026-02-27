import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { getIO } from "../../../../lib/socket";

type OrderUpdateBody = {
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "DELIVERING"
    | "COMPLETED"
    | "CANCELLED";
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const email: string | undefined = user.emailAddresses?.[0]?.emailAddress;
    if (!email)
      return NextResponse.json({ error: "Email not found" }, { status: 400 });

    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser?.isAdmin)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body: OrderUpdateBody = await request.json();
    const { status } = body;

    const order = await prisma.order.update({
      where: { id: parseInt((await params).id) },
      data: { status },
      include: {
        user: true,
        items: { include: { food: true, groceryItem: true } },
      },
    });

    try {
      const io = getIO();
      io.to("admin-orders").emit("order-updated", order);
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    await prisma.order.delete({
      where: { id: orderId },
    });

    // Emit Socket.io event for order deletion
    try {
      const io = getIO();
      io.to("admin-orders").emit("order-deleted", orderId);
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 },
    );
  }
}
