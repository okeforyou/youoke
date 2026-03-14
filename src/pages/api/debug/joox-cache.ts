import type { NextApiRequest, NextApiResponse } from "next";
import { adminFirestore } from "@/firebase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!adminFirestore) {
    return res.status(500).json({ error: "Firestore not initialized" });
  }

  try {
    const doc = await adminFirestore.collection("system_cache").doc("joox_charts").get();
    if (!doc.exists) {
      return res.status(200).json({ exists: false, message: "No joox_charts document found" });
    }

    const data = doc.data();
    return res.status(200).json({
      exists: true,
      updatedAt: data?.updatedAt,
      chartSummary: data?.charts?.map((c: any) => ({
        id: c.id,
        name: c.name,
        songCount: c.singles?.length || 0
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
