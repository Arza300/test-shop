export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { OrderStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { orderStatusUpdateSchema } from "@/lib/validations/order";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "ممنوع" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = orderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const { status } = parsed.data;
  const order = await prisma.order.update({
    where: { id: params.id },
    data: { status: status as OrderStatus },
  });
  return NextResponse.json({ id: order.id, status: order.status });
}
