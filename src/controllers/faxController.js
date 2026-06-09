import axios from "axios";
import { z } from "zod";
import Fax from "../models/Fax.js";
import { routeFax } from "../services/providerRouter.js";
import { writeResidencyLog } from "../storage/residencyStorage.js";

// Zod schema with correct lowercase transform
const faxSchema = z.object({
  to: z.string().min(5, "Recipient fax number is required"),
  fileUrl: z.string().url("A valid file URL is required"),
  provider: z.string().optional().transform(val => val?.toLowerCase()),
});

/**
 * SEND FAX
 * 
 * Now residency-aware:
 * - Receives residencyZone from middleware
 * - Routes through residency-compliant providers
 * - Logs to zone-partitioned storage
 * - Includes routing metadata in response
 */
export const sendFax = async (req, res) => {
  try {
    const { to, fileUrl, provider } = faxSchema.parse(req.body);
    const residencyZone = req.residencyZone || "global";

    // Route through residency-aware provider router
    const routingResult = await routeFax(
      {
        to,
        fileUrl,
        preferredProvider: provider,
      },
      residencyZone
    );

    // Store fax record in database
    const faxRecord = await Fax.create({
      provider: routingResult.primaryProvider,
      to,
      fileUrl,
      faxId: routingResult.id || routingResult.faxId,
      status: "sent",
      residencyZone, // Store zone for later reference
      primaryProvider: routingResult.primaryProvider,
      fallbackProvider: routingResult.fallbackProvider || null,
      failoverUsed: routingResult.failoverUsed || false,
    });

    // Log to residency-partitioned storage
    await writeResidencyLog(
      residencyZone,
      "fax-deliveries.log",
      JSON.stringify({
        faxId: faxRecord._id,
        externalId: routingResult.id || routingResult.faxId,
        to,
        timestamp: new Date().toISOString(),
        primaryProvider: routingResult.primaryProvider,
        fallbackProvider: routingResult.fallbackProvider || null,
        failoverUsed: routingResult.failoverUsed || false,
        residencyZone,
      })
    );

    res.status(200).json({
      message: "Fax sent successfully",
      fax: faxRecord,
      residencyZone,
      routing: {
        primaryProvider: routingResult.primaryProvider,
        fallbackProvider: routingResult.fallbackProvider || null,
        failoverUsed: routingResult.failoverUsed || false,
      },
    });
  } catch (error) {
    console.error("Send Fax Error:", error);
    
    // Log error to residency zone
    const residencyZone = req.residencyZone || "global";
    try {
      await writeResidencyLog(
        residencyZone,
        "fax-errors.log",
        JSON.stringify({
          timestamp: new Date().toISOString(),
          error: error.message,
          residencyZone,
        })
      );
    } catch (logError) {
      console.error("Failed to log error to residency storage:", logError);
    }

    res.status(500).json({
      error: "Failed to send fax",
      details: error.message,
      residencyZone,
    });
  }
};

/**
 * GET FAX STATUS
 * 
 * Now residency-aware:
 * - Receives residencyZone from middleware
 * - Checks provider compliance with zone
 * - Logs status checks to zone-partitioned storage
 */
export const getFaxStatus = async (req, res) => {
  try {
    const { faxId, provider } = req.params;
    const residencyZone = req.residencyZone || "global";

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

    // Log status check
    await writeResidencyLog(
      residencyZone,
      "fax-status-checks.log",
      JSON.stringify({
        faxId,
        provider: providerLower,
        status: response.data.status,
        timestamp: new Date().toISOString(),
        residencyZone,
      })
    );

    res.status(200).json({
      faxId,
      provider: providerLower,
      status: response.data.status,
      raw: response.data,
      residencyZone,
    });
  } catch (error) {
    console.error("Get Fax Status Error:", error);
    
    const residencyZone = req.residencyZone || "global";
    try {
      await writeResidencyLog(
        residencyZone,
        "fax-errors.log",
        JSON.stringify({
          timestamp: new Date().toISOString(),
          error: error.message,
          operation: "getFaxStatus",
          residencyZone,
        })
      );
    } catch (logError) {
      console.error("Failed to log error to residency storage:", logError);
    }

    res.status(500).json({
      error: "Failed to retrieve fax status",
      details: error.message,
      residencyZone,
    });
  }
};
