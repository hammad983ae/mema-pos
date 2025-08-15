import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ApolloClient } from "@apollo/client";
import { GET_UPLOAD_URL, Query, QueryGetUploadUrlArgs } from "@/graphql";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function uploadFileToS3(
  client: ApolloClient<object>,
  file: File,
  folder?: string,
): Promise<{ key: string; publicUrl: string }> {
  const { data } = await client.query<Query, QueryGetUploadUrlArgs>({
    query: GET_UPLOAD_URL,
    variables: {
      fileType: file.type,
      folder,
    },
    fetchPolicy: "no-cache",
  });

  const { url, key, publicUrl } = data.getUploadUrl;

  const putRes = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => "");
    console.error(`S3 upload failed (${putRes.status}): ${text}`);
  }

  const finalPublicUrl =
    publicUrl ?? `https://memaproducts.s3.amazonaws.com/${key}`;

  return { key, publicUrl: finalPublicUrl };
}
