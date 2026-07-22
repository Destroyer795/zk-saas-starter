import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Serverless Zero-Knowledge Vault API Endpoint
 * This backend layer is strictly "dumb" to the data content.
 * It validates that incoming payloads are encrypted ciphertext strings and rejects raw JSON or plaintext.
 */

// Helper to check if string is a valid JSON object/array
function isPlaintextJSON(str: string): boolean {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false; // Not a valid JSON object, which is expected for Base64 ciphertext
  }
}

/**
 * POST /api/vault
 * Saves an encrypted vault item.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id = "demo-user-default", type, encrypted_payload, iv } = body;

    // 1. Strict Validation: Required parameters
    if (!type || !encrypted_payload || !iv) {
      return NextResponse.json(
        { error: "Missing required fields: type, encrypted_payload, and iv are required." },
        { status: 400 }
      );
    }

    // 2. Strict Validation: Type checking
    if (typeof encrypted_payload !== "string" || typeof iv !== "string") {
      return NextResponse.json(
        {
          error:
            "Zero-Knowledge Violation: Payload and IV must be Base64-encoded ciphertext strings.",
        },
        { status: 400 }
      );
    }

    // 3. Zero-Knowledge Safeguard: Reject raw plaintext JSON objects sent accidentally
    if (isPlaintextJSON(encrypted_payload)) {
      return NextResponse.json(
        {
          error:
            "Zero-Knowledge Violation: Plaintext JSON payload detected. Server accepts encrypted Base64 strings only.",
        },
        { status: 400 }
      );
    }

    // 4. Save to Database via Prisma ORM
    const vaultItem = await prisma.vaultItem.create({
      data: {
        user_id,
        type,
        encrypted_payload,
        iv,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: vaultItem,
        message: "Encrypted payload stored successfully. Server remains zero-knowledge.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET /api/vault
 * Retrieves encrypted rows for the specified user or type.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id") || "demo-user-default";
    const type = searchParams.get("type");

    const whereClause: { user_id: string; type?: string } = { user_id: userId };
    if (type) {
      whereClause.type = type;
    }

    const items = await prisma.vaultItem.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/vault
 * Deletes a vault item by ID.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required query parameter: id" }, { status: 400 });
    }

    await prisma.vaultItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Vault item deleted." });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
