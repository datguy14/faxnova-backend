import axios from "axios";
import { z } from "zod";
import Fax from "../models/Fax.js";

// Zod schema with correct lowercase transform
const faxSchema = z.object({
  to: z.string().min(5, "Recipient fax number is required"),
  fileUrl: z.string().url("A valid file URL is required"),
  provider: z.string().optional().transform(val => val?.toLowerCase()),
});

// SEND FAX
export const sendFax = async (req, res) => {
  try {
    const { to, fileUrl, provider } = faxSchema.parse(req.body);

    let endpoint = "";
    let apiKey = "";

    if (provider === "sinch") {
      endpoint = "https://fax.api.sinch.com/v1/faxes";
      apiKey = process.env.SINCH_API_KEY;
    } else if (provider === "telnyx") {
      endpoint = "https://api.telnyx.com/v2/faxes";
      apiKey = process.env.TELNYX_API_KEY;
    } else {
      return res.status(400).json({ error: "Invalid provider" });
    }

    const response = await axios.post(
      endpoint,
      { to, fileUrl },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const faxRecord = await Fax.create({
      provider,
      to,
      fileUrl,
      faxId: response.data.id,
      status: "sent",
    });

    res.status(200).json({
      message: "Fax sent successfully",
      fax: faxRecord,
    });
  } catch (error) {
    console.error("Send Fax Error:", error);
    res.status(500).json({
      error: "Failed to send fax",
      details: error.message,
    });
  }
};

// GET FAX STATUS
export const getFaxStatus = async (req, res) => {
  try {
    const { faxId, provider } = req.params;

    if (!faxId) {
      return res.status(400).json({ error: "Fax ID is required" });
    }

    const providerLower = provider?.toLowerCase();

    let endpoint = "";
    let apiKey = "";

    if (providerLower === "sinch") {
      endpoint = `https://fax.api.sinch.com/v1/faxes/${faxId}`;
      apiKey = process.env.SINCH_API_KEY;
    } else if (providerLower === "telnyx") {
      endpoint = `https://api.telnyx.com/v2/faxes/${faxId}`;
      apiKey = process.env.TELNYX_API_KEY;
    } else {
      return res.status(400).json({ error: "Invalid provider" });
    }

    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    res.status(200).json({
      faxId,
      provider: providerLower,
      status: response.data.status,
      raw: response.data,
    });
  } catch (error) {
    console.error("Get Fax Status Error:", error);
    res.status(500).json({
      error: "Failed to retrieve fax status",
      details: error.message,
    });
  }
};
