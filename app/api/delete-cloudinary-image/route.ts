// app/api/delete-cloudinary-image/route.ts

import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

// ✅ إعداد بيانات الدخول من env
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { public_id, resource_type } = body;

    if (!public_id || !resource_type) {
      return NextResponse.json(
        { error: "Missing public_id or resource_type" },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type,
    });

    if (result.result !== "ok") {
      return NextResponse.json(
        { error: "Cloudinary deletion failed", result },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE_MEDIA_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
