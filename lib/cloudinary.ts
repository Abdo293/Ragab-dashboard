export async function uploadToCloudinary(file: File): Promise<{
  url: string;
  public_id: string;
  type: "image" | "video";
}> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const isVideo = file.type.startsWith("video/");
  const endpoint = isVideo ? "video" : "image";

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) throw new Error("Failed to upload media");

  const data = await res.json();
  return {
    url: data.secure_url,
    public_id: data.public_id,
    type: isVideo ? "video" : "image",
  };
}
