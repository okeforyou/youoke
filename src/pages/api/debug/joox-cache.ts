import type { NextApiRequest, NextApiResponse } from "next";
import { adminFirestore } from "@/firebase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!adminFirestore) {
    return res.status(500).json({ error: "Firestore not initialized" });
  }

  const clear = req.query.clear === 'true';

  try {
    if (clear) {
      await adminFirestore.collection("system_cache").doc("joox_charts").delete();
      return res.status(200).json({ success: true, message: "Cache cleared" });
    }

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
        songCount: c.singles?.length || 0,
        debug: c.debug
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
