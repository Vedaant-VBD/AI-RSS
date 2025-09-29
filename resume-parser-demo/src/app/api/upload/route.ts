import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("resume");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // For now, just return success and let client-side handle PDF parsing
  // This avoids server-side PDF.js issues during deployment
  try {
    // Here you could save the file to storage and return a file ID
    // For demo purposes, just return success
    return NextResponse.json({ 
      message: "File uploaded successfully! Please parse on client-side.", 
      fileSize: file.size,
      fileName: (file as File).name 
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
  }
} 